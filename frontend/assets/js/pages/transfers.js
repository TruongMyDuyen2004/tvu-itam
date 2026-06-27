window.TransfersPage = (() => {
    let transfers = [], devices = [], departments = [], users = [];
    let statFilter = '';

    const statusLabel = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
    const statusBadge = { pending: 'badge-pending', approved: 'badge-active', rejected: 'badge-danger' };

    const load = async () => {
        const [tRes, dRes, depRes, uRes] = await Promise.all([
            API.get('/transfers'),
            API.get('/devices'),
            API.get('/departments'),
            API.get('/users')
        ]);
        if (tRes.ok) transfers = tRes.data.data || [];
        if (dRes.ok) devices = dRes.data.data || [];
        if (depRes.ok) departments = depRes.data.data || [];
        if (uRes.ok) users = uRes.data.data || [];
    };

    const renderStats = () => {
        const st = document.getElementById('tfStats');
        if (!st) return;
        const all = transfers.length;
        const pending = transfers.filter(t => t.status === 'pending').length;
        const approved = transfers.filter(t => t.status === 'approved').length;
        const rejected = transfers.filter(t => t.status === 'rejected').length;

        const cards = [
            { value: all, label: 'Tổng số', filter: '', icon: 'transfer', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)' },
            { value: pending, label: 'Chờ duyệt', filter: 'pending', icon: 'clock', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
            { value: approved, label: 'Đã duyệt', filter: 'approved', icon: 'check', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
            { value: rejected, label: 'Từ chối', filter: 'rejected', icon: 'x', gradient: 'linear-gradient(135deg,#818CF8,#A5B4FC)' },
        ];

        st.innerHTML = cards.map((c, i) => `
            <div class="dash-stat-card card-anim-${i+1}" data-stat="${c.filter}" onclick="TransfersPage.setStatFilter('${c.filter}')" style="cursor:pointer;--stat-gradient:${c.gradient}">
                <div class="dash-stat-icon" style="background:${c.gradient}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${c.icon === 'transfer' ? '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>' :
                        c.icon === 'clock' ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' :
                        c.icon === 'check' ? '<polyline points="20 6 9 17 4 12"/>' :
                        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
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

    const renderTable = () => {
        const el = document.getElementById('transfersList');
        if (!el) return;

        const search = document.getElementById('tfSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('tfStatus')?.value || '';

        const filtered = transfers.filter(t => {
            if (statFilter && t.status !== statFilter) return false;
            if (status && t.status !== status) return false;
            if (search && !t.device_name?.toLowerCase().includes(search) && !t.device_code?.toLowerCase().includes(search) && !t.from_dept_name?.toLowerCase().includes(search) && !t.to_dept_name?.toLowerCase().includes(search) && !t.created_by_name?.toLowerCase().includes(search)) return false;
            return true;
        });

        document.getElementById('tfCount').textContent = `${filtered.length} yêu cầu`;
        document.querySelectorAll('#tfStats .dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#tfStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');

        if (!filtered.length) {
            el.innerHTML = `<div class="dev-empty">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                <h3>Chưa có yêu cầu điều chuyển</h3>
                <p>Tạo yêu cầu mới để bắt đầu</p>
            </div>`;
            return;
        }

        const currentUser = App.getCurrentUser();
        const canApprove = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
        const canViewRejectReason = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

        el.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.25s">
            <table class="dev-table">
                <thead><tr>
                    <th style="padding-left:1.25rem">Thiết bị</th>
                    <th>Nơi đi</th>
                    <th>Nơi đến</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                    <th>Người tạo</th>
                    <th style="text-align:right;padding-right:1.25rem">Thao tác</th>
                </tr></thead>
                <tbody>${filtered.map(t => `<tr class="dev-tr">
                    <td style="padding-left:1.25rem">
                        <div class="dev-name-cell">
                            <div>
                                <div class="dev-name-text">${t.device_name}</div>
                                <div class="dev-name-sub">${t.device_code}</div>
                            </div>
                        </div>
                    </td>
                    <td data-label="Nơi đi"><span style="font-size:.82rem;color:var(--text-secondary)">${t.from_dept_name || t.from_user_name || '—'}</span></td>
                    <td data-label="Nơi đến"><span style="font-size:.82rem;color:var(--text-secondary)">${t.to_dept_name || t.to_user_name || '—'}</span></td>
                    <td data-label="Ngày"><span class="dev-td-date">${fmt.date(t.transfer_date)}</span></td>
                    <td data-label="Trạng thái"><span class="dev-status-pill ${statusBadge[t.status]}">${statusLabel[t.status]}</span>${t.status === 'rejected' && t.rejection_reason && canViewRejectReason ? `<div class="text-xs" style="color:#DC2626;margin-top:4px;max-width:180px;line-height:1.3">Lý do: ${t.rejection_reason}</div>` : ''}</td>
                    <td data-label="Người tạo"><div style="font-size:.82rem;color:var(--text-secondary)">${t.created_by_name || '—'}</div><div class="dev-name-sub">${fmt.date(t.created_at)}</div></td>
                    <td class="dev-td-actions">
                        <button class="dev-action-btn" onclick="TransfersPage.showDetail(${t.id})" title="Xem chi tiết">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        ${t.status === 'pending' && canApprove ? `
                            <button class="dev-action-btn" style="color:var(--accent)" onclick="TransfersPage.approve(${t.id},'approved')" title="Duyệt">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <button class="dev-action-btn dev-action-danger" onclick="TransfersPage.approve(${t.id},'rejected')" title="Từ chối">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        ` : ` <button class="dev-action-btn" onclick="TransfersPage.exportPdf(${t.id})" title="Xuất phiếu bàn giao">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button> `}
                        ${currentUser?.role === 'superadmin' ? `<button class="dev-action-btn dev-action-danger" onclick="TransfersPage.remove(${t.id})" title="Xóa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>` : ''}
                        ${t.approved_by_name ? `<div class="text-xs text-muted" style="margin-top:4px">Duyệt: ${t.approved_by_name}</div>` : ''}
                    </td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    };

    const openModal = () => {
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <div>
                    <div class="modal-title">Tạo yêu cầu điều chuyển</div>
                    <div class="text-xs text-muted" style="margin-top:2px">Điều chuyển tài sản giữa các phòng ban</div>
                </div>
            </div>`, `
            <form id="tfForm">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        Thiết bị & Thời gian
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label">Thiết bị *</label>
                        <select class="form-control" id="tf_device" required>
                            <option value="">-- Chọn thiết bị --</option>
                            ${devices.map(d => `<option value="${d.id}">${d.device_code} - ${d.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Ngày điều chuyển *</label>
                        <input type="date" class="form-control" id="tf_date" value="${new Date().toISOString().slice(0,10)}" required>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M9 21V10M15 21V10"/></svg>
                            Nguồn gốc
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Phòng ban *</label>
                            <select class="form-control" id="tf_from_dept" required>
                                <option value="">-- Chọn phòng ban --</option>
                                ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Người dùng</label>
                            <select class="form-control" id="tf_from_user">
                                <option value="">-- Không xác định --</option>
                                ${users.map(u => `<option value="${u.id}">${u.full_name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M9 21V10M15 21V10"/></svg>
                            Đích đến
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Phòng ban *</label>
                            <select class="form-control" id="tf_to_dept" required>
                                <option value="">-- Chọn phòng ban --</option>
                                ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Người dùng</label>
                            <select class="form-control" id="tf_to_user">
                                <option value="">-- Không xác định --</option>
                                ${users.map(u => `<option value="${u.id}">${u.full_name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Ghi chú
                    </div>
                    <div class="form-group" style="margin-bottom:8px">
                        <label class="form-label">Lý do</label>
                        <textarea class="form-control" id="tf_reason" rows="2" placeholder="Lý do điều chuyển..."></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Ghi chú thêm</label>
                        <textarea class="form-control" id="tf_notes" rows="2" placeholder="Thông tin bổ sung..."></textarea>
                    </div>
                </div>
            </form>`, true, save, '700px');
    };

    const save = async () => {
        const body = {
            device_id: document.getElementById('tf_device').value,
            from_department_id: document.getElementById('tf_from_dept').value || null,
            to_department_id: document.getElementById('tf_to_dept').value || null,
            from_user_id: document.getElementById('tf_from_user').value || null,
            to_user_id: document.getElementById('tf_to_user').value || null,
            transfer_date: document.getElementById('tf_date').value,
            reason: document.getElementById('tf_reason').value,
            notes: document.getElementById('tf_notes').value
        };

        if (!body.device_id || !body.from_department_id || !body.to_department_id || !body.transfer_date) {
            Toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        const res = await API.post('/transfers', body);
        if (res.ok) {
            Toast.success('Tạo yêu cầu điều chuyển thành công');
            closeModal();
            await load();
            renderTable();
        } else {
            Toast.error(res.data.message || 'Có lỗi xảy ra');
        }
    };

    const approve = async (id, status) => {
        if (status === 'approved') {
            if (!confirm('Phê duyệt yêu cầu này?')) return;
        } else {
            showRejectModal('Từ chối điều chuyển', async (reason) => {
                const res = await API.put(`/transfers/${id}/approve`, { status, rejection_reason: reason });
                if (res.ok) { Toast.success('Đã từ chối'); await load(); renderTable(); }
                else Toast.error(res.data.message || 'Có lỗi xảy ra');
            });
            return;
        }

        const res = await API.put(`/transfers/${id}/approve`, { status });
        if (res.ok) { Toast.success('Đã phê duyệt'); await load(); renderTable(); }
        else Toast.error(res.data.message || 'Có lỗi xảy ra');
    };

    const exportPdf = async (id) => {
        const token = API.getToken();
        if (!token) { Toast.error('Vui lòng đăng nhập lại'); return; }
        window.open(API.BASE_URL + `/transfers/${id}/export-pdf?inline=1&token=` + encodeURIComponent(token), '_blank');
    };

    const remove = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa yêu cầu điều chuyển này?')) return;
        const res = await API.delete('/transfers/' + id);
        if (res.ok) {
            Toast.success('Đã xóa yêu cầu điều chuyển');
            await load();
            renderTable();
        } else {
            Toast.error(res.data.message || 'Không thể xóa yêu cầu');
        }
    };

    const setStatFilter = (value) => {
        statFilter = statFilter === value ? '' : value;
        renderTable();
    };

    const render = async () => {
        const currentUser = App.getCurrentUser();
        const canCreate = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Điều chuyển</div>
                                <div class="dev-subtitle">Quản lý điều chuyển tài sản giữa các phòng ban</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${canCreate ? `<button class="dev-btn-primary" title="Tạo yêu cầu điều chuyển" onclick="TransfersPage.openModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Tạo yêu cầu
                        </button>` : ''}
                    </div>
                </div>
                <div class="dev-filter-bar">
                    <div class="dev-search-wrap" style="flex:1;max-width:360px">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="tfSearch" placeholder="Tìm thiết bị...">
                    </div>
                    <div class="dev-filter-selects">
                        <select class="dev-select" id="tfStatus">
                            <option value="">Tất cả trạng thái</option>
                            ${Object.entries(statusLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div id="tfStats" class="dash-stats"></div>
            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        Danh sách điều chuyển
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted)" id="tfCount">Đang tải...</span>
                </div>
                <div id="transfersList" style="min-height:300px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;

        await load();
        renderStats();
        document.getElementById('tfSearch')?.addEventListener('input', renderTable);
        document.getElementById('tfStatus')?.addEventListener('change', renderTable);
        renderTable();
    };

    const showDetail = (id) => {
        const t = transfers.find(d => d.id === id);
        if (!t) return;
        const cu = App.getCurrentUser();
        const canViewReject = cu?.role === 'superadmin' || cu?.role === 'admin';
        const statusColors = { pending: { bg: '#FFFBEB', text: '#D97706' }, approved: { bg: '#ECFDF5', text: '#059669' }, rejected: { bg: '#FEF2F2', text: '#DC2626' } };
        const sc = statusColors[t.status] || statusColors.pending;
        showModal(`
            <div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,${sc.bg},white);margin:-1rem -1rem 0 -1rem;padding:1.2rem 1.5rem;border-radius:14px 14px 0 0;border-bottom:1px solid var(--border)">
                <div style="width:42px;height:42px;border-radius:12px;background:${sc.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${sc.text}15">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${sc.text}" stroke-width="1.8"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>
                </div>
                <div style="flex:1">
                    <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">Chi tiết điều chuyển</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${t.device_code} — ${t.device_name}</div>
                </div>
                <span class="dev-status-pill ${statusBadge[t.status]}" style="font-size:.75rem;padding:4px 12px">${statusLabel[t.status]}</span>
            </div>`, `
            <div class="detail-grid">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#DBEAFE;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        Thiết bị
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Tên thiết bị</div><div class="detail-value">${t.device_name}</div></div>
                        <div><div class="detail-label">Mã thiết bị</div><div class="detail-value" style="font-family:monospace">${t.device_code}</div></div>
                        <div><div class="detail-label">Ngày điều chuyển</div><div class="detail-value">${fmt.date(t.transfer_date)}</div></div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#ECFDF5;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Nhân sự
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Người tạo</div><div class="detail-value">${t.created_by_name || '—'}</div></div>
                        <div><div class="detail-label">Ngày tạo</div><div class="detail-value">${fmt.date(t.created_at)}</div></div>
                        <div><div class="detail-label">Người duyệt</div><div class="detail-value">${t.approved_by_name || '—'}</div></div>
                        <div><div class="detail-label">Trạng thái</div><div class="detail-value"><span class="dev-status-pill ${statusBadge[t.status]}">${statusLabel[t.status]}</span></div></div>
                    </div>
                </div>
            </div>
            <div class="detail-grid" style="margin-top:12px">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#EFF6FF;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        Phân bổ
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Nơi đi</div><div class="detail-value">${t.from_dept_name || '—'}</div></div>
                        <div><div class="detail-label">Người đi</div><div class="detail-value">${t.from_user_name || '—'}</div></div>
                        <div><div class="detail-label">Nơi đến</div><div class="detail-value">${t.to_dept_name || '—'}</div></div>
                        <div><div class="detail-label">Người nhận</div><div class="detail-value">${t.to_user_name || '—'}</div></div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#FFFBEB;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                        Lý do & Ghi chú
                    </div>
                    <div style="margin-top:8px">
                        <div style="font-size:.88rem;line-height:1.6;color:var(--text-primary);background:#F9FAFB;padding:12px;border-radius:8px;border:1px solid var(--border)">${t.reason || '—'}</div>
                        ${t.notes ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><div style="font-size:.72rem;font-weight:600;color:var(--text-muted);margin-bottom:6px">Ghi chú</div><div style="font-size:.85rem;line-height:1.5;color:var(--text-primary)">${t.notes}</div></div>` : ''}
                    </div>
                </div>
            </div>
            ${t.status === 'rejected' && t.rejection_reason && canViewReject ? `
            <div class="detail-full" style="margin-top:12px;background:linear-gradient(135deg,#FEF2F2,#FFF5F5);border:1px solid #FECACA;border-radius:12px;padding:1rem 1.2rem;box-shadow:0 1px 4px rgba(220,38,38,.06)">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <div style="width:28px;height:28px;border-radius:8px;background:#DC2626;display:flex;align-items:center;justify-content:center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <div>
                        <div style="font-size:.82rem;font-weight:700;color:#991B1B">Yêu cầu bị từ chối</div>
                        <div style="font-size:.72rem;color:#B91C1C">Lý do từ chối</div>
                    </div>
                </div>
                <div style="background:white;border:1px solid #FECACA;border-radius:8px;padding:12px 14px;font-size:.85rem;line-height:1.6;color:#991B1B">${t.rejection_reason}</div>
            </div>` : ''}
        `, false, null, '820px');
    };

    return { render, openModal, approve, remove, exportPdf, setStatFilter, showDetail };
})();
