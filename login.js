// ===============================================================
// FILE: login.js (Kết nối trực tiếp, không proxy)
// ===============================================================

// URL MỚI NHẤT CỦA BẠN
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec';

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

async function handleLogin(event) {
    event.preventDefault(); 
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    loginMessage.textContent = 'Đang kiểm tra...';
    loginMessage.className = '';

    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'login');
    url.searchParams.append('username', username);
    url.searchParams.append('password', password);

    try {
        const response = await fetch(url);
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