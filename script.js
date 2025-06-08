// ===============================================================
// FILE: script.js (Kiến trúc "lai")
// ===============================================================

// --- CẤU HÌNH KẾT NỐI ---
// URL GỐC, dùng cho các yêu cầu trực tiếp (Thêm KH)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxicuA511S69p4TK4oUfVLADI2ytb9EJHq3C7MdKElb3D0M4FxlcBRDZUT7S0kjL6g/exec';

// URL qua Proxy, dùng cho các yêu cầu cần đọc phản hồi (Tải danh sách KH)
const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const PROXIED_URL = PROXY_URL + encodeURIComponent(GOOGLE_SCRIPT_URL);
// --- KẾT THÚC CẤU HÌNH ---


const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');
const userInfoDiv = document.getElementById('userInfo');


/**
 * Hàm GHI dữ liệu khách hàng mới bằng phương thức POST TRỰC TIẾP (dùng no-cors)
 */
async function addCustomer(event) {
    event.preventDefault(); 
    
    const tenKhachHang = document.getElementById('tenKhachHang').value;
    const soDienThoai = document.getElementById('soDienThoai').value;
    
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    
    const customerData = {
        TenKhachHang: tenKhachHang,
        SoDienThoai: soDienThoai,
        NgayTao: new Date().toLocaleString('vi-VN'),
        ID: 'KH' + Date.now(),
        NhanVienTao: loggedInUser ? loggedInUser.HoTen : "Không xác định"
    };

    const requestBody = {
      action: 'addCustomer',
      data: customerData
    };

    try {
        // Dùng URL GỐC và chế độ no-cors
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Thủ thuật "không cần hồi âm"
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            redirect: 'follow'
        });
        
        // Vì là no-cors, ta không nhận được phản hồi, cứ giả định là thành công
        showMessage('Đã gửi yêu cầu thêm khách hàng! Đang tải lại danh sách...', 'success');
        form.reset();
        setTimeout(fetchCustomers, 1000); // Chờ 1s để sheet kịp cập nhật
        
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
    }
}


/**
 * Hàm ĐỌC dữ liệu từ Google Sheet qua PROXY CÓ PHÂN QUYỀN
 */
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="4">Đang tải dữ liệu...</td></tr>';
    
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        customerTableBody.innerHTML = '<tr><td colspan="4">Lỗi: Không tìm thấy thông tin người dùng. Đang chuyển về trang đăng nhập...</td></tr>';
        setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        return;
    }

    // Hiển thị thông tin người dùng đăng nhập
    userInfoDiv.innerHTML = `Xin chào, <strong>${loggedInUser.HoTen}</strong> (${loggedInUser.VaiTro}) | <a href="#" id="logoutBtn">Đăng xuất</a>`;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    });


    // Tạo URL với các tham số để gửi lên back-end
    const urlWithParams = new URL(GOOGLE_SCRIPT_URL);
    urlWithParams.searchParams.append('role', loggedInUser.VaiTro);
    urlWithParams.searchParams.append('name', loggedInUser.HoTen);
    urlWithParams.searchParams.append('team', loggedInUser.Nhom);
    
    // Tạo URL cuối cùng để gọi qua proxy
    const finalUrlToFetch = PROXIED_URL + encodeURIComponent(urlWithParams.href);

    try {
        const response = await fetch(finalUrlToFetch);
        const data = await response.json();
        
        customerTableBody.innerHTML = ''; 
        
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="4">Bạn chưa có khách hàng nào.</td></tr>';
            return;
        }

        data.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.TenKhachHang}</td>
                <td>${customer.SoDienThoai}</td>
                <td>${customer.NhanVienTao}</td>
                <td>${new Date(customer.NgayTao).toLocaleString('vi-VN')}</td>
            `;
            customerTableBody.appendChild(row);
        });
    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="4">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
        console.error("Lỗi fetchCustomers: ", error);
    }
}


/**
 * Hàm hiển thị thông báo
 */
function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}


// Gán sự kiện cho form và nút
form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);

// Tự động tải dữ liệu khi mở trang
document.addEventListener('DOMContentLoaded', fetchCustomers);