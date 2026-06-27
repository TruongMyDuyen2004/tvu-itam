window.UsersPage = (() => {
    let users = [], departments = [];
    let editingId = null;
    let activeStat = '';

    const load = async () => {
        const [uRes, dRes] = await Promise.all([API.get('/users'), API.get('/departments')]);
        if (uRes.ok) users = uRes.data.data || [];
        if (dRes.ok) departments = dRes.data.data || [];
    };

    const roleLabel = fmt.roleLabel;
    const roleBadge = { superadmin: 'badge-superadmin', admin: 'badge-admin', user: 'badge-user' };

    const getDeptColor = (name) => {
        if (!name) return 'var(--text-muted)';
        const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f472b6','#6366f1'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const setStatFilter = (stat) => {
        activeStat = activeStat === stat ? '' : stat;
        renderTable();
    };

    const updateStats = () => {
        const total = users.length;
        const active = users.filter(u => u.is_active).length;
        const locked = total - active;
        const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
        document.getElementById('stat_total').innerText = total;
        document.getElementById('stat_active').innerText = active;
        document.getElementById('stat_locked').innerText = locked;
        document.getElementById('stat_admins').innerText = admins;
    };

    const renderTable = () => {
        const el = document.getElementById('usersList');
        if (!el) return;
        const search = document.getElementById('usrSearch')?.value.toLowerCase() || '';
        const role = document.getElementById('usrRole')?.value || '';
        const dept = document.getElementById('usrDept')?.value || '';
        const status = document.getElementById('usrStatus')?.value || '';

        let filtered = users.filter(u =>
            (!search || u.full_name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search) || u.username?.toLowerCase().includes(search)) &&
            (!role || u.role === role) &&
            (!dept || u.department_id == dept) &&
            (!status || String(u.is_active) === status)
        );

        if (activeStat === 'active') filtered = filtered.filter(u => u.is_active);
        else if (activeStat === 'locked') filtered = filtered.filter(u => !u.is_active);
        else if (activeStat === 'admins') filtered = filtered.filter(u => u.role === 'admin' || u.role === 'superadmin');

        document.getElementById('usrCount').textContent = `${filtered.length} người dùng`;

        document.querySelectorAll('.dash-stat-card').forEach(el => el.classList.remove('active'));
        document.querySelector(`.dash-stat-card[data-stat="${activeStat}"]`)?.classList.add('active');

        const currentUser = App.getCurrentUser();
        if (!filtered.length) {
            el.innerHTML = '<div class="dev-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>Không tìm thấy người dùng</h3></div>';
            return;
        }

        el.innerHTML = `<table class="dev-table">
            <thead><tr><th style="padding-left:1.25rem;min-width:180px">Người dùng</th><th style="min-width:140px">Email</th><th>Quyền</th><th>Phòng ban</th><th>Trạng thái</th><th class="dev-td-date">Cuối</th><th style="text-align:right;padding-right:1.25rem">Tác vụ</th></tr></thead>
            <tbody>${filtered.map(u => `<tr class="dev-tr">
                <td style="padding-left:1.25rem"><div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar" style="${!u.is_active?'opacity:.5':''}">${fmt.initials(u.full_name)}</div>
                    <div><div style="font-weight:600;font-size:.85rem;color:var(--text-primary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.25">${u.full_name}</div><div style="font-size:.7rem;color:var(--text-muted);margin-top:1px">@${u.username}</div></div>
                </div></td>
                <td data-label="Email" style="font-size:.82rem;color:var(--text-secondary)">${u.email}</td>
                <td data-label="Quyền"><span class="dev-status-pill ${roleBadge[u.role]}" style="font-size:.65rem">${roleLabel[u.role]}</span></td>
                <td data-label="Phòng ban">${u.department_name ? `<span style="padding:2px 10px;border-radius:6px;font-size:.72rem;font-weight:500;background:${getDeptColor(u.department_name)}12;color:${getDeptColor(u.department_name)};border:1px solid ${getDeptColor(u.department_name)}25;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">${u.department_name}</span>` : '<span style="color:var(--text-muted);font-size:.78rem">—</span>'}</td>
                <td data-label="Trạng thái"><span class="dev-status-pill ${u.is_active?'badge-active':'badge-danger'}">${u.is_active?'Hoạt động':'Bị khóa'}</span></td>
                <td data-label="Cuối" style="white-space:nowrap;color:var(--text-muted);font-size:.78rem">${u.last_login ? fmt.date(u.last_login) : '<span class="text-muted">—</span>'}</td>
                <td class="dev-td-actions"><div style="display:inline-flex;gap:4px">
                    <button class="dev-action-btn" onclick="UsersPage.openModal(${u.id})" title="${currentUser?.role === 'superadmin' || currentUser?.role === 'admin' ? 'Chỉnh sửa' : 'Xem chi tiết'}" ${currentUser?.role !== 'superadmin' && currentUser?.role !== 'admin' ? 'style="opacity:.2"' : ''}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="dev-action-btn" onclick="${currentUser?.role === 'superadmin' && u.id !== currentUser.id ? `UsersPage.openPasswordModal(${u.id})` : ''}" title="Đặt lại mật khẩu" style="${currentUser?.role === 'superadmin' && u.id !== currentUser.id ? '' : 'opacity:.15;cursor:default'}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </button>
                    <button class="dev-action-btn ${u.is_active ? '' : 'dev-action-danger'}" onclick="${currentUser?.role === 'superadmin' && u.id !== currentUser.id ? `UsersPage.toggleActive(${u.id},${u.is_active})` : ''}" title="${u.is_active ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}" style="${currentUser?.role === 'superadmin' && u.id !== currentUser.id ? '' : 'opacity:.15;cursor:default'}">
                        ${u.is_active ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'}
                    </button>
                    <button class="dev-action-btn dev-action-danger" onclick="${currentUser?.role === 'superadmin' && u.id !== currentUser.id ? `UsersPage.remove(${u.id})` : ''}" title="Xóa" style="${currentUser?.role === 'superadmin' && u.id !== currentUser.id ? '' : 'opacity:.15;cursor:default'}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div></td>
            </tr>`).join('')}</tbody>
        </table>`;
    };

    const openModal = (id = null) => {
        editingId = id;
        const u = id ? users.find(x => x.id === id) : null;
        const isEdit = !!id;
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);display:flex;align-items:center;justify-content:center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <div>
                    <div class="modal-title">${isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</div>
                    <div class="text-xs text-muted" style="margin-top:1px">${isEdit ? u.full_name : 'Tạo tài khoản mới trong hệ thống'}</div>
                </div>
            </div>`, `
            <form id="usrForm">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Thông tin cá nhân
                        </div>
                        <div class="form-group">
                            <label class="form-label">Họ tên *</label>
                            <input class="form-control" id="usr_name" value="${u?.full_name||''}" required placeholder="Nguyễn Văn A">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="usr_email" value="${u?.email||''}" required placeholder="a@tvu.edu.vn">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Số điện thoại</label>
                            <input class="form-control" id="usr_phone" value="${u?.phone||''}" placeholder="0xxx...">
                        </div>
                    </div>
                    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                        <div style="font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            Tài khoản & Quyền
                        </div>
                        <div class="form-group">
                            <label class="form-label">Username *</label>
                            <input class="form-control" id="usr_uname" value="${u?.username||''}" ${isEdit?'readonly':''} required placeholder="tai_khoan">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
                            <input type="password" class="form-control" id="usr_pwd" placeholder="${isEdit?'Để trống = giữ nguyên':'Ít nhất 6 ký tự'}" ${isEdit?'':'required'} minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Quyền</label>
                            <select class="form-control" id="usr_role">
                                ${Object.entries(roleLabel).map(([k,v]) => `<option value="${k}" ${(u?.role||'user')===k?'selected':''}>${v}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:12px">
                    <div style="font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        Phân quyền & Phòng ban
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="form-group">
                            <label class="form-label">Phòng ban</label>
                            <select class="form-control" id="usr_dept">
                                <option value="">-- Không thuộc phòng ban --</option>
                                ${departments.map(d => `<option value="${d.id}" ${u?.department_id==d.id?'selected':''}>${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="display:flex;flex-direction:column;justify-content:flex-end">
                            <label class="form-label" style="opacity:0">.</label>
                            <div style="display:flex;align-items:center;gap:10px;padding:.4rem .85rem;background:#F8FAFC;border:1px solid var(--border);border-radius:8px">
                                <span class="dev-status-pill ${u?.is_active !== 0 ? 'badge-active' : 'badge-danger'}" id="usrStatusBadge">${u?.is_active !== 0 ? 'Hoạt động' : 'Bị khóa'}</span>
                                <span style="font-size:.78rem;color:var(--text-muted)">${isEdit ? 'Trạng thái hiện tại' : 'Mặc định: Hoạt động'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>`, true, save, '860px', '100vh');
    };

    const save = async () => {
        const u = editingId ? users.find(x => x.id === editingId) : null;
        const body = {
            full_name: document.getElementById('usr_name').value,
            email: document.getElementById('usr_email').value,
            username: document.getElementById('usr_uname').value,
            role: document.getElementById('usr_role').value,
            department_id: document.getElementById('usr_dept').value || null,
            phone: document.getElementById('usr_phone').value,
            is_active: u ? u.is_active : 1
        };
        const pwd = document.getElementById('usr_pwd').value;
        if (pwd) body.password = pwd;
        if (!body.full_name || !body.email) { Toast.error('Vui lòng nhập đầy đủ thông tin'); return; }
        let res;
        if (editingId) {
            res = await API.put('/users/' + editingId, body);
            if (res.ok && pwd) await API.put('/users/' + editingId + '/reset-password', { new_password: pwd });
        } else {
            if (!pwd) { Toast.error('Vui lòng nhập mật khẩu'); return; }
            res = await API.post('/users', body);
        }
        if (res.ok) { Toast.success(editingId ? 'Cập nhật thành công' : 'Thêm người dùng thành công'); closeModal(); await load(); updateStats(); renderTable(); }
        else Toast.error(res.data.message || 'Có lỗi xảy ra');
    };

    const toggleActive = async (id, current) => {
        if (!confirm(current ? 'Bạn có chắc muốn khóa tài khoản này?' : 'Phê duyệt tài khoản này?')) return;
        const u = users.find(x => x.id === id);
        const res = await API.put('/users/' + id, { ...u, is_active: current ? 0 : 1 });
        if (res.ok) { Toast.success(current ? 'Đã khóa tài khoản' : 'Đã phê duyệt tài khoản'); await load(); updateStats(); renderTable(); }
        else Toast.error('Có lỗi xảy ra');
    };

    const openPasswordModal = async (id) => {
        const u = users.find(x => x.id === id);
        if (!u) return;
        showModal(`
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);display:flex;align-items:center;justify-content:center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <div>
                    <div class="modal-title">Đặt lại mật khẩu</div>
                    <div class="text-xs text-muted" style="margin-top:1px">${u.full_name} — ${u.email}</div>
                </div>
            </div>`, `
            <form id="usrPwdForm">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:16px">
                    <div style="font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        Mật khẩu mới
                    </div>
                    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#92400E;display:flex;align-items:flex-start;gap:8px">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span>Mật khẩu phải có ít nhất 6 ký tự. Người dùng sẽ dùng mật khẩu này để đăng nhập lần sau.</span>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <label class="form-label">Mật khẩu mới *</label>
                        <input type="password" class="form-control" id="usr_new_pwd" placeholder="Ít nhất 6 ký tự" minlength="6" required autofocus>
                    </div>
                </div>
            </form>
        `, true, async () => {
            const password = document.getElementById('usr_new_pwd').value;
            if (!password || password.length < 6) { Toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
            const res = await API.put('/users/' + id + '/reset-password', { new_password: password });
            if (res.ok) { Toast.success('Đặt lại mật khẩu thành công'); closeModal(); }
            else Toast.error(res.data.message || 'Có lỗi xảy ra');
        }, '520px');
    };

    const remove = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
        const res = await API.delete('/users/' + id);
        if (res.ok) { Toast.success('Đã xóa người dùng'); await load(); updateStats(); renderTable(); }
        else Toast.error(res.data.message || 'Không thể xóa người dùng');
    };

    const render = async () => {
        const currentUser = App.getCurrentUser();
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Người dùng</div>
                                <div class="dev-subtitle" id="usrSubtitle">Đang tải...</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        ${currentUser?.role === 'superadmin' ? `<button class="dev-btn-primary" title="Thêm người dùng" onclick="UsersPage.openModal()">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Thêm
                        </button>` : ''}
                    </div>
                </div>
            </div>

            <div class="dash-stats">
                <div class="dash-stat-card" data-stat="" onclick="UsersPage.setStatFilter('')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4338CA,#4F46E5)" class="card-anim-1">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4338CA,#4F46E5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="stat_total" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Tổng</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="active" onclick="UsersPage.setStatFilter('active')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#4F46E5,#6366F1)" class="card-anim-1">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="stat_active" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Hoạt động</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="locked" onclick="UsersPage.setStatFilter('locked')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#6366F1,#818CF8)" class="card-anim-1">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="stat_locked" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">Đã khóa</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
                <div class="dash-stat-card" data-stat="admins" onclick="UsersPage.setStatFilter('admins')" style="cursor:pointer;--stat-gradient:linear-gradient(135deg,#818CF8,#A5B4FC)" class="card-anim-1">
                    <div class="dash-stat-icon" style="background:linear-gradient(135deg,#818CF8,#A5B4FC)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div class="dash-stat-info">
                        <div class="dash-stat-value" id="stat_admins" style="font-size:1.3rem">-</div>
                        <div class="dash-stat-label">QTV</div>
                    </div>
                    <div class="dash-stat-glow"></div>
                </div>
            </div>

            <div class="dev-table-card">
                <div class="dash-card-header">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;flex-wrap:wrap">
                        <div class="dev-search-wrap" style="min-width:200px;flex:1;max-width:280px">
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                            <input id="usrSearch" placeholder="Tên, email...">
                        </div>
                        <select class="dev-select" id="usrRole"><option value="">Quyền</option>${Object.entries(roleLabel).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
                        <select class="dev-select" id="usrDept"><option value="">Phòng ban</option></select>
                        <select class="dev-select" id="usrStatus"><option value="">Trạng thái</option><option value="1">Hoạt động</option><option value="0">Bị khóa</option></select>
                    </div>
                    <span style="font-size:.78rem;font-weight:500;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        <span id="usrCount">Đang tải...</span>
                    </span>
                </div>
                <div id="usersList" style="min-height:250px;position:relative">
                    <div class="dev-loading"><div class="spinner"></div></div>
                </div>
            </div>
        </div>`;

        await load();

        const st = document.getElementById('usrSubtitle');
        if (st) st.textContent = `${users.length} tài khoản trong hệ thống`;

        const deptFilter = document.getElementById('usrDept');
        if (deptFilter) {
            deptFilter.innerHTML = '<option value="">Phòng ban</option>' +
                departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        }

        updateStats();

        document.getElementById('usrSearch')?.addEventListener('input', renderTable);
        document.getElementById('usrRole')?.addEventListener('change', renderTable);
        document.getElementById('usrDept')?.addEventListener('change', renderTable);
        document.getElementById('usrStatus')?.addEventListener('change', renderTable);

        renderTable();
    };

    return { render, openModal, toggleActive, remove, openPasswordModal, setStatFilter };
})();
