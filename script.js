// ===============================================================
// FILE: script.js (Phiên bản đầy đủ, hoàn thiện tất cả chức năng)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL Web App cuối cùng của bạn vào đây !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; 

let allCustomersData = []; // Biến toàn cục để lưu trữ dữ liệu khách hàng

// ===============================================================
// CÁC HÀM CHÍNH
// ===============================================================

async function fetchCustomers() {
    const customerTableBody = document.querySelector('#customerTable tbody');
    customerTableBody.innerHTML = '<tr><td colspan="6">Đang tải dữ liệu...</td></tr>';
    
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    const userInfoDiv = document.getElementById('userInfo');
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `Xin chào, <strong>${loggedInUser.HoTen}</strong> (${loggedInUser.VaiTro}) | <a href="#" id="logoutBtn">Đăng xuất</a>`;
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
    }

    const url = new URL(WEB_APP_URL);
    url.searchParams.append('role', loggedInUser.VaiTro || 'NhanVien');
    url.searchParams.append('name', loggedInUser.HoTen || '');
    url.searchParams.append('team', loggedInUser.Nhom || '');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        allCustomersData = data;
        customerTableBody.innerHTML = ''; 
        
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="6">Không có dữ liệu khách hàng.</td></tr>';
            return;
        }

        data.forEach(customer => {
            const row = document.createElement('tr');
            row.id = `row-${customer.id}`;
            row.innerHTML = `
                <td>${customer.tenKhachHang || ''}</td>
                <td>${customer.sdt || ''}</td>
                <td>${customer.trangThai || ''}</td>
                <td>${customer.tenNhanVien || ''}</td>
                <td>${customer.dauThoiGian ? new Date(customer.dauThoiGian).toLocaleString('vi-VN') : ''}</td>
                <td><button class="edit-btn" data-id="${customer.id}">Sửa</button></td>
            `;
            customerTableBody.appendChild(row);
        });

    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="6">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

function populateFormForEdit(customerId) {
    const customer = allCustomersData.find(c => c.id === customerId);
    if (!customer) {
        console.error("Không tìm thấy khách hàng với ID:", customerId);
        return;
    }

    document.getElementById('id').value = customer.id;

    const fields = ['tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD', 'ghiChu'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = customer[fieldId] || '';
        }
    });

    document.getElementById('formTitle').textContent = 'Cập nhật thông tin Khách hàng';
    document.getElementById('submitBtn').textContent = 'Cập nhật';
    document.getElementById('cancelEditBtn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormToAddMode() {
    document.getElementById('id').value = ''; 
    document.getElementById('addCustomerForm').reset();
    document.getElementById('formTitle').textContent = 'Thêm khách hàng mới';
    document.getElementById('submitBtn').textContent = 'Thêm mới';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

async function handleSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById('id').value;
    
    if (editId) {
        handleUpdateCustomer(editId);
    } else {
        handleAddNewCustomer();
    }
}

async function handleAddNewCustomer() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'addCustomer');
    
    url.searchParams.append('id', 'KH' + Date.now());
    const now = new Date();
    const formattedTimestamp = now.toLocaleString("en-CA", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }).replace(/, /g, " ").slice(0, 19);
    url.searchParams.append('dauThoiGian', formattedTimestamp);
    url.searchParams.append('tenNhanVien', loggedInUser ? loggedInUser.HoTen : "Không xác định");

    const fields = ['tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD', 'ghiChu'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) url.searchParams.append(fieldId, element.value);
    });
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'success') {
            showMessage('Đã thêm khách hàng thành công!', 'success');
            resetFormToAddMode();
            fetchCustomers();
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
    }
}

async function handleUpdateCustomer(customerId) {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'updateCustomer');
    
    url.searchParams.append('updaterName', loggedInUser.HoTen);
    url.searchParams.append('updaterRole', loggedInUser.VaiTro);
    url.searchParams.append('updaterTeam', loggedInUser.Nhom);

    const fields = ['id', 'tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD', 'ghiChu'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) url.searchParams.append(fieldId, element.value);
    });
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        if (result.status === 'success') {
            showMessage('Đã cập nhật khách hàng thành công!', 'success');
            resetFormToAddMode();
            fetchCustomers();
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage(`Lỗi khi cập nhật khách hàng: ${error.message}`, 'error');
    }
}

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

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.className = type; 
    }
}

// ===============================================================
// KHỐI LỆNH CHẠY KHI TẢI TRANG
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addCustomerForm');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const customerTableBody = document.querySelector('#customerTable tbody');
    
    if(form) form.addEventListener('submit', handleSubmit);
    if(loadDataBtn) loadDataBtn.addEventListener('click', fetchCustomers);
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', resetFormToAddMode);

    if (customerTableBody) {
        customerTableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('edit-btn')) {
                const customerId = event.target.getAttribute('data-id');
                populateFormForEdit(customerId);
            }
        });
    }

    // Khởi tạo các chức năng
    fetchCustomers();
    populateDropdowns();
    flatpickr("#ngayKyHD", { dateFormat: "d/m/Y" });
    flatpickr("#ngayXHD", { dateFormat: "d/m/Y" });
});