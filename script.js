// Dán URL của Google Apps Script Web App vào đây
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyt_UvCyx7uoo6RaFkrY-xXO0Mqq0thQ_hMYaQ9HhcwV6aiCNn99NtDs62ikdq_v2WJ/exec';

const form = document.getElementById('addCustomerForm');
const messageDiv = document.getElementById('message');
const customerTableBody = document.querySelector('#customerTable tbody');
const loadDataBtn = document.getElementById('loadDataBtn');

// Hàm GHI dữ liệu lên Google Sheet qua phương thức POST
async function addCustomer(event) {
    event.preventDefault(); // Ngăn form gửi theo cách truyền thống
    
    const tenKhachHang = document.getElementById('tenKhachHang').value;
    const soDienThoai = document.getElementById('soDienThoai').value;
    
    // Tạo đối tượng dữ liệu để gửi đi
    // Tên thuộc tính (VD: "TenKhachHang") phải TRÙNG KHỚP với tên cột trong Google Sheet
    const dataToSend = {
        TenKhachHang: tenKhachHang,
        SoDienThoai: soDienThoai,
        NgayTao: new Date().toLocaleString('vi-VN'), // Tự động thêm ngày giờ
        ID: 'KH' + Date.now(), // Tạo ID duy nhất đơn giản
        NhanVienTao: "Test User" // Sẽ thay bằng tên nhân viên đăng nhập sau
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Dùng no-cors cho các POST đơn giản tới Apps Script
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
            redirect: 'follow'
        });
        
        // Với no-cors, chúng ta không thể đọc response, nhưng có thể giả định thành công
        showMessage('Gửi yêu cầu thêm khách hàng thành công! Đang tải lại danh sách...', 'success');
        form.reset();
        
        // Tải lại dữ liệu sau khi thêm
        setTimeout(fetchCustomers, 1000); // Chờ 1s để sheet kịp cập nhật
        
    } catch (error) {
        showMessage(`Lỗi: ${error.message}`, 'error');
    }
}


// Hàm ĐỌC dữ liệu từ Google Sheet qua phương thức GET
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="3">Đang tải dữ liệu...</td></tr>';
    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        customerTableBody.innerHTML = ''; // Xóa nội dung cũ
        
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

// Hàm hiển thị thông báo
function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; // 'success' hoặc 'error'
}


// Gán sự kiện cho form và nút
form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);

// Tự động tải dữ liệu khi mở trang
document.addEventListener('DOMContentLoaded', fetchCustomers);
