window.DevicesPage = (() => {
    let allDevices = [], categories = [], departments = [], users = [];
    let filtered = [], viewMode = 'table';
    let editingId = null;
    let selectedImageFile = null;
    let statFilter = '';

    const statusOpts = ['active','maintenance','broken','disposed','inactive'];
    const statusLabel = { active:'Đang dùng', maintenance:'Bảo trì', broken:'Hỏng', disposed:'Thanh lý', inactive:'Không dùng' };

    const specTemplates = {
        1: [ // Máy tính để bàn
            { key: 'CPU', val: '' }, { key: 'RAM', val: '' }, { key: 'Ổ cứng', val: '' },
            { key: 'Hệ điều hành', val: '' }, { key: 'Card đồ họa', val: '' }, { key: 'Kích thước màn hình', val: '' },
        ],
        2: [ // Máy tính xách tay
            { key: 'CPU', val: '' }, { key: 'RAM', val: '' }, { key: 'Ổ cứng', val: '' },
            { key: 'Hệ điều hành', val: '' }, { key: 'Card đồ họa', val: '' }, { key: 'Kích thước màn hình', val: '' },
            { key: 'Trọng lượng', val: '' }, { key: 'Pin', val: '' },
        ],
        3: [ // Máy chủ
            { key: 'CPU', val: '' }, { key: 'Số nhân', val: '' }, { key: 'RAM', val: '' },
            { key: 'Ổ cứng', val: '' }, { key: 'Hệ điều hành', val: '' }, { key: 'Nguồn', val: '' },
            { key: 'IP Quản trị', val: '' },
        ],
        4: [ // Thiết bị mạng
            { key: 'Loại', val: '' }, { key: 'Số cổng', val: '' }, { key: 'Tốc độ', val: '' },
            { key: 'Chuẩn', val: '' }, { key: 'PoE', val: '' }, { key: 'IP Quản lý', val: '' },
        ],
        5: [ // Máy in
            { key: 'Loại máy in', val: '' }, { key: 'Độ phân giải', val: '' }, { key: 'Tốc độ in', val: '' },
            { key: 'Khổ giấy', val: '' }, { key: 'Kết nối', val: '' },
        ],
        6: [ // Màn hình
            { key: 'Kích thước', val: '' }, { key: 'Độ phân giải', val: '' }, { key: 'Tần số quét', val: '' },
            { key: 'Tấm nền', val: '' }, { key: 'Cổng kết nối', val: '' },
        ],
        7: [ // Máy chiếu
            { key: 'Độ sáng (ANSI)', val: '' }, { key: 'Độ phân giải', val: '' }, { key: 'Tuổi thọ bóng đèn', val: '' },
            { key: 'Kết nối', val: '' },
        ],
        8: [ // UPS
            { key: 'Công suất (VA)', val: '' }, { key: 'Công suất (W)', val: '' }, { key: 'Số ngõ ra', val: '' },
            { key: 'Thời gian dự phòng', val: '' }, { key: 'Loại pin', val: '' },
        ],
        9: [ // Thiết bị lưu trữ
            { key: 'Loại', val: '' }, { key: 'Dung lượng', val: '' }, { key: 'Giao tiếp', val: '' },
            { key: 'Tốc độ đọc/ghi', val: '' },
        ],
        10: [ // Thiết bị ngoại vi
            { key: 'Loại', val: '' }, { key: 'Kết nối', val: '' }, { key: 'Tương thích', val: '' },
        ],
    };

    const fillSpecsByCategory = (catId) => {
        const container = document.getElementById('specsContainer');
        if (!container) return;
        const template = specTemplates[parseInt(catId)];
        if (!template) return;
        container.innerHTML = template.map(s => `
            <div class="spec-row" style="display:flex;gap:8px;margin-bottom:8px">
                <input class="form-control spec-key" placeholder="Tên thông số" value="${s.key}" style="flex:1.2;padding:.5rem .7rem;font-size:.82rem">
                <input class="form-control spec-val" placeholder="Giá trị" value="${s.val}" style="flex:2;padding:.5rem .7rem;font-size:.82rem">
                <button type="button" title="Xóa thông số" class="spec-remove-btn" onclick="this.parentElement.remove()" style="width:34px;height:34px;border-radius:6px;border:1px solid #FECACA;background:#FEF2F2;color:#DC2626;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`).join('');
    };

    const getCategoryIcon = (catId) => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return '📦';
        const map = { laptop:'💻', desktop:'🖥️', server:'🖥️', wifi:'🖧', printer:'🖨️', monitor:'🖥️', projector:'📽️', battery:'🔋', 'hard-drive':'💾', keyboard:'⌨️' };
        return map[cat.icon] || cat.icon || '📦';
    };

    const load = async (queryParams = {}) => {
        const qs = Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams).toString() : '';
        const [devRes, catRes, deptRes, usrRes] = await Promise.all([
            API.get('/devices' + qs), API.get('/categories'), API.get('/departments'), API.get('/users')
        ]);
        if (devRes.ok) allDevices = devRes.data.data || [];
        if (catRes.ok) categories = catRes.data.data || [];
        if (deptRes.ok) departments = deptRes.data.data || [];
        if (usrRes.ok) users = usrRes.data.data || [];
        filtered = allDevices.filter(d => d.status !== 'disposed');
    };

    const getFilterParams = () => {
        const p = {};
        const search = document.getElementById('devSearch')?.value.trim();
        const status = document.getElementById('devStatusFilter')?.value;
        const cat = document.getElementById('devCatFilter')?.value;
        const dept = document.getElementById('devDeptFilter')?.value;
        if (search) p.search = search;
        if (status) p.status = status;
        if (cat) p.category_id = cat;
        if (dept) p.department_id = dept;
        ['advPriceMin','advPriceMax','advDateFrom','advDateTo','advModel','advSerial'].forEach(id => {
            const v = document.getElementById(id)?.value.trim();
            if (v) p[id.replace('adv', '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')] = v;
        });
        return p;
    };

    const applyFilter = () => {
        const params = getFilterParams();
        const currentUser = App.getCurrentUser();
        filtered = allDevices.filter(d => {
            const s = params.search?.toLowerCase() || '';
            if (!params.status && d.status === 'disposed') return false;
            if (currentUser?.role === 'user' && d.assigned_user_id !== currentUser.id) return false;
            if (statFilter && d.status !== statFilter) return false;
            return (!s || d.name?.toLowerCase().includes(s) || d.device_code?.toLowerCase().includes(s) || d.brand?.toLowerCase().includes(s))
                && (!params.status || d.status === params.status)
                && (!params.category_id || String(d.category_id) === params.category_id)
                && (!params.department_id || String(d.department_id) === params.department_id)
                && (!params.purchase_price_min || (d.purchase_price && Number(d.purchase_price) >= Number(params.purchase_price_min)))
                && (!params.purchase_price_max || (d.purchase_price && Number(d.purchase_price) <= Number(params.purchase_price_max)))
                && (!params.purchase_date_from || (d.purchase_date && new Date(d.purchase_date) >= new Date(params.purchase_date_from)))
                && (!params.purchase_date_to || (d.purchase_date && new Date(d.purchase_date) <= new Date(params.purchase_date_to)))
                && (!params.model || (d.model && d.model.toLowerCase().includes(params.model.toLowerCase())))
                && (!params.serial_number || (d.serial_number && d.serial_number.toLowerCase().includes(params.serial_number.toLowerCase())));
        });
        renderList();
        const el = document.getElementById('devCount');
        if (el) el.textContent = `${filtered.length} thiết bị`;
        document.querySelectorAll('#devStats .dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`#devStats .dash-stat-card[data-stat="${statFilter}"]`)?.classList.add('active');
    };

    const renderStats = () => {
        const st = document.getElementById('devStats');
        if (!st) return;
        const all = allDevices.filter(d => d.status !== 'disposed').length;
        const active = allDevices.filter(d => d.status === 'active').length;
        const maintenance = allDevices.filter(d => d.status === 'maintenance').length;
        const broken = allDevices.filter(d => d.status === 'broken').length;

        const cards = [
            { value: all, label: 'Tổng số', filter: '', icon: 'device', gradient: 'linear-gradient(135deg,#4338CA,#4F46E5)' },
            { value: active, label: 'Đang dùng', filter: 'active', icon: 'check', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
            { value: maintenance, label: 'Bảo trì', filter: 'maintenance', icon: 'clock', gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
            { value: broken, label: 'Hỏng', filter: 'broken', icon: 'x', gradient: 'linear-gradient(135deg,#818CF8,#A5B4FC)' },
        ];

        st.innerHTML = cards.map((c, i) => `
            <div class="dash-stat-card card-anim-${i+1}" data-stat="${c.filter}" onclick="DevicesPage.setStatFilter('${c.filter}')" style="cursor:pointer;--stat-gradient:${c.gradient}">
                <div class="dash-stat-icon" style="background:${c.gradient}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${c.icon === 'device' ? '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>' :
                        c.icon === 'check' ? '<polyline points="20 6 9 17 4 12"/>' :
                        c.icon === 'clock' ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' :
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

    const setStatFilter = (value) => {
        statFilter = statFilter === value ? '' : value;
        applyFilter();
    };

    const renderList = () => {
        const container = document.getElementById('devicesList');
        if (!container) return;
        const user = App.getCurrentUser();
        const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
        if (!filtered.length) {
            const deptVal = document.getElementById('devDeptFilter')?.value;
            container.innerHTML = `<div class="dev-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <h3>${!isAdmin && deptVal && deptVal != user.department_id ? 'Truy cập bị từ chối' : 'Không tìm thấy thiết bị'}</h3>
                <p>${!isAdmin && deptVal && deptVal != user.department_id ? 'Nhân viên phòng ban này không được xem tài sản của phòng ban khác.' : 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'}</p>
            </div>`;
            return;
        }
        if (viewMode === 'grid') {
            container.innerHTML = `<div class="dev-grid">${filtered.map(d => deviceCard(d)).join('')}</div>`;
        } else {
            container.innerHTML = `<table class="dev-table">
                <thead><tr><th>Mã TB</th><th>Tên thiết bị</th><th>Loại</th><th>Phòng ban</th><th>Tình trạng</th><th>Bảo hành</th><th>Ngày mua</th><th style="text-align:right">Thao tác</th></tr></thead>
                <tbody>${filtered.map(d => deviceRow(d)).join('')}</tbody>
            </table>`;
        }
        container.querySelectorAll('.dev-tr, .dev-grid-card').forEach(el => el.addEventListener('click', function(e) {
            if (e.target.closest('[data-edit]') || e.target.closest('[data-delete]')) return;
            openDetail(this.dataset.view);
        }));
        container.querySelectorAll('[data-edit]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); openModal(el.dataset.edit); }));
        container.querySelectorAll('[data-delete]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); deleteDevice(el.dataset.delete); }));
    };

    const deviceCard = (d) => `
        <div class="dev-grid-card" data-view="${d.id}">
            <div class="dev-grid-img">
                ${d.image_url
                    ? `<img src="${d.image_url}" alt="${d.name}">`
                    : `<span class="dev-grid-placeholder">${getCategoryIcon(d.category_id)}</span>`}
                <span class="dev-grid-badge"><span class="dev-badge dev-badge-${d.status}">${statusLabel[d.status]}</span></span>
            </div>
            <div class="dev-grid-body">
                <div class="dev-grid-name">${d.name}</div>
                <div class="dev-grid-brand">${[d.brand,d.model].filter(Boolean).join(' ') || '—'}</div>
                <div class="dev-grid-footer">
                    <span class="dev-grid-dept">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        ${d.department_name||'—'}
                    </span>
                    <span class="dev-grid-code">${d.device_code}</span>
                </div>
            </div>
        </div>`;

    const deviceRow = (d) => {
        const user = App.getCurrentUser();
        const canEdit = user?.role === 'superadmin' || user?.role === 'admin';
        const canDelete = user?.role === 'superadmin';
        const days = d.warranty_expiry ? Math.ceil((new Date(d.warranty_expiry) - new Date()) / 86400000) : null;
        const statColors = { active: { dot: '#047857', bg: '#D1FAE5', text: '#000000' }, maintenance: { dot: '#B45309', bg: '#FEF3C7', text: '#000000' }, broken: { dot: '#DC2626', bg: '#FEE2E2', text: '#000000' }, disposed: { dot: '#6B7280', bg: '#E5E7EB', text: '#000000' }, inactive: { dot: '#9CA3AF', bg: '#F3F4F6', text: '#000000' } };
        const sc = statColors[d.status] || statColors.active;
        const warColor = days <= 30 ? '#EF4444' : days <= 90 ? '#F59E0B' : '#6B7280';
        return `<tr class="dev-tr" data-view="${d.id}">
            <td class="dev-td-code" data-label="Mã TB"><span class="dev-code">${d.device_code}</span></td>
            <td class="dev-td-name" data-label="Tên TB">
                <div class="dev-name-cell">
                    ${d.image_url
                        ? `<img src="${d.image_url}" class="dev-name-avatar" alt="">`
                        : `<div class="dev-name-icon">${getCategoryIcon(d.category_id)}</div>`}
                    <div>
                        <div class="dev-name-text">${d.name}</div>
                        <div class="dev-name-sub">${[d.brand,d.model].filter(Boolean).join(' ') || '—'}</div>
                    </div>
                </div>
            </td>
            <td data-label="Loại"><span class="dev-cat-chip">${d.category_name||'—'}</span></td>
            <td data-label="Phòng ban"><span class="dev-dept-text">${d.department_name||'—'}</span></td>
            <td data-label="Tình trạng"><span class="dev-status-pill" style="background:${sc.bg};color:${sc.text};font-weight:700"><span class="dev-status-dot" style="background:${sc.dot}"></span>${statusLabel[d.status]}</span></td>
            <td data-label="Bảo hành">${d.warranty_expiry ? `<span style="color:${warColor};font-weight:600;font-size:.8rem">${fmt.date(d.warranty_expiry)}</span>${days <= 90 ? `<span class="dev-war-days" style="color:#fff;background:${warColor}">${days} ngày</span>` : ''}` : '<span style="color:#94a3b8">—</span>'}</td>
            <td class="dev-td-date" data-label="Ngày mua">${fmt.date(d.purchase_date)}</td>
            <td class="dev-td-actions" data-label="Thao tác">
                <button class="dev-action-btn" data-view="${d.id}" title="Chi tiết">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                ${canEdit ? `<button class="dev-action-btn" data-edit="${d.id}" title="Chỉnh sửa">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>` : ''}
                ${canDelete ? `<button class="dev-action-btn dev-action-danger" data-delete="${d.id}" title="Xóa">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>` : ''}
            </td>
        </tr>`;
    };

    const openDetail = async (id) => {
        const res = await API.get('/devices/' + id);
        if (!res.ok) { Toast.error('Không thể tải chi tiết'); return; }
        const d = res.data.data;
        const user = App.getCurrentUser();
        const canEdit = user?.role === 'superadmin' || user?.role === 'admin';

        let specs = '';
        try {
            const s = typeof d.specs === 'string' ? JSON.parse(d.specs) : d.specs;
            if (s) specs = Object.entries(s).map(([k,v]) => `
                <div class="detail-spec-row">
                    <span class="detail-spec-key">${k}</span>
                    <span class="detail-spec-val">${v}</span>
                </div>`).join('');
        } catch(e) {}

        const stColors = { active:'#059669', maintenance:'#D97706', broken:'#DC2626', disposed:'#6B7280', inactive:'#9CA3AF' };
        const stBg = { active:'#ECFDF5', maintenance:'#FFFBEB', broken:'#FEF2F2', disposed:'#F9FAFB', inactive:'#F3F4F6' };
        const stLabel = { active:'Đang dùng', maintenance:'Bảo trì', broken:'Hỏng', disposed:'Thanh lý', inactive:'Không dùng' };
        const sc = stColors[d.status] || '#6B7280';
        const sb = stBg[d.status] || '#F3F4F6';

        const infoFields = [
            { label:'Mã thiết bị', val: d.device_code, highlight:'primary' },
            { label:'Phòng ban', val: d.department_name || '—' },
            { label:'Vị trí', val: d.location || '—' },
            { label:'Giá trị', val: fmt.currency(d.purchase_price), highlight:'accent' },
            { label:'Ngày mua', val: fmt.date(d.purchase_date) },
            { label:'Bảo hành', val: fmt.date(d.warranty_expiry) },
            { label:'Serial', val: d.serial_number || '—' },
            { label:'Người dùng', val: d.assigned_user_name || 'Chưa bàn giao' },
        ];

        const maintItems = d.maintenance_history?.slice(0,4) || [];
        const maintStatusColors = { pending:'#F59E0B', in_progress:'#3B82F6', completed:'#10B981', cancelled:'#6B7280' };
        const maintStatusBg = { pending:'#FFFBEB', in_progress:'#EFF6FF', completed:'#ECFDF5', cancelled:'#F3F4F6' };
        const fmtMaintStatus = { pending:'Chờ', in_progress:'Đang làm', completed:'Xong', cancelled:'Hủy' };

        const stSvg = { active:'<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>', maintenance:'<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>', broken:'<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>', disposed:'<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>', inactive:'<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>' };

        showModal(`
            <div style="display:flex;align-items:center;gap:14px;border-left:4px solid ${sc};padding-left:12px">
                <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,${sb},white);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px ${sc}20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${sc}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                        <span class="modal-title" style="font-size:1.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</span>
                        <span style="display:inline-flex;align-items:center;gap:5px;font-size:.68rem;font-weight:700;padding:3px 12px;border-radius:20px;background:${sb};color:#000;flex-shrink:0;border:1px solid ${sc}30">
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="${sc}"><circle cx="12" cy="12" r="10"/></svg>
                            ${stLabel[d.status]}
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;font-size:.78rem;color:var(--text-secondary)">
                        <span style="font-family:monospace;font-weight:600">${d.device_code}</span>
                        <span style="color:var(--border)">•</span>
                        <span>${d.category_name||'Không phân loại'}</span>
                        ${d.brand ? `<span style="color:var(--border)">•</span><span>${d.brand}</span>` : ''}
                    </div>
                </div>
            </div>`, `
            <div class="detail-body">
                <div class="detail-hero" style="padding:1.25rem;margin:0;border-radius:16px;background:linear-gradient(135deg,var(--bg-base),#FAFBFC)">
                    <div class="detail-image-wrap" style="border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,.06);width:240px;height:190px">
                        ${d.image_url
                            ? `<img src="${d.image_url}" alt="${d.name}">`
                            : `<div class="detail-image-placeholder" style="background:white"><span>${getCategoryIcon(d.category_id)}</span><small>${d.category_name||'Chưa có ảnh'}</small></div>`}
                    </div>
                    <div class="detail-info-grid" style="gap:8px;grid-template-columns:1fr 1fr">
                        ${infoFields.map(f => `
                            <div class="detail-info-item" style="padding:10px 14px;border-radius:10px;background:var(--bg-surface);border:1px solid var(--border-light);box-shadow:0 1px 3px rgba(0,0,0,.02);transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.06)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,.02)'">
                                <div class="detail-info-label" style="font-size:.7rem;font-weight:600;color:var(--text-muted);margin-bottom:2px">${f.label}</div>
                                <div class="detail-info-value" style="font-size:.9rem;font-weight:700;color:var(--text-primary)"${f.highlight ? ` data-highlight="${f.highlight}"` : ''}>${f.val}</div>
                            </div>`).join('')}
                    </div>
                </div>

                <div class="detail-sections" style="padding:0 1.25rem;margin-top:14px">
                    <div class="detail-section" style="border-radius:14px;border:1px solid var(--border-light);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.03)">
                        <div class="detail-section-header" style="padding:12px 16px;background:linear-gradient(135deg,#F5F3FF,white);border-bottom:1px solid var(--border-light)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                            <span class="detail-section-title" style="font-size:.85rem;font-weight:700;color:#4338CA">Thông số cấu hình</span>
                        </div>
                        <div class="detail-section-body" style="padding:4px 0">
                            ${specs || `<div class="detail-section-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg><p>Chưa có thông số</p></div>`}
                        </div>
                    </div>
                    <div class="detail-section" style="border-radius:14px;border:1px solid var(--border-light);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.03)">
                        <div class="detail-section-header" style="padding:12px 16px;background:linear-gradient(135deg,#FFFBEB,white);border-bottom:1px solid var(--border-light)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span class="detail-section-title" style="font-size:.85rem;font-weight:700;color:#B45309">Lịch sử bảo trì</span>
                            ${maintItems.length ? `<span class="detail-section-badge" style="font-size:.65rem;font-weight:700;padding:2px 10px;border-radius:100px;background:#FEF3C7;color:#92400E">${maintItems.length} mục</span>` : ''}
                        </div>
                        <div class="detail-section-body" style="padding:4px 0">
                            ${maintItems.length ? maintItems.map(m => {
                                const mc = maintStatusColors[m.status]||'#6B7280';
                                const mb = maintStatusBg[m.status]||'#F3F4F6';
                                return `
                                <div class="detail-maint-item" style="padding:12px 16px;border-bottom:1px solid var(--border-light);transition:background .15s" onmouseover="this.style.background='#FAFBFC'" onmouseout="this.style.background=''">
                                    <div class="detail-maint-top">
                                        <div class="detail-maint-left">
                                            <span class="detail-maint-dot" style="width:8px;height:8px;border-radius:50%;background:${mc};flex-shrink:0;box-shadow:0 0 0 3px ${mc}20"></span>
                                            <span class="detail-maint-date" style="font-size:.8rem;font-weight:700;color:var(--text-primary)">${fmt.date(m.request_date)}</span>
                                        </div>
                                        <span class="detail-maint-status" style="font-size:.65rem;font-weight:700;padding:2px 10px;border-radius:100px;background:${mb};color:${mc}">${fmtMaintStatus[m.status]||m.status}</span>
                                    </div>
                                    <div class="detail-maint-desc" style="font-size:.8rem;color:var(--text-secondary);margin-top:4px;line-height:1.5;padding-left:20px">${m.description||'Không có mô tả'}</div>
                                </div>`;
                            }).join('')
                            : `<div class="detail-section-empty" style="padding:28px 16px;text-align:center"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" style="opacity:.5;margin-bottom:6px"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p style="color:var(--text-muted);font-size:.85rem">Chưa có hoạt động bảo trì</p></div>`}
                        </div>
                    </div>
                </div>

                ${d.notes ? `
                <div class="detail-notes" style="margin:14px 1.25rem 0;background:linear-gradient(135deg,#FFFBEB,white);border:1px solid #FDE68A;border-radius:12px;padding:14px 16px">
                    <div class="detail-notes-header" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span style="font-size:.8rem;font-weight:700;color:#92400E">Ghi chú</span>
                    </div>
                    <div class="detail-notes-text" style="font-size:.82rem;color:#78716C;line-height:1.6">${d.notes}</div>
                </div>` : ''}

                <div class="detail-footer" style="display:flex;align-items:center;justify-content:space-between;padding:14px 1.25rem 6px;gap:8px;flex-wrap:wrap;border-top:1px solid var(--border-light);margin-top:14px">
                    <div class="detail-footer-left" style="display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--text-muted)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${fmt.date(d.updated_at)}
                        <span class="detail-footer-divider" style="color:var(--border);margin:0 4px">|</span>
                        <span style="font-weight:600">ID #${d.id}</span>
                    </div>
                    <div class="detail-footer-right" style="display:flex;align-items:center;gap:8px">
                        <button class="dev-btn-secondary" style="padding:8px 16px;font-size:.78rem;border-radius:10px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text-secondary);font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s" onmouseover="this.style.borderColor='#94A3B8'" onmouseout="this.style.borderColor=''" onclick="window.DevicesPage.showQRCode(${d.id})">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-5v5"/><path d="M16 21v-5"/></svg>
                            Mã QR
                        </button>
                        ${canEdit ? `
                        <button class="dev-btn-primary" style="padding:8px 16px;font-size:.78rem;border:none;border-radius:10px;background:linear-gradient(135deg,#2563EB,#3B82F6);color:white;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(37,99,235,.25);transition:all .15s" onmouseover="this.style.boxShadow='0 4px 14px rgba(37,99,235,.35)';this.style.transform='translateY(-1px)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(37,99,235,.25)';this.style.transform=''" onclick="window.DevicesPage.openModal(${d.id})">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Chỉnh sửa
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `, false, '960px');
    };

    const showQRCode = async (id) => {
        const res = await API.get(`/devices/${id}/qrcode`);
        if (!res.ok) { Toast.error('Không thể tạo QR code'); return; }
        const { qrcode, device, url } = res.data.data;
        showModal(`
            <div class="flex items-center gap-3">
                <span style="font-size:1.2rem">📱</span>
                <span>QR Code: ${device.name}</span>
            </div>`, `
            <div style="text-align:center">
                <div style="background:white;padding:1.5rem;border-radius:12px;display:inline-block;margin-bottom:1.25rem;box-shadow:0 4px 20px rgba(0,0,0,.08);border:1px solid var(--border-light)">
                    <img src="${qrcode}" alt="QR" style="display:block;width:260px;height:260px">
                </div>
                <div style="margin-bottom:1rem">
                    <div class="font-bold" style="font-size:1.1rem">${device.device_code}</div>
                    <div class="text-sm text-secondary">${device.name}</div>
                </div>
                <div class="flex gap-3 justify-center">
                    <button class="btn btn-primary" title="Tải mã QR" onclick="window.DevicesPage.downloadQR('${qrcode.replace(/'/g, "\\'")}', '${device.device_code}', ${device.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Tải QR
                    </button>
                    <button class="btn btn-secondary" title="In nhãn QR" onclick="window.DevicesPage.printQR('${qrcode.replace(/'/g, "\\'")}', '${device.device_code}', '${device.name.replace(/'/g, "\\'")}', '${url.replace(/'/g, "\\'")}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        In nhãn
                    </button>
                </div>
            </div>
        `);
    };

    const downloadQR = (dataURL, code, id) => {
        const dlUrl = `/api/devices/${id}/qrcode.png`;
        // On mobile, try Web Share API first (user can save to Photos/Album)
        if (/Mobi|Android/i.test(navigator.userAgent) && navigator.canShare) {
            fetch(dlUrl)
                .then(r => r.blob())
                .then(blob => {
                    const file = new File([blob], `QR_${code}.png`, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        return navigator.share({ files: [file], title: `QR ${code}` });
                    }
                    throw new Error('Web Share not supported');
                })
                .then(() => Toast.success('Đã tải QR code'))
                .catch(() => {
                    // Fallback: open in new tab
                    window.open(dlUrl, '_blank');
                    Toast.success('Đã tải QR code');
                });
        } else {
            // Desktop: data URL download
            const a = document.createElement('a');
            a.download = `QR_${code}.png`;
            a.href = dataURL;
            a.click();
            Toast.success('Đã tải QR code');
        }
    };

    const printQR = (dataURL, code, name, lookupUrl = '') => {
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>QR - ${code}</title>
            <style>
                body{font-family:sans-serif;text-align:center;padding:1cm;color:#1a1a2e}
                .lbl{border:1px solid #ddd;padding:1cm;display:inline-block;border-radius:8px;max-width:8cm}
                img{width:5cm;height:5cm;margin:.5cm 0}
                h2{margin:0;font-size:22px}
                h3{margin:4px 0;font-weight:normal;color:#666;font-size:14px}
                .u{font-size:9px;color:#444;word-break:break-all;margin-top:8px}
            </style></head><body>
            <div class="lbl">
                <h2>${code}</h2>
                <h3>${name}</h3>
                <img src="${dataURL}">
                ${lookupUrl ? `<div class="u">${lookupUrl}</div>` : ''}
                <p style="font-size:11px;color:#888">TVU-ITAM</p>
            </div>
            <script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

    const exportDevices = () => {
        const p = getFilterParams();
        const params = Object.entries(p).filter(([,v]) => v).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        const token = localStorage.getItem('tvu_token');
        window.open(`/api/devices/export${params || token ? '?' : ''}${params}${params&&token?'&':''}${token ? 'token='+encodeURIComponent(token) : ''}`, '_blank');
    };

    const importDevices = () => {
        let selectedFile = null;

        const modalBody = `
            <div style="margin-bottom:1rem">
                <div style="font-size:.85rem;color:var(--text-muted);margin-bottom:1rem">
                    Tải lên file Excel (.xlsx, .xls) để import danh sách thiết bị.
                    File cần có các cột: <strong>Mã tài sản</strong>, <strong>Tên tài sản</strong>, Loại, Hãng, Model, Serial, Giá trị, Ngày mua, Phòng ban, Trạng thái.
                </div>
                <div id="importDropZone" style="border:2px dashed var(--border);border-radius:12px;padding:2.5rem 1.5rem;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg-base);position:relative">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <div style="font-size:.9rem;font-weight:600;color:var(--text-primary);margin-bottom:4px" id="importFileName">Kéo thả file Excel vào đây</div>
                    <div style="font-size:.75rem;color:var(--text-muted)">hoặc bấm chọn file</div>
                    <input type="file" id="importFileInput" accept=".xlsx,.xls" style="position:absolute;inset:0;opacity:0;cursor:pointer">
                </div>
                <div id="importPreview" style="margin-top:1rem;display:none"></div>
            </div>
            <div class="modal-footer" style="padding:0;margin-top:1rem;border:none">
                <button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
                <button class="btn btn-primary" id="importSubmitBtn" disabled>Import</button>
            </div>`;

        showModal('Import Excel thiết bị', modalBody, false);

        const dropZone = document.getElementById('importDropZone');
        const fileInput = document.getElementById('importFileInput');
        const fileNameEl = document.getElementById('importFileName');
        const submitBtn = document.getElementById('importSubmitBtn');
        const previewEl = document.getElementById('importPreview');

        const updateFile = (file) => {
            if (!file) return;
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['xlsx', 'xls'].includes(ext)) {
                Toast.error('Chỉ chấp nhận file Excel (.xlsx, .xls)');
                return;
            }
            selectedFile = file;
            fileNameEl.textContent = file.name;
            fileNameEl.style.color = 'var(--primary)';
            dropZone.style.borderColor = 'var(--primary)';
            dropZone.style.background = 'rgba(37,99,235,0.04)';
            submitBtn.disabled = false;
            previewEl.style.display = 'none';
        };

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) updateFile(e.target.files[0]);
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
            dropZone.style.background = 'rgba(37,99,235,0.06)';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--border)';
            dropZone.style.background = 'var(--bg-base)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border)';
            dropZone.style.background = 'var(--bg-base)';
            if (e.dataTransfer.files.length) updateFile(e.dataTransfer.files[0]);
        });

        submitBtn.addEventListener('click', async () => {
            if (!selectedFile) return;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang import...';

            const formData = new FormData();
            formData.append('file', selectedFile);
            const token = API.getToken();

            try {
                const res = await fetch('/api/devices/import', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();

                previewEl.style.display = 'block';
                if (data.success) {
                    let html = `
                        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:12px 14px;margin-bottom:10px">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="#059669" style="display:inline;vertical-align:middle;margin-right:4px"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                            <strong style="color:#065F46">${data.message}</strong>
                        </div>`;
                    const detail = data.data;
                    if (detail.skipped?.length) {
                        html += `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:.78rem">
                            <strong style="color:#92400E">Bỏ qua ${detail.skipped.length} thiết bị (đã tồn tại):</strong>
                            <div style="margin-top:4px;color:#78716C">${detail.skipped.join(', ')}</div>
                        </div>`;
                    }
                    if (detail.errors?.length) {
                        html += `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;font-size:.78rem">
                            <strong style="color:#991B1B">${detail.errors.length} lỗi:</strong>
                            <div style="margin-top:4px;color:#B91C1C">${detail.errors.join('<br>')}</div>
                        </div>`;
                    }
                    previewEl.innerHTML = html;
                    submitBtn.textContent = 'Hoàn tất';
                    submitBtn.onclick = closeModal;
                    fileNameEl.textContent = 'Kéo thả file Excel vào đây';
                    fileNameEl.style.color = '';
                    dropZone.style.borderColor = 'var(--border)';
                    dropZone.style.background = 'var(--bg-base)';
                    selectedFile = null;
                    fileInput.value = '';
                    await load();
                    applyFilter();
                } else {
                    previewEl.innerHTML = `
                        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 14px">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="#DC2626" style="display:inline;vertical-align:middle;margin-right:4px"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/></svg>
                            <strong style="color:#991B1B">${data.message}</strong>
                            ${data.errors?.length ? `<div style="margin-top:8px;color:#B91C1C;font-size:.78rem">${data.errors.join('<br>')}</div>` : ''}
                        </div>`;
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Thử lại';
                }
            } catch (err) {
                previewEl.innerHTML = `
                    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 14px">
                        <strong style="color:#991B1B">Lỗi kết nối server. Vui lòng thử lại.</strong>
                    </div>`;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Thử lại';
            }
        });
    };

    const openModal = (id = null) => {
        editingId = id ? parseInt(id) : null;
        const device = id ? allDevices.find(d => d.id === editingId) : null;
        selectedImageFile = null;

        const isEdit = !!id;
        const sectionCard = (content) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)">
                ${content}
            </div>`;

        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,${isEdit?'#EEF2FF,#E0E7FF':'#ECFDF5,#D1FAE5'});display:flex;align-items:center;justify-content:center">
                    ${isEdit
                        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
                        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
                </div>
                <div>
                    <div class="modal-title">${isEdit ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}</div>
                    <div class="text-xs text-muted" style="margin-top:1px">${isEdit ? `Đang cập nhật: ${device?.name}` : 'Nhập thông tin thiết bị mới'}</div>
                </div>
            </div>`, `
            <form id="deviceForm">
                <div style="display:grid;grid-template-columns:240px 1fr;gap:16px;margin-bottom:16px">
                    ${sectionCard(`
                        <div style="padding:16px">
                            <div style="font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                Ảnh thiết bị
                            </div>
                            <div class="image-upload-container ${device?.image_url?'has-image':''}" id="imageUploadArea" style="height:180px;padding:1rem">
                                <input type="file" id="df_image_input" accept="image/*" style="display:none">
                                <img src="${device?.image_url||''}" class="image-upload-preview" id="imagePreview">
                                <div class="upload-placeholder">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                    <div style="font-size:.72rem;color:var(--text-muted);margin-top:6px">Nhấn để tải ảnh lên</div>
                                </div>
                            </div>
                            <input type="hidden" id="df_image_url" value="${device?.image_url||''}">
                        </div>
                    `)}
                    ${sectionCard(`
                        <div style="padding:16px">
                            <div style="font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                                Thông tin cơ bản
                            </div>
                            <div class="form-row" style="gap:10px">
                                <div class="form-group" style="margin-bottom:10px">
                                    <label class="form-label">Mã thiết bị *</label>
                                    <input class="form-control" id="df_code" value="${device?.device_code||''}" placeholder="VD: TVU-PC-010" ${isEdit?'readonly':''} required>
                                </div>
                                <div class="form-group" style="margin-bottom:10px">
                                    <label class="form-label">Loại thiết bị *</label>
                                    <select class="form-control" id="df_cat" required>
                                        <option value="">-- Chọn loại --</option>
                                        ${categories.map(c => `<option value="${c.id}" ${device?.category_id==c.id?'selected':''}>${c.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-group" style="margin-bottom:10px">
                                <label class="form-label">Tên thiết bị *</label>
                                <input class="form-control" id="df_name" value="${device?.name||''}" placeholder="VD: Máy tính Dell OptiPlex" required>
                            </div>
                            <div class="form-row" style="gap:10px">
                                <div class="form-group" style="margin-bottom:0"><label class="form-label">Hãng</label><input class="form-control" id="df_brand" value="${device?.brand||''}" placeholder="Dell, HP..."></div>
                                <div class="form-group" style="margin-bottom:0"><label class="form-label">Model</label><input class="form-control" id="df_model" value="${device?.model||''}" placeholder="Model số"></div>
                            </div>
                        </div>
                    `)}
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
                    ${sectionCard(`
                        <div style="padding:16px">
                            <div style="font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                Phân bổ & Trạng thái
                            </div>
                            <div class="form-row" style="gap:10px">
                                <div class="form-group" style="margin-bottom:10px"><label class="form-label">Serial</label><input class="form-control" id="df_serial" value="${device?.serial_number||''}" placeholder="S/N"></div>
                                <div class="form-group" style="margin-bottom:10px"><label class="form-label">Tình trạng</label>
                                    <select class="form-control" id="df_status">
                                        ${statusOpts.map(s => `<option value="${s}" ${(device?.status||'active')==s?'selected':''}>${statusLabel[s]}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row" style="gap:10px">
                                <div class="form-group" style="margin-bottom:0"><label class="form-label">Phòng ban</label>
                                    <select class="form-control" id="df_dept"><option value="">-- Không có --</option>
                                        ${departments.map(d => `<option value="${d.id}" ${device?.department_id==d.id?'selected':''}>${d.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="margin-bottom:0"><label class="form-label">Người dùng</label>
                                    <select class="form-control" id="df_user"><option value="">-- Chưa phân công --</option>
                                        ${users.map(u => `<option value="${u.id}" ${device?.assigned_user_id==u.id?'selected':''}>${u.full_name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    `)}
                    ${sectionCard(`
                        <div style="padding:16px">
                            <div style="font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Thời gian & Tài chính
                            </div>
                            <div class="form-row" style="gap:10px">
                                <div class="form-group" style="margin-bottom:10px"><label class="form-label">Ngày mua</label><input type="date" class="form-control" id="df_purchase" value="${device?.purchase_date?.slice(0,10)||''}"></div>
                                <div class="form-group" style="margin-bottom:10px"><label class="form-label">Giá mua (VNĐ)</label><input type="number" class="form-control" id="df_price" value="${device?.purchase_price||''}" placeholder="0"></div>
                            </div>
                            <div class="form-row" style="gap:10px">
                                <div class="form-group" style="margin-bottom:0"><label class="form-label">Hết bảo hành</label><input type="date" class="form-control" id="df_warranty" value="${device?.warranty_expiry?.slice(0,10)||''}"></div>
                                <div class="form-group" style="margin-bottom:0"><label class="form-label">Vị trí</label><input class="form-control" id="df_location" value="${device?.location||''}" placeholder="Phòng, tòa nhà..."></div>
                            </div>
                        </div>
                    `)}
                </div>

                ${sectionCard(`
                    <div style="padding:16px">
                        <div style="font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                            Thông số cấu hình
                        </div>
                        <div id="specsContainer">
                            ${(() => {
                                let specs = device?.specs;
                                try { if (typeof specs === 'string') specs = JSON.parse(specs); } catch(e) {}
                                const entries = specs && typeof specs === 'object' ? Object.entries(specs) : [];
                                if (entries.length === 0) entries.push(['', '']);
                                return entries.map(([k, v], i) => `
                                <div class="spec-row" style="display:flex;gap:8px;margin-bottom:8px">
                                    <input class="form-control spec-key" placeholder="Tên thông số (VD: CPU)" value="${k}" style="flex:1.2;padding:.5rem .7rem;font-size:.82rem">
                                    <input class="form-control spec-val" placeholder="Giá trị (VD: Intel i5-11400)" value="${v}" style="flex:2;padding:.5rem .7rem;font-size:.82rem">
                <button type="button" title="Xóa thông số" class="spec-remove-btn" onclick="this.parentElement.remove()" style="width:34px;height:34px;border-radius:6px;border:1px solid #FECACA;background:#FEF2F2;color:#DC2626;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>`).join('');
                            })()}
                        </div>
                        <button type="button" id="addSpecBtn" style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:.35rem .8rem;border-radius:6px;border:1px dashed var(--border);background:transparent;color:var(--primary);font-size:.78rem;font-weight:500;cursor:pointer;transition:all .15s ease;font-family:inherit" onmouseover="this.style.background='var(--primary-bg)'" onmouseout="this.style.background='transparent'">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Thêm thông số
                        </button>
                    </div>
                `)}

                ${sectionCard(`
                    <div style="padding:16px">
                        <div style="font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Ghi chú
                        </div>
                        <textarea class="form-control" id="df_notes" rows="3" placeholder="Thông tin bổ sung về thiết bị...">${device?.notes||''}</textarea>
                    </div>
                `)}
            </form>`, true, saveDevice, '860px');

        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('df_image_input');
        const preview = document.getElementById('imagePreview');
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedImageFile = file;
                const r = new FileReader();
                r.onload = (e) => { preview.src = e.target.result; uploadArea.classList.add('has-image'); };
                r.readAsDataURL(file);
            }
        });

        document.getElementById('addSpecBtn')?.addEventListener('click', () => {
            const container = document.getElementById('specsContainer');
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
            row.innerHTML = `
                <input class="form-control spec-key" placeholder="Tên thông số (VD: CPU)" style="flex:1.2;padding:.5rem .7rem;font-size:.82rem">
                <input class="form-control spec-val" placeholder="Giá trị (VD: Intel i5-11400)" style="flex:2;padding:.5rem .7rem;font-size:.82rem">
                <button type="button" title="Xóa thông số" class="spec-remove-btn" style="width:34px;height:34px;border-radius:6px;border:1px solid #FECACA;background:#FEF2F2;color:#DC2626;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px" onclick="this.parentElement.remove()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>`;
            container.appendChild(row);
            row.querySelector('.spec-key').focus();
        });

        const catSelect = document.getElementById('df_cat');
        if (catSelect && !editingId) {
            catSelect.addEventListener('change', () => {
                fillSpecsByCategory(catSelect.value);
            });
        }
    };

    const saveDevice = async () => {
        const btn = document.getElementById('saveModalBtn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Đang lưu...';
        try {
            let imageUrl = document.getElementById('df_image_url').value;
            if (selectedImageFile) {
                const fd = new FormData();
                fd.append('image', selectedImageFile);
                const upRes = await fetch(`${API.BASE_URL}/upload/device`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${API.getToken()}` }, body: fd
                });
                const upData = await upRes.json();
                if (upData.success) imageUrl = upData.data.url;
                else { Toast.error('Tải ảnh thất bại: ' + upData.message); btn.disabled = false; btn.textContent = 'Lưu'; return; }
            }
            const specRows = document.querySelectorAll('#specsContainer .spec-row');
            const specs = {};
            specRows.forEach(row => {
                const k = row.querySelector('.spec-key')?.value.trim();
                const v = row.querySelector('.spec-val')?.value.trim();
                if (k && v) specs[k] = v;
            });

            const body = {
                device_code: document.getElementById('df_code').value.trim(),
                name: document.getElementById('df_name').value.trim(),
                category_id: document.getElementById('df_cat').value,
                brand: document.getElementById('df_brand').value.trim(),
                model: document.getElementById('df_model').value.trim(),
                serial_number: document.getElementById('df_serial').value.trim(),
                specs: Object.keys(specs).length ? specs : null,
                status: document.getElementById('df_status').value,
                department_id: document.getElementById('df_dept').value || null,
                assigned_user_id: document.getElementById('df_user').value || null,
                purchase_date: document.getElementById('df_purchase').value || null,
                purchase_price: document.getElementById('df_price').value || null,
                warranty_expiry: document.getElementById('df_warranty').value || null,
                location: document.getElementById('df_location').value.trim(),
                notes: document.getElementById('df_notes').value.trim(),
                image_url: imageUrl
            };
            if (!body.device_code || !body.name || !body.category_id) {
                Toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                btn.disabled = false; btn.textContent = 'Lưu'; return;
            }
            const res = editingId ? await API.put('/devices/' + editingId, body) : await API.post('/devices', body);
            if (res.ok) {
                Toast.success(editingId ? 'Cập nhật thành công' : 'Thêm thiết bị thành công');
                closeModal();
                await load(); renderList();
            } else {
                Toast.error(res.data.message || 'Có lỗi xảy ra');
                btn.disabled = false; btn.textContent = 'Lưu';
            }
        } catch (err) {
            console.error(err);
            Toast.error('Lỗi hệ thống khi lưu');
            btn.disabled = false; btn.textContent = 'Lưu';
        }
    };

    const downloadPdf = (url) => {
        const token = API.getToken();
        if (!token) { Toast.error('Vui lòng đăng nhập lại'); return; }
        const sep = url.includes('?') ? '&' : '?';
        window.open(url + sep + 'inline=1&token=' + encodeURIComponent(token), '_blank');
    };

    const exportPdf = () => {
        const p = getFilterParams();
        const qs = Object.entries(p).filter(([,v]) => v).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        downloadPdf(`/api/devices/export-pdf${qs?'?'+qs:''}`);
    };

    const exportDepreciationPdf = () => {
        downloadPdf('/api/devices/depreciation/export-pdf');
    };

    const deleteDevice = async (id) => {
        const device = allDevices.find(d => d.id == id);
        if (!confirm(`Xóa thiết bị "${device?.name}"?\nThao tác này không thể hoàn tác!`)) return;
        const res = await API.delete('/devices/' + id);
        if (res.ok) { Toast.success('Đã xóa thiết bị'); await load(); renderList(); }
        else { Toast.error(res.data.message || 'Không thể xóa'); }
    };

    const render = async () => {
        const content = document.getElementById('mainContent');
        const user = App.getCurrentUser();
        const canAdd = user?.role === 'superadmin' || user?.role === 'admin';
        const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

        const isUser = user?.role === 'user';
        content.innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Quản lý Thiết bị</div>
                                <div class="dev-subtitle">Danh sách thiết bị CNTT</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${canAdd ? `<button class="dev-btn-primary" id="addDeviceBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Thêm thiết bị
                        </button>` : ''}
                    </div>
                </div>
                <div class="dev-filter-bar">
                    <div class="dev-search-wrap" style="flex:1;max-width:360px">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input id="devSearch" placeholder="Tìm mã, tên, hãng, model...">
                    </div>
                    <div class="dev-filter-selects">
                        <select class="dev-select" id="devStatusFilter">
                            <option value="">Mọi tình trạng</option>
                            ${statusOpts.map(s => `<option value="${s}">${statusLabel[s]}</option>`).join('')}
                        </select>
                        <select class="dev-select" id="devCatFilter"><option value="">Mọi loại</option></select>
                        <select class="dev-select" id="devDeptFilter"><option value="">Mọi phòng ban</option></select>
                        <button class="dev-btn-icon" id="advSearchToggle" title="Tìm nâng cao">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        </button>
                        <button class="dev-btn-icon ${viewMode === 'grid' ? 'dev-btn-active' : ''}" id="viewToggle" title="${viewMode === 'grid' ? 'Xem bảng' : 'Xem lưới'}">
                            ${viewMode === 'grid'
                                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
                                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'}
                        </button>
                        ${canAdd ? `<button class="dev-btn-icon" id="exportPdfBtn" title="Xuất PDF">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>` : ''}
                        ${canAdd ? `<button class="dev-btn-icon" id="exportDevicesBtn" title="Xuất Excel">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                        </button>` : ''}
                        ${canAdd ? `<button class="dev-btn-icon" id="importDevicesBtn" title="Import Excel">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <div id="devStats" class="dash-stats"></div>

            <div id="advSearchPanel" class="dev-adv-search" style="display:none">
                <div class="dev-adv-grid">
                    <div><label class="dev-adv-label">Giá từ</label><input type="number" class="dev-adv-input" id="advPriceMin" placeholder="0"></div>
                    <div><label class="dev-adv-label">Giá đến</label><input type="number" class="dev-adv-input" id="advPriceMax" placeholder="999.999.999"></div>
                    <div><label class="dev-adv-label">Ngày mua từ</label><input type="date" class="dev-adv-input" id="advDateFrom"></div>
                    <div><label class="dev-adv-label">Ngày mua đến</label><input type="date" class="dev-adv-input" id="advDateTo"></div>
                    <div><label class="dev-adv-label">Model</label><input class="dev-adv-input" id="advModel" placeholder="VD: OptiPlex 7080"></div>
                    <div><label class="dev-adv-label">Serial</label><input class="dev-adv-input" id="advSerial" placeholder="VD: SN-12345"></div>
                </div>
                <div class="dev-adv-actions">
                    <button class="dev-btn-primary dev-btn-sm" id="advSearchBtn">Tìm kiếm</button>
                    <button class="dev-btn-secondary dev-btn-sm" id="advClearBtn">Xóa lọc</button>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dash-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        Danh sách thiết bị
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted)" id="devCount">Đang tải...</span>
                </div>
                <div id="devicesList" style="min-height:300px"><div class="dev-loading"><div class="spinner"></div></div></div>
            </div>
        </div>`;

        await load();
        renderStats();
        document.getElementById('devCatFilter').innerHTML = '<option value="">Mọi loại</option>' + categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        const deptFilter = document.getElementById('devDeptFilter');
        if (isAdmin) {
            deptFilter.innerHTML = '<option value="">Mọi phòng ban</option>' + departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        } else {
            const myDept = departments.find(d => d.id == user.department_id);
            deptFilter.innerHTML = myDept ? `<option value="${myDept.id}">${myDept.name}</option>` : '<option value="">Không thuộc phòng ban</option>';
        }

        document.getElementById('devSearch')?.addEventListener('input', applyFilter);
        document.getElementById('devStatusFilter')?.addEventListener('change', applyFilter);
        document.getElementById('devCatFilter')?.addEventListener('change', applyFilter);
        document.getElementById('devDeptFilter')?.addEventListener('change', applyFilter);
        document.getElementById('viewToggle')?.addEventListener('click', () => {
            viewMode = viewMode === 'table' ? 'grid' : 'table';
            const btn = document.getElementById('viewToggle');
            if (btn) {
                btn.classList.toggle('dev-btn-active', viewMode === 'grid');
                btn.title = viewMode === 'grid' ? 'Xem bảng' : 'Xem lưới';
                btn.innerHTML = viewMode === 'grid'
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
            }
            renderList();
        });
        if (canAdd) document.getElementById('addDeviceBtn')?.addEventListener('click', () => openModal());
        document.getElementById('exportDevicesBtn')?.addEventListener('click', exportDevices);
        document.getElementById('exportPdfBtn')?.addEventListener('click', exportPdf);
        document.getElementById('exportDepreciationPdfBtn')?.addEventListener('click', exportDepreciationPdf);
        document.getElementById('importDevicesBtn')?.addEventListener('click', importDevices);

        const advToggle = document.getElementById('advSearchToggle');
        const advPanel = document.getElementById('advSearchPanel');
        advToggle?.addEventListener('click', () => {
            const shown = advPanel.style.display !== 'none';
            advPanel.style.display = shown ? 'none' : 'block';
        });
        document.getElementById('advSearchBtn')?.addEventListener('click', applyFilter);
        document.getElementById('advClearBtn')?.addEventListener('click', () => {
            advPanel.querySelectorAll('input').forEach(el => el.value = '');
            document.getElementById('devSearch').value = '';
            document.getElementById('devStatusFilter').value = '';
            document.getElementById('devCatFilter').value = '';
            document.getElementById('devDeptFilter').value = '';
            statFilter = '';
            applyFilter();
        });

        const params = window.__currentParams || {};
        if (params.status) {
            const sf = document.getElementById('devStatusFilter');
            if (sf) sf.value = params.status;
        }
        applyFilter();
        if (params.view) {
            setTimeout(() => { openDetail(params.view); delete window.__currentParams.view; }, 500);
        }
    };

    return { render, openModal, openDetail, showQRCode, downloadQR, printQR, setStatFilter };
})();

window.showModal = function(title, body, hasFooter = false, onSave = null, maxWidth = null, maxHeight = null) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    const mw = maxWidth || (hasFooter ? '760px' : '700px');
    const mh = maxHeight || '90vh';
    container.innerHTML = `
    <div class="modal-overlay active" id="activeModal">
        <div class="modal" style="max-width:min(${mw},calc(100vw - 24px));max-height:${mh}">
            <div class="modal-header">
                <span class="modal-title">${title}</span>
                <button class="modal-close" title="Đóng" onclick="closeModal()">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                </button>
            </div>
            <div class="modal-body">${body}</div>
            ${hasFooter ? `<div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Hủy</button><button class="btn btn-primary" id="saveModalBtn">Lưu thay đổi</button></div>` : ''}
        </div>
    </div>`;
    if (hasFooter && onSave) document.getElementById('saveModalBtn')?.addEventListener('click', onSave);
    document.getElementById('activeModal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
};

window.closeModal = function() {
    const m = document.getElementById('activeModal');
    if (m) { m.classList.remove('active'); setTimeout(() => m.remove(), 300); }
};

window.showRejectModal = function(title, callback) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    container.innerHTML = `
    <div class="modal-overlay active" id="activeModal">
        <div class="modal" style="max-width:480px">
            <div class="modal-header">
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:8px;background:#FEF2F2;display:flex;align-items:center;justify-content:center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                <div class="modal-title">${title}</div>
                </div>
                <button class="modal-close" title="Đóng" onclick="closeModal()">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#991B1B">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Hành động này sẽ từ chối yêu cầu. Vui lòng cho biết lý do.
                </div>
                <label class="form-label">Lý do từ chối</label>
                <textarea class="form-control" id="rejectReasonInput" rows="3" placeholder="Nhập lý do từ chối..." style="resize:vertical"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Hủy</button>
                <button class="btn btn-danger" id="confirmRejectBtn">Từ chối</button>
            </div>
        </div>
    </div>`;
    document.getElementById('confirmRejectBtn')?.addEventListener('click', () => {
        const reason = document.getElementById('rejectReasonInput')?.value.trim();
        if (!reason) { Toast.error('Vui lòng nhập lý do từ chối'); return; }
        closeModal();
        callback(reason);
    });
    document.getElementById('activeModal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
    setTimeout(() => document.getElementById('rejectReasonInput')?.focus(), 100);
};