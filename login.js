// Dán URL của Google Apps Script Web App của bạn vào đây
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxXWGX5z_jDAObth0H3Ao0ZWK0WBdMg-1PY6Z1E4pw8ZogxIvZ4EQc6J0v686YEzewt/exec';

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

// Hàm xử lý khi người dùng nhấn nút đăng nhập
async function handleLogin(event) {
    event.preventDefault(); // Ngăn form tự động gửi đi

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    loginMessage.textContent = 'Đang kiểm tra...';
    loginMessage.className = '';

    try {
        // Tạo một đối tượng dữ liệu để gửi đi
        // Thêm một thuộc tính "action" để Apps Script biết đây là yêu cầu đăng nhập
        const requestBody = {
            action: 'login',
            username: username,
            password: password
        };
        
        // Gửi yêu cầu POST đến Apps Script
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Đăng nhập thành công! Lưu thông tin người dùng vào sessionStorage
            // sessionStorage là kho lưu trữ tạm thời của trình duyệt, dữ liệu sẽ mất khi bạn đóng tab
            sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
            
            // Chuyển hướng người dùng đến trang quản lý chính
            window.location.href = 'index.html';

        } else {
            // Đăng nhập thất bại, hiển thị lỗi
            loginMessage.textContent = result.message;
            loginMessage.className = 'error';
        }

    } catch (error) {
        loginMessage.textContent = 'Đã xảy ra lỗi kết nối. Vui lòng thử lại.';
        loginMessage.className = 'error';
        console.error('Lỗi khi đăng nhập:', error);
    }
}

loginForm.addEventListener('submit', handleLogin);