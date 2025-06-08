// ===============================================================
// FILE: script.js (Kết nối trực tiếp, không proxy)
// ===============================================================

// URL CUỐI CÙNG, KHÔNG DÙNG PROXY
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec';

const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');
const userInfoDiv = document.getElementById('userInfo');

/**
 * Hàm GHI dữ liệu khách hàng mới bằng phương thức GET
 */
async function addCustomer(event) {
    event.preventDefault(); 
    
    const tenKhachHang = document.getElementById('tenKhachHang').value;
    const soDienThoai = document.getElementById('soDienThoai').value;
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'addCustomer');
    url.searchParams.append('TenKhachHang', tenKhachHang);
    url.searchParams.append('SoDienThoai', soDienThoai);
    url.searchParams.append('NgayTao', new Date().toLocaleString('vi-VN'));
    url.searchParams.append('ID', 'KH' + Date.now());
    // *** DÒNG ĐÃ SỬA LẠI TỪ search_params THÀNH searchParams ***
    url.searchParams.append('NhanVienTao', loggedInUser ? loggedInUser.HoTen : "Không xác định");

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            showMessage('Đã thêm khách hàng thành công!', 'success');
            form.reset();
            fetchCustomers();
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
    }
}


/**
 * Hàm ĐỌC dữ liệu từ Google Sheet CÓ PHÂN QUYỀN
 */
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="4">Đang tải dữ liệu...</td></tr>';
    
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        customerTableBody.innerHTML = '<tr><td colspan="4">Lỗi: Không tìm thấy thông tin người dùng. Đang chuyển về trang đăng nhập...</td></tr>';
        setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        return;
    }

    userInfoDiv.innerHTML = `Xin chào, <strong>${loggedInUser.HoTen}</strong> (${loggedInUser.VaiTro}) | <a href="#" id="logoutBtn">Đăng xuất</a>`;
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    });

    // Tạo URL với các tham số để gửi lên back-end
    const url = new URL(WEB_APP_URL);
    // Lưu ý: Không cần action=getCustomers vì doGet mặc định là hành động này
    url.searchParams.append('role', loggedInUser.VaiTro || 'NhanVien'); // Gửi vai trò
    url.searchParams.append('name', loggedInUser.HoTen || ''); // Gửi tên
    url.searchParams.append('team', loggedInUser.Nhom || ''); // Gửi tên nhóm
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // ... (phần code hiển thị bảng giữ nguyên như cũ) ...
        
    } catch (error) {
        // ... (phần code xử lý lỗi giữ nguyên như cũ) ...
    }
}


function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}


// Gán sự kiện cho form và nút
form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);

// Tự động tải dữ liệu khi mở trang
document.addEventListener('DOMContentLoaded', fetchCustomers);