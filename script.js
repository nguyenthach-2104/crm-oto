// ===============================================================
// FILE: script.js (Hoàn thiện Lọc và Giao diện Bảng mới)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL Web App cuối cùng của bạn vào đây !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; 

let allCustomersData = []; // Biến toàn cục để lưu trữ dữ liệu khách hàng

// ===============================================================
// CÁC HÀM ĐIỀU KHIỂN POPUP
// ===============================================================
function openModal() {
    document.getElementById('customerModal').style.display = 'flex';
}
function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
}

// ===============================================================
// CÁC HÀM XỬ LÝ DỮ LIỆU CHÍNH
// ===============================================================

/**
 * Hàm ĐỌC dữ liệu, có thể nhận tham số lọc và hiển thị ra bảng mới
 * @param {object} filter - Đối tượng chứa thông tin lọc
 */
async function fetchCustomers(filter = {}) {
    const customerTableBody = document.querySelector('#customerTable tbody');
    customerTableBody.innerHTML = '<tr><td colspan="8">Đang tải dữ liệu...</td></tr>';
    
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

    // Gửi thông tin lọc nếu có
    if (filter.type && filter.start && filter.end) {
        url.searchParams.append('filterType', filter.type);
        url.searchParams.append('startDate', filter.start);
        url.searchParams.append('endDate', filter.end);
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        allCustomersData = data; // Dữ liệu trả về từ backend đã được lọc và sắp xếp
        customerTableBody.innerHTML = ''; 
        
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="8">Không có dữ liệu khách hàng nào khớp với điều kiện.</td></tr>';
            return;
        }

        data.forEach(customer => {
            const row = document.createElement('tr');
            row.id = `row-${customer.id}`;
            // Cập nhật lại các cột hiển thị theo yêu cầu mới
            row.innerHTML = `
                <td>${customer.dauThoiGian ? new Date(customer.dauThoiGian).toLocaleString('vi-VN') : ''}</td>
                <td>${customer.tenKhachHang || ''}</td>
                <td>${customer.sdt || ''}</td>
                <td>${customer.trangThai || ''}</td>
                <td>${customer.ngayKyHD || ''}</td>
                <td>${customer.ngayXHD || ''}</td>
                <td><pre class="notes-preview">${customer.ghiChu || ''}</pre></td>
                <td><button class="edit-btn" data-id="${customer.id}">Sửa</button></td>
            `;
            customerTableBody.appendChild(row);
        });

    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="8">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
        console.error("Lỗi fetchCustomers: ", error);
    }
}

/**
 * Điền dữ liệu của khách hàng vào form để chỉnh sửa
 * @param {string} customerId - ID của khách hàng được chọn
 */
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
    const oldNotesDiv = document.getElementById('oldNotesDisplay');
    oldNotesDiv.style.display = 'block';
    oldNotesDiv.innerHTML = `<strong>Lịch sử Ghi chú & Hoạt động:</strong><br><pre>${customer.ghiChu || 'Chưa có ghi chú.'}</pre>`;
    document.getElementById('ghiChu').value = '';
    document.getElementById('ghiChu').placeholder = "Thêm ghi chú mới tại đây...";
    document.getElementById('formTitle').textContent = `Cập nhật KH: ${customer.tenKhachHang}`;
    document.getElementById('submitBtn').textContent = 'Lưu thay đổi';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    openModal();
}

/**
 * Reset form về trạng thái "Thêm mới"
 */
function resetFormToAddMode() {
    document.getElementById('id').value = ''; 
    document.getElementById('addCustomerForm').reset();
    document.getElementById('formTitle').textContent = 'Thêm khách hàng mới';
    document.getElementById('submitBtn').textContent = 'Thêm mới';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('oldNotesDisplay').style.display = 'none';
    document.getElementById('ghiChu').placeholder = "Ghi chú";
}

/**
 * Xử lý chính khi submit form: Quyết định là Thêm mới hay Cập nhật
 */
async function handleSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById('id').value;
    if (editId) {
        handleUpdateCustomer(editId);
    } else {
        handleAddNewCustomer();
    }
}

/**
 * Xử lý logic Thêm mới khách hàng
 */
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
            closeModal();
            fetchCustomers();
        } else { showMessage('Lỗi từ server: ' + result.message, 'error'); }
    } catch (error) { showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error'); }
}

/**
 * Xử lý logic Cập nhật khách hàng
 */
async function handleUpdateCustomer(customerId) {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'updateCustomer');
    url.searchParams.append('updaterName', loggedInUser.HoTen);

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
            closeModal();
            fetchCustomers();
        } else { showMessage('Lỗi từ server: ' + result.message, 'error'); }
    } catch (error) { showMessage(`Lỗi khi cập nhật khách hàng: ${error.message}`, 'error'); }
}

/**
 * Lấy dữ liệu cho các ô dropdown
 */
async function populateDropdowns() {
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'getOptions');
    try {
        const response = await fetch(url);
        const optionsData = await response.json();
        if (optionsData.status === 'error') { return; }
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
    } catch (error) { console.error("Lỗi khi tải dữ liệu cho dropdown:", error); }
}

/**
 * Hiển thị thông báo
 */
function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) { messageDiv.textContent = msg; messageDiv.className = type; }
}

/**
 * Thiết lập ngày mặc định cho bộ lọc
 */
function setDefaultDates() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    if(!startDateInput || !endDateInput) return;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const flatpickrConfig = { dateFormat: "Y-m-d" };
    flatpickr(startDateInput, { ...flatpickrConfig, defaultDate: firstDay });
    flatpickr(endDateInput, { ...flatpickrConfig, defaultDate: lastDay });
}


// ===============================================================
// KHỐI LỆNH CHẠY KHI TẢI TRANG
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Lấy các phần tử DOM
    const form = document.getElementById('addCustomerForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const customerModal = document.getElementById('customerModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const customerTableBody = document.querySelector('#customerTable tbody');

    // Các nút lọc
    const filterByTimestampBtn = document.getElementById('filterByTimestampBtn');
    const filterByContractBtn = document.getElementById('filterByContractBtn');
    const filterByDeliveryBtn = document.getElementById('filterByDeliveryBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    // Gán sự kiện
    if(addCustomerBtn) { addCustomerBtn.addEventListener('click', () => { resetFormToAddMode(); openModal(); }); }
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(customerModal) { customerModal.addEventListener('click', (event) => { if (event.target === customerModal) closeModal(); }); }
    if(form) form.addEventListener('submit', handleSubmit);
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', resetFormToAddMode);
    
    if (customerTableBody) {
        customerTableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('edit-btn')) {
                const customerId = event.target.getAttribute('data-id');
                populateFormForEdit(customerId);
            }
        });
    }
    
    const handleFilterClick = (filterType) => {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
            fetchCustomers({ type: filterType, start: startDateInput.value, end: endDateInput.value });
        } else {
            alert("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
        }
    };
    
    if (filterByTimestampBtn) filterByTimestampBtn.addEventListener('click', () => handleFilterClick('dauThoiGian'));
    if (filterByContractBtn) filterByContractBtn.addEventListener('click', () => handleFilterClick('ngayKyHD'));
    if (filterByDeliveryBtn) filterByDeliveryBtn.addEventListener('click', () => handleFilterClick('ngayXHD'));
    if (resetFilterBtn) resetFilterBtn.addEventListener('click', () => fetchCustomers());

    // Khởi tạo
    setDefaultDates();
    fetchCustomers();
    populateDropdowns();
    flatpickr("#ngayKyHD", { dateFormat: "d/m/Y" });
    flatpickr("#ngayXHD", { dateFormat: "d/m/Y" });
});