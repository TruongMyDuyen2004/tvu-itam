window.QRCodePage = (() => {
    let allDevices = [];
    let filtered = [];
    let selectedIds = new Set();
    let categories = [];
    let departments = [];
    let viewMode = 'grid';
    let activeTab = 'manage';
    let statFilter = '';
    let currentDevice = null;

    const statusLabel = { active:'Đang dùng', maintenance:'Bảo trì', broken:'Hỏng', disposed:'Thanh lý', inactive:'Không dùng', in_stock:'Tồn kho' };
    const qrStatusLabel = { pending:'Chưa in', printed:'Đã in', assigned:'Đã gắn' };
    const qrStatusColor = {
        pending: { bg:'#FEF3C7', text:'#92400E', dot:'#F59E0B' },
        printed: { bg:'#DBEAFE', text:'#1E40AF', dot:'#3B82F6' },
        assigned: { bg:'#D1FAE5', text:'#065F46', dot:'#10B981' }
    };

    const icon = {
        qr: '<rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-5v5"/><path d="M16 21v-5"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
        check: '<polyline points="20 6 9 17 4 12"/>',
        search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
        link: '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',
        filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
        grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
        table: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>',
        scan: '<rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-5v5"/><path d="M16 21v-5"/>',
        history: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
        edit: '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>'
    };

    const render = async () => {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="qr-page">
                <div class="qr-header">
                    <div class="qr-header-left">
                        <div class="qr-title-icon" style="background:linear-gradient(135deg,#4F46E5,#7C3AED)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.qr}</svg>
                        </div>
                        <div>
                            <h1 class="qr-title">Quản lý Mã QR</h1>
                            <p class="qr-subtitle">Quản lý mã QR code cho tất cả thiết bị trong hệ thống</p>
                        </div>
                    </div>
                    <div class="qr-header-right">
                        <button onclick="QRCodePage.bulkDownload()" id="qrBulkBtn" class="qr-btn qr-btn-primary" disabled>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.download}</svg>
                            Tải đã chọn (<span id="qrBulkCount">0</span>)
                        </button>
                    </div>
                </div>

                <div class="qr-tabs">
                    <button onclick="QRCodePage.switchTab('manage')" id="tab-manage" class="qr-tab active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.qr}</svg>
                        Quản lý QR
                    </button>
                    <button onclick="QRCodePage.switchTab('dashboard')" id="tab-dashboard" class="qr-tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.filter}</svg>
                        Thống kê
                    </button>
                    <button onclick="QRCodePage.switchTab('labels')" id="tab-labels" class="qr-tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.tag}</svg>
                        Mẫu nhãn
                    </button>
                    <button onclick="QRCodePage.switchTab('history')" id="tab-history" class="qr-tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.history}</svg>
                        Lịch sử quét
                    </button>
                    <button onclick="QRCodePage.switchTab('scanner')" id="tab-scanner" class="qr-tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.scan}</svg>
                        Quét QR
                    </button>
                </div>

                <div id="qrTabContent" class="qr-tab-content">
                    <div class="qr-loading"><div class="spinner"></div><p>Đang tải dữ liệu...</p></div>
                </div>
            </div>

            <style>
                .qr-page{animation:fadeIn .3s ease}
                .qr-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:12px}
                .qr-header-left{display:flex;align-items:center;gap:14px}
                .qr-title-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
                .qr-title-icon svg{width:24px;height:24px}
                .qr-title{font-size:1.4rem;font-weight:800;color:var(--text-primary);margin:0}
                .qr-subtitle{font-size:.85rem;color:var(--text-muted);margin:2px 0 0}
                .qr-header-right{display:flex;gap:8px}
                .qr-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s;border:none;font-family:inherit}
                .qr-btn svg{width:16px;height:16px}
                .qr-btn-primary{background:#2563EB;color:#fff}.qr-btn-primary:hover{background:#1D4ED8}
                .qr-btn-primary:disabled{background:#93C5FD;cursor:not-allowed}
                .qr-btn-outline{background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border)}.qr-btn-outline:hover{background:var(--bg-base)}
                .qr-tabs{display:flex;gap:2px;border-bottom:2px solid var(--border-light);margin-bottom:1.25rem;overflow-x:auto}
                .qr-tab{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border:none;background:none;font-size:.85rem;font-weight:600;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s;white-space:nowrap;font-family:inherit}
                .qr-tab svg{width:16px;height:16px}
                .qr-tab:hover{color:var(--text-primary);background:var(--bg-base);border-radius:8px 8px 0 0}
                .qr-tab.active{color:#2563EB;border-bottom-color:#2563EB}
                .qr-tab-content{min-height:400px}
                .qr-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem;color:var(--text-muted);gap:12px}
                .qr-loading .spinner{width:36px;height:36px;border:3px solid var(--border-light);border-top-color:#2563EB;border-radius:50%;animation:spin .8s linear infinite}
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                .qr-empty{text-align:center;padding:3rem;color:var(--text-muted)}
                .qr-empty svg{margin-bottom:12px}
                .qr-empty h3{font-size:1rem;font-weight:700;margin:0 0 4px;color:var(--text-primary)}
                .qr-empty p{font-size:.85rem;margin:0}
                .qr-filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:1rem}
                .qr-search-wrap{flex:1;min-width:200px;position:relative}
                .qr-search-wrap svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-muted);pointer-events:none}
                .qr-search-wrap input{width:100%;padding:8px 12px 8px 34px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;background:var(--bg-surface);transition:border-color .2s}
                .qr-search-wrap input:focus{outline:none;border-color:#2563EB}
                .qr-filter-select{padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;background:var(--bg-surface);cursor:pointer}
                .qr-view-toggle{display:flex;border:1px solid var(--border);border-radius:8px;overflow:hidden}
                .qr-view-btn{padding:8px 12px;border:none;background:var(--bg-surface);cursor:pointer;display:flex;align-items:center;transition:all .2s}
                .qr-view-btn svg{width:16px;height:16px}
                .qr-view-btn.active{background:#2563EB;color:#fff}
                .qr-view-btn.active svg{stroke:#fff}
                .qr-toolbar-info{display:flex;align-items:center;gap:10px;margin-bottom:1rem;font-size:.85rem;color:var(--text-muted)}
                .qr-toolbar-info strong{color:var(--text-primary)}
                .qr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
                .qr-card{background:var(--bg-surface);border:1px solid var(--border-light);border-radius:14px;padding:16px;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}
                .qr-card:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,.08);border-color:#2563EB}
                .qr-card.selected{border:2px solid #2563EB;background:#EFF6FF}
                .qr-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
                .qr-card-checkbox{width:18px;height:18px;accent-color:#2563EB;cursor:pointer;margin-top:2px}
                .qr-card-select{font-size:.68rem;padding:3px 8px;border-radius:6px;border:1px solid var(--border);font-weight:600;cursor:pointer;outline:none;background:var(--bg-surface)}
                .qr-card-qr{text-align:center;margin-bottom:12px}
                .qr-card-qr img{width:120px;height:120px;border-radius:10px;border:1px solid var(--border-light);transition:transform .2s}
                .qr-card:hover .qr-card-qr img{transform:scale(1.05)}
                .qr-card-code{font-family:monospace;font-weight:700;font-size:.95rem;color:var(--text-primary);text-align:center}
                .qr-card-name{font-size:.82rem;font-weight:600;margin:4px 0 8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-primary)}
                .qr-card-badges{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
                .qr-card-dept{font-size:.75rem;color:var(--text-muted);text-align:center;margin-bottom:10px}
                .qr-card-actions{display:flex;gap:4px;justify-content:center;border-top:1px solid var(--border-light);padding-top:10px}
                .qr-card-action{font-size:.72rem;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all .2s;font-family:inherit;font-weight:500}
                .qr-card-action:hover{background:#2563EB;color:#fff;border-color:#2563EB}
                .qr-card-action svg{width:12px;height:12px}
                .qr-table-wrap{overflow-x:auto;border:1px solid var(--border-light);border-radius:12px;background:var(--bg-surface)}
                .qr-table{width:100%;border-collapse:collapse;font-size:.82rem}
                .qr-table th{padding:12px 14px;text-align:left;font-weight:700;font-size:.78rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);background:var(--bg-base);border-bottom:2px solid var(--border-light);white-space:nowrap}
                .qr-table td{padding:12px 14px;border-bottom:1px solid var(--border-light);vertical-align:middle}
                .qr-table tr:last-child td{border-bottom:none}
                .qr-table tr:hover td{background:var(--bg-base)}
                .qr-table tr.selected td{background:#EFF6FF}
                .qr-badge{font-size:.72rem;padding:3px 10px;border-radius:6px;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
                .qr-badge-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
                .qr-table-action{font-size:.72rem;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);cursor:pointer;margin:2px;transition:all .2s;font-family:inherit}
                .qr-table-action:hover{background:#2563EB;color:#fff;border-color:#2563EB}
                @media(max-width:768px){.qr-header{flex-direction:column;align-items:flex-start}.qr-grid{grid-template-columns:1fr}.qr-filter-bar{flex-direction:column}.qr-search-wrap{min-width:100%}}
            </style>
        `;
        await loadBaseData();
        renderTab();
    };

    const loadBaseData = async () => {
        try {
            const qrRes = await API.get('/devices/qr/all');
            if (qrRes.ok && qrRes.data?.data) {
                allDevices = qrRes.data.data;
                filtered = [...allDevices];
            }
        } catch (e) { console.error(e); }
        try {
            const catRes = await API.get('/categories');
            if (catRes.ok && catRes.data?.data) categories = catRes.data.data;
        } catch (e) {}
        try {
            const deptRes = await API.get('/departments');
            if (deptRes.ok && deptRes.data?.data) departments = deptRes.data.data;
        } catch (e) {}
    };

    const switchTab = (tab) => {
        activeTab = tab;
        document.querySelectorAll('.qr-tab').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + tab)?.classList.add('active');
        renderTab();
    };

    const renderTab = () => {
        const el = document.getElementById('qrTabContent');
        if (!el) return;
        switch (activeTab) {
            case 'manage': renderManageTab(el); break;
            case 'dashboard': renderDashboardTab(el); break;
            case 'labels': renderLabelsTab(el); break;
            case 'history': renderHistoryTab(el); break;
            case 'scanner': renderScannerTab(el); break;
        }
    };

    /* ==================== TAB 1: QUẢN LÝ ==================== */
    const renderManageTab = (el) => {
        const total = allDevices.length;
        const pending = allDevices.filter(d => d.qr_status === 'pending').length;
        const printed = allDevices.filter(d => d.qr_status === 'printed').length;
        const assigned = allDevices.filter(d => d.qr_status === 'assigned').length;

        const cards = [
            { value: total, label: 'Tổng QR', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)', icon: icon.qr, filter: '' },
            { value: pending, label: 'Chưa in', gradient: 'linear-gradient(135deg,#D97706,#F59E0B)', icon: icon.clock, filter: 'pending' },
            { value: printed, label: 'Đã in', gradient: 'linear-gradient(135deg,#2563EB,#3B82F6)', icon: icon.printer, filter: 'printed' },
            { value: assigned, label: 'Đã gắn', gradient: 'linear-gradient(135deg,#059669,#10B981)', icon: icon.check, filter: 'assigned' },
        ];

        el.innerHTML = `
            <div class="dash-stats" style="margin-bottom:1.25rem">
                ${cards.map((c, i) => `
                    <div class="dash-stat-card card-anim-${i+1} ${statFilter===c.filter?'active':''}" style="--stat-gradient:${c.gradient};cursor:pointer" onclick="QRCodePage.setStatFilter('${c.filter}')">
                        <div class="dash-stat-icon" style="background:${c.gradient}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${c.icon}</svg>
                        </div>
                        <div class="dash-stat-info">
                            <div class="dash-stat-value">${c.value}</div>
                            <div class="dash-stat-label">${c.label}</div>
                        </div>
                        <div class="dash-stat-glow"></div>
                    </div>
                `).join('')}
            </div>

            <div class="qr-filter-bar">
                <div class="qr-search-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.search}</svg>
                    <input type="text" id="qrSearch" placeholder="Tìm mã, tên, hãng, số serial..." oninput="QRCodePage.filter()">
                </div>
                <select id="qrStatusFilter" onchange="QRCodePage.filter()" class="qr-filter-select">
                    <option value="">Mọi tình trạng</option>
                    <option value="active">Đang dùng</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="broken">Hỏng</option>
                    <option value="disposed">Thanh lý</option>
                    <option value="inactive">Không dùng</option>
                    <option value="in_stock">Tồn kho</option>
                </select>
                <select id="qrStatusTypeFilter" onchange="QRCodePage.filter()" class="qr-filter-select">
                    <option value="">Mọi trạng thái QR</option>
                    <option value="pending">Chưa in</option>
                    <option value="printed">Đã in</option>
                    <option value="assigned">Đã gắn</option>
                </select>
                <select id="qrDeptFilter" onchange="QRCodePage.filter()" class="qr-filter-select">
                    <option value="">Mọi phòng ban</option>
                </select>
                <div class="qr-view-toggle">
                    <button onclick="QRCodePage.setViewMode('grid')" id="btnGrid" class="qr-view-btn active" title="Dạng lưới"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.grid}</svg></button>
                    <button onclick="QRCodePage.setViewMode('table')" id="btnTable" class="qr-view-btn" title="Dạng bảng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.table}</svg></button>
                </div>
            </div>

            <div class="qr-toolbar-info">
                <span id="qrTotalCount">${filtered.length} thiết bị</span>
                <span style="color:var(--border)">|</span>
                <span>Đã chọn: <strong id="qrSelectedInfo">0</strong></span>
                <div style="flex:1"></div>
                <button onclick="QRCodePage.selectAll()" class="qr-btn qr-btn-outline" style="font-size:.78rem;padding:6px 12px">
                    ${selectedIds.size === filtered.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
            </div>

            <div id="qrGrid"></div>
        `;

        const deptFilter = document.getElementById('qrDeptFilter');
        departments.forEach(d => { deptFilter.innerHTML += `<option value="${d.id}">${d.name}</option>`; });

        setViewMode(viewMode);
    };

    const setStatFilter = (value) => {
        statFilter = statFilter === value ? '' : value;
        const qsFilter = document.getElementById('qrStatusTypeFilter');
        if (qsFilter) qsFilter.value = statFilter;
        renderManageTab(document.getElementById('qrTabContent'));
        filter();
    };

    const setViewMode = (mode) => {
        viewMode = mode;
        const btnGrid = document.getElementById('btnGrid');
        const btnTable = document.getElementById('btnTable');
        if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');
        if (btnTable) btnTable.classList.toggle('active', mode === 'table');
        renderData();
    };

    const renderData = () => {
        const container = document.getElementById('qrGrid');
        if (!container) return;
        document.getElementById('qrTotalCount').textContent = `${filtered.length} thiết bị`;
        if (!filtered.length) {
            container.innerHTML = `
                <div class="qr-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-5v5"/><path d="M16 21v-5"/></svg>
                    <h3>Không tìm thấy thiết bị</h3>
                    <p>Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                </div>`;
            return;
        }
        if (viewMode === 'table') renderTable(container);
        else renderGrid(container);
        updateSelectedCount();
    };

    const renderGrid = (container) => {
        container.innerHTML = `<div class="qr-grid">${filtered.map(d => {
            const sel = selectedIds.has(d.id);
            const sc = qrStatusColor[d.qr_status] || qrStatusColor.pending;
            const st = statusLabel[d.status] || d.status;
            return `
            <div class="qr-card ${sel?'selected':''}" onclick="QRCodePage.toggleSelect(${d.id})">
                <div class="qr-card-top">
                    <input type="checkbox" class="qr-card-checkbox" ${sel?'checked':''} onclick="event.stopPropagation()">
                    <select class="qr-card-select" onclick="event.stopPropagation()" onchange="QRCodePage.updateStatus(${d.id},this.value)" style="color:${sc.text};background:${sc.bg};border-color:${sc.dot}">
                        <option value="pending" ${d.qr_status==='pending'?'selected':''}>Chưa in</option>
                        <option value="printed" ${d.qr_status==='printed'?'selected':''}>Đã in</option>
                        <option value="assigned" ${d.qr_status==='assigned'?'selected':''}>Đã gắn</option>
                    </select>
                </div>
                <div class="qr-card-qr" style="position:relative">
                    <img src="${d.qr_code}" alt="QR ${d.device_code}">
                    ${d.image_url ? `<img src="${d.image_url}" alt="${d.name}" style="position:absolute;bottom:-8px;right:-8px;width:48px;height:48px;object-fit:cover;border-radius:8px;border:2px solid var(--bg-surface);box-shadow:0 2px 8px rgba(0,0,0,.15)">` : ''}
                </div>
                <div class="qr-card-code">${d.device_code}</div>
                <div class="qr-card-name" title="${d.name}">${d.name}</div>
                <div class="qr-card-badges">
                    <span class="qr-badge" style="background:${sc.bg};color:${sc.text}"><span class="qr-badge-dot" style="background:${sc.dot}"></span>${qrStatusLabel[d.qr_status]}</span>
                    <span class="qr-badge" style="background:var(--bg-base);color:var(--text-muted)">${st}</span>
                </div>
                <div class="qr-card-dept">${d.department_name||'Chưa phân phòng'}</div>
                <div class="qr-card-actions">
                    <button class="qr-card-action" onclick="event.stopPropagation();QRCodePage.downloadSingle(${d.id},'${d.device_code}')" title="Tải QR">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.download}</svg> Tải
                    </button>
                    <button class="qr-card-action" onclick="event.stopPropagation();QRCodePage.printLabel('${d.device_code}','${(d.name||'').replace(/'/g,"\\'")}','${(d.brand||'').replace(/'/g,"\\'")}','${(d.model||'').replace(/'/g,"\\'")}','${(d.department_name||'').replace(/'/g,"\\'")}','${d.qr_code}',${d.id})" title="In nhãn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.printer}</svg> In
                    </button>
                    <button class="qr-card-action" onclick="event.stopPropagation();QRCodePage.copyLink('${d.qr_url}')" title="Copy link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.link}</svg> Link
                    </button>
                </div>
            </div>`;
        }).join('')}</div>`;
    };

    const renderTable = (container) => {
        container.innerHTML = `
        <div class="qr-table-wrap">
        <table class="qr-table">
            <thead><tr>
                <th style="width:40px;text-align:center"><input type="checkbox" onchange="QRCodePage.selectAll()" style="accent-color:#2563EB"></th>
                <th>Mã TB</th>
                <th>Tên thiết bị</th>
                <th>Phòng ban</th>
                <th style="text-align:center">QR Code</th>
                <th style="text-align:center">Trạng thái QR</th>
                <th style="text-align:center">Tình trạng</th>
                <th style="text-align:center">Thao tác</th>
            </tr></thead>
            <tbody>${filtered.map(d => {
                const sel = selectedIds.has(d.id);
                const sc = qrStatusColor[d.qr_status] || qrStatusColor.pending;
                return `<tr class="${sel?'selected':''}" onclick="QRCodePage.toggleSelect(${d.id})" style="cursor:pointer">
                    <td style="text-align:center"><input type="checkbox" ${sel?'checked':''} onchange="QRCodePage.toggleSelect(${d.id})" onclick="event.stopPropagation()" style="accent-color:#2563EB"></td>
                    <td><span style="font-family:monospace;font-weight:700">${d.device_code}</span></td>
                    <td>${d.name}<div style="font-size:.72rem;color:var(--text-muted)">${[d.brand,d.model].filter(Boolean).join(' ')}</div></td>
                    <td style="font-size:.78rem;color:var(--text-muted)">${d.department_name||'—'}</td>
                    <td style="text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:6px">${d.image_url ? `<img src="${d.image_url}" style="width:36px;height:36px;border-radius:4px;object-fit:cover;border:1px solid var(--border-light)">` : ''}<img src="${d.qr_code}" style="width:48px;height:48px;border-radius:6px;border:1px solid var(--border-light);cursor:pointer" onclick="event.stopPropagation();QRCodePage.showFullQR('${d.device_code}','${d.qr_code}')"></div></td>
                    <td style="text-align:center"><select onchange="QRCodePage.updateStatus(${d.id},this.value)" onclick="event.stopPropagation()" class="qr-card-select" style="color:${sc.text};background:${sc.bg};border-color:${sc.dot}">
                        <option value="pending" ${d.qr_status==='pending'?'selected':''}>Chưa in</option>
                        <option value="printed" ${d.qr_status==='printed'?'selected':''}>Đã in</option>
                        <option value="assigned" ${d.qr_status==='assigned'?'selected':''}>Đã gắn</option>
                    </select></td>
                    <td style="text-align:center"><span class="qr-badge" style="background:var(--bg-base);color:var(--text-muted)">${statusLabel[d.status]||d.status}</span></td>
                    <td style="text-align:center;white-space:nowrap">
                        <button class="qr-table-action" onclick="event.stopPropagation();QRCodePage.downloadSingle(${d.id},'${d.device_code}')">Tải</button>
                        <button class="qr-table-action" onclick="event.stopPropagation();QRCodePage.printLabel('${d.device_code}','${(d.name||'').replace(/'/g,"\\'")}','${(d.brand||'').replace(/'/g,"\\'")}','${(d.model||'').replace(/'/g,"\\'")}','${(d.department_name||'').replace(/'/g,"\\'")}','${d.qr_code}',${d.id})">In</button>
                        <button class="qr-table-action" onclick="event.stopPropagation();QRCodePage.copyLink('${d.qr_url}')">Link</button>
                    </td>
                </tr>`;
            }).join('')}</tbody>
        </table></div>`;
    };

    const showFullQR = (code, qrImg) => {
        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html><head><title>QR - ${code}</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5;font-family:sans-serif}img{width:400px;height:400px;border:2px solid #333;border-radius:16px;background:#fff;padding:20px}h2{text-align:center;margin-top:16px;font-family:monospace}</style></head><body><div><img src="${qrImg}"><h2>${code}</h2></div></body></html>`);
        w.document.close();
    };

    /* ==================== TAB 2: DASHBOARD ==================== */
    const renderDashboardTab = (el) => {
        const total = allDevices.length;
        const pending = allDevices.filter(d => d.qr_status === 'pending').length;
        const printed = allDevices.filter(d => d.qr_status === 'printed').length;
        const assigned = allDevices.filter(d => d.qr_status === 'assigned').length;
        const byDept = {};
        allDevices.forEach(d => {
            const dept = d.department_name || 'Chưa phân';
            if (!byDept[dept]) byDept[dept] = { total:0, pending:0, printed:0, assigned:0 };
            byDept[dept].total++;
            byDept[dept][d.qr_status]++;
        });
        const byStatus = {};
        allDevices.forEach(d => {
            const s = statusLabel[d.status] || d.status;
            if (!byStatus[s]) byStatus[s] = 0;
            byStatus[s]++;
        });
        const pct = (v) => total ? Math.round(v / total * 100) : 0;

        el.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:2rem">
                <div style="padding:20px;border-radius:12px;background:linear-gradient(135deg,#3B82F6,#2563EB);color:#fff">
                    <div style="font-size:2rem;font-weight:800">${total}</div>
                    <div style="font-size:.85rem;opacity:.9">Tổng QR Code</div>
                </div>
                <div style="padding:20px;border-radius:12px;background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff">
                    <div style="font-size:2rem;font-weight:800">${pending}</div>
                    <div style="font-size:.85rem;opacity:.9">Chưa in (${pct(pending)}%)</div>
                    <div style="height:6px;background:rgba(255,255,255,.3);border-radius:3px;margin-top:8px"><div style="height:100%;width:${pct(pending)}%;background:#fff;border-radius:3px"></div></div>
                </div>
                <div style="padding:20px;border-radius:12px;background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff">
                    <div style="font-size:2rem;font-weight:800">${printed}</div>
                    <div style="font-size:.85rem;opacity:.9">Đã in (${pct(printed)}%)</div>
                    <div style="height:6px;background:rgba(255,255,255,.3);border-radius:3px;margin-top:8px"><div style="height:100%;width:${pct(printed)}%;background:#fff;border-radius:3px"></div></div>
                </div>
                <div style="padding:20px;border-radius:12px;background:linear-gradient(135deg,#10B981,#059669);color:#fff">
                    <div style="font-size:2rem;font-weight:800">${assigned}</div>
                    <div style="font-size:.85rem;opacity:.9">Đã gắn (${pct(assigned)}%)</div>
                    <div style="height:6px;background:rgba(255,255,255,.3);border-radius:3px;margin-top:8px"><div style="height:100%;width:${pct(assigned)}%;background:#fff;border-radius:3px"></div></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
                <div style="background:var(--bg-surface);border:1px solid var(--border-light);border-radius:12px;padding:20px">
                    <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">Theo phòng ban</h3>
                    ${Object.entries(byDept).sort((a,b) => b[1].total - a[1].total).map(([dept, data]) => `
                        <div style="margin-bottom:12px">
                            <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px"><span style="font-weight:600">${dept}</span><span style="color:var(--text-muted)">${data.total}</span></div>
                            <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--bg-base)">
                                <div style="width:${data.pending/data.total*100}%;background:#F59E0B" title="Chưa in: ${data.pending}"></div>
                                <div style="width:${data.printed/data.total*100}%;background:#3B82F6" title="Đã in: ${data.printed}"></div>
                                <div style="width:${data.assigned/data.total*100}%;background:#10B981" title="Đã gắn: ${data.assigned}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border-light);border-radius:12px;padding:20px">
                    <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">Theo tình trạng thiết bị</h3>
                    ${Object.entries(byStatus).sort((a,b) => b[1] - a[1]).map(([status, count]) => `
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                            <span style="font-size:.85rem;font-weight:600;min-width:100px">${status}</span>
                            <div style="flex:1;height:24px;background:var(--bg-base);border-radius:6px;overflow:hidden">
                                <div style="height:100%;width:${count/total*100}%;background:linear-gradient(90deg,#3B82F6,#2563EB);border-radius:6px"></div>
                            </div>
                            <span style="font-size:.85rem;font-weight:700;min-width:30px;text-align:right">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    /* ==================== TAB 3: MẪU NHÃN ==================== */
    const renderLabelsTab = (el) => {
        const sample = allDevices[0] || { device_code:'TVU-XX-000', name:'Tên thiết bị', brand:'Hãng', model:'Model', department_name:'Phòng ban', qr_code:'' };
        el.innerHTML = `
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Mẫu nhãn QR Code</h3>
            <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:1.5rem">Chọn kích thước nhãn phù hợp. Click vào mẫu để xem trước rồi in.</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem">
                ${[
                    { name:'Nhỏ (5x3cm)', w:'5cm', h:'3cm', qrW:'2cm', qrH:'2cm', fs:'8px', nfs:'10px', desc:'Phù hợp dán lên laptop, màn hình' },
                    { name:'Vừa (7x5cm)', w:'7cm', h:'5cm', qrW:'3cm', qrH:'3cm', fs:'10px', nfs:'12px', desc:'Phù hợp dán lên máy tính bàn, máy in' },
                    { name:'Lớn (10x7cm)', w:'10cm', h:'7cm', qrW:'4cm', qrH:'4cm', fs:'12px', nfs:'14px', desc:'Phù hợp dán lên tủ racks, server' }
                ].map(t => `
                    <div onclick="QRCodePage.printLabelSize('${sample.device_code}','${(sample.name||'').replace(/'/g,"\\'")}','${(sample.brand||'').replace(/'/g,"\\'")}','${(sample.model||'').replace(/'/g,"\\'")}','${(sample.department_name||'').replace(/'/g,"\\'")}','${sample.qr_code}','${t.w}','${t.h}','${t.qrW}','${t.qrH}','${t.fs}','${t.nfs}')" 
                        style="background:var(--bg-surface);border:2px solid var(--border-light);border-radius:12px;padding:20px;cursor:pointer;transition:all .2s;text-align:center" onmouseover="this.style.borderColor='#2563EB'" onmouseout="this.style.borderColor='var(--border-light)'">
                        <div style="border:2px dashed var(--border);border-radius:8px;padding:16px;display:inline-block;margin-bottom:12px">
                            ${sample.qr_code ? `<img src="${sample.qr_code}" style="width:${t.qrW};height:${t.qrH}">` : '<div style="width:60px;height:60px;background:var(--bg-base);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:.7rem">QR</div>'}
                            <div style="font-family:monospace;font-weight:700;font-size:${t.fs};margin-top:6px">${sample.device_code}</div>
                            <div style="font-size:${parseInt(t.fs)-1}px;color:var(--text-muted)">${sample.name||''}</div>
                        </div>
                        <div style="font-weight:700;font-size:.95rem;margin-bottom:4px">${t.name}</div>
                        <div style="font-size:.8rem;color:var(--text-muted)">${t.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const printLabelSize = (code, name, brand, model, dept, qrImg, w, h, qrW, qrH, fs, nfs, deviceId) => {
        const win = window.open('', '_blank');
        const updateAfterPrint = deviceId ? `if(window.opener&&window.opener.QRCodePage){window.opener.QRCodePage.updateStatus(${deviceId},'printed');}` : '';
        win.document.write(`<!DOCTYPE html><html><head><title>Nhãn QR - ${code}</title>
        <style>
            @media print{body{padding:0!important;margin:0!important;background:#fff!important}#confirmOverlay{display:none!important}}
            body{margin:0;padding:2cm;font-family:'Segoe UI',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5}
            .label{width:${w};box-sizing:border-box;border:2px solid #1e3a5f;border-radius:10px;background:#fff;display:flex;flex-direction:column}
            .label-header{background:linear-gradient(135deg,#1e3a5f,#2563EB);color:#fff;text-align:center;padding:10px 10px 8px;border-radius:8px 8px 0 0}
            .label-header .qr{width:${qrW};height:${qrH};margin:0 auto 6px;display:block;border-radius:4px;background:#fff;padding:4px}
            .label-header .code{font-family:monospace;font-weight:800;font-size:${fs};letter-spacing:1px}
            .label-body{padding:10px;text-align:center;flex:1}
            .label-body .name{font-weight:700;font-size:${parseInt(fs)-1}px;color:#1e3a5f;margin:0 0 4px;line-height:1.3}
            .label-body .info{font-size:${parseInt(fs)-2}px;color:#666;margin:2px 0}
            .label-footer{background:#f0f4f8;text-align:center;padding:6px;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;font-size:7px;color:#94a3b8;font-weight:600;letter-spacing:.5px}
        </style>
        </head><body>
        <div class="label">
            <div class="label-header">
                ${qrImg ? `<img src="${qrImg}" class="qr">` : ''}
                <div class="code">${code}</div>
            </div>
            <div class="label-body">
                <div class="name">${name}</div>
                ${brand || model ? `<div class="info">${[brand,model].filter(Boolean).join(' ')}</div>` : ''}
                ${dept ? `<div class="info">${dept}</div>` : ''}
            </div>
            <div class="label-footer">TVU-ITAM</div>
        </div>
        <div id="confirmOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999">
            <div style="background:#fff;border-radius:12px;padding:24px;text-align:center;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.2)">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" style="margin-bottom:12px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <h3 style="margin:0 0 8px;font-size:1rem;font-weight:700">Xác nhận in nhãn</h3>
                <p style="margin:0 0 16px;font-size:.85rem;color:#666">Bạn muốn in nhãn QR Code cho <strong>${code}</strong>?</p>
                <div style="display:flex;gap:8px;justify-content:center">
                    <button onclick="document.getElementById('confirmOverlay').remove();${updateAfterPrint}window.print();" style="padding:8px 20px;background:#2563EB;color:#fff;border:none;border-radius:8px;font-size:.85rem;font-weight:600;cursor:pointer">In</button>
                    <button onclick="window.close();" style="padding:8px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:.85rem;cursor:pointer">Hủy</button>
                </div>
            </div>
        </div>
        </body></html>`);
        win.document.close();
    };

    /* ==================== TAB 4: LỊCH SỬ QUÉT ==================== */
    const renderHistoryTab = async (el) => {
        el.innerHTML = '<div class="qr-loading"><div class="spinner"></div><p>Đang tải lịch sử quét...</p></div>';
        try {
            const res = await API.get('/devices/qr/scan-logs?limit=100');
            const logs = res.ok && res.data?.data ? res.data.data : [];
            if (!logs.length) {
                el.innerHTML = `
                    <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Lịch sử quét QR</h3>
                    <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:1.5rem">Ghi nhận các lần quét QR code để quản lý và kiểm tra.</p>
                    <div class="qr-empty">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <h3>Chưa có lịch sử quét nào</h3>
                        <p>Hãy quét mã QR thiết bị để bắt đầu ghi nhận</p>
                    </div>`;
                return;
            }
            const actionLabel = { view: 'Xem thông tin', update: 'Cập nhật thông tin' };
            const actionColor = { view: { bg:'#DBEAFE', text:'#1E40AF' }, update: { bg:'#D1FAE5', text:'#065F46' } };
            el.innerHTML = `
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Lịch sử quét QR</h3>
                <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:1.5rem">Ghi nhận ${logs.length} lần quét gần nhất.</p>
                <div class="qr-table-wrap">
                <table class="qr-table">
                    <thead><tr>
                        <th>Thời gian</th><th>Mã TB</th><th>Tên thiết bị</th><th style="text-align:center">Hành động</th><th>Người quét</th><th>Chi tiết</th><th>IP</th>
                    </tr></thead>
                    <tbody>${logs.map(l => {
                        const ac = actionColor[l.action] || actionColor.view;
                        const ts = l.scanned_at ? new Date(l.scanned_at).toLocaleString('vi-VN') : '—';
                        let detail = '—';
                        if (l.action === 'update' && l.updated_fields) {
                            try { const f = JSON.parse(l.updated_fields); detail = Object.entries(f).map(([k,v]) => `${k}: ${v}`).join(', '); } catch (_) { detail = l.updated_fields; }
                        }
                        return `<tr>
                            <td style="font-size:.78rem;white-space:nowrap">${ts}</td>
                            <td><span style="font-family:monospace;font-weight:700">${l.device_code||'—'}</span></td>
                            <td>${l.device_name||'—'}</td>
                            <td style="text-align:center"><span class="qr-badge" style="background:${ac.bg};color:${ac.text}">${actionLabel[l.action]||l.action}</span></td>
                            <td style="font-size:.78rem">${l.user_name||'Khách'}</td>
                            <td style="font-size:.78rem;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${detail}">${detail}</td>
                            <td style="font-size:.75rem;color:var(--text-muted);font-family:monospace">${l.ip_address||'—'}</td>
                        </tr>`;
                    }).join('')}</tbody>
                </table></div>`;
        } catch (e) {
            el.innerHTML = '<div class="qr-empty"><h3>Lỗi tải lịch sử quét</h3><p>Vui lòng thử lại</p></div>';
        }
    };

    /* ==================== TAB 5: QUÉT QR ==================== */
    const renderScannerTab = (el) => {
        el.innerHTML = `
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Quét mã QR</h3>
            <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:1.5rem">Sử dụng camera để quét mã QR và tra cứu thông tin thiết bị.</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
                <div style="background:var(--bg-surface);border:1px solid var(--border-light);border-radius:12px;padding:20px;text-align:center">
                    <div id="scannerBox" style="width:300px;height:300px;margin:0 auto;border:3px dashed var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;background:#000;position:relative;overflow:hidden">
                        <video id="qrVideo" style="width:100%;height:100%;object-fit:cover;display:none"></video>
                        <div id="scannerPlaceholder" style="text-align:center;color:#999">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5">${icon.scan}</svg>
                            <p style="margin-top:8px;font-size:.85rem">Nhấn "Bắt đầu" để quét</p>
                        </div>
                    </div>
                    <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
                        <button onclick="QRCodePage.startScanner()" id="scannerStartBtn" class="qr-btn qr-btn-primary">Bắt đầu</button>
                        <button onclick="QRCodePage.stopScanner()" id="scannerStopBtn" class="qr-btn qr-btn-outline" style="display:none">Dừng</button>
                    </div>
                </div>
                <div id="scannerResult" style="background:var(--bg-surface);border:1px solid var(--border-light);border-radius:12px;padding:20px">
                    <div style="text-align:center;color:var(--text-muted);padding:2rem">
                        <p style="font-size:.9rem">Kết quả sẽ hiển thị ở đây</p>
                        <p style="font-size:.8rem;margin-top:4px">Hoặc nhập mã thủ công:</p>
                        <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
                            <input type="text" id="manualCode" placeholder="TVU-XX-000" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;width:180px">
                            <button onclick="QRCodePage.manualLookup()" class="qr-btn qr-btn-primary">Tra cứu</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    let scannerStream = null;
    const startScanner = async () => {
        try {
            const video = document.getElementById('qrVideo');
            const placeholder = document.getElementById('scannerPlaceholder');
            scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = scannerStream;
            video.play();
            video.style.display = 'block';
            placeholder.style.display = 'none';
            document.getElementById('scannerStartBtn').style.display = 'none';
            document.getElementById('scannerStopBtn').style.display = '';
            Toast.success('Camera đã bật. Hướng camera vào mã QR.');
        } catch (err) {
            Toast.error('Không thể truy cập camera: ' + err.message);
        }
    };

    const stopScanner = () => {
        if (scannerStream) { scannerStream.getTracks().forEach(t => t.stop()); scannerStream = null; }
        const video = document.getElementById('qrVideo');
        const placeholder = document.getElementById('scannerPlaceholder');
        if (video) { video.style.display = 'none'; video.srcObject = null; }
        if (placeholder) placeholder.style.display = '';
        const startBtn = document.getElementById('scannerStartBtn');
        const stopBtn = document.getElementById('scannerStopBtn');
        if (startBtn) startBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = 'none';
    };

    const lookupDevice = async (code) => {
        const resultEl = document.getElementById('scannerResult');
        resultEl.innerHTML = '<div class="qr-loading"><div class="spinner"></div><p>Đang tìm...</p></div>';
        try {
            const res = await API.get(`/public/qr/${encodeURIComponent(code)}`);
            if (res.ok && res.data?.data) {
                const d = res.data.data;
                const sc = qrStatusColor[d.qr_status] || qrStatusColor.pending;
                currentDevice = d;
                try { await API.post('/devices/qr/scan-log', { device_id: d.id, action: 'view' }); } catch (_) {}
                resultEl.innerHTML = `
                    <div style="text-align:center;margin-bottom:12px"><img src="${d.qr_code || ''}" style="width:100px;height:100px;border-radius:8px;border:1px solid var(--border-light)"></div>
                    <div style="font-family:monospace;font-weight:700;font-size:1rem;text-align:center">${d.device_code}</div>
                    <div style="font-weight:600;text-align:center;margin:4px 0">${d.name}</div>
                    <div style="display:flex;gap:6px;justify-content:center;margin:8px 0"><span class="qr-badge" style="background:${sc.bg};color:${sc.text}">${qrStatusLabel[d.qr_status]||'N/A'}</span></div>
                    <div style="font-size:.82rem;color:var(--text-muted);margin-top:12px">
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light)"><span>Hãng/Model</span><span style="font-weight:600">${[d.brand,d.model].filter(Boolean).join(' ')||'—'}</span></div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light)"><span>Phòng ban</span><span style="font-weight:600">${d.department_name||'—'}</span></div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light)"><span>Vị trí</span><span style="font-weight:600">${d.location||'—'}</span></div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Bảo hành</span><span style="font-weight:600">${d.warranty_expiry ? new Date(d.warranty_expiry).toLocaleDateString('vi-VN') : '—'}</span></div>
                    </div>
                    <div style="margin-top:16px;border-top:1px solid var(--border-light);padding-top:12px">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                            <span style="font-size:.85rem;font-weight:700">Cập nhật thông tin</span>
                            <button onclick="QRCodePage.toggleUpdateForm()" id="toggleUpdateBtn" class="qr-btn qr-btn-outline" style="font-size:.75rem;padding:4px 10px">Sửa</button>
                        </div>
                        <div id="scanUpdateForm" style="display:none">
                            <div style="margin-bottom:8px"><label style="font-size:.78rem;font-weight:600;display:block;margin-bottom:3px">Vị trí</label><input type="text" id="scanLocation" value="${d.location||''}" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.82rem;box-sizing:border-box"></div>
                            <div style="margin-bottom:8px"><label style="font-size:.78rem;font-weight:600;display:block;margin-bottom:3px">Tình trạng</label><select id="scanStatus" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.82rem;box-sizing:border-box;background:var(--bg-surface)"><option value="active" ${d.status==='active'?'selected':''}>Đang dùng</option><option value="maintenance" ${d.status==='maintenance'?'selected':''}>Bảo trì</option><option value="broken" ${d.status==='broken'?'selected':''}>Hỏng</option><option value="disposed" ${d.status==='disposed'?'selected':''}>Thanh lý</option><option value="inactive" ${d.status==='inactive'?'selected':''}>Không dùng</option></select></div>
                            <div style="margin-bottom:8px"><label style="font-size:.78rem;font-weight:600;display:block;margin-bottom:3px">Trạng thái QR</label><select id="scanQRStatus" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.82rem;box-sizing:border-box;background:var(--bg-surface)"><option value="pending" ${d.qr_status==='pending'?'selected':''}>Chưa in</option><option value="printed" ${d.qr_status==='printed'?'selected':''}>Đã in</option><option value="assigned" ${d.qr_status==='assigned'?'selected':''}>Đã gắn</option></select></div>
                            <div style="margin-bottom:8px"><label style="font-size:.78rem;font-weight:600;display:block;margin-bottom:3px">Ghi chú</label><textarea id="scanNotes" rows="2" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.82rem;box-sizing:border-box;resize:vertical"></textarea></div>
                            <button onclick="QRCodePage.submitScanUpdate(${d.id})" class="qr-btn qr-btn-primary" style="width:100%;justify-content:center">Cập nhật</button>
                        </div>
                    </div>`;
            } else {
                resultEl.innerHTML = `<div class="qr-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><h3 style="color:#EF4444">Không tìm thấy thiết bị</h3><p>Mã: <strong>${code}</strong></p></div>`;
            }
        } catch (e) {
            resultEl.innerHTML = `<div class="qr-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><h3 style="color:#EF4444">Lỗi tra cứu</h3><p>Vui lòng thử lại</p></div>`;
        }
    };

    const toggleUpdateForm = () => {
        const form = document.getElementById('scanUpdateForm');
        const btn = document.getElementById('toggleUpdateBtn');
        if (form) {
            const visible = form.style.display !== 'none';
            form.style.display = visible ? 'none' : 'block';
            if (btn) btn.textContent = visible ? 'Sửa' : 'Đóng';
        }
    };

    const submitScanUpdate = async (deviceId) => {
        const data = {
            device_id: deviceId,
            location: document.getElementById('scanLocation')?.value || undefined,
            status: document.getElementById('scanStatus')?.value || undefined,
            qr_status: document.getElementById('scanQRStatus')?.value || undefined,
            notes: document.getElementById('scanNotes')?.value || undefined
        };
        try {
            const res = await API.put('/devices/qr/scan-update', data);
            if (res.ok) {
                Toast.success('Cập nhật thành công');
                toggleUpdateForm();
                const d = allDevices.find(x => x.id === deviceId);
                if (d) { if (data.location) d.location = data.location; if (data.status) d.status = data.status; if (data.qr_status) d.qr_status = data.qr_status; }
            } else { Toast.error(res.data?.message || 'Lỗi cập nhật'); }
        } catch (e) { Toast.error('Lỗi cập nhật'); }
    };

    const manualLookup = () => {
        const code = document.getElementById('manualCode')?.value?.trim();
        if (!code) { Toast.error('Nhập mã thiết bị'); return; }
        lookupDevice(code);
    };

    /* ==================== SHARED ==================== */
    const filter = () => {
        const sv = document.getElementById('qrSearch')?.value?.toLowerCase() || '';
        const st = document.getElementById('qrStatusFilter')?.value || '';
        const qs = document.getElementById('qrStatusTypeFilter')?.value || '';
        const dept = document.getElementById('qrDeptFilter')?.value || '';
        filtered = allDevices.filter(d => {
            if (sv && ![d.name,d.device_code,d.brand,d.model,d.serial_number].some(v => v?.toLowerCase().includes(sv))) return false;
            if (st && d.status !== st) return false;
            if (qs && d.qr_status !== qs) return false;
            if (dept && d.department_id != dept) return false;
            return true;
        });
        renderData();
    };

    const toggleSelect = (id) => {
        selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
        renderData();
    };

    const selectAll = () => {
        if (selectedIds.size === filtered.length) selectedIds.clear();
        else filtered.forEach(d => selectedIds.add(d.id));
        renderData();
    };

    const updateSelectedCount = () => {
        const c = selectedIds.size;
        const sc = document.getElementById('qrBulkCount');
        const si = document.getElementById('qrSelectedInfo');
        const btn = document.getElementById('qrBulkBtn');
        if (sc) sc.textContent = c;
        if (si) si.textContent = c;
        if (btn) btn.disabled = c === 0;
    };

    const updateStatus = async (id, qr_status) => {
        try {
            const res = await API.put('/devices/qr/status', { id, qr_status });
            if (res.ok) {
                const d = allDevices.find(x => x.id === id);
                if (d) d.qr_status = qr_status;
                Toast.success(`Đã cập nhật: ${qrStatusLabel[qr_status]}`);
            } else { Toast.error(res.data?.message || 'Lỗi'); }
        } catch (e) { Toast.error('Lỗi cập nhật'); }
    };

    const downloadSingle = async (id, code) => {
        try {
            const token = API.getToken();
            const res = await fetch(`/api/devices/${id}/qrcode.png?token=${encodeURIComponent(token)}`);
            if (!res.ok) { Toast.error('Tải QR thất bại'); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `QR_${code}.png`; a.click();
            URL.revokeObjectURL(url);
            Toast.success(`Đã tải QR_${code}.png`);
        } catch (e) { Toast.error('Lỗi tải file'); }
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url).then(() => Toast.success('Đã copy link QR')).catch(() => Toast.error('Không thể copy'));
    };

    const bulkDownload = async () => {
        if (!selectedIds.size) { Toast.error('Vui lòng chọn thiết bị'); return; }
        try {
            const token = API.getToken();
            const ids = Array.from(selectedIds).join(',');
            Toast.success('Đang tải file ZIP...');
            const res = await fetch(`/api/devices/qr/bulk-download?ids=${ids}&token=${encodeURIComponent(token)}`);
            if (!res.ok) { Toast.error('Tải QR thất bại'); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `QR_Codes_${new Date().toISOString().slice(0,10)}.zip`; a.click();
            URL.revokeObjectURL(url);
            Toast.success('Đã tải file ZIP');
        } catch (e) { Toast.error('Lỗi tải file ZIP'); }
    };

    const printLabel = (code, name, brand, model, dept, qrImg, deviceId) => printLabelSize(code, name, brand, model, dept, qrImg, '7cm','5cm','3cm','3cm','10px','12px', deviceId);

    return { render, switchTab, filter, toggleSelect, selectAll, setViewMode, setStatFilter, updateStatus, downloadSingle, copyLink, bulkDownload, printLabel, printLabelSize, showFullQR, startScanner, stopScanner, manualLookup, lookupDevice, toggleUpdateForm, submitScanUpdate };
})();
