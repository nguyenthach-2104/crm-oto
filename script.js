// ===============================================================
// FILE: script.js (Phiên bản đầy đủ cho Giao diện Thông minh)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL Web App cuối cùng của bạn vào đây !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec';

// --- Lấy các phần tử DOM ---
const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');
const userInfoDiv = document.getElementById('userInfo');


// ===============================================================
// CÁC HÀM CHÍNH
// ===============================================================

/**
 * Hàm GHI dữ liệu khách hàng mới với đầy đủ các trường từ form
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

    // Lấy dữ liệu từ tất cả các ô input và select
    const fields = ['tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD', 'ghiChu'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            url.searchParams.append(fieldId, element.value);
        }
    });

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            showMessage('Đã thêm khách hàng thành công!', 'success');
            document.getElementById('addCustomerForm').reset();
            fetchCustomers(); // Tải lại danh sách sau khi thêm thành công
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
        console.error("Lỗi addCustomer:", error);
    }
}

/**
 * Hàm ĐỌC dữ liệu từ Google Sheet CÓ PHÂN QUYỀN và hiển thị ra bảng
 */
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="9">Đang tải dữ liệu...</td></tr>';
    
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Hiển thị thông tin người dùng và nút đăng xuất
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
                <td>${customer.dauThoiGian ? new Date(customer.dauThoiGian).toLocaleString('vi-VN') : ''}</td>
            `;
            customerTableBody.appendChild(row);
        });
    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="9">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
        console.error("Lỗi fetchCustomers: ", error);
    }
}

/**
 * HÀM MỚI: Lấy dữ liệu cho các dropdown từ sheet 'Data' và điền vào các thẻ <select>
 */
async function populateDropdowns() {
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'getOptions');

    try {
        const response = await fetch(url);
        const optionsData = await response.json();

        if (optionsData.status === 'error') {
            console.error('Lỗi khi lấy dữ liệu options:', optionsData.message);
            return;
        }

        // Lặp qua từng loại dropdown (tinhThanh, loaiXe,...)
        // Tên key trong optionsData phải khớp với id của thẻ select
        for (const key in optionsData) {
            const selectElement = document.getElementById(key);
            if (selectElement) {
                const options = optionsData[key];
                // Xóa các option cũ (trừ option đầu tiên) trước khi thêm mới
                selectElement.innerHTML = `<option value="">-- Chọn ${selectElement.firstElementChild.textContent.replace('--','').trim()} --</option>`;
                options.forEach(optionValue => {
                    const optionElement = document.createElement('option');
                    optionElement.value = optionValue;
                    optionElement.textContent = optionValue;
                    selectElement.appendChild(optionElement);
                });
            }
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu cho dropdown:", error);
    }
}


/**
 * Hàm hiển thị thông báo
 */
function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}


// ===============================================================
// GÁN SỰ KIỆN VÀ KHỞI TẠO
// ===============================================================

// Gán sự kiện cho form và nút
form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);

// Khi toàn bộ trang HTML đã tải xong, thực hiện các hành động sau:
document.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy danh sách khách hàng và hiển thị
    fetchCustomers();
    
    // 2. Lấy dữ liệu và điền vào các ô dropdown
    populateDropdowns();
    
    // 3. Khởi tạo lịch cho các ô ngày tháng
    flatpickr("#ngayKyHD", { 
        dateFormat: "d-m-Y", // Định dạng ngày Việt Nam
    });
    flatpickr("#ngayXHD", {
        dateFormat: "d-m-Y",
    });
});