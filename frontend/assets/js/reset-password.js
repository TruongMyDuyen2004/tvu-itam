document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
        document.getElementById('resetForm').innerHTML = '<div class="alert-error" style="display:block;text-align:center;padding:20px;">Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu.</div>'
            + '<div class="form-toggle" style="margin-top:16px"><a href="/">Quay lại đăng nhập</a></div>';
        return;
    }

    const form = document.getElementById('resetForm');
    const passwordInput = document.getElementById('new_password');
    const confirmInput = document.getElementById('confirm_password');
    const errorDiv = document.getElementById('resetError');
    const resetBtn = document.getElementById('resetBtn');
    const resetBtnText = document.getElementById('resetBtnText');
    const resetSpinner = document.getElementById('resetSpinner');

    // Toggle password visibility
    document.getElementById('togglePwd').addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (password.length < 6) {
            errorDiv.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            errorDiv.style.display = 'block';
            return;
        }
        if (password !== confirm) {
            errorDiv.textContent = 'Mật khẩu xác nhận không khớp';
            errorDiv.style.display = 'block';
            return;
        }

        errorDiv.style.display = 'none';
        resetBtn.disabled = true;
        resetBtnText.textContent = 'Đang xử lý...';
        resetSpinner.style.display = 'block';

        const res = await API.post('/auth/reset-password', { token, password });

        resetBtn.disabled = false;
        resetBtnText.textContent = 'Đặt lại mật khẩu';
        resetSpinner.style.display = 'none';

        if (res.ok && res.data.success) {
            errorDiv.textContent = res.data.message + ' Đang chuyển hướng...';
            errorDiv.style.color = '#10B981';
            errorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
            errorDiv.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            errorDiv.style.display = 'block';
            setTimeout(() => { window.location.href = '/'; }, 3000);
        } else {
            errorDiv.textContent = res.data.message || 'Đặt lại mật khẩu thất bại';
            errorDiv.style.display = 'block';
        }
    });
});
