// ===============================================================
// FILE: script.js
// MỤC ĐÍCH: XỬ LÝ LOGIC TRANG QUẢN LÝ KHÁCH HÀNG
// ===============================================================

// --- CẤU HÌNH KẾT NỐI VỚI PROXY ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxicuA511S69p4TK4oUfVLADI2ytb9EJHq3C7MdKElb3D0M4FxlcBRDZUT7S0kjL6g/exec';
const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const WEB_APP_URL = PROXY_URL + encodeURIComponent(GOOGLE_SCRIPT_URL);
// --- KẾT THÚC CẤU HÌNH ---


const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');

/**
 * Hàm GHI dữ liệu khách hàng mới lên Google Sheet qua phương thức POST
 */
async function addCustomer(event) {
    event.preventDefault(); 
    
    const tenKhachHang = document.getElementById('tenKhachHang').value;
    const soDienThoai = document.getElementById('soDienThoai').value;
    
    // Dữ liệu khách hàng
    const customerData = {
        TenKhachHang: tenKhachHang,
        SoDienThoai: soDienThoai,
        NgayTao: new Date().toLocaleString('vi-VN'),
        ID: 'KH' + Date.now(),
        NhanVienTao: "Test User" 
    };

    // Toàn bộ request body, bao gồm action và data
    const requestBody = {
      action: 'addCustomer',
      data: customerData
    };

    try {
        // Gửi yêu cầu POST đến proxy
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();

        if(result.status === 'success') {
            showMessage('Đã thêm khách hàng thành công! Đang tải lại danh sách...', 'success');
            form.reset();
            setTimeout(fetchCustomers, 500); // Chờ 0.5s để sheet kịp cập nhật
        } else {
            showMessage('Lỗi từ server: ' + result.message, 'error');
        }
        
    } catch (error) {
        showMessage(`Lỗi khi thêm khách hàng: ${error.message}`, 'error');
    }
}

/**
 * Hàm ĐỌC dữ liệu từ Google Sheet qua phương thức GET
 */
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="3">Đang tải dữ liệu...</td></tr>';
    try {
        const response = await fetch(WEB_APP_URL); // Gửi yêu cầu GET đơn giản
        const data = await response.json();
        
        customerTableBody.innerHTML = ''; 
        
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="3">Chưa có dữ liệu.</td></tr>';
            return;
        }

        data.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.TenKhachHang}</td>
                <td>${customer.SoDienThoai}</td>
                <td>${new Date(customer.NgayTao).toLocaleString('vi-VN')}</td>
            `;
            customerTableBody.appendChild(row);
        });
    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="3">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
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