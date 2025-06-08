// ===============================================================
// FILE: login.js (Kết nối trực tiếp, không proxy)
// ===============================================================

// URL CUỐI CÙNG, KHÔNG DÙNG PROXY
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec';

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

async function handleLogin(event) {
    event.preventDefault(); 
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    loginMessage.textContent = 'Đang kiểm tra...';
    loginMessage.className = '';

    const urlWithParams = new URL(WEB_APP_URL);
    urlWithParams.searchParams.append('action', 'login');
    urlWithParams.searchParams.append('username', username);
    urlWithParams.searchParams.append('password', password);

    try {
        const response = await fetch(urlWithParams);
        const result = await response.json();
        
        if (result.status === 'success') {
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            window.location.href = 'index.html';
        } else {
            loginMessage.textContent = result.message;
            loginMessage.className = 'error';
        }
    } catch (error) {
        loginMessage.textContent = 'Lỗi kết nối hoặc phân tích dữ liệu. Vui lòng thử lại.';
        loginMessage.className = 'error';
        console.error('Lỗi khi đăng nhập:', error);
    }
}

loginForm.addEventListener('submit', handleLogin);