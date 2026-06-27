window.SettingsPage = (() => {
    const escapeHtml = (text) => {
        if (text == null) return '';
        return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    };

    const saveSettings = async () => {
        const btn = document.getElementById('saveSettingsBtn');
        btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;margin:0 auto"></div>';
        const payload = {
            notification_email: document.getElementById('settingNotificationEmail').value.trim(),
            maintenance_default_interval_days: document.getElementById('settingMaintenanceInterval').value || '90',
            maintenance_notification_enabled: document.getElementById('settingNotifyMaintenance').checked ? '1' : '0',
            login_alerts_enabled: document.getElementById('settingLoginAlerts').checked ? '1' : '0'
        };
        const res = await API.put('/settings', payload);
        if (!res.ok) { Toast.error(res.data?.message || 'Lưu cài đặt thất bại'); btn.disabled = false; btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu cài đặt`; return; }
        Toast.success('Cài đặt đã được lưu');
        btn.disabled = false; btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Lưu cài đặt`;
    };

    const render = async () => {
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Cài đặt hệ thống</div>
                                <div class="dev-subtitle">Cấu hình các thông số chung cho toàn bộ hệ thống</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="settingsBody">
                <div style="display:flex;justify-content:center;align-items:center;height:200px"><div class="spinner"></div></div>
            </div>
        </div>`;

        const res = await API.get('/settings');
        if (!res.ok) {
            document.getElementById('settingsBody').innerHTML = '<div class="dev-empty"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>Không thể tải cài đặt</h3></div>';
            return;
        }
        const cfg = res.data.data;

        document.getElementById('settingsBody').innerHTML = `
            <div class="settings-grid">
                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-card-icon" style="background:linear-gradient(135deg,#DBEAFE,#EFF6FF);color:#2563EB">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        </div>
                        <span>Thông báo & Cảnh báo</span>
                    </div>
                    <div class="settings-card-body">
                        <div class="form-group" style="margin:0">
                            <label class="form-label">Email nhận thông báo</label>
                            <input id="settingNotificationEmail" class="form-control" type="email" value="${escapeHtml(cfg.notification_email || '')}" placeholder="admin@tvu.edu.vn" style="margin-top:4px">
                            <div class="form-hint">Email dùng để gửi cảnh báo bảo trì và thông báo hệ thống.</div>
                        </div>
                        <div class="toggle-row">
                            <div>
                                <div class="toggle-label">Cảnh báo bảo trì</div>
                                <div class="toggle-desc">Gửi thông báo khi thiết bị đến hạn bảo trì</div>
                            </div>
                            <label class="toggle-switch">
                                <input id="settingNotifyMaintenance" type="checkbox" ${cfg.maintenance_notification_enabled === '1' ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="toggle-row">
                            <div>
                                <div class="toggle-label">Cảnh báo đăng nhập</div>
                                <div class="toggle-desc">Thông báo khi có đăng nhập bất thường</div>
                            </div>
                            <label class="toggle-switch">
                                <input id="settingLoginAlerts" type="checkbox" ${cfg.login_alerts_enabled === '1' ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-card-icon" style="background:linear-gradient(135deg,#DCFCE7,#ECFDF5);color:#059669">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        </div>
                        <span>Bảo trì & Bảo hành</span>
                    </div>
                    <div class="settings-card-body">
                        <div class="form-group" style="margin:0">
                            <label class="form-label">Chu kỳ bảo trì mặc định</label>
                            <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
                                <input id="settingMaintenanceInterval" class="form-control" type="number" min="1" value="${cfg.maintenance_default_interval_days || 90}" style="width:100px;text-align:center">
                                <span class="form-unit">ngày</span>
                            </div>
                            <div class="form-hint">Khoảng thời gian mặc định giữa các lần bảo trì thiết bị.</div>
                        </div>
                        <div class="settings-info-row" style="background:linear-gradient(135deg,#ECFDF5,#DCFCE7);border-color:#A7F3D0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            <div>
                                <div style="font-weight:600;color:#065F46;font-size:.82rem">Hệ thống đang hoạt động</div>
                                <div style="color:#047857;font-size:.73rem">Các cài đặt sẽ được áp dụng ngay sau khi lưu</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="capacitorSettings" class="settings-card" style="display:none;margin-top:1rem">
                <div class="settings-card-header">
                    <div class="settings-card-icon" style="background:linear-gradient(135deg,#EDE9FE,#F3E8FF);color:#7C3AED">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </div>
                    <span>Cấu hình kết nối App</span>
                </div>
                <div class="settings-card-body">
                    <div class="form-hint" style="margin-bottom:8px">
                        Nhập địa chỉ IP máy chủ để ứng dụng di động kết nối.
                        VD: <code style="background:#F1F5F9;padding:1px 6px;border-radius:4px;font-size:.75rem">http://192.168.1.6:5000</code>
                    </div>
                    <div style="display:flex;gap:8px">
                        <input id="serverUrlInput" class="form-control" type="text" value="${API.getServerUrl()}" placeholder="http://192.168.1.6:5000" style="flex:1;font-family:monospace;font-size:.82rem">
                        <button class="dev-btn-primary dev-btn-sm" id="setServerUrlBtn" style="white-space:nowrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Kết nối
                        </button>
                    </div>
                    <div id="serverStatus" class="form-hint" style="margin-top:6px">
                        🔄 Đang kiểm tra kết nối...
                    </div>
                </div>
            </div>

            <div class="settings-actions">
                <button class="dev-btn-primary" id="saveSettingsBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Lưu cài đặt
                </button>
            </div>`;

        document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);

        const capSection = document.getElementById('capacitorSettings');
        const isNative = API.isNative();
        const hasStoredUrl = !!localStorage.getItem('tvu_server_url');
        if (capSection) {
            if (isNative || hasStoredUrl) capSection.style.display = '';
        }
        const setServerBtn = document.getElementById('setServerUrlBtn');
        if (setServerBtn) {
            setServerBtn.addEventListener('click', () => {
                const url = document.getElementById('serverUrlInput')?.value.trim();
                if (url) API.setServerUrl(url);
            });
        }
        const serverStatus = document.getElementById('serverStatus');
        if (serverStatus) {
            const input = document.getElementById('serverUrlInput');
            const checkUrl = input?.value || API.getServerUrl();
            fetch(checkUrl + '/api/health')
                .then(r => r.json())
                .then(d => {
                    serverStatus.innerHTML = '✅ Kết nối thành công — Server: ' + (d.message || 'OK');
                    serverStatus.style.color = '#10B981';
                })
                .catch(() => {
                    serverStatus.innerHTML = '⚠️ Không thể kết nối server. Kiểm tra lại địa chỉ IP.';
                    serverStatus.style.color = '#EF4444';
                });
        }
    };

    return { render };
})();