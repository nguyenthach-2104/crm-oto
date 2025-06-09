// ===============================================================
// FILE: script.js (Hoàn thiện cuối cùng)
// ===============================================================

// !!! QUAN TRỌNG: Dán URL Web App cuối cùng của bạn vào đây !!!
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; 

let allCustomersData = [];
let currentlyDisplayedData = [];

// ===============================================================
// CÁC HÀM TRỢ GIÚP
// ===============================================================

function openModal() { document.getElementById('customerModal').style.display = 'flex'; }
function closeModal() { document.getElementById('customerModal').style.display = 'none'; }

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.className = type; 
        setTimeout(() => { messageDiv.textContent = ''; messageDiv.className = ''; }, 3000);
    }
}

function formatDate(dateString, includeTime = false) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (includeTime) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year}`;
}

function setDefaultDates() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    if(!startDateInput || !endDateInput) return;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const flatpickrConfig = {
        altInput: true,
        altFormat: "d/m/Y",
        dateFormat: "Y-m-d",
        allowInput: true,
    };
    flatpickr(startDateInput, { ...flatpickrConfig, defaultDate: firstDay });
    flatpickr(endDateInput, { ...flatpickrConfig, defaultDate: lastDay });
}

// ===============================================================
// CÁC HÀM XỬ LÝ DỮ LIỆU CHÍNH
// ===============================================================

function renderTable(customerData) {
    const customerTableBody = document.querySelector('#customerTable tbody');
    const summaryInfo = document.getElementById('summaryInfo');
    customerTableBody.innerHTML = ''; 

    let contractCount = 0;
    let deliveryCount = 0;
    if (Array.isArray(customerData)) {
        customerData.forEach(customer => {
            if (customer.ngayKyHD) contractCount++;
            if (customer.ngayXHD) deliveryCount++;
        });
        summaryInfo.textContent = `Hiển thị: ${customerData.length} KH | Ký HĐ: ${contractCount} | Xuất HĐ: ${deliveryCount}`;

        if (customerData.length === 0) {
            customerTableBody.innerHTML = `<tr><td colspan="11">Không có dữ liệu khách hàng nào khớp với điều kiện.</td></tr>`;
            return;
        }

        customerData.forEach((customer, index) => {
            const row = document.createElement('tr');
            row.id = `row-${customer.id}`;
            const firstLineOfNote = String(customer.ghiChu || '').split('\n')[0];

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(customer.dauThoiGian, true)}</td>
                <td>${customer.tenKhachHang || ''}</td>
                <td>${customer.sdt || ''}</td>
                <td>${customer.tinhThanh || ''}</td>
                <td>${customer.loaiXe || ''}</td>
                <td>${customer.trangThai || ''}</td>
                <td>${formatDate(customer.ngayKyHD, false)}</td>
                <td>${formatDate(customer.ngayXHD, false)}</td>
                <td><pre class="notes-preview" title="${customer.ghiChu || ''}">${firstLineOfNote}</pre></td>
                <td><button class="edit-btn" data-id="${customer.id}">Sửa</button></td>
            `;
            customerTableBody.appendChild(row);
        });
    }
}

async function fetchCustomers(filter = {}) {
    const customerTableBody = document.querySelector('#customerTable tbody');
    customerTableBody.innerHTML = '<tr><td colspan="11">Đang tải dữ liệu...</td></tr>';
    
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

    if (filter.type && filter.start && filter.end) {
        url.searchParams.append('filterType', filter.type);
        url.searchParams.append('startDate', filter.start);
        url.searchParams.append('endDate', filter.end);
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.error("Server đã trả về lỗi:", data.message);
            customerTableBody.innerHTML = `<tr><td colspan="11">Có lỗi xảy ra: ${data.message || 'Không thể tải dữ liệu.'}</td></tr>`;
            return; 
        }
        
        allCustomersData = data;
        currentlyDisplayedData = allCustomersData;
        renderTable(currentlyDisplayedData);

    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="11">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
        console.error("Lỗi fetchCustomers: ", error);
    }
}

/**
 * HÀM ĐƯỢC SỬA LẠI: Hiển thị đúng và đầy đủ ghi chú cũ
 */
function populateFormForEdit(customerId) {
    const customer = allCustomersData.find(c => c.id === customerId);
    if (!customer) {
        console.error("Không tìm thấy khách hàng với ID:", customerId);
        return;
    }
    
    document.getElementById('id').value = customer.id;
    const fields = ['tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.hasOwnProperty('_flatpickr')) {
                element._flatpickr.setDate(customer[fieldId], false);
            } else {
                element.value = customer[fieldId] || '';
            }
        }
    });
    
    // Sửa logic hiển thị ghi chú: điền toàn bộ ghi chú cũ vào textarea
    const ghiChuTextarea = document.getElementById('ghiChu');
    ghiChuTextarea.value = customer.ghiChu || ''; // Hiển thị toàn bộ lịch sử
    ghiChuTextarea.placeholder = "Viết tiếp ghi chú mới vào đây...";
    // Tự động cuộn xuống cuối ô ghi chú để dễ dàng viết tiếp
    ghiChuTextarea.scrollTop = ghiChuTextarea.scrollHeight;
    
    document.getElementById('formTitle').textContent = `Cập nhật KH: ${customer.tenKhachHang}`;
    document.getElementById('submitBtn').textContent = 'Lưu thay đổi';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    openModal();
}

/**
 * HÀM ĐƯỢC SỬA LẠI: Reset ô ghi chú về trạng thái ban đầu
 */
function resetFormToAddMode() {
    document.getElementById('id').value = ''; 
    document.getElementById('addCustomerForm').reset();
    document.getElementById('formTitle').textContent = 'Thêm khách hàng mới';
    document.getElementById('submitBtn').textContent = 'Thêm mới';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('ghiChu').placeholder = "Ghi chú";
}

async function handleSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById('id').value;
    if (editId) { handleUpdateCustomer(editId); } 
    else { handleAddNewCustomer(); }
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
        if (element) url.searchParams.append(fieldId, element._flatpickr ? element.value : element.value);
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

async function handleUpdateCustomer(customerId) {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const url = new URL(WEB_APP_URL);
    url.searchParams.append('action', 'updateCustomer');
    url.searchParams.append('updaterName', loggedInUser.HoTen);
    url.searchParams.append('updaterRole', loggedInUser.VaiTro);
    url.searchParams.append('updaterTeam', loggedInUser.Nhom);
    // Khi cập nhật, gửi đi toàn bộ nội dung của ô Ghi chú
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
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
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

    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        const dataToSearch = currentlyDisplayedData;
        const searchResults = dataToSearch.filter(customer => {
            const phone = String(customer.sdt || '');
            return phone.includes(searchTerm);
        });
        renderTable(searchResults);
    };
    
    if(searchBtn) searchBtn.addEventListener('click', performSearch);
    if(searchInput) searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

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
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            setDefaultDates();
            searchInput.value = '';
            fetchCustomers();
});
    }

    // Khởi tạo các chức năng chính
    setDefaultDates();
    fetchCustomers();
    populateDropdowns();
    const formDateConfig = { altInput: true, altFormat: "d/m/Y", dateFormat: "Y-m-d", allowInput: true };
    flatpickr("#ngayKyHD", formDateConfig);
    flatpickr("#ngayXHD", formDateConfig);
});