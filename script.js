// ===============================================================
// FILE: script.js (Hỗ trợ cấu trúc 18 cột)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL MỚI NHẤT của bạn từ Apps Script vào đây !!!
const WEB_APP_URL = 'URL_MOI_NHAT_CUA_BAN'; 

const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');
const userInfoDiv = document.getElementById('userInfo');

/**
 * Hàm GHI dữ liệu khách hàng mới với đầy đủ 18 trường
 */
async function addCustomer(event) {
    event.preventDefault();
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'addCustomer');

    // Tự động thêm các trường ẩn
    url.searchParams.append('id', 'KH' + Date.now());
    url.searchParams.append('dauThoiGian', new Date().toLocaleString('vi-VN'));
    url.searchParams.append('tenNhanVien', loggedInUser ? loggedInUser.HoTen : "Không xác định");

    // Lấy dữ liệu từ tất cả các ô input và gửi đi
    const fields = ['tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD', 'ghiChu'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if(element) {
            url.searchParams.append(fieldId, element.value);
        }
    });
    
    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            showMessage('Đã thêm khách hàng thành công!', 'success');
            document.getElementById('addCustomerForm').reset();
            fetchCustomers();
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
    }
}

/**
 * Hàm ĐỌC dữ liệu và hiển thị các cột mới
 */
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="9">Đang tải dữ liệu...</td></tr>';
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    userInfoDiv.innerHTML = `Xin chào, <strong>${loggedInUser.HoTen}</strong> (${loggedInUser.VaiTro}) | <a href="#" id="logoutBtn">Đăng xuất</a>`;
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    });

    const url = new URL(WEB_APP_URL);
    url.searchParams.append('role', loggedInUser.VaiTro || 'NhanVien');
    url.searchParams.append('name', loggedInUser.HoTen || '');
    url.searchParams.append('team', loggedInUser.Nhom || '');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        customerTableBody.innerHTML = ''; 
        
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="9">Không có dữ liệu khách hàng.</td></tr>';
            return;
        }

        data.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.tenKhachHang || ''}</td>
                <td>${customer.sdt || ''}</td>
                <td>${customer.tinhThanh || ''}</td>
                <td>${customer.loaiXe || ''}</td>
                <td>${customer.trangThai || ''}</td>
                <td>${customer.phanLoaiKH || ''}</td>
                <td>${customer.ngayKyHD || ''}</td>
                <td>${customer.tenNhanVien || ''}</td>
                <td>${new Date(customer.dauThoiGian).toLocaleString('vi-VN')}</td>
            `;
            customerTableBody.appendChild(row);
        });
    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="9">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}

form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);
document.addEventListener('DOMContentLoaded', fetchCustomers);