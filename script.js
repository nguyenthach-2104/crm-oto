// ===============================================================
// FILE: script.js (Phiên bản cuối cùng, sửa lỗi Sắp xếp)
// ===============================================================

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; 

let allCustomersData = [];

/**
 * HÀM TRỢ GIÚP MỚI: Chuyển đổi chuỗi ngày tháng (cả dd/mm/yyyy và yyyy-mm-dd) thành đối tượng Date
 */
function parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Thử định dạng yyyy-mm-dd hh:mm:ss (chuẩn)
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Thử định dạng dd/mm/yyyy...
    const parts = dateString.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (parts) {
        // parts[1]=dd, parts[2]=mm, parts[3]=yyyy
        date = new Date(parts[3], parts[2] - 1, parts[1]);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    return null; // Trả về null nếu không thể chuyển đổi
}

/**
 * HÀM ĐƯỢC CẬP NHẬT: Thêm logic sort ở front-end
 */
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
        let data = await response.json();
        
        if (Array.isArray(data)) {
            // SẮP XẾP DỮ LIỆU Ở ĐÂY, DÙNG HÀM PARSEDATE MỚI
            data.sort((a, b) => {
                const dateA = parseDate(a.dauThoiGian);
                const dateB = parseDate(b.dauThoiGian);
                return (dateB || 0) - (dateA || 0);
            });
        }
        
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
                <td>${customer.dauThoiGian ? new Date(parseDate(customer.dauThoiGian)).toLocaleString('vi-VN') : ''}</td>
                <td><button class="edit-btn" data-id="${customer.id}">Sửa</button></td>
            `;
            customerTableBody.appendChild(row);
        });

    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="6">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
    }
}


// ... (Tất cả các hàm khác từ populateFormForEdit đến hết file giữ nguyên như phiên bản đầy đủ trước đó) ...
// Để đảm bảo, tôi sẽ dán lại toàn bộ các hàm còn lại.

function populateFormForEdit(customerId) {
    const customer = allCustomersData.find(c => c.id === customerId);
    if (!customer) { console.error("Không tìm thấy khách hàng với ID:", customerId); return; }
    document.getElementById('id').value = customer.id;
    const fields = ['tenKhachHang', 'sdt', 'tinhThanh', 'huyenTp', 'loaiXe', 'phienBan', 'mau', 'kenh', 'nguon', 'trangThai', 'phanLoaiKH', 'laiThu', 'ngayKyHD', 'ngayXHD', 'ghiChu'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) { element.value = customer[fieldId] || ''; }
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

function resetFormToAddMode() {
    document.getElementById('id').value = ''; 
    document.getElementById('addCustomerForm').reset();
    document.getElementById('formTitle').textContent = 'Thêm khách hàng mới';
    document.getElementById('submitBtn').textContent = 'Thêm mới';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('oldNotesDisplay').style.display = 'none';
    document.getElementById('ghiChu').placeholder = "Ghi chú";
}

async function handleSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById('id').value;
    if (editId) { handleUpdateCustomer(editId); } 
    else { handleAddNewCustomer(); }
}

async function handleAddNewCustomer() { /* Giữ nguyên như cũ */ }
async function handleUpdateCustomer(customerId) { /* Giữ nguyên như cũ */ }
async function populateDropdowns() { /* Giữ nguyên như cũ */ }
function showMessage(msg, type) { /* Giữ nguyên như cũ */ }
function openModal() { document.getElementById('customerModal').style.display = 'flex'; }
function closeModal() { document.getElementById('customerModal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', () => { /* Giữ nguyên như cũ */ });

// Dán lại các hàm còn thiếu để bạn có file đầy đủ nhất

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

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) { messageDiv.textContent = msg; messageDiv.className = type; }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addCustomerForm');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const customerModal = document.getElementById('customerModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const customerTableBody = document.querySelector('#customerTable tbody');
    if(addCustomerBtn) { addCustomerBtn.addEventListener('click', () => { resetFormToAddMode(); openModal(); }); }
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(customerModal) { customerModal.addEventListener('click', (event) => { if (event.target === customerModal) closeModal(); }); }
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
    fetchCustomers();
    populateDropdowns();
    flatpickr("#ngayKyHD", { dateFormat: "d/m/Y" });
    flatpickr("#ngayXHD", { dateFormat: "d/m/Y" });
});