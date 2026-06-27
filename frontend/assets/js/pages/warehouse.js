window.WarehousePage = (() => {
    let warehouses = [], receipts = [], issues = [], stock = [], departments = [];
    let subPage = 'stock';
    let searchQuery = '';
    let filteredStock = [], filteredReceipts = [], filteredIssues = [], filteredWarehouses = [];
    let dataReady = false;

    const doSearch = (q) => {
        const caretPos = q.length;
        searchQuery = q.toLowerCase().trim();
        renderTable(true);
        const input = document.querySelector('#warehouseContent input[oninput*="doSearch"]');
        if (input) { input.focus(); input.setSelectionRange(caretPos, caretPos); }
    };

    const filterData = () => {
        if (!searchQuery) {
            filteredStock = stock;
            filteredReceipts = receipts;
            filteredIssues = issues;
            filteredWarehouses = warehouses;
            return;
        }
        filteredStock = stock.map(g => ({
            ...g,
            devices: g.devices.filter(d =>
                (d.device_name || '').toLowerCase().includes(searchQuery) ||
                (d.device_code || '').toLowerCase().includes(searchQuery)
            )
        })).filter(g => g.devices.length);
        filteredReceipts = receipts.filter(r =>
            (r.receipt_code || '').toLowerCase().includes(searchQuery) ||
            (r.warehouse_name || '').toLowerCase().includes(searchQuery) ||
            (r.supplier_name || '').toLowerCase().includes(searchQuery)
        );
        filteredIssues = issues.filter(i =>
            (i.issue_code || '').toLowerCase().includes(searchQuery) ||
            (i.warehouse_name || '').toLowerCase().includes(searchQuery) ||
            (i.department_name || '').toLowerCase().includes(searchQuery) ||
            (i.recipient_name || '').toLowerCase().includes(searchQuery)
        );
        filteredWarehouses = warehouses.filter(w =>
            (w.name || '').toLowerCase().includes(searchQuery) ||
            (w.warehouse_code || '').toLowerCase().includes(searchQuery) ||
            (w.manager_name || '').toLowerCase().includes(searchQuery)
        );
    };

    const renderTable = (skipLoad) => {
        if (subPage === 'stock') renderStock(skipLoad);
        else if (subPage === 'receipts') renderReceipts(skipLoad);
        else if (subPage === 'issues') renderIssues(skipLoad);
        else if (subPage === 'warehouses') renderWarehouses(skipLoad);
    };

    const loadAll = async () => {
        const [whRes, depRes] = await Promise.all([API.get('/warehouses'), API.get('/departments')]);
        if (whRes.ok) warehouses = whRes.data.data || [];
        if (depRes.ok) departments = depRes.data.data || [];
    };

    const loadStock = async () => {
        const res = await API.get('/warehouses/stock');
        if (res.ok) stock = res.data.data || [];
    };

    const loadReceipts = async () => {
        const res = await API.get('/warehouses/receipts');
        if (res.ok) receipts = res.data.data || [];
    };

    const loadIssues = async () => {
        const res = await API.get('/warehouses/issues');
        if (res.ok) issues = res.data.data || [];
    };

    const setSubPage = (page) => {
        subPage = page;
        dataReady = false;
        renderContent();
    };

    const grd = (from, to) => `linear-gradient(135deg,${from},${to})`;

    const renderTabs = () => {
        const active = subPage;
        const tabs = [
            { id: 'stock', label: 'Tồn kho', icon: '<path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16"/><path d="M8 12h8"/>' },
            { id: 'receipts', label: 'Nhập kho', icon: '<path d="M12 5v14M5 12h14"/>' },
            { id: 'issues', label: 'Xuất kho', icon: '<path d="M5 12h14M12 5l7 7-7 7"/>' },
            { id: 'warehouses', label: 'Quản lý kho', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
        ];
        return `<div class="dev-tabs" style="margin-bottom:1.25rem">${tabs.map(t => `
            <div class="dev-tab ${active === t.id ? 'active' : ''}" onclick="WarehousePage.setSubPage('${t.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
                ${t.label}
            </div>`).join('')}</div>`;
    };

    const renderContent = () => {
        const el = document.getElementById('warehouseContent');
        if (!el) return;
        if (subPage === 'stock') renderStock();
        else if (subPage === 'receipts') renderReceipts();
        else if (subPage === 'issues') renderIssues();
        else if (subPage === 'warehouses') renderWarehouses();
    };

    const renderStock = async (skipLoad) => {
        const el = document.getElementById('warehouseContent');
        if (!el) return;
        if (subPage !== 'stock') return;
        if (skipLoad && !dataReady) return;
        if (!skipLoad) { await loadStock(); if (subPage !== 'stock') return; dataReady = true; }
        filterData();
        const total = filteredStock.reduce((s, g) => s + g.devices.length, 0);
        el.innerHTML = `
            <div class="dash-stats" style="margin-bottom:12px">
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#4338CA','#4F46E5')};background:${grd('#EEF2FF','#E0E7FF')};border-color:#C7D2FE">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#4338CA','#4F46E5')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16"/><path d="M8 12h8"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${total}</div><div class="dash-stat-label">TB trong kho</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#4F46E5','#6366F1')};background:${grd('#EEF2FF','#E0E7FF')};border-color:#C7D2FE">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#4F46E5','#6366F1')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${filteredStock.length}</div><div class="dash-stat-label">Số kho</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div style="margin-left:auto;display:flex;align-items:center;gap:6px">
                    <button class="dev-btn-secondary" style="padding:.35rem .6rem;font-size:.72rem;border-radius:6px" onclick="window.open(API.BASE_URL + '/warehouses/stock/export-pdf?inline=1&_=' + Date.now() + '&token=' + encodeURIComponent(API.getToken()), '_blank')" title="Xuất PDF tồn kho">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        In PDF
                    </button>
                    <div style="position:relative">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input class="form-control" placeholder="Tìm kiếm..." value="${searchQuery}" oninput="WarehousePage.doSearch(this.value)" style="padding:.45rem .9rem .45rem 36px;font-size:.95rem;width:420px;border-radius:8px;border:1px solid var(--border)">
                    </div>
                </div>
            </div>
            <div class="dev-table-card" style="border-radius:12px">
                ${renderStockTable()}
            </div>`;
    };

    const renderStockTable = () => {
        const rows = filteredStock;
        if (!rows.length) return `<div class="dev-empty" style="padding:32px 16px">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16"/><path d="M8 12h8"/></svg>
            <h3 style="font-size:.95rem;margin:8px 0 4px">${searchQuery ? 'Không tìm thấy' : 'Kho trống'}</h3>
            <p style="font-size:.8rem;color:var(--text-muted)">${searchQuery ? 'Không có thiết bị phù hợp với từ khóa tìm kiếm' : 'Chưa có thiết bị nào trong kho'}</p>
        </div>`;
        return rows.map(g => `
            <div style="padding:.45rem 1rem;border-bottom:1px solid var(--border);background:#F8FAFC;display:flex;align-items:center;gap:6px;font-size:.8rem;font-weight:600;color:var(--text-primary)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                ${g.warehouse_name} <span style="font-weight:400;color:var(--text-muted);font-size:.7rem">(${g.devices.length} TB)</span>
            </div>
            <table class="dev-table" style="font-size:.78rem">
                <thead><tr>
                    <th style="padding:.35rem .5rem .35rem 1rem">Mã TB</th>
                    <th style="padding:.35rem .5rem">Tên thiết bị</th>
                    <th style="padding:.35rem 1rem .35rem .5rem;width:120px">Ngày nhập</th>
                </tr></thead>
                <tbody>${g.devices.map(d => `<tr class="dev-tr">
                    <td style="padding:.3rem .5rem .3rem 1rem"><span class="dev-code" style="font-size:.72rem;padding:.1rem .4rem">${d.device_code || '—'}</span></td>
                    <td style="padding:.3rem .5rem"><div><div class="dev-name-text" style="font-size:.78rem">${d.device_name || '—'}</div><div class="dev-name-sub" style="font-size:.65rem">${d.device_code || ''}</div></div></td>
                    <td style="padding:.3rem 1rem .3rem .5rem"><span style="font-size:.72rem;color:var(--text-muted)">${fmt.date(d.device_created)}</span></td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>`).join('');
    };

    const renderReceipts = async (skipLoad) => {
        const el = document.getElementById('warehouseContent');
        if (!el) return; if (subPage !== 'receipts') return;
        const cu = App.getCurrentUser();
        const canCreate = cu?.role === 'superadmin' || cu?.role === 'admin';
        if (skipLoad && !dataReady) return;
        if (!skipLoad) { await loadReceipts(); if (subPage !== 'receipts') return; dataReady = true; }
        filterData();
        const totalDevices = receipts.reduce((s, r) => s + (r.device_count || 0), 0);
        el.innerHTML = `
            <div class="dash-stats" style="margin-bottom:12px">
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#4338CA','#4F46E5')};background:${grd('#EEF2FF','#E0E7FF')};border-color:#C7D2FE">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#4338CA','#4F46E5')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${receipts.length}</div><div class="dash-stat-label">Phiếu nhập</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#4F46E5','#6366F1')};background:${grd('#EEF2FF','#E0E7FF')};border-color:#C7D2FE">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#4F46E5','#6366F1')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16"/><path d="M8 12h8"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${totalDevices}</div><div class="dash-stat-label">TB đã nhập</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                    ${canCreate ? `<button class="dev-btn-primary" style="padding:.32rem .7rem;font-size:.75rem;background:${grd('#2563EB','#3B82F6')};box-shadow:0 2px 8px rgba(37,99,235,.2);border:none;border-radius:6px;color:#fff;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px" onclick="WarehousePage.showCreateReceipt()">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Tạo phiếu
                    </button>` : ''}
                    <div style="position:relative">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input class="form-control" placeholder="Tìm kiếm..." value="${searchQuery}" oninput="WarehousePage.doSearch(this.value)" style="padding:.45rem .9rem .45rem 36px;font-size:.95rem;width:420px;border-radius:8px;border:1px solid var(--border)">
                    </div>
                </div>
            </div>
            <div class="dev-table-card" style="border-radius:12px">
                ${filteredReceipts.length ? `<table class="dev-table" style="font-size:.78rem">
                    <thead><tr>
                        <th style="padding:.35rem .5rem .35rem 1rem">Mã phiếu</th>
                        <th style="padding:.35rem .5rem">Ngày nhập</th>
                        <th style="padding:.35rem .5rem">Kho</th>
                        <th style="padding:.35rem .5rem">Nhà cung cấp</th>
                        <th style="padding:.35rem .5rem;text-align:center">Số TB</th>
                        <th style="padding:.35rem .5rem">Người tạo</th>
                        <th style="padding:.35rem 1rem .35rem .5rem;text-align:right">Thao tác</th>
                    </tr></thead>
                    <tbody>${filteredReceipts.map(r => `<tr class="dev-tr">
                        <td style="padding:.3rem .5rem .3rem 1rem"><span class="dev-code" style="font-size:.72rem;padding:.1rem .4rem">${r.receipt_code}</span></td>
                        <td style="padding:.3rem .5rem"><span style="font-size:.72rem;color:var(--text-muted)">${fmt.date(r.receipt_date)}</span></td>
                        <td style="padding:.3rem .5rem;font-size:.76rem">${r.warehouse_name || '—'}</td>
                        <td style="padding:.3rem .5rem;font-size:.76rem;color:var(--text-secondary)">${r.supplier_name || '—'}</td>
                        <td style="padding:.3rem .5rem;text-align:center"><span class="dev-status-pill badge-active" style="font-size:.68rem;padding:.05rem .45rem">${r.device_count || 0}</span></td>
                        <td style="padding:.3rem .5rem;font-size:.76rem;color:var(--text-secondary)">${r.created_by_name || '—'}</td>
                        <td style="padding:.3rem 1rem .3rem .5rem;text-align:right">
                            <button class="dev-action-btn" style="width:26px;height:26px" onclick="WarehousePage.showReceiptDetail(${r.id})" title="Chi tiết">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            ${canCreate ? `<button class="dev-action-btn dev-action-danger" style="width:26px;height:26px" onclick="WarehousePage.removeReceipt(${r.id})" title="Xóa">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>` : ''}
                        </td>
                    </tr>`).join('')}</tbody>
                </table>` : `<div class="dev-empty" style="padding:32px 16px">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    <h3 style="font-size:.95rem;margin:8px 0 4px">${searchQuery ? 'Không tìm thấy' : 'Chưa có phiếu nhập kho'}</h3>
                    <p style="font-size:.8rem;color:var(--text-muted)">${searchQuery ? 'Không có phiếu nhập phù hợp với từ khóa tìm kiếm' : 'Tạo phiếu nhập mới để bắt đầu'}</p>
                </div>`}
            </div>`;
    };

    const renderIssues = async (skipLoad) => {
        const el = document.getElementById('warehouseContent');
        if (!el) return; if (subPage !== 'issues') return;
        const cu = App.getCurrentUser();
        const canCreate = cu?.role === 'superadmin' || cu?.role === 'admin';
        if (skipLoad && !dataReady) return;
        if (!skipLoad) { await loadIssues(); if (subPage !== 'issues') return; dataReady = true; }
        filterData();
        const totalDevices = issues.reduce((s, i) => s + (i.device_count || 0), 0);
        el.innerHTML = `
            <div class="dash-stats" style="margin-bottom:12px">
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#DC2626','#EF4444')};background:${grd('#FEF2F2','#FEE2E2')};border-color:#FECACA">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#DC2626','#EF4444')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${issues.length}</div><div class="dash-stat-label">Phiếu xuất</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#F87171','#FCA5A5')};background:${grd('#FEF2F2','#FEE2E2')};border-color:#FECACA">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#DC2626','#EF4444')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16"/><path d="M8 12h8"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${totalDevices}</div><div class="dash-stat-label">TB đã xuất</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                    ${canCreate ? `<button class="dev-btn-primary" style="padding:.32rem .7rem;font-size:.75rem;background:${grd('#DC2626','#EF4444')};box-shadow:0 2px 8px rgba(220,38,38,.2);border:none;border-radius:6px;color:#fff;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px" onclick="WarehousePage.showCreateIssue()">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Tạo phiếu
                    </button>` : ''}
                    <div style="position:relative">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input class="form-control" placeholder="Tìm kiếm..." value="${searchQuery}" oninput="WarehousePage.doSearch(this.value)" style="padding:.45rem .9rem .45rem 36px;font-size:.95rem;width:420px;border-radius:8px;border:1px solid var(--border)">
                    </div>
                </div>
            </div>
            <div class="dev-table-card" style="border-radius:12px">
                ${filteredIssues.length ? `<table class="dev-table" style="font-size:.78rem">
                    <thead><tr>
                        <th style="padding:.35rem .5rem .35rem 1rem">Mã phiếu</th>
                        <th style="padding:.35rem .5rem">Ngày xuất</th>
                        <th style="padding:.35rem .5rem">Kho</th>
                        <th style="padding:.35rem .5rem">Phòng ban</th>
                        <th style="padding:.35rem .5rem">Người nhận</th>
                        <th style="padding:.35rem .5rem;text-align:center">Số TB</th>
                        <th style="padding:.35rem .5rem">Người tạo</th>
                        <th style="padding:.35rem 1rem .35rem .5rem;text-align:right">Thao tác</th>
                    </tr></thead>
                    <tbody>${filteredIssues.map(i => `<tr class="dev-tr">
                        <td style="padding:.3rem .5rem .3rem 1rem"><span class="dev-code" style="font-size:.72rem;padding:.1rem .4rem;background:#FEE2E2;color:#991B1B">${i.issue_code}</span></td>
                        <td style="padding:.3rem .5rem"><span style="font-size:.72rem;color:var(--text-muted)">${fmt.date(i.issue_date)}</span></td>
                        <td style="padding:.3rem .5rem;font-size:.76rem;color:var(--text-secondary)">${i.warehouse_name || '—'}</td>
                        <td style="padding:.3rem .5rem;font-size:.76rem">${i.department_name || '—'}</td>
                        <td style="padding:.3rem .5rem;font-size:.76rem;color:var(--text-secondary)">${i.recipient_name || '—'}</td>
                        <td style="padding:.3rem .5rem;text-align:center"><span class="dev-status-pill badge-broken" style="font-size:.68rem;padding:.05rem .45rem">${i.device_count || 0}</span></td>
                        <td style="padding:.3rem .5rem;font-size:.76rem;color:var(--text-secondary)">${i.created_by_name || '—'}</td>
                        <td style="padding:.3rem 1rem .3rem .5rem;text-align:right">
                            <button class="dev-action-btn" style="width:26px;height:26px" onclick="WarehousePage.showIssueDetail(${i.id})" title="Chi tiết">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            ${canCreate ? `<button class="dev-action-btn dev-action-danger" style="width:26px;height:26px" onclick="WarehousePage.removeIssue(${i.id})" title="Xóa">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>` : ''}
                        </td>
                    </tr>`).join('')}</tbody>
                </table>` : `<div class="dev-empty" style="padding:32px 16px">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <h3 style="font-size:.95rem;margin:8px 0 4px">${searchQuery ? 'Không tìm thấy' : 'Chưa có phiếu xuất kho'}</h3>
                    <p style="font-size:.8rem;color:var(--text-muted)">${searchQuery ? 'Không có phiếu xuất phù hợp với từ khóa tìm kiếm' : 'Tạo phiếu xuất mới để bắt đầu'}</p>
                </div>`}
            </div>`;
    };

    const renderWarehouses = async (skipLoad) => {
        const el = document.getElementById('warehouseContent');
        if (!el) return; if (subPage !== 'warehouses') return;
        const cu = App.getCurrentUser();
        const canEdit = cu?.role === 'superadmin' || cu?.role === 'admin';
        if (skipLoad && !dataReady) return;
        if (!skipLoad) { await loadAll(); if (subPage !== 'warehouses') return; dataReady = true; }
        filterData();
        el.innerHTML = `
            <div class="dash-stats" style="margin-bottom:12px">
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#4338CA','#4F46E5')};background:${grd('#EEF2FF','#E0E7FF')};border-color:#C7D2FE">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#4338CA','#4F46E5')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${warehouses.length}</div><div class="dash-stat-label">Kho</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" style="padding:10px 16px;--stat-gradient:${grd('#4F46E5','#6366F1')};background:${grd('#EEF2FF','#E0E7FF')};border-color:#C7D2FE">
                    <div class="dash-stat-icon" style="width:32px;height:32px;background:${grd('#4F46E5','#6366F1')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
                    <div class="dash-stat-info"><div class="dash-stat-value" style="font-size:1.1rem">${warehouses.filter(w => w.manager_name).length}</div><div class="dash-stat-label">Có phụ trách</div></div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                    ${canEdit ? `<button class="dev-btn-primary" style="padding:.32rem .7rem;font-size:.75rem;background:${grd('#4F46E5','#6366F1')};box-shadow:0 2px 8px rgba(79,70,229,.2);border:none;border-radius:6px;color:#fff;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px" onclick="WarehousePage.showWarehouseModal()">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Thêm kho
                    </button>` : ''}
                    <div style="position:relative">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input class="form-control" placeholder="Tìm kiếm..." value="${searchQuery}" oninput="WarehousePage.doSearch(this.value)" style="padding:.45rem .9rem .45rem 36px;font-size:.95rem;width:420px;border-radius:8px;border:1px solid var(--border)">
                    </div>
                </div>
            </div>
            <div class="dev-table-card" style="border-radius:12px">
                ${filteredWarehouses.length ? `<table class="dev-table" style="font-size:.78rem">
                    <thead><tr>
                        <th style="padding:.35rem .5rem .35rem 1rem">Mã kho</th>
                        <th style="padding:.35rem .5rem">Tên kho</th>
                        <th style="padding:.35rem .5rem">Địa chỉ</th>
                        <th style="padding:.35rem .5rem">Phụ trách</th>
                        <th style="padding:.35rem 1rem .35rem .5rem;text-align:right">Thao tác</th>
                    </tr></thead>
                    <tbody>${filteredWarehouses.map(w => `<tr class="dev-tr">
                        <td style="padding:.3rem .5rem .3rem 1rem"><span class="dev-code" style="font-size:.72rem;padding:.1rem .4rem;background:#EEF2FF;color:#4338CA">${w.warehouse_code}</span></td>
                        <td style="padding:.3rem .5rem"><div class="dev-name-cell" style="gap:6px"><div style="width:24px;height:24px;border-radius:6px;background:${grd('#EEF2FF','#E0E7FF')};display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div><div class="dev-name-text" style="font-size:.78rem">${w.name}</div></div></td>
                        <td style="padding:.3rem .5rem;font-size:.76rem;color:var(--text-secondary)">${w.address || '—'}</td>
                        <td style="padding:.3rem .5rem">${w.manager_name ? `<span class="dev-status-pill badge-active" style="font-size:.68rem;padding:.05rem .45rem">${w.manager_name}</span>` : '<span style="font-size:.76rem;color:var(--text-muted)">—</span>'}</td>
                        <td style="padding:.3rem 1rem .3rem .5rem;text-align:right">
                            ${canEdit ? `
                                <button class="dev-action-btn" style="width:26px;height:26px;color:var(--accent)" onclick="WarehousePage.showWarehouseModal(${w.id})" title="Sửa">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="dev-action-btn dev-action-danger" style="width:26px;height:26px" onclick="WarehousePage.removeWarehouse(${w.id})" title="Xóa">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                            ` : ''}
                        </td>
                    </tr>`).join('')}</tbody>
                </table>` : `<div class="dev-empty" style="padding:32px 16px">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <h3>${searchQuery ? 'Không tìm thấy' : 'Chưa có kho'}</h3>
                    <p>${searchQuery ? 'Không có kho phù hợp với từ khóa tìm kiếm' : 'Thêm kho mới để bắt đầu'}</p>
                </div>`}
            </div>`;
    };

    const showWarehouseModal = (id) => {
        const isEdit = !!id;
        const w = isEdit ? warehouses.find(x => x.id === id) : null;
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:${grd('#4F46E5','#6366F1')};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(79,70,229,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                    <div class="modal-title">${isEdit ? 'Cập nhật kho' : 'Thêm kho mới'}</div>
                    <div class="text-xs text-muted" style="margin-top:2px">${isEdit ? w.warehouse_code : ''}</div>
                </div>
            </div>`, `
            <form>
                <div class="form-group">
                    <label class="form-label">Tên kho *</label>
                    <input class="form-control" id="wh_name" value="${isEdit ? (w.name || '') : ''}" placeholder="Nhập tên kho">
                </div>
                <div class="form-group">
                    <label class="form-label">Địa chỉ</label>
                    <input class="form-control" id="wh_address" value="${isEdit ? (w.address || '') : ''}" placeholder="Nhập địa chỉ kho">
                </div>
                <div class="form-group">
                    <label class="form-label">Người phụ trách</label>
                    <input class="form-control" id="wh_manager" value="${isEdit ? (w.manager_name || '') : ''}" placeholder="Tên người phụ trách">
                </div>
                <div class="form-group" style="margin-bottom:0">
                    <label class="form-label">Ghi chú</label>
                    <textarea class="form-control" id="wh_notes" rows="2" placeholder="Ghi chú">${isEdit ? (w.notes || '') : ''}</textarea>
                </div>
            </form>`, true, async () => {
            const body = {
                name: document.getElementById('wh_name').value.trim(),
                address: document.getElementById('wh_address').value.trim() || null,
                manager_name: document.getElementById('wh_manager').value.trim() || null,
                notes: document.getElementById('wh_notes').value.trim() || null,
            };
            if (!body.name) { Toast.error('Tên kho không được để trống'); return; }
            const res = isEdit ? await API.put('/warehouses/' + id, body) : await API.post('/warehouses', body);
            if (res.ok) { Toast.success(isEdit ? 'Cập nhật kho thành công' : 'Tạo kho thành công'); closeModal(); renderWarehouses(); }
            else Toast.error(res.data.message || 'Lỗi');
        }, '500px');
    };

    const removeWarehouse = async (id) => {
        if (!confirm('Xóa kho này?')) return;
        const res = await API.delete('/warehouses/' + id);
        if (res.ok) { Toast.success('Đã xóa kho'); renderWarehouses(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    const showCreateReceipt = () => {
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:${grd('#2563EB','#3B82F6')};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div>
                    <div class="modal-title">Tạo phiếu nhập kho</div>
                    <div class="text-xs text-muted" style="margin-top:2px">Nhập thiết bị có sẵn vào kho</div>
                </div>
            </div>`, `
            <form>
                <div class="form-row" style="margin-bottom:12px">
                    <div class="form-group">
                        <label class="form-label">Ngày nhập *</label>
                        <input type="date" class="form-control" id="rc_date" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kho *</label>
                        <select class="form-control" id="rc_warehouse">
                            <option value="">Chọn kho</option>
                            ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Nhà cung cấp</label>
                    <input class="form-control" id="rc_supplier" placeholder="Tên nhà cung cấp">
                </div>
                <div class="form-group">
                    <label class="form-label">Danh sách thiết bị (ID, mỗi dòng 1 ID) *</label>
                    <textarea class="form-control" id="rc_device_ids" rows="6" placeholder="VD:&#10;1&#10;2&#10;3"></textarea>
                    <div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">Nhập ID của thiết bị có sẵn trong hệ thống, mỗi dòng một ID</div>
                </div>
                <div class="form-group" style="margin-bottom:0">
                    <label class="form-label">Ghi chú</label>
                    <textarea class="form-control" id="rc_notes" rows="2" placeholder="Ghi chú"></textarea>
                </div>
            </form>`, true, async () => {
            const date = document.getElementById('rc_date').value;
            const warehouse_id = document.getElementById('rc_warehouse').value;
            const raw = document.getElementById('rc_device_ids').value.trim();
            if (!date || !warehouse_id || !raw) { Toast.error('Vui lòng điền đầy đủ thông tin'); return; }
            const device_ids = raw.split('\n').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
            if (!device_ids.length) { Toast.error('Danh sách thiết bị không hợp lệ'); return; }
            const body = {
                receipt_date: date,
                warehouse_id: parseInt(warehouse_id),
                supplier_name: document.getElementById('rc_supplier').value.trim() || null,
                notes: document.getElementById('rc_notes').value.trim() || null,
                device_ids,
            };
            const res = await API.post('/warehouses/receipts', body);
            if (res.ok) { Toast.success('Tạo phiếu nhập kho thành công'); closeModal(); renderReceipts(); }
            else Toast.error(res.data.message || 'Lỗi');
        }, '550px');
    };

    const showReceiptDetail = async (id) => {
        const res = await API.get('/warehouses/receipts/' + id);
        if (!res.ok) { Toast.error('Không thể tải chi tiết'); return; }
        const r = res.data.data;
        const token = API.getToken();
        showModal('Chi tiết phiếu nhập', `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;background:${grd('#EFF6FF','#F8FAFC')};margin:-1rem -1rem 0 -1rem;padding:1.2rem 1.5rem;border-radius:14px 14px 0 0;border-bottom:1px solid var(--border)">
                <div style="width:44px;height:44px;border-radius:12px;background:${grd('#2563EB','#3B82F6')};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 10px rgba(37,99,235,.2)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div style="flex:1">
                    <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">${r.receipt_code}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:3px"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        ${r.warehouse_name || ''}
                        <span style="margin:0 4px;color:#CBD5E1">&middot;</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${fmt.date(r.receipt_date)}
                    </div>
                </div>
                <button class="dev-btn-secondary" style="padding:.35rem .6rem;font-size:.72rem;border-radius:6px;flex-shrink:0" onclick="window.open(API.BASE_URL + '/warehouses/receipts/${r.id}/export-pdf?inline=1&_=' + Date.now() + '&token=' + encodeURIComponent('${token}'), '_blank')" title="Xuất PDF">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    In phiếu
                </button>
            </div>
            <div class="detail-grid" style="grid-template-columns:1fr">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1.2rem;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,.04)'">
                    <div class="detail-section-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:5px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        Thông tin phiếu
                    </div>
                    <div>
                    <div style="padding:8px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
                        <span style="font-size:.73rem;color:var(--text-muted);font-weight:500;white-space:nowrap">Mã phiếu</span>
                        <span style="font-size:.88rem;font-weight:600;color:var(--text-primary);font-family:monospace;text-align:right">${r.receipt_code}</span>
                    </div>
                    <div style="padding:8px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
                        <span style="font-size:.73rem;color:var(--text-muted);font-weight:500;white-space:nowrap">Ngày nhập</span>
                        <span style="font-size:.88rem;font-weight:600;color:var(--text-primary);text-align:right">${fmt.date(r.receipt_date)}</span>
                    </div>
                    <div style="padding:8px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
                        <span style="font-size:.73rem;color:var(--text-muted);font-weight:500;white-space:nowrap">Kho</span>
                        <span style="font-size:.88rem;font-weight:600;color:var(--text-primary);text-align:right">${r.warehouse_name || '—'}</span>
                    </div>
                    <div style="padding:8px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
                        <span style="font-size:.73rem;color:var(--text-muted);font-weight:500;white-space:nowrap">Nhà cung cấp</span>
                        <span style="font-size:.88rem;font-weight:600;color:var(--primary);text-align:right">${r.supplier_name || '—'}</span>
                    </div>
                    <div style="padding:8px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
                        <span style="font-size:.73rem;color:var(--text-muted);font-weight:500;white-space:nowrap">Người tạo</span>
                        <span style="font-size:.88rem;font-weight:600;color:var(--text-primary);text-align:right">${r.created_by_name || '—'}</span>
                    </div>
                    <div style="padding:8px 0;display:flex;align-items:center;justify-content:space-between">
                        <span style="font-size:.73rem;color:var(--text-muted);font-weight:500;white-space:nowrap">Tổng thiết bị</span>
                        <span style="font-size:.95rem;font-weight:700;color:var(--primary);text-align:right">${r.details ? r.details.length : 0}</span>
                    </div>
                </div>
                    ${r.notes ? `<div style="margin-top:10px;padding:10px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px"><div style="font-size:.72rem;font-weight:600;color:#92400E;margin-bottom:3px">Ghi chú</div><div style="font-size:.82rem;color:#78350F">${r.notes}</div></div>` : ''}
                </div>
            </div>
            ${r.details && r.details.length ? `
            <div style="margin-top:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)">
                <div style="padding:.75rem 1rem;font-weight:600;font-size:.82rem;border-bottom:1px solid var(--border);background:${grd('#F8FAFC','#F1F5F9')};display:flex;align-items:center;gap:7px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Danh sách thiết bị
                </div>
                <table class="dev-table">
                    <thead><tr>
                        <th style="padding:.4rem .5rem .4rem 1rem;width:40px">STT</th>
                        <th style="padding:.4rem .5rem">Mã TB</th>
                        <th style="padding:.4rem .5rem">Tên thiết bị</th>
                        <th style="padding:.4rem 1rem .4rem .5rem">Trạng thái</th>
                    </tr></thead>
                    <tbody>${r.details.map((d, idx) => `<tr class="dev-tr" style="transition:background .15s" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''">
                        <td style="padding:.35rem .5rem .35rem 1rem;text-align:center;font-size:.78rem;color:var(--text-muted)">${idx + 1}</td>
                        <td style="padding:.35rem .5rem"><span class="dev-code" style="font-size:.72rem;padding:.12rem .45rem">${d.device_code || '—'}</span></td>
                        <td style="padding:.35rem .5rem"><span class="dev-name-text" style="font-size:.82rem">${d.device_name || 'ID: ' + d.device_id}</span></td>
                        <td style="padding:.35rem 1rem .35rem .5rem"><span class="dev-status-pill badge-active" style="font-size:.68rem">${d.device_status || '—'}</span></td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>` : ''}`, false, null, '700px');
    };

    const removeReceipt = async (id) => {
        const res = await API.delete('/warehouses/receipts/' + id);
        if (res.ok) { Toast.success('Đã xóa phiếu nhập'); renderReceipts(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    const showCreateIssue = () => {
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:10px;background:${grd('#DC2626','#EF4444')};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(220,38,38,.25)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div>
                    <div class="modal-title">Tạo phiếu xuất kho</div>
                    <div class="text-xs text-muted" style="margin-top:2px">Xuất thiết bị từ kho</div>
                </div>
            </div>`, `
            <form>
                <div class="form-row" style="margin-bottom:12px">
                    <div class="form-group">
                        <label class="form-label">Ngày xuất *</label>
                        <input type="date" class="form-control" id="iss_date" value="${new Date().toISOString().slice(0,10)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kho *</label>
                        <select class="form-control" id="iss_warehouse">
                            <option value="">Chọn kho</option>
                            ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row" style="margin-bottom:12px">
                    <div class="form-group">
                        <label class="form-label">Phòng ban</label>
                        <select class="form-control" id="iss_department">
                            <option value="">Không chọn</option>
                            ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Người nhận</label>
                        <input class="form-control" id="iss_recipient" placeholder="Tên người nhận">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Danh sách thiết bị (ID, mỗi dòng 1 ID) *</label>
                    <textarea class="form-control" id="iss_device_ids" rows="6" placeholder="VD:&#10;1&#10;2&#10;3"></textarea>
                    <div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">Chỉ xuất được thiết bị có trạng thái "in_stock" (đang trong kho)</div>
                </div>
                <div class="form-group" style="margin-bottom:0">
                    <label class="form-label">Ghi chú</label>
                    <textarea class="form-control" id="iss_notes" rows="2" placeholder="Ghi chú"></textarea>
                </div>
            </form>`, true, async () => {
            const date = document.getElementById('iss_date').value;
            const warehouse_id = document.getElementById('iss_warehouse').value;
            const raw = document.getElementById('iss_device_ids').value.trim();
            if (!date || !warehouse_id || !raw) { Toast.error('Vui lòng điền đầy đủ thông tin'); return; }
            const device_ids = raw.split('\n').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
            if (!device_ids.length) { Toast.error('Danh sách thiết bị không hợp lệ'); return; }
            const body = {
                issue_date: date,
                warehouse_id: parseInt(warehouse_id),
                department_id: document.getElementById('iss_department').value || null,
                recipient_name: document.getElementById('iss_recipient').value.trim() || null,
                notes: document.getElementById('iss_notes').value.trim() || null,
                device_ids,
            };
            const res = await API.post('/warehouses/issues', body);
            if (res.ok) { Toast.success('Tạo phiếu xuất kho thành công'); closeModal(); renderIssues(); }
            else Toast.error(res.data.message || 'Lỗi');
        }, '550px');
    };

    const showIssueDetail = async (id) => {
        const res = await API.get('/warehouses/issues/' + id);
        if (!res.ok) { Toast.error('Không thể tải chi tiết'); return; }
        const i = res.data.data;
        const token = API.getToken();
        showModal('Chi tiết phiếu xuất', `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <div style="width:42px;height:42px;border-radius:12px;background:${grd('#FEF2F2','#FEE2E2')};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div style="flex:1">
                    <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">${i.issue_code}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${i.warehouse_name || ''} &middot; ${fmt.date(i.issue_date)}</div>
                </div>
                <button class="dev-btn-secondary" style="padding:.35rem .6rem;font-size:.72rem;border-radius:6px;flex-shrink:0" onclick="window.open(API.BASE_URL + '/warehouses/issues/${i.id}/export-pdf?inline=1&_=' + Date.now() + '&token=' + encodeURIComponent('${token}'), '_blank')" title="Xuất PDF">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    In phiếu
                </button>
            </div>
            <div class="detail-grid">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.03)">
                    <div class="detail-section-title">Thông tin phiếu</div>
                    <div class="detail-grid" style="margin-top:8px">
                        <div><div class="detail-label">Mã phiếu</div><div class="detail-value" style="font-family:monospace">${i.issue_code}</div></div>
                        <div><div class="detail-label">Ngày xuất</div><div class="detail-value">${fmt.date(i.issue_date)}</div></div>
                        <div><div class="detail-label">Kho</div><div class="detail-value">${i.warehouse_name || '—'}</div></div>
                        <div><div class="detail-label">Phòng ban</div><div class="detail-value">${i.department_name || '—'}</div></div>
                        <div><div class="detail-label">Người nhận</div><div class="detail-value">${i.recipient_name || '—'}</div></div>
                        <div><div class="detail-label">Người tạo</div><div class="detail-value">${i.created_by_name || '—'}</div></div>
                        <div><div class="detail-label">Tổng thiết bị</div><div class="detail-value" style="font-weight:700">${i.details ? i.details.length : 0}</div></div>
                    </div>
                    ${i.notes ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div class="detail-label">Ghi chú</div><div style="font-size:.82rem;margin-top:4px">${i.notes}</div></div>` : ''}
                </div>
            </div>
            ${i.details && i.details.length ? `
            <div style="margin-top:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">
                <div style="padding:.75rem 1rem;font-weight:600;font-size:.82rem;border-bottom:1px solid var(--border);background:#F9FAFB">Danh sách thiết bị</div>
                <table class="dev-table">
                    <thead><tr><th style="padding-left:1rem">Mã TB</th><th>Tên thiết bị</th><th style="padding-right:1rem">Trạng thái</th></tr></thead>
                    <tbody>${i.details.map(d => `<tr class="dev-tr">
                        <td style="padding-left:1rem"><span class="dev-code">${d.device_code || ''}</span></td>
                        <td><span class="dev-name-text">${d.device_name || 'ID: ' + d.device_id}</span></td>
                        <td style="padding-right:1rem"><span class="dev-status-pill badge-active">${d.device_status || ''}</span></td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>` : ''}`, false, null, '700px');
    };

    const removeIssue = async (id) => {
        if (!confirm('Xóa phiếu xuất kho? Thiết bị sẽ được chuyển về trạng thái trong kho.')) return;
        const res = await API.delete('/warehouses/issues/' + id);
        if (res.ok) { Toast.success('Đã xóa phiếu xuất'); renderIssues(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    const render = async () => {
        const el = document.getElementById('mainContent');
        if (!el) return;
        await loadAll();
        el.innerHTML = `
        <div class="page-section">
            <div class="dev-header" style="margin-bottom:0">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:${grd('#2563EB','#3B82F6')}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7h16"/><path d="M8 12h8"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Quản lý kho</div>
                                <div class="dev-subtitle">Quản lý nhập/xuất/tồn kho thiết bị</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ${renderTabs()}
            <div id="warehouseContent">
                <div class="dev-loading"><div class="spinner"></div></div>
            </div>
        </div>`;
        renderContent();
    };

    return { render, setSubPage, doSearch, showCreateReceipt, showCreateIssue, showReceiptDetail, showIssueDetail, removeReceipt, removeIssue, showWarehouseModal, removeWarehouse }; 
})();
