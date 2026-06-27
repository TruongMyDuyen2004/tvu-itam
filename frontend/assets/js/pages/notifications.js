window.NotificationsPage = (() => {
    let notifications = [];
    let currentFilter = '';

    const typeIcon = { maintenance: '🔧', warranty: '⚠️', incident: '🚨', transfer: '📦', disposal: '🗑️' };
    const typeLabel = { maintenance: 'Bảo trì', warranty: 'Bảo hành', incident: 'Sự cố', transfer: 'Điều chuyển', disposal: 'Thanh lý' };
    const typeColor = { maintenance: '#3B82F6', warranty: '#F59E0B', incident: '#EF4444', transfer: '#8B5CF6', disposal: '#6B7280' };

    const load = async () => {
        const res = await API.get('/notifications');
        if (res.ok) notifications = (res.data.data || []).filter((n, i, a) => a.findIndex(x => x.title === n.title && x.message === n.message && x.type === n.type) === i);
    };

    const groupByTime = (items) => {
        const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);
        return {
            'Hôm nay': items.filter(n => new Date(n.date) >= today),
            'Tuần này': items.filter(n => { const d = new Date(n.date); return d < today && d >= weekAgo; }),
            'Tháng này': items.filter(n => { const d = new Date(n.date); return d < weekAgo && d >= monthAgo; }),
            'Cũ hơn': items.filter(n => new Date(n.date) < monthAgo)
        };
    };

    const renderList = () => {
        const el = document.getElementById('notifList');
        if (!el) return;
        const filter = document.getElementById('notifFilter')?.value || '';
        let filtered = notifications;
        if (currentFilter === 'high') filtered = notifications.filter(n => n.priority === 'high');
        else if (currentFilter === 'medium') filtered = notifications.filter(n => n.priority === 'medium');
        if (!currentFilter && filter) filtered = notifications.filter(n => n.type === filter);

        document.getElementById('notifCount').textContent = `${filtered.length} thông báo`;

        if (!filtered.length) {
            el.innerHTML = `<div class="dev-empty">
                <div style="width:72px;height:72px;border-radius:50%;background:#EEF2FF;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                </div>
                <h3 style="color:#1E293B;margin-bottom:.25rem">Không có thông báo</h3>
                <p style="color:#94A3B8;font-size:.85rem">Tất cả đều ổn, không có cảnh báo nào!</p>
            </div>`;
            return;
        }

        const groups = groupByTime(filtered);
        let html = '<div class="notif-list">';
        Object.entries(groups).forEach(([label, items]) => {
            if (!items.length) return;
            html += `<div class="notif-group-label">${label}</div>`;
            items.forEach(n => {
                const color = typeColor[n.type] || '#6B7280';
                const isHigh = n.priority === 'high';
                html += `<div class="notif-item${isHigh ? ' high' : ' medium'}" onclick="window.location.hash='${n.link}'">
                    <div class="notif-icon" style="background:${color}15;color:${color}">${typeIcon[n.type]}</div>
                    <div class="notif-content">
                        <div class="notif-title-row">
                            <span class="notif-title">${n.title}</span>
                            <span class="notif-type-badge" style="background:${color}15;color:${color}">${typeLabel[n.type]}</span>
                            ${isHigh ? '<span class="notif-urgent">Khẩn</span>' : ''}
                        </div>
                        <div class="notif-message">${n.message}</div>
                        <div class="notif-time">${fmt.datetime(n.date)}</div>
                    </div>
                </div>`;
            });
        });
        html += '</div>';
        el.innerHTML = html;
    };

    const filterBy = (key) => {
        currentFilter = key;
        const cards = document.querySelectorAll('.dash-stats .dash-stat-card');
        cards.forEach(c => c.classList.remove('active'));
        if (key === 'high') { if (cards[1]) cards[1].classList.add('active'); }
        else if (key === 'medium') { if (cards[2]) cards[2].classList.add('active'); }
        else { if (cards[0]) cards[0].classList.add('active'); }
        renderList();
    };

    const render = async () => {
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Thông báo</div>
                                <div class="dev-subtitle">Các cảnh báo và thông báo hệ thống</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        <button class="dev-btn-secondary" onclick="NotificationsPage.refresh()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat-card" style="--stat-gradient:linear-gradient(135deg,#4338CA,#4F46E5)" onclick="NotificationsPage.filterBy('')">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="nsTotal" style="font-weight:700">-</div>
                        <div class="dash-stat-label">Tổng thông báo</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="--stat-gradient:linear-gradient(135deg,#4F46E5,#6366F1)" onclick="NotificationsPage.filterBy('high')">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="nsHigh" style="font-weight:700">-</div>
                        <div class="dash-stat-label">Cảnh báo khẩn</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="--stat-gradient:linear-gradient(135deg,#6366F1,#818CF8)" onclick="NotificationsPage.filterBy('medium')">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="nsMedium" style="font-weight:700">-</div>
                        <div class="dash-stat-label">Cảnh báo TB</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                        Danh sách thông báo
                    </div>
                    <div class="dev-filter-selects" style="display:flex;align-items:center;gap:8px">
                        <select class="dev-select" id="notifFilter">
                            <option value="">Tất cả thông báo</option>
                            <option value="maintenance">🔧 Bảo trì</option>
                            <option value="warranty">⚠️ Bảo hành</option>
                            <option value="incident">🚨 Sự cố</option>
                            <option value="transfer">📦 Điều chuyển</option>
                            <option value="disposal">🗑️ Thanh lý</option>
                        </select>
                    </div>
                    <span style="font-size:.78rem;font-weight:600;color:var(--text-muted)" id="notifCount">Đang tải...</span>
                </div>
                <div id="notifList" style="min-height:250px">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;

        document.getElementById('notifFilter')?.addEventListener('change', () => { currentFilter = ''; renderList(); });
        await load();
        renderList();
        updateSummary();
    };

    const updateSummary = () => {
        const total = document.getElementById('nsTotal');
        const high = document.getElementById('nsHigh');
        const med = document.getElementById('nsMedium');
        if (total) total.textContent = notifications.length;
        if (high) high.textContent = notifications.filter(n => n.priority === 'high').length;
        if (med) med.textContent = notifications.filter(n => n.priority === 'medium').length;
    };

    const refresh = async () => {
        Toast.info('Đang tải lại...');
        await load();
        renderList();
        updateSummary();
        Toast.success('Đã cập nhật');
    };

    return { render, refresh, filterBy };
})();
