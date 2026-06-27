(function () {
    const statusLabel = {
        active: 'Đang sử dụng',
        maintenance: 'Đang bảo trì',
        broken: 'Hỏng',
        disposed: 'Đã thanh lý',
        inactive: 'Ngừng sử dụng'
    };

    const statusBadgeClass = {
        active: 'badge-active',
        maintenance: 'badge-maintenance',
        broken: 'badge-broken',
        disposed: 'badge-disposed',
        inactive: 'badge-secondary'
    };

    const maintTypeLabel = {
        dinh_ky: 'Bảo trì định kỳ',
        dot_xuat: 'Sửa chữa đột xuất'
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('vi-VN');
    };

    const render = (device) => {
        const root = document.getElementById('publicContent');
        const badgeCls = statusBadgeClass[device.status] || 'badge-secondary';
        const statusText = statusLabel[device.status] || device.status;
        const maintHtml = (device.maintenance_summary || []).length
            ? device.maintenance_summary.map(m => `
                <div class="public-maint-item">
                    ${maintTypeLabel[m.maintenance_type] || m.maintenance_type}
                    — ${fmtDate(m.request_date)}
                    <span class="badge badge-${m.status === 'hoan_thanh' ? 'success' : 'pending'}" style="margin-left:.35rem;font-size:.7rem">
                        ${m.status === 'hoan_thanh' ? 'Hoàn thành' : 'Chờ xử lý'}
                    </span>
                </div>
            `).join('')
            : '<div class="public-maint-item" style="color:var(--text-muted)">Chưa có lịch sử bảo trì gần đây</div>';

        root.innerHTML = `
            <div class="public-card">
                <div class="public-card-body">
                    <div class="public-device-code">${device.device_code}</div>
                    <h1 class="public-device-name">${device.name}</h1>
                    <span class="badge ${badgeCls}">${statusText}</span>
                    <div class="public-info-grid">
                        ${row('Loại', (device.category_icon || '') + ' ' + (device.category_name || '—'))}
                        ${row('Phòng ban', device.department_name)}
                        ${row('Người sử dụng', device.assigned_user_name)}
                        ${row('Hãng / Model', [device.brand, device.model].filter(Boolean).join(' ') || '—')}
                        ${row('Số serial', device.serial_number)}
                        ${row('Vị trí', device.location)}
                        ${row('Hạn bảo hành', fmtDate(device.warranty_expiry))}
                    </div>
                    <div class="public-section-title">Bảo trì gần đây</div>
                    ${maintHtml}
                </div>
            </div>
            <div class="public-footer">
                <p>Tra cứu qua mã QR — TVU-ITAM</p>
                <p style="margin-top:.5rem"><a href="/">Đăng nhập hệ thống quản lý</a></p>
            </div>
        `;
        document.title = `${device.device_code} — ${device.name} | TVU-ITAM`;
    };

    const row = (label, value) => `
        <div class="public-info-row">
            <span class="public-info-label">${label}</span>
            <span class="public-info-value">${value || '—'}</span>
        </div>
    `;

    const showError = (message) => {
        document.getElementById('publicContent').innerHTML = `
            <div class="public-card">
                <div class="public-error">
                    <h2>Không tìm thấy thiết bị</h2>
                    <p>${message || 'Thiết bị không tồn tại trong hệ thống.'}</p>
                    <p style="margin-top:1rem"><a href="/" class="btn btn-primary btn-sm">Về trang đăng nhập</a></p>
                </div>
            </div>
        `;
    };

    // Check for server-embedded data first
    if (window.__DEVICE_DATA__) {
        // SSR already rendered the HTML — just hide the spinner
        const spinner = document.querySelector('.public-loading');
        if (spinner) spinner.style.display = 'none';
        return;
    }

    // Fallback: fetch from API (for backward compatibility)
    const parseRoute = () => {
        const path = window.location.pathname.replace(/\/+$/, '');
        const qMatch = path.match(/\/q\/(.+)$/i);
        if (qMatch) return { type: 'code', value: decodeURIComponent(qMatch[1]) };
        const qrMatch = path.match(/\/qr\/(.+)$/i);
        if (qrMatch) return { type: 'code', value: decodeURIComponent(qrMatch[1]) };
        const idMatch = path.match(/\/device\/(\d+)$/i);
        if (idMatch) return { type: 'id', value: idMatch[1] };
        const params = new URLSearchParams(window.location.search);
        if (params.get('code')) return { type: 'code', value: params.get('code') };
        if (params.get('id')) return { type: 'id', value: params.get('id') };
        return null;
    };

    const fetchWithTimeout = (url, timeoutMs = 8000) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(url, { signal: controller.signal })
            .finally(() => clearTimeout(timeout));
    };

    const init = async () => {
        const route = parseRoute();
        if (!route) {
            showError('Liên kết QR không hợp lệ.');
            return;
        }
        const apiUrl = route.type === 'id'
            ? `/api/public/device/${route.value}`
            : `/api/public/qr/${encodeURIComponent(route.value)}`;
        try {
            const res = await fetchWithTimeout(apiUrl, 8000);
            const json = await res.json();
            if (!res.ok || !json.success) {
                showError(json.message);
                return;
            }
            render(json.data);
        } catch (err) {
            console.error('QR fetch error:', err);
            if (err.name === 'AbortError') {
                showError('Kết nối quá chậm. Vui lòng thử lại sau.');
            } else {
                showError('Không thể kết nối máy chủ.');
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
