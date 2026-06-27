window.LogsPage = (() => {
    let logs = [], allLogs = [];
    let currentFilter = { search: '', entity_type: '', action: '' };
    let activeStat = '';
    let fullStats = { total: 0, users: 0, devices: 0, approvals: 0 };

    const escapeHtml = (text) => {
        if (text == null) return '';
        return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    };

    const actionLabel = (a) => {
        const map = { create: 'Tạo', update: 'Cập nhật', delete: 'Xóa', approve: 'Phê duyệt', login: 'Đăng nhập', reject: 'Từ chối' };
        return map[a?.toLowerCase()] || a;
    };

    const entityIcon = (t) => {
        const map = { user: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>', device: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', transfer: '<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/>', maintenance: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>', disposal: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' };
        return map[t?.toLowerCase()] || '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    };

    const entityColor = (t) => {
        const map = { user: '#2563EB', device: '#059669', transfer: '#D97706', maintenance: '#7C3AED', disposal: '#DC2626' };
        return map[t?.toLowerCase()] || '#6B7280';
    };

    const loadLogs = async () => {
        const res = await API.get('/logs');
        const el = document.getElementById('logsTable');
        if (!res.ok) {
            if (el) el.innerHTML = '<div class="dev-empty"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>Không thể tải nhật ký</h3></div>';
            return;
        }
        allLogs = res.data.data || [];
        fullStats = {
            total: allLogs.length,
            users: allLogs.filter(l => l.entity_type === 'user').length,
            devices: allLogs.filter(l => l.entity_type === 'device').length,
            approvals: allLogs.filter(l => l.action?.toLowerCase().includes('duyệt') || l.action?.toLowerCase().includes('chối')).length
        };
        applyFilter();
    };

    const applyFilter = () => {
        logs = allLogs.filter(l => {
            if (currentFilter.search && !l.user_name?.toLowerCase().includes(currentFilter.search.toLowerCase()) && !l.action?.toLowerCase().includes(currentFilter.search.toLowerCase()) && !(l.ip_address||'').includes(currentFilter.search)) return false;
            if (currentFilter.entity_type && l.entity_type !== currentFilter.entity_type) return false;
            if (currentFilter.action && l.action !== currentFilter.action) return false;
            return true;
        });
        renderTable();
    };

    const actionBadge = (a) => {
        const map = {
            create: { label: 'Tạo', color: '#059669', bg: '#DCFCE7' },
            update: { label: 'Cập nhật', color: '#2563EB', bg: '#DBEAFE' },
            delete: { label: 'Xóa', color: '#DC2626', bg: '#FEE2E2' },
            approve: { label: 'Phê duyệt', color: '#7C3AED', bg: '#EDE9FE' },
            login: { label: 'Đăng nhập', color: '#0891B2', bg: '#CFFAFE' },
            reject: { label: 'Từ chối', color: '#DC2626', bg: '#FEE2E2' },
            lock: { label: 'Khóa', color: '#92400E', bg: '#FEF3C7' }
        };
        const m = map[a?.toLowerCase()] || { label: a || '—', color: '#6B7280', bg: '#F3F4F6' };
        return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600;background:${m.bg};color:${m.color}">${m.label}</span>`;
    };

    const entityBadge = (t, id) => {
        const map = {
            user: { label: 'Người dùng', color: '#2563EB', bg: '#DBEAFE', icon: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>' },
            device: { label: 'Thiết bị', color: '#059669', bg: '#DCFCE7', icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>' },
            transfer: { label: 'Điều chuyển', color: '#D97706', bg: '#FEF3C7', icon: '<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/>' },
            maintenance: { label: 'Bảo trì', color: '#7C3AED', bg: '#EDE9FE', icon: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>' },
            disposal: { label: 'Thanh lý', color: '#DC2626', bg: '#FEE2E2', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' }
        };
        const m = map[t?.toLowerCase()] || { label: escapeHtml(t) || '—', color: '#6B7280', bg: '#F3F4F6', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' };
        return `<span style="display:inline-flex;align-items:center;gap:5px;padding:2px 10px 2px 6px;border-radius:20px;font-size:.75rem;font-weight:500;background:${m.bg};color:${m.color}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${m.color}" stroke-width="2">${m.icon}</svg>${m.label}${id ? ` <span style="font-weight:400;opacity:.7">#${escapeHtml(id)}</span>` : ''}</span>`;
    };

    const renderTable = () => {
        const el = document.getElementById('logsTable');
        if (!el) return;

        document.getElementById('logTotal').textContent = fullStats.total;
        document.getElementById('logUsers').textContent = fullStats.users;
        document.getElementById('logDevices').textContent = fullStats.devices;
        document.getElementById('logApprovals').textContent = fullStats.approvals;
        document.getElementById('logCount').textContent = `${logs.length} bản ghi`;

        document.querySelectorAll('.dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`.dash-stat-card[data-stat="${activeStat}"]`)?.classList.add('active');

        if (!logs.length) {
            el.innerHTML = '<div class="dev-empty"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><h3>Không có nhật ký</h3><p style="color:var(--text-muted);font-size:.85rem;margin-top:4px">Chưa có hoạt động nào được ghi nhận</p></div>';
            return;
        }

        el.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.1s"><table class="dev-table" id="logsDataTable">
            <thead><tr><th style="padding-left:1.25rem;min-width:150px">Thời gian</th><th>Người dùng</th><th style="width:1%">Hành động</th><th>Đối tượng</th><th class="log-col-ip" style="width:1%">IP</th><th style="text-align:right;padding-right:1.25rem">Chi tiết</th></tr></thead>
            <tbody>${logs.map((log, i) => `<tr class="dev-tr" style="animation:dashFadeUp .35s ease-out both;animation-delay:${.04 * i}s">
                <td data-label="Thời gian" style="padding-left:1.25rem"><span class="dev-td-date" style="white-space:nowrap">${fmt.datetime(log.created_at)}</span></td>
                <td data-label="Người dùng"><div style="display:flex;align-items:center;gap:8px"><div class="avatar" style="width:28px;height:28px;font-size:.65rem">${fmt.initials(log.user_name || 'HT')}</div><div><div style="font-weight:600;font-size:.85rem;color:var(--text-primary)">${escapeHtml(log.user_name || 'Hệ thống')}</div>${log.user_role ? `<div style="font-size:.68rem;color:var(--text-muted);margin-top:1px"><span class="dev-status-pill ${log.user_role === 'superadmin' ? 'badge-superadmin' : log.user_role === 'admin' ? 'badge-admin' : 'badge-user'}" style="font-size:.6rem">${fmt.roleLabel[log.user_role]}</span></div>` : ''}</div></div></td>
                <td data-label="Hành động">${actionBadge(log.action)}</td>
                <td data-label="Đối tượng">${entityBadge(log.entity_type, log.entity_id)}</td>
                <td class="log-col-ip" data-label="IP" style="font-family:monospace;font-size:.75rem;color:var(--text-secondary)">${escapeHtml(log.ip_address || '—')}</td>
                <td class="dev-td-actions"><button class="dev-action-btn" onclick="LogsPage.showDetail(${log.id})" title="Xem chi tiết"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg></button></td>
            </tr>`).join('')}</tbody>
        </table></div>`;
    };

    const showDetail = async (id) => {
        const res = await API.get('/logs/' + id);
        if (!res.ok) { Toast.error('Không lấy được chi tiết'); return; }
        const log = res.data.data;

        let oldData = null, newData = null;
        try { oldData = log.old_data ? JSON.parse(log.old_data) : null; } catch(e) {}
        try { newData = log.new_data ? JSON.parse(log.new_data) : null; } catch(e) {}

        const diffKeys = oldData && newData ? Object.keys(newData).filter(k => JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])) : [];

        showModal(`
            <div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#F8FAFC,#F1F5F9);margin:-1rem -1rem 0 -1rem;padding:1.2rem 1.5rem;border-radius:14px 14px 0 0;border-bottom:1px solid var(--border)">
                <div style="width:42px;height:42px;border-radius:12px;background:${entityColor(log.entity_type)}12;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${entityColor(log.entity_type)}18">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${entityColor(log.entity_type)}" stroke-width="1.8">${entityIcon(log.entity_type)}</svg>
                </div>
                <div style="flex:1">
                    <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">${actionLabel(log.action)}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${log.entity_type || 'Hệ thống'} ${log.entity_id ? `#${log.entity_id}` : ''} — ${fmt.datetime(log.created_at)}</div>
                </div>
                <div class="avatar" style="width:36px;height:36px">${fmt.initials(log.user_name || 'HT')}</div>
            </div>`, `
            <div class="detail-grid">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#EFF6FF;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        Người thực hiện
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Người dùng</div><div class="detail-value">${escapeHtml(log.user_name || 'Hệ thống')}</div></div>
                        <div><div class="detail-label">Quyền</div><div class="detail-value">${log.user_role ? `<span class="dev-status-pill ${log.user_role === 'superadmin' ? 'badge-superadmin' : log.user_role === 'admin' ? 'badge-admin' : 'badge-user'}">${fmt.roleLabel[log.user_role]}</span>` : '<span class="text-muted">—</span>'}</div></div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#FEF3C7;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Thông tin
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Hành động</div><div class="detail-value">${actionLabel(log.action)}</div></div>
                        <div><div class="detail-label">Đối tượng</div><div class="detail-value">${log.entity_type || '—'}</div></div>
                        <div><div class="detail-label">ID</div><div class="detail-value" style="font-family:monospace">${log.entity_id || '—'}</div></div>
                        <div><div class="detail-label">IP</div><div class="detail-value" style="font-family:monospace">${escapeHtml(log.ip_address || '—')}</div></div>
                    </div>
                </div>
            </div>
            ${log.user_agent ? `<div class="detail-full" style="margin-top:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem">
                <div class="detail-section-title" style="border-bottom-color:#F3F4F6;display:flex;align-items:center;gap:8px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    User Agent
                </div>
                <div style="margin-top:8px;font-size:.82rem;color:var(--text-secondary);word-break:break-all;background:#F9FAFB;padding:10px 12px;border-radius:8px;border:1px solid var(--border)">${escapeHtml(log.user_agent)}</div>
            </div>` : ''}
            ${oldData || newData ? `<div class="detail-grid" style="margin-top:12px">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem">
                    <div class="detail-section-title" style="border-bottom-color:#FEF2F2;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Dữ liệu cũ
                    </div>
                    <pre style="margin-top:8px;font-size:.78rem;line-height:1.5;background:#FEF2F2;color:#991B1B;padding:10px 12px;border-radius:8px;border:1px solid #FECACA;overflow:auto;max-height:200px">${oldData ? escapeHtml(JSON.stringify(oldData, null, 2)) : '—'}</pre>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem">
                    <div class="detail-section-title" style="border-bottom-color:#ECFDF5;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Dữ liệu mới
                    </div>
                    <pre style="margin-top:8px;font-size:.78rem;line-height:1.5;background:#ECFDF5;color:#065F46;padding:10px 12px;border-radius:8px;border:1px solid #A7F3D0;overflow:auto;max-height:200px">${newData ? escapeHtml(JSON.stringify(newData, null, 2)) : '—'}</pre>
                </div>
            </div>` : ''}
            ${diffKeys.length > 0 ? `<div class="detail-full" style="margin-top:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem">
                <div class="detail-section-title" style="border-bottom-color:#EFF6FF;display:flex;align-items:center;gap:8px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="3" y1="3" x2="7" y2="7"/></svg>
                    Thay đổi (${diffKeys.length})
                </div>
                <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">${diffKeys.map(k => `
                    <div style="display:flex;gap:10px;align-items:flex-start;padding:6px 10px;border-radius:6px;background:#F9FAFB;border:1px solid var(--border-light)">
                        <span style="font-size:.75rem;font-weight:600;color:var(--text-secondary);min-width:100px">${escapeHtml(k)}</span>
                        <div style="flex:1;display:flex;gap:10px;font-size:.78rem">
                            <span style="flex:1;color:#DC2626;background:#FEF2F2;padding:2px 8px;border-radius:4px;word-break:break-all">${oldData ? escapeHtml(JSON.stringify(oldData[k])) : '—'}</span>
                            <span style="flex:1;color:#059669;background:#ECFDF5;padding:2px 8px;border-radius:4px;word-break:break-all">${newData ? escapeHtml(JSON.stringify(newData[k])) : '—'}</span>
                        </div>
                    </div>
                `).join('')}</div>
            </div>` : ''}
        `, false, null, '780px');
    };

    const setStatFilter = (stat) => {
        activeStat = activeStat === stat ? '' : stat;
        if (activeStat === 'user' || activeStat === 'device') {
            currentFilter.entity_type = activeStat;
            currentFilter.action = '';
        } else if (activeStat === 'approve') {
            currentFilter.action = 'approve';
            currentFilter.entity_type = '';
        } else {
            currentFilter.entity_type = '';
            currentFilter.action = '';
        }
        currentFilter.search = document.getElementById('logSearch')?.value?.trim() || '';
        applyFilter();
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
                                <div class="dev-title">Nhật ký hoạt động</div>
                                <div class="dev-subtitle">Theo dõi tất cả thay đổi trong hệ thống</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                    </div>
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat-card" data-stat="" onclick="LogsPage.setStatFilter('')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4338CA,#4F46E5)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="logTotal" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Tổng</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="user" onclick="LogsPage.setStatFilter('user')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4F46E5,#6366F1)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="logUsers" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Người dùng</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="device" onclick="LogsPage.setStatFilter('device')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#6366F1,#818CF8)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="logDevices" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Thiết bị</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="approve" onclick="LogsPage.setStatFilter('approve')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#818CF8,#A5B4FC)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#818CF8,#A5B4FC)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="logApprovals" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Phê duyệt</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap">
                        <div class="dev-search-wrap" style="min-width:200px;flex:1;max-width:320px">
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                            <input id="logSearch" placeholder="Hành động, người dùng, IP..." value="${escapeHtml(currentFilter.search)}">
                        </div>
                        <div class="dev-filter-selects">
                            <select class="dev-select" id="logEntity" style="min-width:130px">
                                <option value="">Đối tượng</option>
                                <option value="user" ${currentFilter.entity_type === 'user' ? 'selected' : ''}>Người dùng</option>
                                <option value="device" ${currentFilter.entity_type === 'device' ? 'selected' : ''}>Thiết bị</option>
                                <option value="transfer" ${currentFilter.entity_type === 'transfer' ? 'selected' : ''}>Điều chuyển</option>
                                <option value="maintenance" ${currentFilter.entity_type === 'maintenance' ? 'selected' : ''}>Bảo trì</option>
                                <option value="disposal" ${currentFilter.entity_type === 'disposal' ? 'selected' : ''}>Thanh lý</option>
                            </select>
                            <select class="dev-select" id="logAction" style="min-width:130px">
                                <option value="">Hành động</option>
                                <option value="create" ${currentFilter.action === 'create' ? 'selected' : ''}>Tạo</option>
                                <option value="update" ${currentFilter.action === 'update' ? 'selected' : ''}>Cập nhật</option>
                                <option value="delete" ${currentFilter.action === 'delete' ? 'selected' : ''}>Xóa</option>
                                <option value="approve" ${currentFilter.action === 'approve' ? 'selected' : ''}>Phê duyệt</option>
                                <option value="reject" ${currentFilter.action === 'reject' ? 'selected' : ''}>Từ chối</option>
                                <option value="lock" ${currentFilter.action === 'lock' ? 'selected' : ''}>Khóa</option>
                            </select>
                            <button class="dev-btn-primary dev-btn-sm" id="applyLogFilterBtn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                                Lọc
                            </button>
                        </div>
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span id="logCount">Đang tải...</span>
                    </span>
                </div>
                <div id="logsTable" style="min-height:250px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;

        document.getElementById('applyLogFilterBtn')?.addEventListener('click', () => {
            activeStat = '';
            currentFilter.search = document.getElementById('logSearch')?.value?.trim() || '';
            currentFilter.entity_type = document.getElementById('logEntity')?.value || '';
            currentFilter.action = document.getElementById('logAction')?.value || '';
            applyFilter();
        });
        document.getElementById('logSearch')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('applyLogFilterBtn')?.click();
        });

        await loadLogs();
    };

    return { render, showDetail, setStatFilter };
})();
