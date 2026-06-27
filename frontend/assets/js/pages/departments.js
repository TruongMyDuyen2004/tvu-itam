window.DepartmentsPage = (() => {
    let departments = [];
    let activeStat = '';

    const load = async () => {
        const res = await API.get('/departments');
        if (res.ok) departments = res.data.data || [];
    };

    const getDeptColor = (name) => {
        if (!name) return { bg: '#6B7280', light: '#F3F4F6', border: '#6B7280' };
        const colors = [
            { bg: '#4338CA', light: '#E0E7FF', border: '#6366F1' },
            { bg: '#1E3A5F', light: '#BFDBFE', border: '#2563EB' },
            { bg: '#064E3B', light: '#A7F3D0', border: '#059669' },
            { bg: '#78350F', light: '#FDE68A', border: '#D97706' },
            { bg: '#3B0764', light: '#DDD6FE', border: '#7C3AED' },
            { bg: '#7F1D1D', light: '#FECACA', border: '#DC2626' },
            { bg: '#164E63', light: '#A5F3FC', border: '#0891B2' },
            { bg: '#831843', light: '#FBCFE8', border: '#DB2777' },
            { bg: '#4C0519', light: '#FBCFE8', border: '#E11D48' },
            { bg: '#052E16', light: '#BBF7D0', border: '#22C55E' },
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const openModal = (id = null) => {
        const d = id ? departments.find(x => x.id === id) : null;
        const isEdit = !!d;
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E0E7FF,#C7D2FE);display:flex;align-items:center;justify-content:center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                    <div class="modal-title">${isEdit ? 'Chỉnh sửa' : 'Thêm'} phòng ban</div>
                    <div class="text-xs text-muted" style="margin-top:1px">${isEdit ? d.name : 'Tạo đơn vị mới'}</div>
                </div>
            </div>`, `
            <form id="deptForm">
                <div style="background:#FAFBFC;border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        Thông tin đơn vị
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="form-group"><label class="form-label">Tên</label><input class="form-control" id="dept_name" value="${d?.name||''}" placeholder="VD: Phòng Công nghệ thông tin" required></div>
                        <div class="form-group"><label class="form-label">Mã</label><input class="form-control" id="dept_code" value="${d?.code||''}" placeholder="PCNTT" required></div>
                    </div>
                    <div class="form-group"><label class="form-label">Vị trí</label><input class="form-control" id="dept_loc" value="${d?.location||''}" placeholder="Nhà A - Tầng 1"></div>
                    <div class="form-group" style="margin-bottom:0"><label class="form-label">Mô tả</label><textarea class="form-control" id="dept_desc" rows="2" placeholder="Chức năng, nhiệm vụ...">${d?.description||''}</textarea></div>
                </div>
            </form>`, true, async () => {
                const body = { name: document.getElementById('dept_name').value, code: document.getElementById('dept_code').value, location: document.getElementById('dept_loc').value, description: document.getElementById('dept_desc').value };
                if (!body.name || !body.code) { Toast.error('Nhập tên và mã'); return; }
                const res = isEdit ? await API.put('/departments/' + d.id, body) : await API.post('/departments', body);
                if (res.ok) { Toast.success(isEdit ? 'Đã cập nhật' : 'Đã thêm'); closeModal(); await load(); renderGrid(); }
                else Toast.error(res.data.message || 'Lỗi');
            }, '600px');
    };

    const setStatFilter = (stat) => {
        activeStat = activeStat === stat ? '' : stat;
        renderGrid();
    };

    const renderGrid = () => {
        const el = document.getElementById('deptGrid');
        if (!el) return;
        const cu = App.getCurrentUser();
        const q = document.getElementById('deptSearch')?.value?.toLowerCase() || '';

        let filtered = departments.filter(d => !q || d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q));
        if (activeStat === 'devices') filtered = filtered.filter(d => (d.device_count||0) > 0);
        else if (activeStat === 'users') filtered = filtered.filter(d => (d.user_count||0) > 0);
        else if (activeStat === 'managers') filtered = filtered.filter(d => d.manager_name);

        document.getElementById('deptSubtitle').textContent = `${filtered.length} / ${departments.length} đơn vị`;
        document.getElementById('statTotal').textContent = departments.length;
        document.getElementById('statDevices').textContent = departments.reduce((s,d) => s + (d.device_count||0), 0);
        document.getElementById('statUsers').textContent = departments.reduce((s,d) => s + (d.user_count||0), 0);
        document.getElementById('statManagers').textContent = departments.filter(d => d.manager_name).length;

        document.querySelectorAll('.dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`.dash-stat-card[data-stat="${activeStat}"]`)?.classList.add('active');

        if (!filtered.length) {
            el.innerHTML = '<div class="dept-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><h3>Không tìm thấy</h3><p>Thử thay đổi bộ lọc</p></div>';
            return;
        }

        el.innerHTML = filtered.map(d => {
            const c = getDeptColor(d.name);
            return `<div class="dept-card" style="--dept-bg:${c.bg};--dept-light:${c.light};--dept-border:${c.border}">
                <div class="dept-card-top">
                    <div class="dept-badge" style="background:${c.bg}">${d.code?.substring(0,3)||'PB'}</div>
                    <div style="display:flex;gap:4px">
                        ${cu?.role === 'superadmin' || cu?.role === 'admin' ? `
                        <button class="dept-btn-edit" onclick="event.stopPropagation();DepartmentsPage.openModal(${d.id})" title="Sửa">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>` : ''}
                        ${cu?.role === 'superadmin' ? `
                        <button class="dept-btn-del" onclick="event.stopPropagation();DepartmentsPage.remove(${d.id})" title="Xóa">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>` : ''}
                    </div>
                </div>
                <div class="dept-card-body">
                    <div class="dept-card-header">
                        <div class="dept-name">${d.name}</div>
                        <div class="dept-code" style="background:${c.light};color:${c.bg}">${d.code}</div>
                    </div>
                    ${d.location ? `<div class="dept-loc">📍 ${d.location}</div>` : ''}
                    <div class="dept-stats">
                        <div class="dept-stat">
                            <span class="dept-stat-val" style="color:${c.bg}">${d.device_count||0}</span>
                            <span class="dept-stat-lbl">Thiết bị</span>
                        </div>
                        <div class="dept-stat">
                            <span class="dept-stat-val" style="color:${c.bg}">${d.user_count||0}</span>
                            <span class="dept-stat-lbl">Nhân viên</span>
                        </div>
                        <div class="dept-stat">
                            <span class="dept-stat-val" style="color:${c.bg};font-size:.85rem">${d.manager_name||'—'}</span>
                            <span class="dept-stat-lbl">Trưởng đơn vị</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    };

    const render = async () => {
        const cu = App.getCurrentUser();
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Phòng ban</div>
                                <div class="dev-subtitle" id="deptSubtitle">Đang tải...</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${cu?.role === 'superadmin' ? `<button class="dev-btn-primary" title="Thêm phòng ban" onclick="DepartmentsPage.openModal()">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Thêm
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat-card ${activeStat === '' ? 'active' : ''}" data-stat="" onclick="DepartmentsPage.setStatFilter('')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4338CA,#4F46E5)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statTotal" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Phòng ban</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card ${activeStat === 'devices' ? 'active' : ''}" data-stat="devices" onclick="DepartmentsPage.setStatFilter('devices')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4F46E5,#6366F1)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statDevices" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Có thiết bị</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card ${activeStat === 'users' ? 'active' : ''}" data-stat="users" onclick="DepartmentsPage.setStatFilter('users')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#6366F1,#818CF8)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statUsers" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Có nhân viên</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card ${activeStat === 'managers' ? 'active' : ''}" data-stat="managers" onclick="DepartmentsPage.setStatFilter('managers')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#818CF8,#A5B4FC)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#818CF8,#A5B4FC)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statManagers" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Có trưởng đơn vị</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dev-search-wrap" style="min-width:200px;flex:1;max-width:320px">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="deptSearch" placeholder="Tìm tên, mã...">
                    </div>
                </div>
                <div class="dept-grid-wrap">
                    <div class="dept-grid" id="deptGrid"></div>
                </div>
            </div>
        </div>`;

        await load();
        renderGrid();
        document.getElementById('deptSearch')?.addEventListener('input', renderGrid);
    };

    const remove = async (id) => {
        if (!confirm('Xóa phòng ban này?')) return;
        const res = await API.delete('/departments/' + id);
        if (res.ok) { Toast.success('Đã xóa'); await load(); renderGrid(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    return { render, openModal, remove, setStatFilter };
})();
