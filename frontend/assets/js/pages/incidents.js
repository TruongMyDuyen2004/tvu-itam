window.IncidentsPage = (() => {
    let records = [], devices = [], users = [];
    let statFilter = '';

    const load = async () => {
        const [iRes, dRes, uRes] = await Promise.all([API.get('/incidents'), API.get('/devices'), API.get('/users')]);
        if (iRes.ok) records = iRes.data.data || [];
        if (dRes.ok) devices = dRes.data.data || [];
        if (uRes.ok) users = uRes.data.data || [];
    };

    const sevColor = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical' };
    const sevLabel = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Khẩn cấp' };

    const applyFilter = () => {
        const status = document.getElementById('incStatus')?.value || '';
        const sev = document.getElementById('incSev')?.value || '';
        const search = document.getElementById('incSearch')?.value.trim().toLowerCase() || '';
        let filtered = records.filter(r => {
            if (statFilter && r.status !== statFilter) return false;
            if (status && r.status !== status) return false;
            if (sev && r.severity !== sev) return false;
            if (search && !r.device_name?.toLowerCase().includes(search) && !r.issue?.toLowerCase().includes(search) && !r.reporter_name?.toLowerCase().includes(search)) return false;
            return true;
        });
        renderTable(filtered);
        document.getElementById('incCount').textContent = `${filtered.length} sự cố`;
        document.querySelectorAll('#incStats .dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#incStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');
    };

    const renderStats = () => {
        const st = document.getElementById('incStats');
        if (!st) return;
        const all = records.length;
        const open = records.filter(r => r.status === 'open').length;
        const inProg = records.filter(r => r.status === 'in_progress').length;
        const resolved = records.filter(r => r.status === 'resolved').length;
        const closed = records.filter(r => r.status === 'closed').length;

        const cards = [
            { value: all, label: 'Tổng số', filter: '', icon: 'alert', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)' },
            { value: open, label: 'Mới', filter: 'open', icon: 'plus', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
            { value: inProg, label: 'Đang xử lý', filter: 'in_progress', icon: 'activity', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
            { value: resolved, label: 'Đã giải quyết', filter: 'resolved', icon: 'check', gradient: 'linear-gradient(135deg,#818CF8,#A5B4FC)' },
            { value: closed, label: 'Đã đóng', filter: 'closed', icon: 'check', gradient: 'linear-gradient(135deg,#A5B4FC,#C7D2FE)' },
        ];

        st.innerHTML = cards.map((c, i) => `
            <div class="dash-stat-card card-anim-${i+1}" data-stat="${c.filter}" onclick="IncidentsPage.setStatFilter('${c.filter}')" style="cursor:pointer;--stat-gradient:${c.gradient}">
                <div class="dash-stat-icon" style="background:${c.gradient}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${c.icon === 'alert' ? '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' :
                        c.icon === 'plus' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' :
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

    const renderTable = (data) => {
        const el = document.getElementById('incList');
        if (!el) return;
        if (!data.length) {
            el.innerHTML = `<div class="dev-empty">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h3>Không có sự cố nào</h3>
                <p>Hệ thống đang hoạt động ổn định</p>
            </div>`; return;
        }
        const user = App.getCurrentUser();
        const canUpdate = user?.role !== 'user';
        el.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.25s">
            <table class="dev-table">
                <thead><tr>
                    <th style="padding-left:1.25rem">Thiết bị</th>
                    <th>Vấn đề</th>
                    <th>Mức độ</th>
                    <th>Tình trạng</th>
                    <th>Người báo</th>
                    <th>Phụ trách</th>
                    <th>Thời gian</th>
                    <th style="text-align:right;padding-right:1.25rem">Thao tác</th>
                </tr></thead>
                <tbody>${data.map(r => `<tr class="dev-tr">
                    <td style="padding-left:1.25rem">
                        <div class="dev-name-cell">
                            <div>
                                <div class="dev-name-text">${r.device_name||'—'}</div>
                                <div class="dev-name-sub">${r.device_code||''}${r.department_name?' • '+r.department_name:''}</div>
                            </div>
                        </div>
                    </td>
                    <td data-label="Vấn đề"><div class="truncate" style="max-width:240px;font-size:.82rem" title="${r.issue}">${r.issue}</div></td>
                    <td data-label="Mức độ"><span class="dev-status-pill ${sevColor[r.severity]}">${sevLabel[r.severity]}</span></td>
                    <td data-label="Tình trạng"><span class="dev-status-pill badge-${r.status}">${fmt.incidentStatus[r.status]}</span></td>
                    <td data-label="Người báo"><span style="font-size:.82rem;color:var(--text-secondary)">${r.reporter_name||'—'}</span></td>
                    <td data-label="Phụ trách"><span style="font-size:.82rem;color:var(--text-secondary)">${r.assignee_name||'<span class="text-muted">—</span>'}</span></td>
                    <td data-label="Thời gian"><span class="dev-td-date">${fmt.datetime(r.reported_at)}</span></td>
                    <td class="dev-td-actions">
                        ${canUpdate ? `<button class="dev-action-btn" onclick="IncidentsPage.openUpdate(${r.id})" title="Xử lý">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </button>` : ''}
                        <button class="dev-action-btn" onclick="IncidentsPage.openDetail(${r.id})" title="Chi tiết">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </button>
                        <button class="dev-action-btn" onclick="IncidentsPage.exportPdf(${r.id})" title="In PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                        ${user?.role === 'superadmin' ? `<button class="dev-action-btn dev-action-danger" onclick="IncidentsPage.remove(${r.id})" title="Xóa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>` : ''}
                    </td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    };

    const openReport = () => {
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#EF4444,#DC2626);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(220,38,38,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                    <div class="modal-title">Báo cáo sự cố</div>
                    <div class="text-xs text-muted" style="margin-top:2px">Gửi thông báo về sự cố thiết bị</div>
                </div>
            </div>`, `
            <form id="incForm">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        Thông tin sự cố
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label">Thiết bị *</label>
                        <select class="form-control" id="inc_device" required>
                            <option value="">-- Chọn thiết bị --</option>
                            ${devices.map(d => `<option value="${d.id}">${d.device_code} - ${d.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label">Vấn đề *</label>
                        <input class="form-control" id="inc_issue" placeholder="Mô tả ngắn gọn vấn đề" required>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label">Mô tả chi tiết</label>
                        <textarea class="form-control" id="inc_desc" rows="3" placeholder="Mô tả chi tiết, các bước tái hiện lỗi..."></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Mức độ nghiêm trọng</label>
                        <select class="form-control" id="inc_sev">
                            ${Object.entries(sevLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </form>`, true, async () => {
            const body = { device_id: document.getElementById('inc_device').value, issue: document.getElementById('inc_issue').value, description: document.getElementById('inc_desc').value, severity: document.getElementById('inc_sev').value };
            if (!body.device_id || !body.issue) { Toast.error('Vui lòng điền đầy đủ thông tin'); return; }
            const res = await API.post('/incidents', body);
            if (res.ok) { Toast.success('Báo cáo sự cố thành công'); closeModal(); await load(); applyFilter(); }
            else Toast.error(res.data.message);
        }, '600px');
    };

    const openUpdate = (id) => {
        const r = records.find(x => x.id === id);
        if (!r) return;
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                    <div class="modal-title">Xử lý sự cố</div>
                    <div class="text-xs text-muted" style="margin-top:2px">${r.issue?.slice(0,50)}</div>
                </div>
            </div>`, `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
                <div>
                    <div style="font-weight:600;font-size:.85rem;color:var(--text-primary)">${r.device_name||'—'}</div>
                    <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${r.issue}</div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0">
                    <span class="dev-status-pill ${sevColor[r.severity]}">${sevLabel[r.severity]}</span>
                    <span class="dev-status-pill badge-${r.status}">${fmt.incidentStatus[r.status]}</span>
                </div>
            </div>
            <form>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            Cập nhật trạng thái
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Tình trạng</label>
                            <select class="form-control" id="upd_status">
                                ${Object.entries(fmt.incidentStatus).map(([k,v]) => `<option value="${k}" ${r.status===k?'selected':''}>${v}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Phân công
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Kỹ thuật viên</label>
                            <select class="form-control" id="upd_assign">
                                <option value="">-- Chưa phân công --</option>
                                ${users.filter(u => u.role !== 'user').map(u => `<option value="${u.id}" ${r.assigned_to==u.id?'selected':''}>${u.full_name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Kết quả xử lý
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <textarea class="form-control" id="upd_res" rows="3" placeholder="Mô tả cách đã xử lý...">${r.resolution||''}</textarea>
                    </div>
                </div>
            </form>`, true, async () => {
            const res = await API.put('/incidents/' + id, { status: document.getElementById('upd_status').value, assigned_to: document.getElementById('upd_assign').value || null, resolution: document.getElementById('upd_res').value });
            if (res.ok) { Toast.success('Cập nhật thành công'); closeModal(); await load(); applyFilter(); }
            else Toast.error(res.data.message);
        }, '720px');
    };

    const remove = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa sự cố này?')) return;
        const res = await API.delete('/incidents/' + id);
        if (res.ok) {
            Toast.success('Đã xóa sự cố');
            await load();
            applyFilter();
        } else {
            Toast.error(res.data.message || 'Không thể xóa sự cố');
        }
    };

    const openDetail = async (id) => {
        const res = await API.get('/incidents/' + id);
        if (!res.ok) { Toast.error('Không thể tải chi tiết sự cố'); return; }
        const r = res.data.data;
        const isClosed = r.status === 'resolved' || r.status === 'closed';
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <div>
                    <div class="modal-title">Chi tiết sự cố</div>
                    <div class="text-xs text-muted" style="margin-top:2px">Mã #${r.id} — ${r.issue?.slice(0,60)}</div>
                </div>
            </div>`, `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
                <div>
                    <div style="font-weight:600;font-size:.85rem;color:var(--text-primary)">${r.device_name||'—'} (${r.device_code||'—'})</div>
                    <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${r.department_name||''}${r.category_name ? ' • '+r.category_name : ''}</div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap">
                    <span class="dev-status-pill ${sevColor[r.severity]}">${sevLabel[r.severity]}</span>
                    <span class="dev-status-pill badge-${r.status}">${fmt.incidentStatus[r.status]}</span>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Vấn đề</div>
                    <div style="font-size:.85rem;color:var(--text-primary)">${r.issue||'—'}</div>
                    ${r.description ? `<div style="font-size:.78rem;color:var(--text-secondary);margin-top:8px;border-top:1px solid var(--border);padding-top:8px">${r.description}</div>` : ''}
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Thông tin chung</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.8rem">
                        <span style="color:var(--text-muted)">Người báo:</span><span style="color:var(--text-primary)">${r.reporter_name||'—'}</span>
                        <span style="color:var(--text-muted)">Thời gian:</span><span style="color:var(--text-primary)">${fmt.datetime(r.reported_at)}</span>
                        <span style="color:var(--text-muted)">Phụ trách:</span><span style="color:var(--text-primary)">${r.assignee_name||'—'}</span>
                        <span style="color:var(--text-muted)">Mức độ:</span><span style="color:var(--text-primary)">${sevLabel[r.severity]}</span>
                        <span style="color:var(--text-muted)">Trạng thái:</span><span style="color:var(--text-primary)">${fmt.incidentStatus[r.status]}</span>
                    </div>
                </div>
            </div>
            ${isClosed ? `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:14px">
                <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Kết quả xử lý</div>
                <div style="font-size:.82rem;color:var(--text-primary)">${r.resolution||'—'}</div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-top:6px">Hoàn thành: ${fmt.datetime(r.resolved_at)}</div>
            </div>` : ''}`, false, null, '640px');
    };

    const exportPdf = async (id) => {
        const token = localStorage.getItem('tvu_token');
        window.open(API.BASE_URL + `/incidents/${id}/export-pdf?inline=1&token=` + encodeURIComponent(token), '_blank');
    };

    const setStatFilter = (value) => {
        statFilter = statFilter === value ? '' : value;
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Sự cố</div>
                                <div class="dev-subtitle">Quản lý và theo dõi các sự cố thiết bị</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        <button class="dev-btn-primary" title="Báo cáo sự cố" style="background:linear-gradient(135deg,#EF4444,#DC2626);box-shadow:0 2px 8px rgba(220,38,38,.25)" onclick="IncidentsPage.openReport()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Báo cáo sự cố
                        </button>
                    </div>
                </div>
                <div class="dev-filter-bar">
                    <div class="dev-search-wrap" style="flex:1;max-width:360px">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="incSearch" placeholder="Tìm thiết bị, vấn đề...">
                    </div>
                    <div class="dev-filter-selects">
                        <select class="dev-select" id="incStatus">
                            <option value="">Tất cả tình trạng</option>
                            ${Object.entries(fmt.incidentStatus).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                        <select class="dev-select" id="incSev">
                            <option value="">Tất cả mức độ</option>
                            ${Object.entries(sevLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div id="incStats" class="dash-stats"></div>
            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Danh sách sự cố
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted)" id="incCount">Đang tải...</span>
                </div>
                <div id="incList" style="min-height:300px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;
        await load();
        renderStats();
        document.getElementById('incSearch')?.addEventListener('input', applyFilter);
        document.getElementById('incStatus')?.addEventListener('change', applyFilter);
        document.getElementById('incSev')?.addEventListener('change', applyFilter);
        applyFilter();
    };

    return { render, openReport, openUpdate, openDetail, exportPdf, remove, setStatFilter };
})();
