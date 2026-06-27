window.LoginHistoryPage = (() => {
    let currentFilter = { username: '', success: '' };
    let activeStat = '';
    let fullStats = { total: 0, success: 0, fail: 0 };
    let allRows = [];

    const escapeHtml = (text) => {
        if (text == null) return '';
        return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    };

    const renderHistory = () => {
        const wrapper = document.getElementById('loginHistoryTableWrapper');
        if (!wrapper) return;

        const rows = allRows.filter(r => {
            if (currentFilter.username && !r.username?.toLowerCase().includes(currentFilter.username.toLowerCase())) return false;
            if (currentFilter.success !== '' && String(r.success) !== currentFilter.success) return false;
            return true;
        });

        const successCount = rows.filter(r => r.success == 1).length;
        const failCount = rows.filter(r => r.success == 0).length;

        document.getElementById('histTotal').textContent = fullStats.total;
        document.getElementById('histSuccess').textContent = fullStats.success;
        document.getElementById('histFail').textContent = fullStats.fail;
        document.getElementById('histCount').textContent = `${rows.length} bản ghi`;

        document.querySelectorAll('.dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`.dash-stat-card[data-stat="${activeStat}"]`)?.classList.add('active');

        if (!rows.length) {
            wrapper.innerHTML = '<div class="dev-empty"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><h3>Không có dữ liệu</h3></div>';
            return;
        }

        wrapper.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.1s"><table class="dev-table">
            <thead><tr><th style="padding-left:1.25rem;min-width:150px">Thời gian</th><th>Tài khoản</th><th>Người dùng</th><th style="width:1%">Quyền</th><th style="width:1%">Trạng thái</th><th style="width:1%">IP</th><th style="padding-right:1.25rem">Nội dung</th></tr></thead>
            <tbody>${rows.map(r => `<tr class="dev-tr">
                <td data-label="Thời gian" style="padding-left:1.25rem"><span class="dev-td-date" style="white-space:nowrap">${fmt.datetime(r.created_at)}</span></td>
                <td data-label="Tài khoản"><code style="background:#F3F4F6;padding:2px 8px;border-radius:5px;font-size:.78rem">${escapeHtml(r.username)}</code></td>
                <td data-label="Người dùng" style="font-size:.85rem;color:var(--text-secondary)">${escapeHtml(r.full_name || '<span class="text-muted">—</span>')}</td>
                <td data-label="Quyền">${r.role ? `<span class="dev-status-pill ${r.role === 'superadmin' ? 'badge-superadmin' : r.role === 'admin' ? 'badge-admin' : 'badge-user'}" style="font-size:.65rem">${fmt.roleLabel[r.role]}</span>` : '<span class="text-muted">—</span>'}</td>
                <td data-label="Trạng thái"><span class="dev-status-pill ${r.success == 1 ? 'badge-completed' : 'badge-critical'}" style="font-size:.68rem">${r.success == 1 ? 'Thành công' : 'Thất bại'}</span></td>
                <td data-label="IP" style="font-family:monospace;font-size:.78rem;color:var(--text-secondary)">${escapeHtml(r.ip_address || '—')}</td>
                <td data-label="Nội dung" style="padding-right:1.25rem;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82rem;color:var(--text-muted)">${escapeHtml(r.message || '—')}</td>
            </tr>`).join('')}</tbody>
        </table></div>`;
    };

    const loadHistory = async () => {
        const res = await API.get('/auth/history');
        if (!res.ok) return;
        allRows = res.data.data.rows || [];
        fullStats = {
            total: allRows.length,
            success: allRows.filter(r => r.success == 1).length,
            fail: allRows.filter(r => r.success == 0).length
        };
        renderHistory();
    };

    const exportCsv = () => {
        const query = [];
        if (currentFilter.username) query.push(`username=${encodeURIComponent(currentFilter.username)}`);
        if (currentFilter.success !== '') query.push(`success=${encodeURIComponent(currentFilter.success)}`);
        const token = localStorage.getItem('tvu_token');
        if (token) query.push(`token=${encodeURIComponent(token)}`);
        window.location.href = `/api/auth/history/export${query.length ? `?${query.join('&')}` : ''}`;
    };

    const setStatFilter = (stat) => {
        activeStat = activeStat === stat ? '' : stat;
        if (activeStat === 'success') currentFilter.success = '1';
        else if (activeStat === 'fail') currentFilter.success = '0';
        else currentFilter.success = '';
        currentFilter.username = document.getElementById('loginHistoryUsername')?.value.trim() || '';
        renderHistory();
    };

    const render = async () => {
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Lịch sử đăng nhập</div>
                                <div class="dev-subtitle">Theo dõi hoạt động đăng nhập hệ thống</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        <button class="dev-btn-secondary" id="refreshLoginHistoryBtn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                            Tải lại
                        </button>
                        <button class="dev-btn-primary" id="exportLoginHistoryBtn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Xuất Excel
                        </button>
                    </div>
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat-card" data-stat="" onclick="LoginHistoryPage.setStatFilter('')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4338CA,#4F46E5)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="histTotal">-</div>
                        <div class="dash-stat-label">Tổng lượt</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="success" onclick="LoginHistoryPage.setStatFilter('success')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4F46E5,#6366F1)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="histSuccess">-</div>
                        <div class="dash-stat-label">Thành công</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="fail" onclick="LoginHistoryPage.setStatFilter('fail')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#6366F1,#818CF8)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="histFail">-</div>
                        <div class="dash-stat-label">Thất bại</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="cursor:default;--stat-gradient:linear-gradient(135deg,#818CF8,#A5B4FC)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#818CF8,#A5B4FC)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" style="font-size:1.3rem">1</div>
                        <div class="dash-stat-label">90 ngày</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap">
                        <div class="dev-search-wrap" style="min-width:200px;flex:1;max-width:320px">
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                            <input id="loginHistoryUsername" placeholder="Tên đăng nhập..." value="${currentFilter.username}">
                        </div>
                        <div class="dev-filter-selects">
                            <select class="dev-select" id="loginHistorySuccess" style="min-width:120px">
                                <option value="">Tất cả trạng thái</option>
                                <option value="1" ${currentFilter.success === '1' ? 'selected' : ''}>Thành công</option>
                                <option value="0" ${currentFilter.success === '0' ? 'selected' : ''}>Thất bại</option>
                            </select>
                        </div>
                        <button class="dev-btn-primary dev-btn-sm" id="applyLoginHistoryFilterBtn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                            Lọc
                        </button>
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span id="histCount">Đang tải...</span>
                    </span>
                </div>
                <div id="loginHistoryTableWrapper" style="min-height:250px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;

        document.getElementById('refreshLoginHistoryBtn')?.addEventListener('click', () => {
            currentFilter = { username: '', success: '' };
            activeStat = '';
            document.getElementById('loginHistoryUsername').value = '';
            document.getElementById('loginHistorySuccess').value = '';
            loadHistory();
        });
        document.getElementById('applyLoginHistoryFilterBtn')?.addEventListener('click', () => {
            currentFilter.username = document.getElementById('loginHistoryUsername')?.value.trim() || '';
            currentFilter.success = document.getElementById('loginHistorySuccess')?.value || '';
            activeStat = '';
            renderHistory();
        });
        document.getElementById('exportLoginHistoryBtn')?.addEventListener('click', exportCsv);

        document.getElementById('loginHistoryUsername')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('applyLoginHistoryFilterBtn')?.click();
        });

        await loadHistory();
    };

    return { render, setStatFilter };
})();
