/* ============================================================
   TVU-ITAM - Login Page JS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (API.isLoggedIn()) {
        window.location.href = '/app.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const togglePwd = document.getElementById('togglePwd');

    // Toggle password visibility - login
    togglePwd.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    });

    // Toggle password visibility - register
    const regPasswordInput = document.getElementById('reg_password');
    const regTogglePwd = document.getElementById('regTogglePwd');
    if (regTogglePwd) {
        regTogglePwd.addEventListener('click', () => {
            const type = regPasswordInput.type === 'password' ? 'text' : 'password';
            regPasswordInput.type = type;
        });
    }



    // Login form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        errorDiv.style.display = 'none';
        loginBtn.disabled = true;
        loginBtnText.textContent = 'Đang đăng nhập...';
        loginSpinner.style.display = 'block';

        const res = await API.post('/auth/login', { username, password });

        loginBtn.disabled = false;
        loginBtnText.textContent = 'Đăng nhập';
        loginSpinner.style.display = 'none';

        if (res.ok && res.data.success) {
            API.setAuth(res.data.token, res.data.user);
            
            // Kiểm tra xem có địa chỉ cần quay lại không (Ví dụ từ QR Code)
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = '/app.html' + redirectUrl;
            } else {
                window.location.href = '/app.html';
            }
        } else {
            errorDiv.textContent = res.data.message || 'Đăng nhập thất bại';
            errorDiv.style.display = 'block';
        }
    });

    // Form toggle logic
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const regDeptSelect = document.getElementById('reg_dept');

    const loadDepartments = async () => {
        if (regDeptSelect.options.length > 1) return; // Already loaded
        const res = await API.get('/departments');
        if (res.ok) {
            const depts = res.data.data;
            regDeptSelect.innerHTML = '<option value="">-- Chọn phòng ban / khoa --</option>' + 
                depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        } else {
            regDeptSelect.innerHTML = '<option value="">Lỗi tải phòng ban</option>';
        }
    };

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            loadDepartments();
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // Forgot password modal
    const forgotPwdLink = document.getElementById('forgotPwdLink');
    if (forgotPwdLink) {
        forgotPwdLink.addEventListener('click', (e) => {
            e.preventDefault();

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'forgot-overlay';
            overlay.innerHTML = `
                <div class="forgot-modal">
                    <button type="button" class="forgot-close" id="forgotClose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                    <div id="forgotStep1">
                        <div class="forgot-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        </div>
                        <h3>Quên mật khẩu?</h3>
                        <p>Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
                        <div class="forgot-input-wrapper">
                            <input type="email" id="forgotEmail" placeholder="Email của bạn" required>
                        </div>
                        <div id="forgotError" class="alert-error" style="display:none"></div>
                        <button type="button" class="btn-login" id="forgotSubmitBtn">
                            <span id="forgotSubmitText">Gửi yêu cầu</span>
                            <svg class="btn-spinner" id="forgotSubmitSpinner" style="display:none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.3"/>
                                <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    <div id="forgotStep2" style="display:none">
                        <div class="forgot-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        </div>
                        <h3>Kiểm tra email</h3>
                        <p id="forgotSentMsg">Vui lòng kiểm tra email để đặt lại mật khẩu.</p>
                        <div id="forgotCheckGroup" style="margin-top:1rem;text-align:center">
                            <a href="#" id="forgotCheckLink" style="color:var(--login-primary);font-size:.85rem;font-weight:600;text-decoration:none">Đã kiểm tra email →</a>
                        </div>
                        <div id="forgotResetGroup" style="display:none;margin-top:1rem;text-align:center">
                            <a href="#" id="forgotResetBtn" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,var(--login-primary-dark),var(--login-primary));color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(29,78,216,.25)">Đặt lại mật khẩu ngay</a>
                            <p style="margin-top:.75rem;font-size:.75rem;color:#94a3b8">Liên kết hết hạn sau 1 giờ</p>
                        </div>
                        <div style="margin-top:1.25rem;text-align:center">
                            <a href="#" id="forgotBackLink" style="color:#64748B;font-size:.8rem;text-decoration:none">← Gửi lại yêu cầu</a>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const step1 = overlay.querySelector('#forgotStep1');
            const step2 = overlay.querySelector('#forgotStep2');
            const step2Msg = overlay.querySelector('#forgotSentMsg');
            const checkGroup = overlay.querySelector('#forgotCheckGroup');
            const resetGroup = overlay.querySelector('#forgotResetGroup');
            const resetBtn = overlay.querySelector('#forgotResetBtn');

            const closeModal = () => overlay.remove();
            overlay.querySelector('#forgotClose').addEventListener('click', closeModal);
            overlay.addEventListener('click', (ev) => { if (ev.target === overlay) closeModal(); });

            // Submit handler
            const emailInput = overlay.querySelector('#forgotEmail');
            const errDiv = overlay.querySelector('#forgotError');
            const submitBtn = overlay.querySelector('#forgotSubmitBtn');
            const submitText = overlay.querySelector('#forgotSubmitText');
            const submitSpinner = overlay.querySelector('#forgotSubmitSpinner');

            submitBtn.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                if (!email || !isValidEmail(email)) {
                    errDiv.textContent = 'Vui lòng nhập email hợp lệ';
                    errDiv.style.display = 'block';
                    return;
                }
                errDiv.style.display = 'none';
                submitBtn.disabled = true;
                submitText.textContent = 'Đang gửi...';
                submitSpinner.style.display = 'block';

                const res = await API.post('/auth/forgot-password', { email });

                submitBtn.disabled = false;
                submitText.textContent = 'Gửi yêu cầu';
                submitSpinner.style.display = 'none';

                if (res.ok && res.data.success) {
                    step1.style.display = 'none';
                    step2.style.display = 'block';
                    checkGroup.style.display = '';
                    resetGroup.style.display = 'none';
                    step2Msg.textContent = 'Vui lòng kiểm tra email để đặt lại mật khẩu.';
                    if (res.data.resetLink) {
                        resetBtn.href = res.data.resetLink;
                        resetBtn.style.display = '';
                        overlay.querySelector('#forgotCheckLink').addEventListener('click', (e) => {
                            e.preventDefault();
                            checkGroup.style.display = 'none';
                            resetGroup.style.display = '';
                        });
                    } else {
                        overlay.querySelector('#forgotCheckLink').style.display = 'none';
                    }
                    emailInput.value = '';
                } else {
                    errDiv.textContent = res.data.message || 'Lỗi gửi yêu cầu';
                    errDiv.style.display = 'block';
                }
            });

            // Enter key to submit
            emailInput.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') submitBtn.click();
            });

            // Back link: go back to step 1
            overlay.querySelector('#forgotBackLink').addEventListener('click', (e) => {
                e.preventDefault();
                step1.style.display = '';
                step2.style.display = 'none';
            });

            emailInput.focus();
        });
    }

    // Email validation
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Register form submit
    if (registerForm) {
        const regErrorDiv = document.getElementById('registerError');
        const registerBtn = document.getElementById('registerBtn');
        const registerBtnText = document.getElementById('registerBtnText');
        const registerSpinner = document.getElementById('registerSpinner');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('reg_fullname').value.trim();
            const email = document.getElementById('reg_email').value.trim();
            const username = document.getElementById('reg_username').value.trim();
            const password = document.getElementById('reg_password').value;
            const department_id = document.getElementById('reg_dept').value;

            if (!full_name) {
                regErrorDiv.textContent = 'Vui lòng nhập họ và tên';
                regErrorDiv.style.display = 'block'; return;
            }
            if (!email) {
                regErrorDiv.textContent = 'Vui lòng nhập email';
                regErrorDiv.style.display = 'block'; return;
            }
            if (!isValidEmail(email)) {
                regErrorDiv.textContent = 'Email không đúng định dạng';
                regErrorDiv.style.display = 'block'; return;
            }
            if (!department_id) {
                regErrorDiv.textContent = 'Vui lòng chọn phòng ban';
                regErrorDiv.style.display = 'block'; return;
            }

            regErrorDiv.style.display = 'none';
            registerBtn.disabled = true;
            registerBtnText.textContent = 'Đang đăng ký...';
            registerSpinner.style.display = 'block';

            const res = await API.post('/auth/register', { full_name, email, username, password, department_id });

            registerBtn.disabled = false;
            registerBtnText.textContent = 'Đăng ký';
            registerSpinner.style.display = 'none';

            if (res.ok && res.data.success) {
                // Hiển thị thông báo thành công dài hơn để người dùng kịp đọc
                const successMsg = res.data.message || 'Đăng ký thành công! Đang chờ Admin duyệt...';
                regErrorDiv.textContent = successMsg;
                regErrorDiv.style.color = '#10B981';
                regErrorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
                regErrorDiv.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                regErrorDiv.style.display = 'block';

                setTimeout(() => {
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    document.getElementById('username').value = username;
                    document.getElementById('password').value = '';
                    document.getElementById('password').focus();
                    registerForm.reset();
                    // Reset styling cho error div
                    regErrorDiv.style.color = '';
                    regErrorDiv.style.background = '';
                    regErrorDiv.style.borderColor = '';
                }, 4000);
            } else {
                regErrorDiv.textContent = res.data.message || 'Đăng ký thất bại';
                regErrorDiv.style.display = 'block';
            }
        });
    }
});
