// ===============================================================
// FILE: script.js (Đã sửa lỗi khởi tạo)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL Web App cuối cùng của bạn vào đây !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; 

// ===============================================================
// KHAI BÁO CÁC HÀM CHÍNH
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
            fetchCustomers();
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
    }
}

/**
 * Hàm ĐỌC dữ liệu từ Google Sheet CÓ PHÂN QUYỀN và hiển thị ra bảng
 */
async function fetchCustomers() {
    const customerTableBody = document.querySelector('#customerTable tbody');
    customerTableBody.innerHTML = '<tr><td colspan="9">Đang tải dữ liệu...</td></tr>';
    
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    const userInfoDiv = document.getElementById('userInfo');
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
 * Hàm lấy dữ liệu cho các dropdown từ sheet 'Data' và điền vào các thẻ <select>
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

        for (const key in optionsData) {
            const selectElement = document.getElementById(key);
            if (selectElement) {
                const options = optionsData[key];
                selectElement.innerHTML = `<option value="">-- ${selectElement.firstElementChild.textContent.replace('--','').trim()} --</option>`;
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
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}


// ===============================================================
// KHỐI LỆNH CHẠY KHI TẢI TRANG (DOMContentLoaded)
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Chỉ khi trang đã tải xong, chúng ta mới tìm các phần tử và gán sự kiện
    const form = document.getElementById('addCustomerForm');
    const loadDataBtn = document.getElementById('loadDataBtn');
    
    if(form) {
        form.addEventListener('submit', addCustomer);
    }
    if(loadDataBtn) {
        loadDataBtn.addEventListener('click', fetchCustomers);
    }

    // 1. Lấy danh sách khách hàng và hiển thị
    fetchCustomers();
    
    // 2. Lấy dữ liệu và điền vào các ô dropdown
    populateDropdowns();
    
    // 3. Khởi tạo lịch cho các ô ngày tháng
    flatpickr("#ngayKyHD", { 
        dateFormat: "d/m/Y",
    });
    flatpickr("#ngayXHD", {
        dateFormat: "d/m/Y",
    });
});