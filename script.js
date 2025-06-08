// ===============================================================
// FILE: script.js (Hoàn thiện chức năng Sửa)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL Web App cuối cùng của bạn vào đây !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; 

let allCustomersData = []; // Biến toàn cục để lưu trữ dữ liệu khách hàng

// ===============================================================
// CÁC HÀM CHÍNH
// ===============================================================

async function fetchCustomers() {
    // ... code hàm này giữ nguyên như phiên bản đầy đủ trước đó ...
}

async function populateDropdowns() {
    // ... code hàm này giữ nguyên như phiên bản đầy đủ trước đó ...
}

function showMessage(msg, type) {
    // ... code hàm này giữ nguyên như phiên bản đầy đủ trước đó ...
}

function populateFormForEdit(customerId) {
    const customer = allCustomersData.find(c => c.id === customerId);
    if (!customer) return;

    document.getElementById('id').value = customer.id; // Quan trọng: điền ID vào ô ẩn

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
    
    // Thêm các trường ẩn
    url.searchParams.append('id', 'KH' + Date.now());
    const now = new Date();
    const formattedTimestamp = now.toLocaleString("en-CA", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }).replace(/, /g, " ").slice(0, 19);
    url.searchParams.append('dauThoiGian', formattedTimestamp);
    url.searchParams.append('tenNhanVien', loggedInUser ? loggedInUser.HoTen : "Không xác định");

    // Lấy dữ liệu từ form
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

async function handleUpdateCustomer() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'updateCustomer');

    // Gửi thông tin người cập nhật để kiểm tra quyền ở back-end
    url.searchParams.append('updaterName', loggedInUser.HoTen);
    url.search_params.append('updaterRole', loggedInUser.VaiTro);
    url.searchParams.append('updaterTeam', loggedInUser.Nhom);

    // Lấy dữ liệu từ form, bao gồm cả ID đang được sửa
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

// ===============================================================
// KHỐI LỆNH CHẠY KHI TẢI TRANG
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addCustomerForm');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    
    if(form) form.addEventListener('submit', handleSubmit);
    if(loadDataBtn) loadDataBtn.addEventListener('click', fetchCustomers);
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', resetFormToAddMode);

    fetchCustomers();
    populateDropdowns();
    flatpickr("#ngayKyHD", { dateFormat: "d/m/Y" });
    flatpickr("#ngayXHD", { dateFormat: "d/m/Y" });
});