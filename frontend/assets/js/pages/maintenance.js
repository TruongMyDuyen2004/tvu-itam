window.MaintenancePage = (() => {
    let records = [], devices = [], users = [];
    let editingId = null;
    const userDeviceIds = new Set();

    const load = async () => {
        const currentUser = App.getCurrentUser();
        const [mRes, dRes, uRes] = await Promise.all([API.get('/maintenance'), API.get('/devices'), API.get('/users')]);
        if (mRes.ok) records = mRes.data.data || [];
        if (dRes.ok) devices = dRes.data.data || [];
        if (uRes.ok) users = uRes.data.data || [];
        userDeviceIds.clear();
        if (currentUser?.role === 'user') {
            devices.filter(d => d.assigned_user_id === currentUser.id).forEach(d => userDeviceIds.add(d.id));
        }
    };

    let statFilter = '';

    const applyFilter = () => {
        const currentUser = App.getCurrentUser();
        const status = document.getElementById('mtStatus')?.value || '';
        const type = document.getElementById('mtType')?.value || '';
        const search = document.getElementById('mtSearch')?.value.trim().toLowerCase() || '';
        let filtered = records.filter(r => {
            if (currentUser?.role === 'user' && !userDeviceIds.has(r.device_id)) return false;
            if (statFilter && r.status !== statFilter) return false;
            if (type && r.maintenance_type !== type) return false;
            if (search && !r.device_name?.toLowerCase().includes(search) && !r.device_code?.toLowerCase().includes(search) && !r.technician_name?.toLowerCase().includes(search)) return false;
            return true;
        });
        renderTable(filtered);
        document.getElementById('mtCount').textContent = `${filtered.length} phiếu`;
        document.querySelectorAll('#mtStats .dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#mtStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');
    };

    const renderStats = () => {
        const st = document.getElementById('mtStats');
        if (!st) return;
        const all = records.length;
        const choXuLy = records.filter(r => r.status === 'cho_xu_ly').length;
        const dangTH = records.filter(r => r.status === 'dang_thuc_hien').length;
        const done = records.filter(r => r.status === 'hoan_thanh').length;

        const cards = [
            { value: all, label: 'Tổng số', filter: '', icon: 'calendar', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)' },
            { value: choXuLy, label: 'Chờ xử lý', filter: 'cho_xu_ly', icon: 'clock', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
            { value: dangTH, label: 'Đang xử lý', filter: 'dang_thuc_hien', icon: 'activity', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
            { value: done, label: 'Hoàn thành', filter: 'hoan_thanh', icon: 'check', gradient: 'linear-gradient(135deg,#818CF8,#A5B4FC)' },
        ];

        st.innerHTML = cards.map((c, i) => `
            <div class="dash-stat-card card-anim-${i+1}" data-stat="${c.filter}" onclick="MaintenancePage.setStatFilter('${c.filter}')" style="cursor:pointer;--stat-gradient:${c.gradient}">
                <div class="dash-stat-icon" style="background:${c.gradient}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${c.icon === 'calendar' ? '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' :
                        c.icon === 'clock' ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' :
                        c.icon === 'activity' ? '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' :
                        '<polyline points="20 6 9 17 4 12"/>'}
                    </svg>
                </div>
                <div class="dash-stat-info">
                    <div class="dash-stat-value">${c.value}</div>
                    <div class="dash-stat-label">${c.label}</div>
                </div>
                <div class="dash-stat-glow"></div>
            </div>
        `).join('');
    };

    const resultBadge = (r) => {
        if (!r.result) return '<span class="text-muted" style="font-size:.78rem">—</span>';
        const color = r.result === 'da_sua' ? '#16A34A' : '#DC2626';
        const label = fmt.maintenanceResult?.[r.result] || r.result;
        return `<span style="font-size:.75rem;color:${color};font-weight:600">${label}</span>`;
    };

    const renderTable = (data) => {
        const el = document.getElementById('mtList');
        if (!el) return;
        if (!data.length) {
            el.innerHTML = `<div class="dev-empty">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                <h3>Không có phiếu bảo trì</h3>
                <p>Nhấn "Tạo phiếu bảo trì" để thêm mới</p>
            </div>`; return;
        }
        const user = App.getCurrentUser();
        const canEdit = user?.role !== 'user';
        el.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.25s">
            <table class="dev-table">
                <thead><tr>
                    <th style="padding-left:1.25rem">Mã phiếu</th>
                    <th>Thiết bị</th>
                    <th>Loại</th>
                    <th>Ngày đề xuất</th>
                    <th>Kỹ thuật viên</th>
                    <th>Kết quả</th>
                    <th>Tình trạng</th>
                    <th style="text-align:right;padding-right:1.25rem">Thao tác</th>
                </tr></thead>
                <tbody>${data.map(r => {
                    const isPending = r.status === 'cho_xu_ly' || r.status === 'da_duyet';
                    return `<tr class="dev-tr">
                    <td data-label="Mã phiếu" style="padding-left:1.25rem"><span style="font-family:monospace;font-size:.82rem;color:var(--text-accent);font-weight:600">${r.maintenance_code||'—'}</span></td>
                    <td data-label="Thiết bị">
                        <div class="dev-name-cell">
                            <div>
                                <div class="dev-name-text">${r.device_name}</div>
                                <div class="dev-name-sub">${r.device_code||''} ${r.department_name ? '• '+r.department_name : ''}</div>
                            </div>
                        </div>
                    </td>
                    <td data-label="Loại"><span class="chip">${fmt.typeLabel[r.maintenance_type]||r.maintenance_type}</span></td>
                    <td data-label="Ngày đề xuất">
                        <div style="font-size:.82rem;font-weight:500;color:var(--text-primary)">${fmt.date(r.request_date)}</div>
                        ${r.start_date ? `<div class="dev-name-sub" style="margin-top:1px">Bắt đầu: ${fmt.date(r.start_date)}</div>` : ''}
                        ${r.actual_date ? `<div class="dev-name-sub" style="margin-top:1px">Hoàn thành: ${fmt.date(r.actual_date)}</div>` : ''}
                    </td>
                    <td data-label="KTV"><span style="font-size:.82rem;color:var(--text-secondary)">${r.technician_name||'<span class="text-muted">—</span>'}</span></td>
                    <td data-label="Kết quả">${resultBadge(r)}</td>
                    <td data-label="Trạng thái"><span class="dev-status-pill badge-${r.status}">${fmt.maintenanceStatus[r.status]||r.status}</span></td>
                    <td data-label="Thao tác" class="dev-td-actions">
                        ${canEdit ? `<button class="dev-action-btn" onclick="MaintenancePage.openModal(${r.id})" title="Chỉnh sửa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="dev-action-btn" onclick="MaintenancePage.exportPdf(${r.id})" title="Xuất PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                        ${isPending ? `<button class="dev-action-btn" style="color:var(--accent)" onclick="MaintenancePage.complete(${r.id})" title="Hoàn thành">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>` : ''}
                        ${user?.role === 'superadmin' ? `<button class="dev-action-btn dev-action-danger" onclick="MaintenancePage.remove(${r.id})" title="Xóa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>` : ''}
                        ` : '—'}
                    </td>
                </tr>`}).join('')}</tbody>
            </table>
        </div>`;
    };

    const openModal = async (id = null) => {
        editingId = id;
        let r = null;
        if (id) { const res = await API.get('/maintenance/' + id); if (res.ok) r = res.data.data; }
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                    <div class="modal-title">${id ? 'Cập nhật phiếu bảo trì' : 'Tạo phiếu bảo trì'}</div>
                    <div class="text-xs text-muted" style="margin-top:2px">${id ? 'Chỉnh sửa thông tin phiếu bảo trì' : 'Lên lịch bảo trì thiết bị'}</div>
                </div>
            </div>`, `
            <form id="mtForm">
                <div class="form-row" style="gap:14px;margin-bottom:14px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                            Thiết bị & Nội dung
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Thiết bị *</label>
                            <select class="form-control" id="mt_device" required>
                                <option value="">-- Chọn thiết bị --</option>
                                ${devices.map(d => `<option value="${d.id}" ${r?.device_id==d.id?'selected':''}>${d.device_code} - ${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Mô tả sự cố</label>
                            <textarea class="form-control" id="mt_problem" rows="2" placeholder="Mô tả sự cố cần bảo trì...">${r?.description||''}</textarea>
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Nội dung bảo trì</label>
                            <textarea class="form-control" id="mt_content" rows="2" placeholder="Nội dung sửa chữa/bảo trì...">${r?.notes||''}</textarea>
                        </div>
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Thời gian
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Ngày đề xuất *</label>
                            <input type="date" class="form-control" id="mt_request_date" value="${r?.request_date?.slice(0,10)||''}" required>
                        </div>
                        <div class="form-row" style="gap:10px">
                            <div class="form-group" style="margin-bottom:0">
                                <label class="form-label">Ngày bắt đầu</label>
                                <input type="date" class="form-control" id="mt_start_date" value="${r?.start_date?.slice(0,10)||''}">
                            </div>
                            <div class="form-group" style="margin-bottom:0">
                                <label class="form-label">Ngày hoàn thành</label>
                                <input type="date" class="form-control" id="mt_actual" value="${r?.actual_date?.slice(0,10)||''}">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-row" style="gap:14px;margin-bottom:14px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Nhân sự & Phê duyệt
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Kỹ thuật viên</label>
                            <select class="form-control" id="mt_tech">
                                <option value="">-- Chưa phân công --</option>
                                ${users.filter(u => u.role !== 'user').map(u => `<option value="${u.id}" ${r?.technician_id==u.id?'selected':''}>${u.full_name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Người phê duyệt</label>
                            <select class="form-control" id="mt_approver">
                                <option value="">-- Chưa chọn --</option>
                                ${users.filter(u => u.role === 'superadmin' || u.role === 'admin').map(u => `<option value="${u.id}" ${r?.approver_id==u.id?'selected':''}>${u.full_name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row" style="gap:10px;margin-bottom:10px">
                            <div class="form-group" style="margin-bottom:0">
                                <label class="form-label">Loại bảo trì</label>
                                <select class="form-control" id="mt_type">
                                    ${Object.entries(fmt.typeLabel).map(([k,v]) => `<option value="${k}" ${(r?.maintenance_type||'dinh_ky')===k?'selected':''}>${v}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:0">
                                <label class="form-label">Mức ưu tiên</label>
                                <select class="form-control" id="mt_priority">
                                    ${Object.entries(fmt.priorityLabel).map(([k,v]) => `<option value="${k}" ${(r?.priority||'medium')===k?'selected':''}>${v}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        ${id ? `<div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Tình trạng</label>
                            <select class="form-control" id="mt_status">
                                ${Object.entries(fmt.maintenanceStatus).map(([k,v]) => `<option value="${k}" ${(r?.status||'cho_xu_ly')===k?'selected':''}>${v}</option>`).join('')}
                            </select>
                        </div>` : '<input type="hidden" id="mt_status" value="cho_xu_ly">'}
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                            Chi phí & Kết quả
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Chi phí (VNĐ)</label>
                            <input type="number" class="form-control" id="mt_cost" value="${r?.cost||0}" placeholder="0">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Kết quả thực hiện</label>
                            <select class="form-control" id="mt_result">
                                <option value="">-- Chọn kết quả --</option>
                                ${Object.entries(fmt.maintenanceResult||{}).map(([k,v]) => `<option value="${k}" ${r?.result===k?'selected':''}>${v}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            </form>`, true, save, '800px');
    };

    const save = async () => {
        const body = {
            device_id: document.getElementById('mt_device').value,
            maintenance_type: document.getElementById('mt_type').value,
            request_date: document.getElementById('mt_request_date').value,
            start_date: document.getElementById('mt_start_date')?.value || null,
            actual_date: document.getElementById('mt_actual')?.value || null,
            technician_id: document.getElementById('mt_tech').value || null,
            approver_id: document.getElementById('mt_approver').value || null,
            description: document.getElementById('mt_problem').value,
            notes: document.getElementById('mt_content').value,
            priority: document.getElementById('mt_priority').value,
            status: document.getElementById('mt_status')?.value || 'cho_xu_ly',
            cost: document.getElementById('mt_cost')?.value || 0,
            result: document.getElementById('mt_result')?.value || ''
        };
        if (!body.device_id || !body.request_date) { Toast.error('Vui lòng điền đầy đủ'); return; }
        const res = editingId ? await API.put('/maintenance/' + editingId, body) : await API.post('/maintenance', body);
        if (res.ok) { Toast.success('Lưu thành công'); closeModal(); await load(); applyFilter(); }
        else Toast.error(res.data.message || 'Lỗi');
    };

    const complete = async (id) => {
        if (!confirm('Đánh dấu hoàn thành bảo trì này?')) return;
        const rec = records.find(r => r.id === id);
        const res = await API.put('/maintenance/' + id, { ...rec, status: 'hoan_thanh', actual_date: new Date().toISOString().slice(0,10) });
        if (res.ok) { Toast.success('Đã hoàn thành bảo trì'); await load(); applyFilter(); }
        else Toast.error('Lỗi cập nhật');
    };

    const remove = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa phiếu bảo trì này?')) return;
        const res = await API.delete('/maintenance/' + id);
        if (res.ok) { Toast.success('Đã xóa phiếu bảo trì'); await load(); applyFilter(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    const render = async () => {
        const user = App.getCurrentUser();
        const canAdd = user?.role === 'superadmin' || user?.role === 'admin';
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Phiếu Bảo Trì</div>
                                <div class="dev-subtitle">Quản lý bảo trì thiết bị theo TT 45/2013/TT-BTC</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${canAdd ? `<button class="dev-btn-primary" title="Tạo phiếu bảo trì" onclick="MaintenancePage.openModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Tạo phiếu bảo trì
                        </button>` : ''}
                    </div>
                </div>
                <div class="dev-filter-bar">
                    <div class="dev-search-wrap" style="flex:1;max-width:360px">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="mtSearch" placeholder="Tìm thiết bị, kỹ thuật viên...">
                    </div>
                    <div class="dev-filter-selects">
                        <select class="dev-select" id="mtStatus">
                            <option value="">Tất cả tình trạng</option>
                            ${Object.entries(fmt.maintenanceStatus).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                        <select class="dev-select" id="mtType">
                            <option value="">Tất cả loại</option>
                            ${Object.entries(fmt.typeLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div id="mtStats" class="dash-stats"></div>
            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Danh sách bảo trì
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted)" id="mtCount">Đang tải...</span>
                </div>
                <div id="mtList" style="min-height:300px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;
        await load();
        renderStats();
        document.getElementById('mtSearch')?.addEventListener('input', applyFilter);
        document.getElementById('mtStatus')?.addEventListener('change', applyFilter);
        document.getElementById('mtType')?.addEventListener('change', applyFilter);
        applyFilter();
    };

    const exportPdf = async (id) => {
        const token = API.getToken();
        if (!token) { Toast.error('Vui lòng đăng nhập lại'); return; }
        window.open(API.BASE_URL + `/maintenance/${id}/export-pdf?inline=1&token=` + encodeURIComponent(token), '_blank');
    };

    const setStatFilter = (value) => {
        statFilter = statFilter === value ? '' : value;
        applyFilter();
    };

    return { render, openModal, complete, remove, exportPdf, setStatFilter };
})();
