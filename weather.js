
// OpenWeatherMap API 관련 설정
const API_KEY = 'c18aee0075c67f16c5f6088e7453765a';

/**
 * @description 페이지 상단 h1 태그에 오늘 날짜를 'YYYY년 MM월 DD일의 날씨' 형식으로 설정합니다.
 */
function setDate() {
    const titleElement = document.querySelector('h1');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    titleElement.textContent = `${year}년 ${month}월 ${day}일의 날씨`;
}

/**
 * @description UTC 타임스탬프(초)를 한국 시간(YYYY년 MM월 DD일 HH:MM:SS) 문자열로 변환합니다.
 * @param {number} utcSeconds - UTC 기준 초 단위 타임스탬프
 * @returns {string} 한국 표준시(KST)로 변환된 날짜/시간 문자열
 */
function formatKoreanDateTime(utcSeconds) {
    const date = new Date(utcSeconds * 1000);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul',
    });
}

/**
 * @description 선택된 도시의 날씨 정보를 OpenWeatherMap API에서 받아와 출력합니다.
 * @param {string} city - 영어 도시명 (예: 'Seoul')
 */
async function getWeatherData(city) {
    // API 요청을 위한 URL을 동적으로 생성합니다.
    const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=kr`;
    try {
        // fetch 함수를 사용하여 API에 비동기적으로 데이터를 요청합니다.
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // 주요 날씨 정보만 추출합니다.
        const cityName = data.name; // 도시명
        const weatherMain = data.weather[0]?.main || '-'; // 날씨 (예: Rain)
        const weatherDesc = data.weather[0]?.description || '-'; // 날씨 상세설명 (예: moderate rain)
        const iconCode = data.weather[0]?.icon || '01d'; // 날씨 아이콘 코드 (예: 10d)
        const temp = data.main?.temp?.toFixed(1) || '-'; // 현재 온도
        const humidity = data.main?.humidity || '-'; // 습도
        const windSpeed = data.wind?.speed?.toFixed(1) || '-'; // 풍속
        const dt = data.dt; // 날씨 측정 시각(UTC 초)
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        const measuredTime = formatKoreanDateTime(dt);
        // 보기 좋게 한글로 정리해서 HTML을 만듭니다.
        const weatherHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%;">
                <div class="weather-city" style="font-size:3.5rem; font-weight:bold; margin-bottom:1.2rem; color:#222; text-shadow:1px 1px 2px #fff; letter-spacing:2px;">${cityName}</div>
                <div class="weather-icon" style="margin-bottom:1.2rem;">
                    <img src="${iconUrl}" alt="날씨 아이콘" style="width:300px; height:300px;">
                </div>
                <div class="weather-desc" style="font-size:1.3rem; font-weight:500; margin-bottom:1rem; color:#333;">${weatherDesc} (${weatherMain})</div>
                <div class="weather-etc" style="display:flex; gap:1.5rem; font-size:1.5rem; color:#444; margin-bottom:1.2rem;">
                    <span>온도: <strong>${temp}°C</strong></span>
                    <span>습도: <strong>${humidity}%</strong></span>
                    <span>풍속: <strong>${windSpeed} m/s</strong></span>
                </div>
                <div class="weather-datetime" style="font-size:1.1rem; color:#666; margin-top:0.5rem;">측정시각: ${measuredTime}</div>
            </div>
        `;
        const weatherContainer = document.getElementById('weather-container');
        if (weatherContainer) {
            weatherContainer.innerHTML = weatherHTML;
        }
        return data;
    } catch (error) {
        console.error('날씨 정보를 가져오는 중 오류가 발생했습니다:', error);
        const weatherContainer = document.getElementById('weather-container');
        if (weatherContainer) {
            weatherContainer.innerHTML = `<p style="color:red;">날씨 정보를 불러오는 데 실패했습니다.</p>`;
        }
    }
}

// 웹 문서의 모든 콘텐츠가 로드된 후에 아래 함수들을 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    setDate(); // 날짜 설정 함수 호출
    // select 태그에서 선택된 도시의 값을 가져와 날씨 정보를 표시합니다.
    const citySelect = document.getElementById('city-select');
    let selectedCity = citySelect ? citySelect.value : 'Seoul';
    getWeatherData(selectedCity);
    // 도시가 변경될 때마다 날씨 정보를 새로 불러옵니다.
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            getWeatherData(this.value);
        });
    }
}); 