/* ============================================================
   TVU-ITAM - API Client
   ============================================================ */
const API = (() => {
    // Auto-detect server URL for Capacitor app
    const detectBaseUrl = () => {
        // Check if running in Capacitor (native app)
        if (typeof window !== 'undefined' && window.Capacitor?.isNative) {
            // Try stored server URL first
            const stored = localStorage.getItem('tvu_server_url');
            if (stored) return stored.replace(/\/+$/, '') + '/api';
            return 'http://localhost:5000/api';
        }
        return '/api';
    };
    const BASE = detectBaseUrl();

    const getToken = () => localStorage.getItem('tvu_token');
    const getUser = () => JSON.parse(localStorage.getItem('tvu_user') || 'null');

    const headers = () => ({
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {})
    });

    const request = async (method, path, body = null) => {
        try {
            const opts = { method, headers: headers() };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(BASE + path, opts);
            const data = await res.json();
            if (res.status === 401) {
                localStorage.removeItem('tvu_token');
                localStorage.removeItem('tvu_user');
                if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        return { ok: false, status: 0, data: { success: false, message: 'Lỗi kết nối server' } };
    }
};

    return {
        get: (path) => request('GET', path),
        post: (path, body) => request('POST', path, body),
        put: (path, body) => request('PUT', path, body),
        delete: (path) => request('DELETE', path),
        getToken, getUser,
        BASE_URL: BASE,
        setServerUrl: (url) => {
            localStorage.setItem('tvu_server_url', url);
            window.location.reload();
        },
        getServerUrl: () => localStorage.getItem('tvu_server_url') || 'http://localhost:5000',
        setAuth: (token, user) => {
            localStorage.setItem('tvu_token', token);
            localStorage.setItem('tvu_user', JSON.stringify(user));
        },
        clearAuth: () => {
            localStorage.removeItem('tvu_token');
            localStorage.removeItem('tvu_user');
            localStorage.removeItem('tvu_server_url');
        },
        isLoggedIn: () => !!getToken(),
        isNative: () => typeof window.Capacitor !== 'undefined' && window.Capacitor?.isNative
    };
})();

// Toast notifications
const Toast = {
    container: null,
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    show(message, type = 'info', duration = 3500) {
        this.init();
        const icons = {
            success: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>',
            error: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>',
            warning: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/></svg>',
            info: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `${icons[type]}<span class="toast-msg">${message}</span>`;
        this.container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut .3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    success: (msg) => Toast.show(msg, 'success'),
    error: (msg) => Toast.show(msg, 'error'),
    warning: (msg) => Toast.show(msg, 'warning'),
    info: (msg) => Toast.show(msg, 'info')
};

// Helpers
const fmt = {
    currency: (v) => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—',
    date: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    datetime: (v) => v ? new Date(v).toLocaleString('vi-VN') : '—',
    statusLabel: { active: 'Đang dùng', maintenance: 'Bảo trì', broken: 'Hỏng', disposed: 'Thanh lý', inactive: 'Ngừng dùng', in_stock: 'Đang trong kho' },
    roleLabel: { superadmin: 'Quản trị viên cấp cao', admin: 'Quản trị viên', user: 'Người dùng' },
    roleDescription: {
        superadmin: '',
        admin: '',
        user: ''
    },
    priorityLabel: { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Khẩn cấp' },
    typeLabel: { dinh_ky: 'Định kỳ', dot_xuat: 'Đột xuất' },
    maintenanceStatus: { cho_xu_ly: 'Chờ xử lý', da_duyet: 'Đã duyệt', dang_thuc_hien: 'Đang thực hiện', hoan_thanh: 'Hoàn thành', huy: 'Hủy' },
    maintenanceResult: { da_sua: 'Đã sửa', khong_sua_duoc: 'Không sửa được' },
    incidentStatus: { open: 'Mới', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết', closed: 'Đóng' },
    initials: (name) => name ? name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() : '?',
    deviceIcon: { 1: '🖥️', 2: '💻', 3: '🖧', 4: '🌐', 5: '🖨️', 6: '🖥', 7: '📽️', 8: '🔋', 9: '💾', 10: '⌨️' }
};
