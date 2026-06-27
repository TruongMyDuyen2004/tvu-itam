window.InventoryPage = (() => {
    let sessions = [], departments = [], allDevices = [];
    let statFilter = '';

    const statusLabel = { draft:'Bản nháp', in_progress:'Đang kiểm kê', completed:'Hoàn thành', cancelled:'Đã hủy' };
    const actualStatusLabel = { found:'Còn', missing:'Thiếu', damaged:'Hỏng', transferred:'Đã điều chuyển' };
    const actualStatusColor = { found:'#10B981', missing:'#EF4444', damaged:'#F59E0B', transferred:'#6366F1' };
    const statusBadge = { draft:'badge-secondary', in_progress:'badge-warning', completed:'badge-success', cancelled:'badge-danger' };

    const load = async (params = {}) => {
        const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
        const [sRes, dRes, devRes] = await Promise.all([
            API.get('/inventory' + qs), API.get('/departments'), API.get('/devices')
        ]);
        if (sRes.ok) sessions = sRes.data.data || [];
        if (dRes.ok) departments = dRes.data.data || [];
        if (devRes.ok) allDevices = devRes.data.data || [];
    };

    const applyFilter = () => {
        const search = document.getElementById('invSearch')?.value.trim().toLowerCase() || '';
        const status = document.getElementById('invStatusFilter')?.value || '';
        const quarter = document.getElementById('invQuarterFilter')?.value || '';
        const filtered = sessions.filter(s => {
            if (statFilter && s.status !== statFilter) return false;
            if (status && s.status !== status) return false;
            if (quarter && String(s.quarter) !== quarter) return false;
            if (search && !s.title?.toLowerCase().includes(search) && !s.inventory_code?.toLowerCase().includes(search)) return false;
            return true;
        });
        renderList(filtered);
        document.getElementById('invCount').textContent = `${filtered.length} phiếu`;
        document.querySelectorAll('#invStats .dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#invStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');
    };

    const setStatFilter = (v) => {
        statFilter = statFilter === v ? '' : v;
        applyFilter();
    };

    const renderStats = () => {
        const st = document.getElementById('invStats');
        if (!st) return;
        const total = sessions.length;
        const draft = sessions.filter(s => s.status === 'draft').length;
        const inProgress = sessions.filter(s => s.status === 'in_progress').length;
        const completed = sessions.filter(s => s.status === 'completed').length;
        const hasIssues = sessions.filter(s => s.status === 'completed' && (s.missing_devices > 0 || s.damaged_devices > 0)).length;

        st.innerHTML = [
            { value: total, label: 'Tổng phiếu', filter: '', icon: 'clipboard', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)' },
            { value: draft + inProgress, label: 'Đang thực hiện', filter: 'draft', icon: 'clock', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
            { value: completed, label: 'Hoàn thành', filter: 'completed', icon: 'check', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
            { value: hasIssues, label: 'Có tồn tại', filter: '', icon: 'alert', gradient: 'linear-gradient(135deg,#818CF8,#A5B4FC)' },
        ].map((c, i) => `
            <div class="dash-stat-card card-anim-${i+1}" data-stat="${c.filter}" onclick="InventoryPage.setStatFilter('${c.filter}')" style="cursor:pointer;--stat-gradient:${c.gradient}">
                <div class="dash-stat-icon" style="background:${c.gradient}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${c.icon === 'clipboard' ? '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>' :
                        c.icon === 'clock' ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' :
                        c.icon === 'check' ? '<polyline points="20 6 9 17 4 12"/>' :
                        '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'}
                    </svg>
                </div>
                <div class="dash-stat-info">
                    <div class="dash-stat-value">${c.value}</div>
                    <div class="dash-stat-label">${c.label}</div>
                </div>
                <div class="dash-stat-glow"></div>
            </div>
        `).join('');
        document.querySelector(`#invStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');
    };

    const renderList = (data) => {
        const el = document.getElementById('inventoryList');
        if (!el) return;
        if (!data.length) {
            const hasSessions = sessions.length > 0;
            if (!hasSessions) {
                el.innerHTML = `<div class="dev-empty">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                    <h3>Chưa có phiếu kiểm kê</h3>
                    <p>Tạo phiếu kiểm kê định kỳ để theo dõi và đối chiếu tài sản</p>
                </div>`;
            } else {
                el.innerHTML = `<div class="dev-empty">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <h3>Không tìm thấy kết quả</h3>
                    <p>Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                </div>`;
            }
            return;
        }
        const cu = App.getCurrentUser();
        const canManage = cu?.role !== 'user';
        el.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.25s">
            <table class="dev-table">
                <thead><tr>
                    <th style="padding-left:1.25rem">Mã phiếu</th>
                    <th>Tên đợt kiểm kê</th>
                    <th>Ngày KK</th>
                    <th>Phòng ban</th>
                    <th>Quý</th>
                    <th>Tiến độ</th>
                    <th>Tồn tại</th>
                    <th>Trạng thái</th>
                    <th style="text-align:right;padding-right:1.25rem">Thao tác</th>
                </tr></thead>
                <tbody>${data.map(s => {
                    const progress = s.total_devices > 0 ? Math.round((s.checked_devices || 0) / s.total_devices * 100) : 0;
                    const hasIssues = s.missing_devices > 0 || s.damaged_devices > 0;
                    return `<tr class="dev-tr" style="${hasIssues && s.status === 'completed' ? 'background:#FEF2F2' : ''}">
                        <td style="padding-left:1.25rem"><span style="font-family:monospace;font-weight:600;font-size:.85rem;color:var(--accent)">${s.inventory_code}</span></td>
                        <td>
                            <div class="dev-name-cell">
                                <div style="width:32px;height:32px;border-radius:8px;background:${s.status === 'completed' ? '#ECFDF5' : s.status === 'in_progress' ? '#FFFBEB' : '#F3F4F6'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${s.status === 'completed' ? '#10B981' : s.status === 'in_progress' ? '#F59E0B' : '#9CA3AF'}" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                                </div>
                                <div>
                                    <div class="dev-name-text">${s.title}</div>
                                    <div class="dev-name-sub">${s.created_by_name || ''}</div>
                                </div>
                            </div>
                        </td>
                        <td><span class="dev-td-date">${fmt.date(s.inventory_date)}</span></td>
                        <td><span class="chip">${s.department_name || 'Toàn trường'}</span></td>
                        <td>${s.quarter ? `<span class="badge badge-secondary">Q${s.quarter}/${s.year}</span>` : '—'}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:6px;min-width:80px">
                                <div style="flex:1;height:6px;background:#E2E8F0;border-radius:100px;overflow:hidden">
                                    <div style="height:100%;width:${progress}%;background:${progress === 100 ? '#10B981' : '#3B82F6'};border-radius:100px;transition:width .4s"></div>
                                </div>
                                <span style="font-size:.72rem;font-weight:600;color:#64748B;white-space:nowrap">${s.checked_devices || 0}/${s.total_devices || 0}</span>
                            </div>
                        </td>
                        <td>
                            ${s.missing_devices > 0 || s.damaged_devices > 0
                                ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:600;color:#EF4444">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    ${(s.missing_devices || 0) + (s.damaged_devices || 0)}
                                  </span>`
                                : s.status === 'completed'
                                    ? '<span style="color:#10B981;font-size:.75rem;font-weight:600">✅ Không</span>'
                                    : '<span style="color:#94A3B8;font-size:.75rem">—</span>'
                            }
                        </td>
                        <td><span class="dev-status-pill ${statusBadge[s.status]}">${statusLabel[s.status]}</span></td>
                        <td class="dev-td-actions">
                            <button class="dev-action-btn" onclick="InventoryPage.showDetail(${s.id})" title="Chi tiết">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            ${s.status !== 'completed' && s.status !== 'cancelled' && canManage ? `
                                <button class="dev-action-btn" style="color:var(--accent)" onclick="InventoryPage.showDetail(${s.id})" title="Kiểm kê">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                                </button>` : ''}
                            <button class="dev-action-btn" onclick="InventoryPage.exportPdf(${s.id})" title="In PDF">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            </button>
                            ${s.status !== 'completed' && s.status !== 'cancelled' && canManage ? `
                                <button class="dev-action-btn" onclick="InventoryPage.removeSession(${s.id})" title="Xóa">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>` : ''}
                        </td>
                    </tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
    };

    const render = async () => {
        const content = document.getElementById('mainContent');
        const user = App.getCurrentUser();
        const canManage = user?.role !== 'user';

        content.innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                            Kiểm kê tài sản
                        </div>
                        <div class="dev-header-count" id="invCount">0 phiếu</div>
                    </div>
                    <div class="dev-header-right">
                        ${canManage ? '<button class="dev-btn-primary" id="addBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tạo phiếu kiểm kê</button>' : ''}
                    </div>
                </div>
                <div class="dev-filter-bar">
                    <div class="dev-search-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input class="dev-search-input" id="invSearch" placeholder="Tìm kiếm phiếu kiểm kê...">
                    </div>
                    <select class="dev-filter-select" id="invStatusFilter">
                        <option value="">Tất cả trạng thái</option>
                        <option value="draft">Bản nháp</option>
                        <option value="in_progress">Đang kiểm kê</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                    <select class="dev-filter-select" id="invQuarterFilter">
                        <option value="">Tất cả quý</option>
                        <option value="1">Quý 1</option>
                        <option value="2">Quý 2</option>
                        <option value="3">Quý 3</option>
                        <option value="4">Quý 4</option>
                    </select>
                </div>
            </div>

            <div id="invStats" class="dash-stats"></div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">Danh sách phiếu kiểm kê</div>
                </div>
                <div id="inventoryList"><div class="dev-empty" style="padding:3rem">Đang tải...</div></div>
            </div>
        </div>`;

        await load();
        renderStats();
        applyFilter();

        document.getElementById('addBtn')?.addEventListener('click', () => openCreateModal());
        document.getElementById('invSearch')?.addEventListener('input', applyFilter);
        document.getElementById('invStatusFilter')?.addEventListener('change', applyFilter);
        document.getElementById('invQuarterFilter')?.addEventListener('change', applyFilter);
    };

    // ========== CREATE MODAL ==========
    const openCreateModal = () => {
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3) + 1;
        const deptOpts = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <span style="font-size:1.05rem;font-weight:700;color:#1E293B">Tạo phiếu kiểm kê mới</span>
            </div>`, `
            <form id="invCreateForm">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                    <div style="grid-column:1/-1">
                        <label class="form-label">Tên đợt kiểm kê <span style="color:#EF4444">*</span></label>
                        <input class="form-control" id="iv_title" value="Kiểm kê tài sản Quý ${q}/${now.getFullYear()}" required style="font-size:.88rem">
                    </div>
                    <div>
                        <label class="form-label">Ngày kiểm kê <span style="color:#EF4444">*</span></label>
                        <input class="form-control" id="iv_date" type="date" value="${now.toISOString().slice(0,10)}" required>
                    </div>
                    <div>
                        <label class="form-label">Phòng ban</label>
                        <select class="form-control" id="iv_department" style="font-size:.88rem">
                            <option value="">Toàn trường (tất cả thiết bị)</option>
                            ${deptOpts}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Quý</label>
                        <select class="form-control" id="iv_quarter" style="font-size:.88rem">
                            <option value="1" ${q === 1 ? 'selected' : ''}>Quý 1 (Th1-Th3)</option>
                            <option value="2" ${q === 2 ? 'selected' : ''}>Quý 2 (Th4-Th6)</option>
                            <option value="3" ${q === 3 ? 'selected' : ''}>Quý 3 (Th7-Th9)</option>
                            <option value="4" ${q === 4 ? 'selected' : ''}>Quý 4 (Th10-Th12)</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Năm</label>
                        <input class="form-control" id="iv_year" type="number" value="${now.getFullYear()}" min="2020" max="2030" style="font-size:.88rem">
                    </div>
                    <div style="grid-column:1/-1">
                        <label class="form-label">Ghi chú</label>
                        <textarea class="form-control" id="iv_notes" rows="2" style="font-size:.88rem" placeholder="Thông tin bổ sung..."></textarea>
                    </div>
                </div>
                <div style="display:flex;gap:10px;margin-top:12px;padding:12px 16px;background:#F0F9FF;border-radius:10px;border:1px solid #BAE6FD">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <div style="font-size:.82rem;color:#0369A1;line-height:1.5">
                        <strong style="font-weight:600">Lưu ý:</strong> Hệ thống sẽ tự động lấy danh sách thiết bị đang quản lý (trừ thiết bị đã thanh lý) để tạo phiếu kiểm kê. Nếu chọn phòng ban, chỉ kiểm kê thiết bị thuộc phòng ban đó.
                    </div>
                </div>
            </form>`, true, async () => {
            const title = document.getElementById('iv_title')?.value.trim();
            const inventory_date = document.getElementById('iv_date')?.value;
            const department_id = document.getElementById('iv_department')?.value || null;
            const quarter = parseInt(document.getElementById('iv_quarter')?.value) || null;
            const year = parseInt(document.getElementById('iv_year')?.value) || null;
            const notes = document.getElementById('iv_notes')?.value.trim() || null;
            if (!title) { Toast.error('Vui lòng nhập tên đợt kiểm kê'); return; }
            if (!inventory_date) { Toast.error('Vui lòng chọn ngày kiểm kê'); return; }
            const res = await API.post('/inventory', { title, inventory_date, department_id, quarter, year, notes });
            if (res.ok) {
                Toast.success('Tạo phiếu kiểm kê thành công!');
                closeModal();
                await load();
                renderStats();
                applyFilter();
            } else {
                Toast.error(res.data.message || 'Lỗi tạo phiếu');
            }
        }, '620px');
    };

    // ========== DETAIL MODAL ==========
    const showDetail = async (id) => {
        const res = await API.get(`/inventory/${id}`);
        if (!res.ok) { Toast.error('Không tìm thấy phiếu kiểm kê'); return; }
        const s = res.data.data;
        const details = s.details || [];
        const user = App.getCurrentUser();
        const canManage = user?.role !== 'user' && s.status !== 'completed' && s.status !== 'cancelled';
        const isActive = s.status === 'draft' || s.status === 'in_progress';

        const checked = details.filter(d => d.actual_status).length;
        const found = details.filter(d => d.actual_status === 'found').length;
        const missing = details.filter(d => d.actual_status === 'missing').length;
        const damaged = details.filter(d => d.actual_status === 'damaged').length;
        const transferred = details.filter(d => d.actual_status === 'transferred').length;
        const progress = details.length > 0 ? Math.round(checked / details.length * 100) : 0;

        const sortedDetails = [...details].sort((a, b) => {
            if (a.actual_status === 'missing' || a.actual_status === 'damaged') return -1;
            if (b.actual_status === 'missing' || b.actual_status === 'damaged') return 1;
            if (a.actual_status && !b.actual_status) return -1;
            if (!a.actual_status && b.actual_status) return 1;
            return 0;
        });

        const isAllChecked = checked === details.length;

        const detailRows = sortedDetails.map(d => {
            const sysStatus = d.device_status === 'active' ? 'Đang dùng' : d.device_status === 'maintenance' ? 'Bảo trì' : d.device_status === 'broken' ? 'Hỏng' : d.device_status === 'disposed' ? 'TLý' : d.device_status || '—';
            const isIssue = d.actual_status === 'missing' || d.actual_status === 'damaged';
            const isChecked = !!d.actual_status;
            const sysColor = d.device_status === 'active' ? '#059669' : d.device_status === 'maintenance' ? '#D97706' : d.device_status === 'broken' ? '#DC2626' : '#64748B';
            const sysBg = d.device_status === 'active' ? '#ECFDF5' : d.device_status === 'maintenance' ? '#FFFBEB' : d.device_status === 'broken' ? '#FEF2F2' : '#F3F4F6';
            const statusIcon = isIssue
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
                : isChecked
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<span style="width:14px;height:14px;border-radius:3px;border:2px solid #CBD5E1;display:block"></span>';
            const rowBg = isIssue ? '#FEF2F2' : isChecked ? '#F0FDF4' : '';
            const rowBorder = isIssue ? '#FECACA' : isChecked ? '#BBF7D0' : '#F1F5F9';
            return `<tr style="${rowBg}">
                <td style="padding:10px 8px 10px 1rem">
                    <span style="font-family:monospace;font-size:.78rem;font-weight:600;color:#64748B">${d.device_code || '—'}</span>
                </td>
                <td style="padding:10px 8px">
                    <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:30px;height:30px;border-radius:8px;background:${isChecked ? (isIssue ? '#FEF2F2' : '#DCFCE7') : '#F3F4F6'};display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${isChecked ? (isIssue ? '#FECACA' : '#BBF7D0') : '#E2E8F0'}">
                            ${statusIcon}
                        </div>
                        <div>
                            <div style="font-size:.82rem;font-weight:600;color:#1E293B;line-height:1.3">${d.device_name || '—'}</div>
                            <div style="font-size:.72rem;color:#64748B;margin-top:1px">${d.category_name || ''}${d.brand ? ' · ' + d.brand : ''} · ${d.department_name || '—'}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:10px 8px">
                    <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:.7rem;font-weight:600;background:${sysBg};color:${sysColor}">${sysStatus}</span>
                    <div style="font-size:.7rem;color:#94A3B8;margin-top:3px">${d.system_location || '—'}</div>
                </td>
                <td style="padding:10px 8px;min-width:180px">
                    ${canManage && isActive ? `
                    <div style="display:flex;flex-direction:column;gap:6px">
                        <select class="inv-status-select" data-detail-id="${d.id}" data-session-id="${s.id}" style="border-color:${isChecked ? (actualStatusColor[d.actual_status] || '#D1D5DB') : '#D1D5DB'};color:${isChecked ? (actualStatusColor[d.actual_status] || '#1E293B') : '#94A3B8'}">
                            <option value="" ${!d.actual_status ? 'selected' : ''}>— Chọn kết quả —</option>
                            <option value="found" ${d.actual_status === 'found' ? 'selected' : ''}>✓ Còn</option>
                            <option value="missing" ${d.actual_status === 'missing' ? 'selected' : ''}>✗ Thiếu</option>
                            <option value="damaged" ${d.actual_status === 'damaged' ? 'selected' : ''}>⚠ Hỏng</option>
                            <option value="transferred" ${d.actual_status === 'transferred' ? 'selected' : ''}>⇄ Đã điều chuyển</option>
                        </select>
                        ${isChecked ? `<input class="inv-location-input" data-detail-id="${d.id}" placeholder="Vị trí thực tế (VD: Phòng A101)" value="${d.actual_location || ''}">` : ''}
                    </div>` :
                    `<div style="display:flex;align-items:center;gap:6px">
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isChecked ? actualStatusColor[d.actual_status] || '#CBD5E1' : '#CBD5E1'}"></span>
                        <span style="font-weight:600;font-size:.82rem;color:${actualStatusColor[d.actual_status] || '#94A3B8'}">${d.actual_status ? (actualStatusLabel[d.actual_status] || d.actual_status) : 'Chưa kiểm'}</span>
                    </div>`
                    }
                </td>
                <td style="padding:10px 8px;font-size:.76rem;color:#64748B">
                    ${d.checked_by_name ? `<span style="font-weight:500;color:#475569">${d.checked_by_name}</span>` : (d.checked_at ? fmt.date(d.checked_at) : '') || ''}
                    ${d.actual_location ? `<div style="margin-top:3px;display:flex;align-items:center;gap:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${d.actual_location}</div>` : ''}
                    ${d.notes ? `<div style="margin-top:2px;color:#94A3B8">${d.notes}</div>` : ''}
                </td>
            </tr>`;
        }).join('');

        // Determine workflow step
        const steps = [
            { key: 'draft', label: 'Lập phiếu' },
            { key: 'in_progress', label: 'Đang kiểm kê' },
            { key: 'completed', label: 'Hoàn thành' },
        ];
        const currentStepIdx = s.status === 'completed' ? 2 : s.status === 'in_progress' ? 1 : s.status === 'cancelled' ? -1 : 0;

        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="modal-title" style="font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</span>
                        <span class="dev-status-pill ${statusBadge[s.status]}">${statusLabel[s.status]}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;margin-top:1px;font-size:.72rem;color:#94A3B8;flex-wrap:wrap">
                        <span>${s.inventory_code}</span>
                        <span style="color:#e2e8f0">•</span>
                        <span>${fmt.date(s.inventory_date)}</span>
                        <span style="color:#e2e8f0">•</span>
                        <span>${s.department_name || 'Toàn trường'}</span>
                        ${s.quarter ? `<span style="color:#e2e8f0">•</span><span>Quý ${s.quarter}/${s.year}</span>` : ''}
                    </div>
                </div>
            </div>`, `
        <div class="detail-body" style="padding:0">
            <!-- Workflow Steps -->
            <div style="display:flex;align-items:center;gap:0;padding:14px 20px;background:#F8FAFC;border-radius:10px;margin-bottom:14px;border:1px solid #E2E8F0">
                ${steps.map((step, i) => `
                    <div style="display:flex;align-items:center;flex:1;position:relative">
                        <div style="display:flex;align-items:center;gap:8px;flex:1">
                            <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;
                                ${i < currentStepIdx ? 'background:#10B981' :
                                  i === currentStepIdx ? 'background:#3B82F6;box-shadow:0 0 0 3px rgba(59,130,246,.15)' :
                                  'background:#E2E8F0'}">
                                ${i < currentStepIdx
                                  ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                                  : i === currentStepIdx
                                  ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
                                  : '<span style="width:8px;height:8px;border-radius:50%;background:#CBD5E1;display:block"></span>'}
                            </div>
                            <div>
                                <div style="font-size:.72rem;font-weight:600;color:${i <= currentStepIdx ? '#1E293B' : '#94A3B8'}">${step.label}</div>
                                ${i === currentStepIdx && s.status === 'in_progress' ? '<div style="font-size:.64rem;color:#3B82F6;font-weight:500">Đang thực hiện</div>' : ''}
                            </div>
                        </div>
                        ${i < steps.length - 1 ? `
                        <div style="flex:0 0 24px;margin:0 6px;position:relative">
                            <div style="height:2px;background:${i < currentStepIdx ? '#10B981' : '#E2E8F0'};border-radius:1px;margin-bottom:14px"></div>
                        </div>` : ''}
                    </div>
                `).join('')}
            </div>

            <!-- Stats row -->
            <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
                <div style="flex:1;min-width:70px;text-align:center;padding:8px 6px;background:#fff;border-radius:8px;border:1px solid #E2E8F0">
                    <div style="font-size:1.05rem;font-weight:800;color:#1E293B">${details.length}</div>
                    <div style="font-size:.65rem;color:#94A3B8;margin-top:1px">Tổng TB</div>
                </div>
                <div style="flex:1;min-width:70px;text-align:center;padding:8px 6px;background:#fff;border-radius:8px;border:1px solid #BBF7D0">
                    <div style="font-size:1.05rem;font-weight:800;color:#16A34A">${found}</div>
                    <div style="font-size:.65rem;color:#94A3B8;margin-top:1px">Còn</div>
                </div>
                <div style="flex:1;min-width:70px;text-align:center;padding:8px 6px;background:#fff;border-radius:8px;border:1px solid #FECACA">
                    <div style="font-size:1.05rem;font-weight:800;color:#DC2626">${missing}</div>
                    <div style="font-size:.65rem;color:#94A3B8;margin-top:1px">Thiếu</div>
                </div>
                <div style="flex:1;min-width:70px;text-align:center;padding:8px 6px;background:#fff;border-radius:8px;border:1px solid #FDE68A">
                    <div style="font-size:1.05rem;font-weight:800;color:#D97706">${damaged}</div>
                    <div style="font-size:.65rem;color:#94A3B8;margin-top:1px">Hỏng</div>
                </div>
                <div style="flex:1;min-width:70px;text-align:center;padding:8px 6px;background:#fff;border-radius:8px;border:1px solid #C7D2FE">
                    <div style="font-size:1.05rem;font-weight:800;color:#6366F1">${transferred}</div>
                    <div style="font-size:.65rem;color:#94A3B8;margin-top:1px">Đã ĐC</div>
                </div>
            </div>

            <!-- Progress Bar -->
            ${isActive ? `
            <div style="margin-bottom:14px;padding:12px 14px;background:#fff;border-radius:10px;border:1px solid #E2E8F0">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <span style="font-size:.78rem;font-weight:600;color:#1E293B">Tiến độ kiểm kê</span>
                    <span style="font-size:.78rem;font-weight:700;color:${progress === 100 ? '#10B981' : '#3B82F6'}">${checked}/${details.length} (${progress}%)</span>
                </div>
                <div style="height:6px;background:#E2E8F0;border-radius:100px;overflow:hidden">
                    <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#3B82F6,${progress === 100 ? '#10B981' : '#6366F1'});border-radius:100px;transition:width .6s cubic-bezier(.4,0,.2,1)"></div>
                </div>
            </div>` : ''}

            <!-- Notes -->
            ${s.notes ? `
            <div style="padding:10px 14px;background:#FFFBEB;border-radius:8px;margin-bottom:12px;font-size:.78rem;border:1px solid #FDE68A;display:flex;gap:6px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <div><strong style="font-weight:600">Ghi chú:</strong> ${s.notes}</div>
            </div>` : ''}

            <!-- Device Table -->
            <div style="overflow-x:auto;border:1px solid #E2E8F0;border-radius:10px">
                <table class="dev-table" style="margin:0">
                    <thead><tr>
                        <th style="padding-left:.9rem;width:80px">Mã TS</th>
                        <th>Tên thiết bị</th>
                        <th style="width:90px">HT (Vị trí)</th>
                        <th style="min-width:160px">Kết quả kiểm kê</th>
                        <th style="width:120px">Người kiểm / Vị trí</th>
                    </tr></thead>
                    <tbody>${detailRows}</tbody>
                </table>
            </div>
        </div>`, true, async () => {
            if (s.status === 'completed') { closeModal(); return; }
            if (checked < details.length) {
                Toast.warning(`Chưa kiểm tra hết thiết bị (${checked}/${details.length})`);
                return;
            }
            if (confirm('Xác nhận hoàn thành phiếu kiểm kê này?')) {
                const res2 = await API.put(`/inventory/${s.id}/complete`);
                if (res2.ok) {
                    Toast.success('✅ Hoàn thành kiểm kê!');
                    closeModal();
                    await load();
                    renderStats();
                    applyFilter();
                } else {
                    Toast.error(res2.data.message);
                }
            }
        }, '820px', '80vh');

        // Bind status changes
        document.querySelectorAll('.inv-status-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const detailId = e.target.dataset.detailId;
                const sessionId = e.target.dataset.sessionId;
                const status = e.target.value;
                if (!status) { Toast.warning('Vui lòng chọn kết quả kiểm kê'); return; }
                const locationInput = e.target.closest('td')?.querySelector('.inv-location-input');
                const location = locationInput?.value?.trim() || null;
                const mb = document.querySelector('.modal-overlay .modal-body');
                const sp = mb?.scrollTop || 0;
                const res2 = await API.put(`/inventory/${sessionId}/check`, {
                    detail_id: parseInt(detailId),
                    actual_status: status,
                    actual_location: location
                });
                if (res2.ok) {
                    Toast.success('Đã cập nhật: ' + (actualStatusLabel[status] || status));
                    await showDetail(sessionId);
                    requestAnimationFrame(() => { const nb = document.querySelector('.modal-overlay .modal-body'); if (nb) nb.scrollTop = sp; });
                } else {
                    Toast.error(res2.data.message);
                }
            });
        });
        document.querySelectorAll('.inv-location-input').forEach(inp => {
            inp.addEventListener('change', async (e) => {
                const detailId = e.target.dataset.detailId;
                const select = document.querySelector(`.inv-status-select[data-detail-id="${detailId}"]`);
                if (!select || !select.value) return;
                const sessionId = select.dataset.sessionId;
                const location = e.target.value.trim() || null;
                await API.put(`/inventory/${sessionId}/check`, {
                    detail_id: parseInt(detailId),
                    actual_status: select.value,
                    actual_location: location
                });
            });
        });

        // Add PDF button to footer
        const footerEl = document.querySelector('.modal-overlay .modal-footer');
        if (footerEl) {
            const pdfBtn = document.createElement('button');
            pdfBtn.className = 'dev-btn-secondary';
            pdfBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Xuất Biên bản';
            pdfBtn.style.marginRight = 'auto';
            pdfBtn.addEventListener('click', () => exportPdf(s.id));
            footerEl.prepend(pdfBtn);
            // Change save button text
            const saveBtn = footerEl.querySelector('[onclick], .dev-btn-primary');
            if (saveBtn && s.status !== 'completed') {
                const isCompleted = s.status === 'completed';
                saveBtn.innerHTML = isCompleted ? 'Hoàn thành' : (isAllChecked ? 'Hoàn thành kiểm kê' : `Hoàn thành (${checked}/${details.length})`);
            }
            if (s.status === 'completed') {
                const saveBtn2 = footerEl.querySelector('.dev-btn-primary');
                if (saveBtn2) {
                    saveBtn2.textContent = 'Đóng';
                    saveBtn2.onclick = closeModal;
                }
            }
        }

        const modalBody = document.querySelector('.modal-overlay .modal-body');
        if (modalBody) {
            modalBody.style.overflowY = 'auto';
            modalBody.style.maxHeight = 'calc(85vh - 130px)';
        }
    };

    const exportPdf = (id) => {
        const token = encodeURIComponent(API.getToken());
        window.open(`${API.BASE_URL}/inventory/${id}/export-pdf?inline=1&token=${token}`, '_blank');
    };

    const removeSession = async (id) => {
        if (!confirm('Xóa phiếu kiểm kê này?')) return;
        const res = await API.delete(`/inventory/${id}`);
        if (res.ok) {
            Toast.success('Đã xóa phiếu kiểm kê');
            await load();
            renderStats();
            applyFilter();
        } else {
            Toast.error(res.data.message);
        }
    };

    return { render, setStatFilter, showDetail, exportPdf, removeSession };
})();
