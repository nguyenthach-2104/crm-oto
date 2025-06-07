// URL CUỐI CÙNG, KHÔNG DÙNG PROXY
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzeBEriyabZ1C7bHAHbkuZNlHek8Xkk5pATqUCBI8MdW8RUxq4vwf9J-LJP7yS_v7wx/exec'; // <-- Dán cùng một URL mới nhất vào đây

const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');

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
    url.searchParams.append('NhanVienTao', loggedInUser ? loggedInUser.HoTen : "Không xác định");

    try {
        const response = await fetch(url);
        const result = await response.json();
        if(result.status === 'success') {
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

async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="3">Đang tải...</td></tr>';
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        customerTableBody.innerHTML = ''; 
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="3">Chưa có dữ liệu.</td></tr>';
            return;
        }
        data.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${customer.TenKhachHang}</td><td>${customer.SoDienThoai}</td><td>${new Date(customer.NgayTao).toLocaleString('vi-VN')}</td>`;
            customerTableBody.appendChild(row);
        });
    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="3">Lỗi khi tải dữ liệu.</td></tr>`;
    }
}

function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}

form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);
document.addEventListener('DOMContentLoaded', fetchCustomers);