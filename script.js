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

async /**
 * Hàm ĐỌC dữ liệu từ Google Sheet.
 * Gửi kèm thông tin người dùng để back-end lọc dữ liệu.
 */
async function fetchCustomers() {
    customerTableBody.innerHTML = '<tr><td colspan="3">Đang tải dữ liệu...</td></tr>';
    
    // Lấy thông tin người dùng đã đăng nhập từ sessionStorage
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser) {
        customerTableBody.innerHTML = '<tr><td colspan="3">Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</td></tr>';
        // Có thể thêm lệnh chuyển về trang đăng nhập sau 3 giây
        // setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        return;
    }

    // Tạo URL với các tham số để gửi lên back-end
    const urlWithParams = new URL(GOOGLE_SCRIPT_URL);
    // Không cần action=getCustomers vì doGet mặc định là lấy KH
    urlWithParams.searchParams.append('role', loggedInUser.VaiTro);
    urlWithParams.searchParams.append('name', loggedInUser.HoTen);
    urlWithPrams.searchParams.append('team', loggedInUser.Nhom); // Chữ "Nhom" phải khớp với tên cột trong sheet NguoiDung
    
    // Tạo URL cuối cùng để gọi qua proxy
    const finalUrlToFetch = PROXIED_URL + encodeURIComponent(urlWithParams.href);

    try {
        const response = await fetch(finalUrlToFetch);
        const data = await response.json();
        
        customerTableBody.innerHTML = ''; 
        
        if (data.length === 0) {
            customerTableBody.innerHTML = '<tr><td colspan="3">Bạn chưa có khách hàng nào.</td></tr>';
            return;
        }

        data.forEach(customer => {
            const row = document.createElement('tr');
            // Cập nhật để hiển thị cả tên Nhân viên tạo
            row.innerHTML = `
                <td>${customer.TenKhachHang}</td>
                <td>${customer.SoDienThoai}</td>
                <td>${customer.NhanVienTao}</td>
                <td>${new Date(customer.NgayTao).toLocaleString('vi-VN')}</td>
            `;
            customerTableBody.appendChild(row);
        });
    } catch (error) {
        customerTableBody.innerHTML = `<tr><td colspan="4">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
        console.error("Lỗi fetchCustomers: ", error);
    }
}


function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = type; 
}

form.addEventListener('submit', addCustomer);
loadDataBtn.addEventListener('click', fetchCustomers);
document.addEventListener('DOMContentLoaded', fetchCustomers);