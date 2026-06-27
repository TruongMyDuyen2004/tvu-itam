window.DisposalsPage = (() => {
    let disposals = [], devices = [];
    let statFilter = '';

    const methodLabel = { ban_thanh_ly: 'Bán thanh lý', tieu_huy: 'Tiêu hủy', dieu_chuyen_noi_bo: 'Điều chuyển nội bộ', mat_tai_san: 'Mất tài sản', hu_hong_khong_sd_duoc: 'Hư hỏng không SD được', khac: 'Khác' };
    const statusLabel = { de_nghi: 'Đề nghị', dang_kiem_tra: 'Đang kiểm tra', cho_phe_duyet: 'Chờ phê duyệt', da_duyet: 'Đã duyệt', da_thanh_ly: 'Đã thanh lý', tu_choi: 'Từ chối' };
    const statusBadge = { de_nghi: 'badge-pending', dang_kiem_tra: 'badge-medium', cho_phe_duyet: 'badge-high', da_duyet: 'badge-active', da_thanh_ly: 'badge-active', tu_choi: 'badge-danger' };
    const statusOrder = ['de_nghi', 'dang_kiem_tra', 'cho_phe_duyet', 'da_duyet', 'da_thanh_ly', 'tu_choi'];

    const load = async () => {
        const [dspRes, devRes] = await Promise.all([API.get('/disposals'), API.get('/devices')]);
        if (dspRes.ok) disposals = dspRes.data.data || [];
        if (devRes.ok) devices = devRes.data.data || [];
    };

    const renderStats = () => {
        const st = document.getElementById('dspStats');
        if (!st) return;
        const counts = { de_nghi: 0, dang_kiem_tra: 0, cho_phe_duyet: 0, da_duyet: 0, da_thanh_ly: 0, tu_choi: 0 };
        disposals.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });
        const cards = [
            { value: disposals.length, label: 'Tổng số', filter: '', icon: 'alert', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)' },
            { value: counts.de_nghi, label: 'Đề nghị', filter: 'de_nghi', icon: 'file', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
            { value: counts.dang_kiem_tra + counts.cho_phe_duyet, label: 'Đang xử lý', filter: 'cho_phe_duyet', icon: 'clock', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
            { value: counts.da_thanh_ly, label: 'Đã thanh lý', filter: 'da_thanh_ly', icon: 'check', gradient: 'linear-gradient(135deg,#818CF8,#A5B4FC)' },
            { value: counts.tu_choi, label: 'Từ chối', filter: 'tu_choi', icon: 'x', gradient: 'linear-gradient(135deg,#FCA5A5,#F87171)' },
        ];
        st.innerHTML = cards.map((c, i) => `
            <div class="dash-stat-card card-anim-${i+1}" data-stat="${c.filter}" onclick="DisposalsPage.setStatFilter('${c.filter}')" style="cursor:pointer;--stat-gradient:${c.gradient}">
                <div class="dash-stat-icon" style="background:${c.gradient}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${c.icon === 'alert' ? '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' :
                        c.icon === 'file' ? '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' :
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
        const el = document.getElementById('disposalsList');
        if (!el) return;
        const search = document.getElementById('dspSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('dspStatus')?.value || '';
        const method = document.getElementById('dspMethod')?.value || '';
        const filtered = disposals.filter(t => {
            if (statFilter && t.status !== statFilter) return false;
            if (status && t.status !== status) return false;
            if (method && t.disposal_method !== method) return false;
            if (search && !t.device_name?.toLowerCase().includes(search) && !t.device_code?.toLowerCase().includes(search) && !t.created_by_name?.toLowerCase().includes(search) && !methodLabel[t.disposal_method]?.toLowerCase().includes(search)) return false;
            return true;
        });
        document.getElementById('dspCount').textContent = `${filtered.length} yêu cầu`;
        document.querySelectorAll('#dspStats .dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#dspStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');
        if (!filtered.length) {
            el.innerHTML = `<div class="dev-empty">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h3>Chưa có phiếu thanh lý</h3>
                <p>Tạo đề nghị mới để bắt đầu</p>
            </div>`; return;
        }
        const cu = App.getCurrentUser();
        const canUpdate = cu?.role === 'superadmin' || cu?.role === 'admin';
        el.innerHTML = `<div class="dev-table-card" style="animation:dashFadeUp .45s ease-out both;animation-delay:.25s">
            <table class="dev-table">
                <thead><tr>
                    <th style="padding-left:1.25rem">Mã phiếu</th>
                    <th>Thiết bị</th>
                    <th>Hình thức</th>
                    <th>Ngày</th>
                    <th>Giá trị CH</th>
                    <th>Trạng thái</th>
                    <th style="text-align:right;padding-right:1.25rem">Thao tác</th>
                </tr></thead>
                <tbody>${filtered.map(t => `<tr class="dev-tr">
                    <td style="padding-left:1.25rem"><span style="font-family:monospace;font-weight:600;font-size:.85rem">${t.disposal_code}</span></td>
                    <td>
                        <div class="dev-name-cell">
                            <div>
                                <div class="dev-name-text">${t.device_name}</div>
                                <div class="dev-name-sub">${t.device_code}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="chip">${methodLabel[t.disposal_method] || t.disposal_method}</span></td>
                    <td><span class="dev-td-date">${fmt.date(t.disposal_date || t.proposal_date)}</span></td>
                    <td><span style="font-size:.82rem;font-weight:600">${t.current_value ? fmt.currency(t.current_value) : '—'}</span></td>
                    <td><span class="dev-status-pill ${statusBadge[t.status]}">${statusLabel[t.status]}</span></td>
                    <td class="dev-td-actions">
                        <button class="dev-action-btn" onclick="DisposalsPage.showDetail(${t.id})" title="Chi tiết">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        ${canUpdate && t.status !== 'da_thanh_ly' && t.status !== 'tu_choi' ? `
                            <button class="dev-action-btn" style="color:var(--accent)" onclick="DisposalsPage.showUpdate(${t.id})" title="Cập nhật">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </button>
                        ` : ''}
                        <button class="dev-action-btn" onclick="DisposalsPage.exportPdf(${t.id})" title="In PDF">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                        ${t.status === 'da_thanh_ly' ? `
                            <button class="dev-action-btn" style="color:#059669" onclick="DisposalsPage.showReportModal(${t.id})" title="Báo cáo kết quả">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            </button>
                        ` : ''}
                        ${cu?.role === 'superadmin' ? `<button class="dev-action-btn dev-action-danger" onclick="DisposalsPage.remove(${t.id})" title="Xóa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>` : ''}
                        ${t.approved_by_name ? `<div class="text-xs text-muted" style="margin-top:4px">Duyệt: ${t.approved_by_name}</div>` : ''}
                    </td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    };

    const showDetail = (id) => {
        const t = disposals.find(d => d.id === id);
        if (!t) return;
        const cu = App.getCurrentUser();
        const canViewReject = cu?.role === 'superadmin' || cu?.role === 'admin';
        const sc = { de_nghi: { bg: '#FFFBEB', text: '#D97706' }, dang_kiem_tra: { bg: '#EFF6FF', text: '#2563EB' }, cho_phe_duyet: { bg: '#FEF2F2', text: '#DC2626' }, da_duyet: { bg: '#ECFDF5', text: '#059669' }, da_thanh_ly: { bg: '#ECFDF5', text: '#059669' }, tu_choi: { bg: '#FEF2F2', text: '#DC2626' } };
        const c = sc[t.status] || sc.de_nghi;
        const rejectReason = t.notes?.includes('[Lý do từ chối]') ? t.notes.split('[Lý do từ chối]: ').pop() : '';
        showModal(`
            <div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,${c.bg},white);margin:-1rem -1rem 0 -1rem;padding:1.2rem 1.5rem;border-radius:14px 14px 0 0;border-bottom:1px solid var(--border)">
                <div style="width:42px;height:42px;border-radius:12px;background:${c.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px ${c.text}15">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c.text}" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style="flex:1">
                    <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">Chi tiết thanh lý</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${t.disposal_code} — ${t.device_name}</div>
                </div>
                <span class="dev-status-pill ${statusBadge[t.status]}" style="font-size:.75rem;padding:4px 12px">${statusLabel[t.status]}</span>
            </div>`, `
            <div class="detail-grid">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#FEF2F2;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        Thiết bị & Giá trị
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Tên</div><div class="detail-value">${t.device_name}</div></div>
                        <div><div class="detail-label">Mã</div><div class="detail-value" style="font-family:monospace">${t.device_code}</div></div>
                        <div><div class="detail-label">Tình trạng</div><div class="detail-value">${t.asset_condition || '—'}</div></div>
                        <div><div class="detail-label">Giá trị còn lại</div><div class="detail-value" style="font-weight:700;color:var(--accent)">${t.current_value ? fmt.currency(t.current_value) : '—'}</div></div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#ECFDF5;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Quyết định
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Số quyết định</div><div class="detail-value" style="font-family:monospace">${t.decision_number || '—'}</div></div>
                        <div><div class="detail-label">Ngày QĐ</div><div class="detail-value">${t.decision_date ? fmt.date(t.decision_date) : '—'}</div></div>
                        <div><div class="detail-label">Người duyệt</div><div class="detail-value">${t.approved_by_name || '—'}</div></div>
                        <div><div class="detail-label">Đơn vị tiếp nhận</div><div class="detail-value">${t.handover_unit || '—'}</div></div>
                    </div>
                </div>
            </div>
            <div class="detail-grid" style="margin-top:12px">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#EFF6FF;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                        Thông tin thanh lý
                    </div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Hình thức</div><div class="detail-value"><span class="chip">${methodLabel[t.disposal_method] || t.disposal_method}</span>${t.disposal_method === 'khac' && t.notes?.includes('[Hình thức khác]') ? `<div style="font-size:.78rem;color:var(--text-muted);margin-top:4px">${t.notes.match(/\[Hình thức khác\]:\s*(.*)/)?.[1] || ''}</div>` : ''}</div></div>
                        <div><div class="detail-label">Giá thu hồi</div><div class="detail-value" style="font-weight:700;color:#059669">${t.recovery_value ? fmt.currency(t.recovery_value) : '—'}</div></div>
                        <div><div class="detail-label">Ngày đề nghị</div><div class="detail-value">${fmt.date(t.proposal_date)}</div></div>
                        <div><div class="detail-label">Ngày thực hiện</div><div class="detail-value">${t.disposal_date ? fmt.date(t.disposal_date) : '—'}</div></div>
                        <div><div class="detail-label">Hội đồng</div><div class="detail-value">${t.council || '—'}</div></div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title" style="border-bottom-color:#FFFBEB;display:flex;align-items:center;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Lý do & Ghi chú
                    </div>
                    <div style="margin-top:8px">
                        <div style="font-size:.88rem;line-height:1.6;color:var(--text-primary);background:#F9FAFB;padding:12px;border-radius:8px;border:1px solid var(--border)">${t.reason || '—'}</div>
                        ${t.notes ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div style="font-size:.72rem;font-weight:600;color:var(--text-muted);margin-bottom:4px">Ghi chú</div><div style="font-size:.82rem;line-height:1.5;color:var(--text-primary)">${t.notes}</div></div>` : ''}
                    </div>
                </div>
            </div>
            ${t.status === 'da_thanh_ly' && (t.report_number || t.report_date || t.report_notes) ? `
            <div style="margin-top:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                <div class="detail-section-title" style="border-bottom-color:#ECFDF5;display:flex;align-items:center;gap:8px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Báo cáo kết quả thanh lý
                </div>
                <div class="detail-grid" style="margin-top:8px">
                    <div><div class="detail-label">Số báo cáo</div><div class="detail-value" style="font-family:monospace">${t.report_number || '—'}</div></div>
                    <div><div class="detail-label">Ngày báo cáo</div><div class="detail-value">${t.report_date ? fmt.date(t.report_date) : '—'}</div></div>
                </div>
                ${t.report_notes ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div class="detail-label">Kết quả</div><div style="font-size:.88rem;line-height:1.6;color:var(--text-primary);background:#F9FAFB;padding:12px;border-radius:8px;border:1px solid var(--border);margin-top:4px">${t.report_notes}</div></div>` : ''}
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                    <button class="dev-btn-primary" style="background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 2px 8px rgba(5,150,105,.25);border:none;border-radius:8px;padding:8px 16px;color:#fff;font-weight:600;cursor:pointer;font-size:.82rem" onclick="DisposalsPage.exportResultPdf(${t.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        Xuất PDF
                    </button>
                </div>
            </div>` : ''}
            ${t.status === 'tu_choi' && rejectReason && canViewReject ? `
            <div style="margin-top:12px;background:linear-gradient(135deg,#FEF2F2,#FFF5F5);border:1px solid #FECACA;border-radius:12px;padding:1rem;display:flex;align-items:flex-start;gap:12px">
                <div style="width:28px;height:28px;border-radius:8px;background:#DC2626;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
                <div><div style="font-size:.82rem;font-weight:700;color:#991B1B">Lý do từ chối</div><div style="font-size:.82rem;color:#B91C1C;margin-top:4px">${rejectReason}</div></div>
            </div>` : ''}
        `, false, null, '820px');
    };

    const showUpdate = (id) => {
        const t = disposals.find(d => d.id === id);
        if (!t) return;
        const cu = App.getCurrentUser();
        const currentIdx = statusOrder.indexOf(t.status);
        const nextStatuses = statusOrder.filter((s, i) => i > currentIdx && s !== 'tu_choi' && s !== 'da_thanh_ly');
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                    <div class="modal-title">Cập nhật thanh lý</div>
                    <div class="text-xs text-muted" style="margin-top:2px">${t.disposal_code} — ${t.device_name}</div>
                </div>
            </div>`, `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
                <div><div style="font-weight:600;font-size:.85rem;color:var(--text-primary)">${t.disposal_code}</div><div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${t.device_name} (${t.device_code})</div></div>
                <span class="dev-status-pill ${statusBadge[t.status]}">${statusLabel[t.status]}</span>
            </div>
            <form>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:14px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Chuyển trạng thái
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Trạng thái tiếp theo</label>
                        <select class="form-control" id="upd_status">
                            ${nextStatuses.map(s => `<option value="${s}">${statusLabel[s]}</option>`).join('')}
                            <option value="tu_choi">Từ chối</option>
                        </select>
                    </div>
                </div>
                <div style="display:none" id="updRejectSection">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:14px">
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label" style="color:#DC2626">Lý do từ chối *</label>
                            <textarea class="form-control" id="upd_reject_reason" rows="3" placeholder="Nhập lý do từ chối..."></textarea>
                        </div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:14px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Thông tin bổ sung</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="form-group"><label class="form-label">Ngày kiểm kê</label><input type="date" class="form-control" id="upd_inspection_date" value="${t.inspection_date || ''}"></div>
                        <div class="form-group"><label class="form-label">Ngày quyết định</label><input type="date" class="form-control" id="upd_decision_date" value="${t.decision_date || ''}"></div>
                        <div class="form-group"><label class="form-label">Số quyết định</label><input class="form-control" id="upd_decision_number" value="${t.decision_number || ''}" placeholder="Tự sinh nếu để trống"></div>
                        <div class="form-group"><label class="form-label">Ngày thanh lý</label><input type="date" class="form-control" id="upd_disposal_date" value="${t.disposal_date || ''}"></div>
                        <div class="form-group"><label class="form-label">Tình trạng TS</label><input class="form-control" id="upd_asset_condition" value="${t.asset_condition || ''}" placeholder="VD: Hư hỏng nặng, hết khấu hao..."></div>
                        <div class="form-group"><label class="form-label">Giá trị còn lại</label><input type="number" class="form-control" id="upd_current_value" value="${t.current_value || ''}" placeholder="0"></div>
                        <div class="form-group"><label class="form-label">Giá trị thu hồi</label><input type="number" class="form-control" id="upd_recovery_value" value="${t.recovery_value || ''}" placeholder="0"></div>
                        <div class="form-group"><label class="form-label">Hình thức</label><select class="form-control" id="upd_method" onchange="DisposalsPage.toggleOtherMethod(this)">${Object.entries(methodLabel).map(([k,v]) => `<option value="${k}" ${t.disposal_method===k?'selected':''}>${v}</option>`).join('')}</select></div>
                        <div id="upd_other_method_wrap" style="display:${t.disposal_method === 'khac' ? 'block' : 'none'};margin-bottom:10px">
                            <label class="form-label">Mô tả hình thức khác</label>
                            <input class="form-control" id="upd_other_method" value="${(t.notes || '').includes('[Hình thức khác]') ? t.notes.replace(/.*\[Hình thức khác\]: /, '') : ''}">
                        </div>
                        <div class="form-group"><label class="form-label">Hội đồng</label><input class="form-control" id="upd_council" value="${t.council || ''}" placeholder="VD: Ông A, Bà B..."></div>
                        <div class="form-group"><label class="form-label">Đơn vị tiếp nhận</label><input class="form-control" id="upd_handover" value="${t.handover_unit || ''}"></div>
                    </div>
                    <div class="form-group" style="margin-top:12px;margin-bottom:0">
                        <label class="form-label">Ghi chú</label>
                        <textarea class="form-control" id="upd_notes" rows="2">${t.notes ? t.notes.replace(/\[Lý do từ chối\]: .*$/, '').trim() : ''}</textarea>
                    </div>
                </div>
            </form>`, true, async () => {
            const status = document.getElementById('upd_status').value;
            const body = { status,
                inspection_date: document.getElementById('upd_inspection_date').value || null,
                decision_number: document.getElementById('upd_decision_number').value || null,
                decision_date: document.getElementById('upd_decision_date').value || null,
                disposal_date: document.getElementById('upd_disposal_date').value || null,
                asset_condition: document.getElementById('upd_asset_condition').value || null,
                current_value: document.getElementById('upd_current_value').value || null,
                recovery_value: document.getElementById('upd_recovery_value').value || null,
                disposal_method: document.getElementById('upd_method').value,
                council: document.getElementById('upd_council').value || null,
                handover_unit: document.getElementById('upd_handover').value || null,
                notes: (document.getElementById('upd_notes').value || '') + (body.disposal_method === 'khac' ? `[Hình thức khác]: ${document.getElementById('upd_other_method')?.value || ''}` : ''),
            };
            if (status === 'tu_choi') {
                body.rejection_reason = document.getElementById('upd_reject_reason').value;
                if (!body.rejection_reason) { Toast.error('Vui lòng nhập lý do từ chối'); return; }
            }
            const res = await API.put('/disposals/' + id, body);
            if (res.ok) { Toast.success(res.data.message); closeModal(); await load(); renderTable(); }
            else Toast.error(res.data.message);
        }, '780px');
        // Show reject reason field when tu_choi selected
        setTimeout(() => {
            document.getElementById('upd_status')?.addEventListener('change', function() {
                document.getElementById('updRejectSection').style.display = this.value === 'tu_choi' ? 'block' : 'none';
            });
            // Trigger toggleOtherMethod for update modal
            const m = document.getElementById('upd_method');
            if (m) DisposalsPage.toggleOtherMethod(m);
        }, 100);
    };

    const openModal = () => {
        const availDevices = devices.filter(d => d.status !== 'disposed');
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#EF4444,#DC2626);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(220,38,38,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                    <div class="modal-title">Lập đề nghị thanh lý</div>
                    <div class="text-xs text-muted" style="margin-top:2px">Theo NĐ 151/2017/NĐ-CP về thanh lý tài sản công</div>
                </div>
            </div>`, `
            <form id="dspForm">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                            Thiết bị
                        </div>
                        <div style="position:relative" class="form-group" style="margin-bottom:0">
                            <label class="form-label">Tìm thiết bị *</label>
                            <input type="text" class="form-control" id="dsp_device_search" placeholder="Gõ mã hoặc tên thiết bị..." autocomplete="off" value="">
                            <input type="hidden" id="dsp_device" value="">
                            <div id="dspDeviceDropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;max-height:220px;overflow-y:auto;z-index:100;box-shadow:0 4px 20px rgba(0,0,0,.12)"></div>
                            <div id="dspDeviceInfo" style="display:none;margin-top:10px;padding:10px;background:#F9FAFB;border:1px solid var(--border-light);border-radius:8px;font-size:.8rem"></div>
                        </div>
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                            Thời gian
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Ngày đề nghị *</label>
                            <input type="date" class="form-control" id="dsp_proposal_date" value="${new Date().toISOString().slice(0,10)}" required>
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Ngày thanh lý</label>
                            <input type="date" class="form-control" id="dsp_disposal_date">
                        </div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                            Hình thức & Giá trị
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Hình thức *</label>
                            <select class="form-control" id="dsp_method" onchange="DisposalsPage.toggleOtherMethod(this)">
                                ${Object.entries(methodLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                            </select>
                        </div>
                        <div id="dsp_other_method_wrap" style="display:none;margin-bottom:10px">
                            <label class="form-label">Mô tả hình thức khác *</label>
                            <input class="form-control" id="dsp_other_method" placeholder="VD: Biếu tặng, trả lại nhà cung cấp...">
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Giá trị còn lại</label>
                            <input type="number" class="form-control" id="dsp_current_value" placeholder="Nhập giá trị còn lại" min="0">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Giá trị thu hồi</label>
                            <input type="number" class="form-control" id="dsp_recovery_value" placeholder="0" min="0">
                        </div>
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                            Hội đồng & Đơn vị
                        </div>
                        <div class="form-group" style="margin-bottom:10px">
                            <label class="form-label">Hội đồng thanh lý</label>
                            <input class="form-control" id="dsp_council" placeholder="VD: Ông A, Bà B...">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Đơn vị tiếp nhận</label>
                            <input class="form-control" id="dsp_handover" placeholder="Nếu có">
                        </div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px">
                    <div style="font-size:.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Lý do & Tình trạng
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Tình trạng tài sản</label>
                            <input class="form-control" id="dsp_condition" placeholder="VD: Hư hỏng nặng, hết khấu hao...">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label class="form-label">Lý do *</label>
                            <textarea class="form-control" id="dsp_reason" rows="3" placeholder="Lý do thanh lý..." required></textarea>
                        </div>
                    </div>
                </div>
            </form>`, true, save, '700px');
        // Setup autocomplete
        setTimeout(() => {
            const input = document.getElementById('dsp_device_search');
            const hidden = document.getElementById('dsp_device');
            const dropdown = document.getElementById('dspDeviceDropdown');
            const info = document.getElementById('dspDeviceInfo');
            if (!input) return;
            const showDropdown = (filter) => {
                const q = filter.toLowerCase();
                const filtered = availDevices.filter(d => d.device_code?.toLowerCase().includes(q) || d.name?.toLowerCase().includes(q));
                if (!filtered.length || !q) { dropdown.style.display = 'none'; return; }
                dropdown.innerHTML = filtered.map(d => `<div data-id="${d.id}" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:10px;transition:background .15s"
                    onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
                    <div style="flex:1"><div style="font-weight:600;font-size:.85rem">${d.device_code}</div><div style="font-size:.78rem;color:var(--text-muted)">${d.name}</div></div>
                    <span style="font-size:.7rem;padding:2px 8px;border-radius:4px;background:#F3F4F6;color:var(--text-muted)">${fmt.statusLabel[d.status] || d.status}</span>
                </div>`).join('');
                dropdown.style.display = 'block';
                dropdown.querySelectorAll('[data-id]').forEach(el => {
                    el.addEventListener('click', () => {
                        const id = parseInt(el.dataset.id);
                        const dev = availDevices.find(d => d.id === id);
                        if (!dev) return;
                        hidden.value = id;
                        input.value = `${dev.device_code} - ${dev.name}`;
                        dropdown.style.display = 'none';
                        showDevicePrice(dev);
                    });
                });
            };
            input.addEventListener('input', () => { hidden.value = ''; info.style.display = 'none'; showDropdown(input.value); });
            input.addEventListener('focus', () => { if (input.value) showDropdown(input.value); });
            document.addEventListener('click', (e) => { if (!e.target.closest('#dsp_device_search') && !e.target.closest('#dspDeviceDropdown')) dropdown.style.display = 'none'; });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') dropdown.style.display = 'none';
                if (e.key === 'Enter') { e.preventDefault(); const first = dropdown.querySelector('[data-id]'); if (first) first.click(); }
            });
        }, 150);
    };

    const calcDepreciation = (price, date, rateOrLife) => {
        if (!price || !date) return { currentValue: 0, years: 0 };
        const pd = new Date(date);
        const now = new Date();
        const years = Math.max(0, Math.floor((now - pd) / (365.25 * 24 * 60 * 60 * 1000)));
        let rate;
        if (rateOrLife != null && rateOrLife <= 100) rate = rateOrLife / 100;
        else if (rateOrLife != null && rateOrLife > 100) rate = 1 / rateOrLife;
        else rate = 0.20;
        const annualDep = price * rate;
        return { currentValue: Math.max(0, Math.round(price - Math.min(annualDep * years, price))), years };
    };

    const toggleOtherMethod = (select) => {
        const wrap = document.getElementById(select.id === 'upd_method' ? 'upd_other_method_wrap' : 'dsp_other_method_wrap');
        if (wrap) wrap.style.display = select.value === 'khac' ? 'block' : 'none';
    };

    const save = async () => {
        const method = document.getElementById('dsp_method').value;
        const otherDesc = document.getElementById('dsp_other_method')?.value?.trim();
        if (method === 'khac' && !otherDesc) { Toast.error('Vui lòng mô tả hình thức thanh lý khác'); return; }
        const body = {
            device_id: document.getElementById('dsp_device').value,
            proposal_date: document.getElementById('dsp_proposal_date').value,
            disposal_date: document.getElementById('dsp_disposal_date').value || null,
            disposal_method: method,
            reason: document.getElementById('dsp_reason').value,
            asset_condition: document.getElementById('dsp_condition').value || null,
            current_value: document.getElementById('dsp_current_value').value || null,
            recovery_value: document.getElementById('dsp_recovery_value').value || null,
            council: document.getElementById('dsp_council').value || null,
            handover_unit: document.getElementById('dsp_handover').value || null,
            notes: method === 'khac' ? `[Hình thức khác]: ${otherDesc}` : (document.getElementById('dsp_notes')?.value || null)
        };
        if (!body.device_id || !body.reason) { Toast.error('Vui lòng điền đầy đủ thông tin bắt buộc'); return; }
        const res = await API.post('/disposals', body);
        if (res.ok) { Toast.success('Tạo đề nghị thanh lý thành công'); closeModal(); await load(); renderTable(); }
        else Toast.error(res.data.message || 'Có lỗi xảy ra');
    };

    const remove = async (id) => {
        if (!confirm('Xóa phiếu thanh lý này?')) return;
        const res = await API.delete('/disposals/' + id);
        if (res.ok) { Toast.success('Đã xóa'); await load(); renderTable(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    const setStatFilter = (value) => { statFilter = statFilter === value ? '' : value; renderTable(); };

    const render = async () => {
        const cu = App.getCurrentUser();
        const canCreate = cu?.role === 'superadmin' || cu?.role === 'admin';
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
                                <div class="dev-title">Thanh lý</div>
                                <div class="dev-subtitle">Quản lý thanh lý tài sản công theo NĐ 151/2017/NĐ-CP</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${canCreate ? `<button class="dev-btn-primary" style="background:linear-gradient(135deg,#EF4444,#DC2626);box-shadow:0 2px 8px rgba(220,38,38,.25)" onclick="DisposalsPage.openModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Lập đề nghị
                        </button>` : ''}
                    </div>
                </div>
                <div class="dev-filter-bar">
                    <div class="dev-search-wrap" style="flex:1;max-width:360px">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="dspSearch" placeholder="Tìm thiết bị, mã phiếu...">
                    </div>
                    <div class="dev-filter-selects">
                        <select class="dev-select" id="dspStatus">
                            <option value="">Tất cả trạng thái</option>
                            ${Object.entries(statusLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                        <select class="dev-select" id="dspMethod">
                            <option value="">Tất cả hình thức</option>
                            ${Object.entries(methodLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div id="dspStats" class="dash-stats"></div>
            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Danh sách thanh lý
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted)" id="dspCount">Đang tải...</span>
                </div>
                <div id="disposalsList" style="min-height:300px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;
        await load();
        renderStats();
        document.getElementById('dspSearch')?.addEventListener('input', renderTable);
        document.getElementById('dspStatus')?.addEventListener('change', renderTable);
        document.getElementById('dspMethod')?.addEventListener('change', renderTable);
        renderTable();
    };

    const exportPdf = async (id) => {
        const token = API.getToken();
        window.open(API.BASE_URL + `/disposals/${id}/export-pdf?inline=1&token=` + encodeURIComponent(token), '_blank');
    };

    const exportResultPdf = async (id) => {
        const token = API.getToken();
        window.open(API.BASE_URL + `/disposals/${id}/export-result-pdf?inline=1&token=` + encodeURIComponent(token), '_blank');
    };

    const showReportModal = (id) => {
        const t = disposals.find(d => d.id === id);
        if (!t) return;
        const hasReport = t.report_number || t.report_date || t.report_notes;
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#059669,#10B981);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(5,150,105,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div>
                    <div class="modal-title">Báo cáo kết quả thanh lý</div>
                    <div class="text-xs text-muted" style="margin-top:2px">${t.disposal_code} — ${t.device_name}</div>
                </div>
            </div>`, `
            <form>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:14px">
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label">Số báo cáo</label>
                        <input class="form-control" id="rpt_number" value="${t.report_number || ''}" placeholder="VD: BC-TL-${String(t.id).padStart(4, '0')}-${new Date().getFullYear()}">
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label">Ngày báo cáo</label>
                        <input type="date" class="form-control" id="rpt_date" value="${t.report_date ? t.report_date.slice(0,10) : new Date().toISOString().slice(0,10)}">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Ghi chú / Kết quả</label>
                        <textarea class="form-control" id="rpt_notes" rows="3" placeholder="Kết quả thanh lý, giá trị thu hồi, phương thức xử lý...">${t.report_notes || ''}</textarea>
                    </div>
                </div>
                ${hasReport ? `
                <div style="display:flex;gap:10px;margin-top:8px">
                    <button type="button" class="dev-btn-primary" style="flex:1;background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 2px 8px rgba(5,150,105,.25);border:none;border-radius:8px;padding:10px 20px;color:#fff;font-weight:600;cursor:pointer" onclick="DisposalsPage.exportResultPdf(${t.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        Xuất PDF báo cáo
                    </button>
                </div>` : ''}
            </form>`, true, async () => {
            const body = {
                report_number: document.getElementById('rpt_number').value || null,
                report_date: document.getElementById('rpt_date').value || null,
                report_notes: document.getElementById('rpt_notes').value || null,
            };
            const res = await API.put('/disposals/' + id + '/report', body);
            if (res.ok) { Toast.success(res.data.message); closeModal(); await load(); renderTable(); }
            else Toast.error(res.data.message);
        }, '520px');
    };

    const showDevicePrice = (dev) => {
        const info = document.getElementById('dspDeviceInfo');
        const cvInput = document.getElementById('dsp_current_value');
        const rvInput = document.getElementById('dsp_recovery_value');
        if (!dev || !dev.id) { info.style.display = 'none'; return; }
        const price = parseFloat(dev.purchase_price) || 0;
        const date = dev.purchase_date || '';
        const life = dev.useful_life_years ? parseInt(dev.useful_life_years) : null;
        const dep = calcDepreciation(price, date, life || 20);
        info.style.display = 'block';
        info.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-muted)">Nguyên giá:</span><span style="font-weight:700;color:var(--accent)">${fmt.currency(price)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-muted)">Giá trị còn lại (${dep.years} năm):</span><span style="font-weight:700;color:var(--accent-warn)">${fmt.currency(dep.currentValue)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-muted)">Ngày mua:</span><span style="font-weight:600">${fmt.date(date)}</span></div>
            <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px dashed var(--border-light);margin-top:6px"><span style="font-size:.72rem;color:var(--text-muted)">Bạn có thể nhập tay giá trị bên dưới</span></div>
        `;
        if (cvInput && !cvInput.value) cvInput.placeholder = `Gợi ý: ${fmt.currency(dep.currentValue)}`;
        if (rvInput && !rvInput.value) rvInput.placeholder = `Gợi ý: ${fmt.currency(Math.round(dep.currentValue * 0.1))}`;
    };

    return { render, openModal, showUpdate, showDetail, exportPdf, exportResultPdf, showReportModal, remove, setStatFilter, toggleOtherMethod };
})();
