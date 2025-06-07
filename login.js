// ===============================================================
// FILE: login.js
// MỤC ĐÍCH: XỬ LÝ LOGIC TRANG ĐĂNG NHẬP
// ===============================================================

// --- CẤU HÌNH KẾT NỐI VỚI PROXY ---
// URL gốc của Apps Script (cái đang bị lỗi CORS)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxicuA511S69p4TK4oUfVLADI2ytb9EJHq3C7MdKElb3D0M4FxlcBRDZUT7S0kjL6g/exec';

// URL của dịch vụ proxy miễn phí
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

// URL cuối cùng mà ứng dụng sẽ gọi đến
const WEB_APP_URL = PROXY_URL + encodeURIComponent(GOOGLE_SCRIPT_URL);
// --- KẾT THÚC CẤU HÌNH ---


const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

/**
 * Hàm xử lý khi người dùng nhấn nút đăng nhập.
 * Sẽ tạo một URL có chứa tham số và gửi yêu cầu GET qua proxy.
 */
async function handleLogin(event) {
    event.preventDefault(); // Ngăn form tự động gửi đi

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    loginMessage.textContent = 'Đang kiểm tra...';
    loginMessage.className = '';

    // Tạo URL gốc với các tham số
    const urlWithParams = new URL(GOOGLE_SCRIPT_URL);
    urlWithParams.searchParams.append('action', 'login');
    urlWithParams.searchParams.append('username', username);
    urlWithParams.searchParams.append('password', password);

    // Tạo URL cuối cùng để gọi qua proxy
    const finalUrlToFetch = PROXY_URL + encodeURIComponent(urlWithParams.href);

    try {
        // Gửi yêu cầu GET đơn giản đến proxy
        const response = await fetch(finalUrlToFetch);
        const result = await response.json();

        if (result.status === 'success') {
            // Đăng nhập thành công, lưu thông tin người dùng vào sessionStorage
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

// Gán sự kiện cho form
loginForm.addEventListener('submit', handleLogin);