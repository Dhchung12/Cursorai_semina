// 오늘 날짜를 가져와서 span 태그에 출력하는 함수
function displayTodayDate() {
    // 현재 날짜 객체 생성
    const today = new Date();
    
    // 한국어 날짜 형식으로 변환
    const options = {
        year: 'numeric',    // 년도 (2024)
        month: 'long',      // 월 (1월, 2월...)
        day: 'numeric'      // 일 (1, 2, 3...)
    };
    
    // 한국어 로케일로 날짜 포맷팅
    const koreanDate = today.toLocaleDateString('ko-KR', options);
    
    // span 태그에 날짜 출력
    document.getElementById('todayDate').textContent = koreanDate;
}

// 할일 입력 섹션을 보여주는 함수
function showTodoInput() {
    const inputSection = document.getElementById('todoInputSection');
    inputSection.style.display = 'block';
    
    // 입력창에 포커스
    document.getElementById('todoInput').focus();
}

// 할일 입력 섹션을 숨기는 함수
function hideTodoInput() {
    const inputSection = document.getElementById('todoInputSection');
    inputSection.style.display = 'none';
    
    // 입력창 초기화
    document.getElementById('todoInput').value = '';
}

// IndexedDB 관련 변수 선언
let db = null;

// IndexedDB에서 할일 목록을 읽어와서 화면에 출력하는 함수
function loadTodos() {
    // ul 태그 가져오기
    const todoList = document.getElementById('todoList');
    // 기존 목록 비우기
    todoList.innerHTML = '';

    // IndexedDB가 준비되어 있으면
    if (db) {
        // 트랜잭션 생성 (읽기 전용)
        const transaction = db.transaction(['todo'], 'readonly');
        const store = transaction.objectStore('todo');
        // 모든 데이터 가져오기
        const request = store.getAll();
        request.onsuccess = function(event) {
            let todos = event.target.result;
            // createAt 기준으로 내림차순 정렬 (최신순)
            todos.sort(function(a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            // 할일이 하나라도 있으면 출력
            if (todos && todos.length > 0) {
                todos.forEach(function(todo) {
                    // li 태그 생성
                    const li = document.createElement('li');
                    li.className = 'todo-item';
                    if (todo.completed) {
                        li.classList.add('completed');
                    }

                    // 체크박스 생성
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = !!todo.completed; // 완료 여부에 따라 체크
                    checkbox.className = 'todo-checkbox';
                    checkbox.setAttribute('data-id', todo.id); // 해당 할일의 id 저장

                    // 체크박스 클릭 시 completed 값 토글
                    checkbox.addEventListener('change', function(e) {
                        const todoId = Number(this.getAttribute('data-id'));
                        updateTodoCompleted(todoId, this.checked);
                    });

                    // 할일 텍스트 span (완료시 <strike>로 감싸기)
                    const textSpan = document.createElement('span');
                    textSpan.className = 'todo-text';
                    if (todo.completed) {
                        textSpan.innerHTML = `<strike>${todo.text}</strike>`;
                    } else {
                        textSpan.textContent = todo.text;
                    }

                    // 마감일 span (괄호 안, 흐린 회색)
                    const dueSpan = document.createElement('span');
                    dueSpan.textContent = `(${todo.dueDate})`;
                    dueSpan.className = 'due';

                    // 수정 버튼(이모지) 생성
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-btn';
                    editBtn.textContent = '✏️';
                    editBtn.setAttribute('title', '수정');
                    editBtn.setAttribute('data-id', todo.id);
                    // 수정 버튼 클릭 시 할일 내용과 마감일 수정
                    editBtn.addEventListener('click', function() {
                        const todoId = Number(this.getAttribute('data-id'));
                        editTodo(todoId);
                    });

                    // 삭제 버튼(이모지) 생성
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.textContent = '🗑️';
                    deleteBtn.setAttribute('title', '삭제');
                    deleteBtn.setAttribute('data-id', todo.id);
                    // 삭제 버튼 클릭 시 해당 할일 삭제
                    deleteBtn.addEventListener('click', function() {
                        const todoId = Number(this.getAttribute('data-id'));
                        // 삭제 전 확인 창
                        if (confirm('정말 삭제하시겠습니까?')) {
                            deleteTodo(todoId);
                        }
                    });

                    // li에 체크박스, 텍스트, 마감일, 수정 버튼, 삭제 버튼 순서로 추가
                    li.appendChild(checkbox);
                    li.appendChild(textSpan);
                    li.appendChild(dueSpan);
                    li.appendChild(editBtn);
                    li.appendChild(deleteBtn);

                    todoList.appendChild(li);
                });
            } else {
                // 할일이 없으면 안내 메시지 출력
                const li = document.createElement('li');
                li.textContent = '저장된 할일이 없습니다.';
                todoList.appendChild(li);
            }
        };
        request.onerror = function() {
            alert('할일 목록을 불러오지 못했습니다.');
        };
    }
}

// 체크박스 클릭 시 completed 값을 업데이트하는 함수
function updateTodoCompleted(todoId, completed) {
    if (!db) return;
    // 트랜잭션 생성 (읽기/쓰기)
    const transaction = db.transaction(['todo'], 'readwrite');
    const store = transaction.objectStore('todo');
    // 해당 id의 할일을 가져옴
    const getRequest = store.get(todoId);
    getRequest.onsuccess = function(event) {
        const todo = event.target.result;
        if (todo) {
            todo.completed = completed; // 완료 상태 변경
            // 수정된 할일을 저장
            const updateRequest = store.put(todo);
            updateRequest.onsuccess = function() {
                loadTodos(); // 목록 새로고침
            };
        }
    };
}

// 삭제 버튼 클릭 시 해당 할일을 삭제하는 함수
function deleteTodo(todoId) {
    if (!db) return;
    const transaction = db.transaction(['todo'], 'readwrite');
    const store = transaction.objectStore('todo');
    const deleteRequest = store.delete(todoId);
    deleteRequest.onsuccess = function() {
        loadTodos(); // 삭제 후 목록 새로고침
    };
    deleteRequest.onerror = function() {
        alert('할일 삭제에 실패했습니다.');
    };
}

// DB 초기화 및 오늘 날짜 표시, 할일 목록 불러오기
window.addEventListener('DOMContentLoaded', function() {
    initDB();
    displayTodayDate(); // 오늘 날짜를 안전하게 span에 출력
});

// DB가 준비되면 할일 목록을 불러오도록 onSuccess에서 호출
function initDB() {
    const request = window.indexedDB.open('todos', 1);
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('todo')) {
            db.createObjectStore('todo', { keyPath: 'id', autoIncrement: true });
        }
    };
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('IndexedDB 연결 성공!');
        loadTodos(); // DB 연결 후 할일 목록 불러오기
    };
    request.onerror = function(event) {
        alert('IndexedDB 연결에 실패했습니다.');
    };
}

// 할일 추가 함수
function addTodo() {
    const todoText = document.getElementById('todoInput').value.trim();
    const todoDueDate = document.getElementById('todoDueDate').value;
    if (todoText === '') {
        alert('할일을 입력해주세요!');
        return;
    }
    if (todoDueDate === '') {
        alert('마감일을 입력해주세요!');
        return;
    }
    if (db) {
        const transaction = db.transaction(['todo'], 'readwrite');
        const store = transaction.objectStore('todo');
        // 할일 객체에 completed(완료여부) 속성 추가, 기본값은 false(미완료)
        const todoData = {
            text: todoText,
            dueDate: todoDueDate,
            createdAt: new Date().toISOString(),
            completed: false // 처음엔 무조건 미완료로 저장
        };
        const request = store.add(todoData);
        request.onsuccess = function() {
            alert('할일이 저장되었습니다!');
            loadTodos(); // 저장 후 목록 새로고침
        };
        request.onerror = function() {
            alert('할일 저장에 실패했습니다.');
        };
    } else {
        alert('IndexedDB가 초기화되지 않았습니다.');
    }
    document.getElementById('todoInput').value = '';
    document.getElementById('todoDueDate').value = '';
    hideTodoInput();
}

// 엔터 키로 할일 추가
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('todoInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addTodo();
        }
    });
});

// 수정 버튼 클릭 시 할일 내용과 마감일을 수정하는 함수
function editTodo(todoId) {
    if (!db) return;
    const transaction = db.transaction(['todo'], 'readwrite');
    const store = transaction.objectStore('todo');
    const getRequest = store.get(todoId);
    getRequest.onsuccess = function(event) {
        const todo = event.target.result;
        if (todo) {
            // 기존 값으로 prompt 입력창 띄우기
            const newText = prompt('할일 내용을 수정하세요:', todo.text);
            if (newText === null) return; // 취소 시
            const newDueDate = prompt('마감일을 수정하세요(yyyy-mm-dd):', todo.dueDate);
            if (newDueDate === null) return; // 취소 시
            if (newText.trim() === '' || newDueDate.trim() === '') {
                alert('할일과 마감일을 모두 입력해야 합니다.');
                return;
            }
            todo.text = newText.trim();
            todo.dueDate = newDueDate.trim();
            // 수정된 할일을 저장
            const updateRequest = store.put(todo);
            updateRequest.onsuccess = function() {
                loadTodos(); // 목록 새로고침
            };
        }
    };
}
