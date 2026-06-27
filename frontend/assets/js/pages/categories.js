window.CategoriesPage = (() => {
    let categories = [];
    let activeStat = '';

    const load = async () => {
        const res = await API.get('/categories');
        if (res.ok) categories = res.data.data || [];
    };

    const iconMap = {
        laptop:'💻', desktop:'🖥️', server:'🖥️', wifi:'🖧', printer:'🖨️',
        monitor:'🖥️', projector:'📽️', battery:'🔋', 'hard-drive':'💾', keyboard:'⌨️',
    };

    const getIcon = (c) => {
        if (!c) return '📦';
        if (iconMap[c.icon]) return iconMap[c.icon];
        if (c.icon && c.icon.length > 2) return '📦';
        return c.icon || '📦';
    };

    const getCatColor = (name) => {
        if (!name) return { bg:'#6B7280', light:'#E5E7EB', border:'#9CA3AF' };
        const colors = [
            { bg:'#1E3A5F', light:'#BFDBFE', border:'#2563EB' },
            { bg:'#064E3B', light:'#A7F3D0', border:'#059669' },
            { bg:'#1E1B4B', light:'#C7D2FE', border:'#4F46E5' },
            { bg:'#164E63', light:'#A5F3FC', border:'#0891B2' },
            { bg:'#78350F', light:'#FDE68A', border:'#D97706' },
            { bg:'#3B0764', light:'#DDD6FE', border:'#7C3AED' },
            { bg:'#7F1D1D', light:'#FECACA', border:'#DC2626' },
            { bg:'#831843', light:'#FBCFE8', border:'#DB2777' },
            { bg:'#4C0519', light:'#FBCFE8', border:'#E11D48' },
            { bg:'#052E16', light:'#BBF7D0', border:'#22C55E' },
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const openModal = (id = null) => {
        const c = id ? categories.find(x => x.id === id) : null;
        const isEdit = !!c;

        const iconOpts = [
            ['💻','Laptop / Máy tính xách tay'],
            ['🖥️','Máy để bàn / Màn hình / Server'],
            ['🖧','Thiết bị mạng / Switch / Router'],
            ['🖨️','Máy in / Scan'],
            ['📽️','Máy chiếu'],
            ['🔋','Bộ lưu điện UPS'],
            ['💾','Thiết bị lưu trữ / NAS'],
            ['⌨️','Thiết bị ngoại vi'],
            ['📱','Máy tính bảng / Điện thoại'],
            ['🌐','Thiết bị mạng khác'],
            ['📦','Loại tài sản khác'],
        ];
        const curIcon = c ? getIcon(c) : '💻';

        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#F3E8FF,#EDE9FE);display:flex;align-items:center;justify-content:center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg>
                </div>
                <div>
                    <div class="modal-title">${isEdit ? 'Chỉnh sửa' : 'Thêm'} loại thiết bị</div>
                    <div class="text-xs text-muted" style="margin-top:1px">${isEdit ? c.name : 'Tạo phân loại mới'}</div>
                </div>
            </div>`, `
            <form id="categoryForm">
                <div style="background:#FAFBFC;border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg>
                        Thông tin loại thiết bị
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tên loại *</label>
                        <input class="form-control" id="cat_name" value="${c?.name||''}" placeholder="VD: Máy tính bảng" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Biểu tượng *</label>
                        <select class="form-control" id="cat_icon" required>
                            ${iconOpts.map(([emoji, label]) =>
                                `<option value="${emoji}" ${curIcon===emoji?'selected':''}>${emoji} ${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mô tả</label>
                        <textarea class="form-control" id="cat_desc" rows="2" placeholder="Mô tả nhóm thiết bị...">${c?.description||''}</textarea>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Thời gian khấu hao (năm) *</label>
                        <input type="number" class="form-control" id="cat_life" value="${c?.useful_life_years||5}" min="1" max="50" placeholder="VD: 5">
                        <div style="font-size:.7rem;color:#94A3B8;margin-top:4px">Theo Thông tư 45/2013/TT-BTC của Bộ Tài chính</div>
                    </div>
                </div>
            </form>`, true, async () => {
            const body = {
                name: document.getElementById('cat_name').value.trim(),
                icon: document.getElementById('cat_icon').value,
                description: document.getElementById('cat_desc').value.trim(),
                useful_life_years: parseInt(document.getElementById('cat_life').value) || 5
            };
            if (!body.name) { Toast.error('Nhập tên loại thiết bị'); return; }
            const res = isEdit ? await API.put('/categories/' + c.id, body) : await API.post('/categories', body);
            if (res.ok) { Toast.success(isEdit ? 'Đã cập nhật' : 'Đã thêm'); closeModal(); await load(); renderGrid(); }
            else Toast.error(res.data.message || 'Lỗi');
        }, '560px');
    };

    const setStatFilter = (stat) => {
        activeStat = activeStat === stat ? '' : stat;
        renderGrid();
    };

    const renderGrid = () => {
        const el = document.getElementById('categoryGrid');
        if (!el) return;
        const cu = App.getCurrentUser();
        const q = document.getElementById('catSearch')?.value?.toLowerCase() || '';

        let filtered = categories.filter(c => !q || c.name?.toLowerCase().includes(q));
        if (activeStat === 'hasDesc') filtered = filtered.filter(c => c.description);
        else if (activeStat === 'noDesc') filtered = filtered.filter(c => !c.description);

        document.getElementById('catSubtitle').textContent = `${filtered.length} / ${categories.length} loại`;
        document.getElementById('statTotal').textContent = categories.length;
        document.getElementById('statDesc').textContent = categories.filter(c => c.description).length;
        document.getElementById('statNoDesc').textContent = categories.filter(c => !c.description).length;
        const catCount = document.getElementById('catCount');
        if (catCount) catCount.textContent = `${filtered.length} / ${categories.length} loại`;

        document.querySelectorAll('.dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`.dash-stat-card[data-stat="${activeStat}"]`)?.classList.add('active');

        if (!filtered.length) {
            el.innerHTML = '<div class="dept-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg><h3>Không tìm thấy</h3><p>Thử thay đổi bộ lọc</p></div>';
            return;
        }

        el.innerHTML = filtered.map(c => {
            const col = getCatColor(c.name);
            const icon = getIcon(c);
            return `<div class="dept-card" style="--dept-bg:${col.bg};--dept-light:${col.light};--dept-border:${col.border}">
                <div class="dept-card-top">
                    <div class="dept-badge" style="background:${col.bg};font-size:1rem;line-height:1">${icon}</div>
                    <div style="display:flex;gap:4px">
                        ${cu?.role === 'superadmin' || cu?.role === 'admin' ? `
                        <button class="dept-btn-edit" onclick="event.stopPropagation();CategoriesPage.openModal(${c.id})" title="Sửa">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>` : ''}
                        ${cu?.role === 'superadmin' ? `
                        <button class="dept-btn-del" onclick="event.stopPropagation();CategoriesPage.remove(${c.id})" title="Xóa">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>` : ''}
                    </div>
                </div>
                <div class="dept-card-body">
                    <div class="dept-card-header">
                        <div class="dept-name">${c.name}</div>
                    </div>
                    ${c.description ? `<div class="dept-loc" style="margin-top:8px;font-size:.82rem;color:#64748B;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4">${c.description}</div>` : `<div class="dept-loc" style="margin-top:8px;font-size:.78rem;color:#9CA3AF;font-style:italic">Không có mô tả</div>`}
                    <div style="margin-top:10px;display:flex;gap:6px;align-items:center">
                        <span style="font-size:.7rem;background:#EEF2FF;color:#4F46E5;padding:2px 8px;border-radius:4px;font-weight:600">KH ${c.useful_life_years || 5} năm</span>
                        <span style="font-size:.7rem;background:#F0FDF4;color:#16A34A;padding:2px 8px;border-radius:4px">Tỷ lệ: ${Math.round(100/(c.useful_life_years||5))}%/năm</span>
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Loại thiết bị</div>
                                <div class="dev-subtitle" id="catSubtitle">Đang tải...</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${cu?.role === 'superadmin' ? `<button class="dev-btn-primary" onclick="CategoriesPage.openModal()">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Thêm
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat-card ${activeStat === '' ? 'active' : ''}" data-stat="" onclick="CategoriesPage.setStatFilter('')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4338CA,#4F46E5)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statTotal" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Tổng loại</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card ${activeStat === 'hasDesc' ? 'active' : ''}" data-stat="hasDesc" onclick="CategoriesPage.setStatFilter('hasDesc')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4F46E5,#6366F1)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statDesc" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Có mô tả</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card ${activeStat === 'noDesc' ? 'active' : ''}" data-stat="noDesc" onclick="CategoriesPage.setStatFilter('noDesc')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#6366F1,#818CF8)">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="statNoDesc" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Chưa mô tả</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div class="dev-search-wrap" style="min-width:200px;flex:1;max-width:320px">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="catSearch" placeholder="Tìm tên loại...">
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg>
                        <span id="catCount">Đang tải...</span>
                    </span>
                </div>
                <div class="dept-grid-wrap">
                    <div class="dept-grid" id="categoryGrid"></div>
                </div>
            </div>
        </div>`;

        await load();
        renderGrid();
        document.getElementById('catSearch')?.addEventListener('input', renderGrid);
    };

    const remove = async (id) => {
        if (!confirm('Xóa loại thiết bị này?')) return;
        const res = await API.delete('/categories/' + id);
        if (res.ok) { Toast.success('Đã xóa'); await load(); renderGrid(); }
        else Toast.error(res.data.message || 'Không thể xóa');
    };

    return { render, openModal, remove, setStatFilter };
})();
