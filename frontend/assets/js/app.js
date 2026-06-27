/* ============================================================
   TVU-ITAM - App Router & Core
   ============================================================ */
const App = (() => {
    let currentPage = '';
    let currentUser = null;
    let dashboardStats = null;

    const pages = {
        dashboard: { title: 'Dashboard', subtitle: 'Tổng quan hệ thống', render: () => DashboardPage.render() },
        devices: { title: 'Quản lý Thiết bị', subtitle: 'Danh sách thiết bị CNTT', render: () => DevicesPage.render() },
        maintenance: { title: 'Lịch Bảo Trì', subtitle: 'Theo dõi và quản lý bảo trì', render: () => MaintenancePage.render() },
        incidents: { title: 'Báo cáo Sự cố', subtitle: 'Quản lý và xử lý sự cố', render: () => IncidentsPage.render() },
        transfers: { title: 'Điều chuyển Tài sản', subtitle: 'Quản lý điều chuyển thiết bị', render: () => TransfersPage.render() },
        disposals: { title: 'Thanh lý Tài sản', subtitle: 'Quản lý thanh lý và thu hồi thiết bị', render: () => DisposalsPage.render() },
        notifications: { title: 'Thông báo', subtitle: 'Cảnh báo và nhắc nhở', render: () => NotificationsPage.render() },
        users: { title: 'Quản lý Người dùng', subtitle: 'Phân quyền và tài khoản', render: () => UsersPage.render() },
        loginHistory: { title: 'Lịch sử đăng nhập', subtitle: 'Theo dõi đăng nhập người dùng', render: () => LoginHistoryPage.render() },
        settings: { title: 'Cài đặt hệ thống', subtitle: 'Thiết lập cấu hình và cảnh báo', render: () => SettingsPage.render() },
        departments: { title: 'Phòng ban / Khoa', subtitle: 'Cơ cấu tổ chức', render: () => DepartmentsPage.render() },
        categories: { title: 'Quản lý Loại Thiết bị', subtitle: 'Danh mục phân loại tài sản CNTT', render: () => CategoriesPage.render() },
        logs: { title: 'Nhật ký hệ thống', subtitle: 'Theo dõi hành động và thay đổi', render: () => LogsPage.render() },
        reports: { title: 'Thống kê & Báo cáo', subtitle: 'Phân tích tài sản', render: () => ReportsPage.render() },
        depreciation: { title: 'Khấu hao tài sản', subtitle: 'Quản lý khấu hao', render: () => DepreciationPage.render() },
        inventory: { title: 'Kiểm kê Tài sản', subtitle: 'Quản lý kiểm kê định kỳ', render: () => InventoryPage.render() },
        warehouse: { title: 'Quản lý Kho', subtitle: 'Nhập/Xuất/Tồn kho tài sản', render: () => WarehousePage.render() },
    };

    const navigate = async (page) => {
        if (!pages[page]) page = 'dashboard';

        // Dọn dẹp các overlay cũ (nếu có) để tránh làm tối màn hình
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) modalOverlay.classList.remove('active');
        const loadingOverlays = document.querySelectorAll('.loading-overlay');
        loadingOverlays.forEach(el => el.remove());

        // Check permission
        if (currentUser && currentUser.role === 'user') {
            // User không được truy cập các trang quản trị cấp cao
            const restrictedPages = ['departments', 'categories', 'transfers', 'disposals', 'users', 'logs', 'settings', 'loginHistory', 'inventory'];
            if (restrictedPages.includes(page)) {
                Toast.error('Bạn không có quyền truy cập trang này');
                page = 'dashboard';
            }
        }
        
        currentPage = page;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.getElementById('nav-' + page);
        if (activeNav) activeNav.classList.add('active');
        // Update user topbar nav
        document.querySelectorAll('.user-topbar-nav a').forEach(el => el.classList.remove('active'));
        const topbarActive = document.querySelector(`.user-topbar-nav a[data-page="${page}"]`);
        if (topbarActive) topbarActive.classList.add('active');

        // Update header
        const p = pages[page];
        const pageTitleEl = document.getElementById('pageTitle');
        const pageSubtitleEl = document.getElementById('pageSubtitle');
        if (pageTitleEl) pageTitleEl.textContent = p.title;
        if (pageSubtitleEl) pageSubtitleEl.textContent = p.subtitle;

        // Render page
        const content = document.getElementById('mainContent');
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show skeleton loading based on page type
        const skeletonHTML = getPageSkeleton(page);
        content.innerHTML = skeletonHTML;

        // Small delay to ensure skeleton renders before removing
        await new Promise(r => setTimeout(r, 50));

        try {
            // Remove any existing transition class to replay animation
            content.classList.remove('page-transition');
            await p.render();
            // Force reflow then add transition animation
            void content.offsetWidth;
            content.classList.add('page-transition');
            // Đánh dấu đã xem section
            if (page === 'maintenance' || page === 'incidents') {
                markSectionViewed(page);
            }
            // Sau khi render xong, đảm bảo không còn gì che mắt người dùng
            const overlays = document.querySelectorAll('.loading-overlay, .modal-overlay');
            overlays.forEach(el => {
                el.classList.remove('active');
                if (el.classList.contains('loading-overlay')) el.style.display = 'none';
            });
        } catch (err) {
            console.error('Error rendering page:', err);
            content.innerHTML = `<div class="empty-state"><h3>Lỗi tải trang</h3><p>${err.message}</p></div>`;
        }
    };

    const updateHeaderStats = (stats) => {
        if (!stats) return;
        const totalEl = document.getElementById('headerTotalDevices');
        const activeEl = document.getElementById('headerActiveDevices');
        if (totalEl) totalEl.querySelector('.stat-val').textContent = stats.total_devices || 0;
        if (activeEl) activeEl.querySelector('.stat-val').textContent = stats.active_devices || 0;
    };

    const updateBadges = (stats) => {
        const mBadge = document.getElementById('badgeMaintenance');
        const iBadge = document.getElementById('badgeIncidents');
        const notifDot = document.getElementById('notifDot');
        const newMaint = stats.new_pending_maintenance !== undefined ? stats.new_pending_maintenance : stats.pending_maintenance;
        const newInc = stats.new_open_incidents !== undefined ? stats.new_open_incidents : stats.open_incidents;
        if (mBadge) {
            if (newMaint > 0) {
                mBadge.textContent = newMaint;
                mBadge.style.display = '';
            } else {
                mBadge.style.display = 'none';
            }
        }
        if (iBadge) {
            if (newInc > 0) {
                iBadge.textContent = newInc;
                iBadge.style.display = '';
            } else {
                iBadge.style.display = 'none';
            }
        }
        if (notifDot) {
            notifDot.style.display = (newMaint > 0 || newInc > 0) ? '' : 'none';
        }
    };

    const markSectionViewed = async (section) => {
        try {
            await API.post('/users/mark-viewed', { section });
            const badgeId = section === 'maintenance' ? 'badgeMaintenance' : 'badgeIncidents';
            const badge = document.getElementById(badgeId);
            if (badge) badge.style.display = 'none';
        } catch (err) { /* ignore */ }
    };

    const updateNotificationCount = async () => {
        const res = await API.get('/notifications/count');
        if (res.ok) {
            const total = res.data.data.total;
            const badge = document.getElementById('notifBadge');
            const dot = document.getElementById('notifDot');
            const btn = document.getElementById('notifBtn');
            if (badge) {
                if (total > 0) {
                    badge.textContent = total > 99 ? '99+' : total;
                    badge.style.display = '';
                    if (dot) dot.style.display = 'none';
                } else {
                    badge.style.display = 'none';
                    if (dot) dot.style.display = '';
                }
            }
            if (btn) btn.title = total > 0 ? `${total} thông báo mới` : 'Không có thông báo mới';
        }
    };

    const fetchAndShowDropdown = async () => {
        const dropdown = document.getElementById('notifDropdown');
        const body = document.getElementById('notifDropdownBody');
        const countEl = document.getElementById('notifDropdownCount');
        if (!dropdown || !body) return;
        const isOpen = dropdown.classList.contains('active');
        if (isOpen) {
            dropdown.classList.remove('active');
            return;
        }
        body.innerHTML = '<div class="notif-dropdown-empty">Đang tải...</div>';
        dropdown.classList.add('active');
        const res = await API.get('/notifications');
        if (res.ok && res.data.data.length > 0) {
            const list = res.data.data.slice(0, 10);
            if (countEl) countEl.textContent = `${res.data.total} thông báo`;
            body.innerHTML = list.map(n => {
                const iconMap = { maintenance: '🔧', warranty: '⚠️', incident: '🚨', transfer: '📦', disposal: '🗑️' };
                const priorityBadge = n.priority === 'high' ? '<span class="badge badge-danger">Cao</span>'
                    : n.priority === 'medium' ? '<span class="badge badge-warning">TB</span>'
                    : '<span class="badge badge-secondary">Thấp</span>';
                const time = n.date ? new Date(n.date).toLocaleDateString('vi-VN') : '';
                return `<div class="notif-dropdown-item" data-link="${n.link || ''}">
                    <div class="notif-dropdown-item-icon">${iconMap[n.type] || '📌'}</div>
                    <div class="notif-dropdown-item-content">
                        <div class="notif-dropdown-item-title">${n.title}</div>
                        <div class="notif-dropdown-item-msg">${n.message}</div>
                        <div class="notif-dropdown-item-time">${time}</div>
                    </div>
                    ${priorityBadge}
                </div>`;
            }).join('');
            body.querySelectorAll('.notif-dropdown-item').forEach(el => {
                el.addEventListener('click', () => {
                    dropdown.classList.remove('active');
                    const link = el.dataset.link;
                    if (link && link.startsWith('#')) navigate(link.slice(1));
                });
            });
        } else {
            if (countEl) countEl.textContent = '0 thông báo';
            body.innerHTML = '<div class="notif-dropdown-empty">✅ Không có thông báo mới</div>';
        }
    };

    // Auto-refresh notifications every 60 seconds
    let notifInterval;
    let eventSource = null;

    const startNotifAutoRefresh = () => {
        updateNotificationCount();

        // Use SSE for real-time updates (replaces polling)
        try {
            const token = API.getToken();
            if (token && typeof EventSource !== 'undefined') {
                eventSource = new EventSource(`${API.BASE_URL}/notifications/stream?token=${token}`);

                eventSource.addEventListener('notification', (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        const total = data.total || 0;
                        const badge = document.getElementById('notifBadge');
                        const dot = document.getElementById('notifDot');
                        if (badge) {
                            badge.textContent = total;
                            badge.style.display = total > 0 ? '' : 'none';
                        }
                        if (dot) {
                            dot.style.display = total > 0 ? '' : 'none';
                        }
                        // Refresh notification dropdown if open
                        const dropdown = document.getElementById('notifDropdown');
                        if (dropdown && dropdown.classList.contains('active')) {
                            fetchAndShowDropdown();
                        }
                    } catch (err) { /* ignore parse errors */ }
                });

                eventSource.onerror = () => {
                    // Try to reconnect after 5 seconds
                    setTimeout(() => {
                        if (eventSource) {
                            eventSource.close();
                            eventSource = null;
                        }
                        startNotifAutoRefresh();
                    }, 5000);
                };
            }
        } catch (err) {
            // Fallback: polling every 60s
            notifInterval = setInterval(updateNotificationCount, 60000);
        }
    };

    const updateUserInfo = (user) => {
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserRole = document.getElementById('sidebarUserRole');
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarUserName) sidebarUserName.textContent = user.username;
        if (sidebarUserRole) sidebarUserRole.textContent = fmt.roleLabel[user.role] || user.role;
        if (sidebarAvatar) {
            if (user.avatar) {
                sidebarAvatar.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
            } else {
                sidebarAvatar.textContent = fmt.initials(user.full_name);
            }
        }
        window.__currentUser = user;
    };

    const init = async () => {
        // Auth check
        if (!API.isLoggedIn()) {
            if (window.location.hash) {
                sessionStorage.setItem('redirectAfterLogin', window.location.hash);
            }
            window.location.href = '/';
            return;
        }

        // Load user info
        const meRes = await API.get('/auth/me');
        if (!meRes.ok) {
            API.clearAuth();
            window.location.href = '/';
            return;
        }
        currentUser = meRes.data.user;
        window.__currentUser = currentUser;

        // Update sidebar user info
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserRole = document.getElementById('sidebarUserRole');
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        if (sidebarUserName) sidebarUserName.textContent = currentUser.username;
        if (sidebarUserRole) sidebarUserRole.textContent = fmt.roleLabel[currentUser.role] || currentUser.role;
        if (sidebarAvatar) {
            if (currentUser.avatar) {
                sidebarAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="avatar">`;
            } else {
                sidebarAvatar.textContent = fmt.initials(currentUser.full_name);
            }
        }
        const topbarAvatar = document.getElementById('userTopbarAvatar');
        if (topbarAvatar) {
            if (currentUser.avatar) {
                topbarAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
            } else {
                topbarAvatar.textContent = fmt.initials(currentUser.full_name);
            }
            topbarAvatar.addEventListener('click', () => showProfileModal());
        }
        const sidebarUserDetail = document.getElementById('sidebarUserDetail');
        if (sidebarUserDetail) sidebarUserDetail.textContent = fmt.roleDescription[currentUser.role] || '';

        const navSectionReports = document.getElementById('nav-section-reports');
        const navSectionAdmin = document.getElementById('nav-section-admin');
        const navUsers = document.getElementById('nav-users');
        const navDepartments = document.getElementById('nav-departments');
        const navCategories = document.getElementById('nav-categories');
        const navTransfers = document.getElementById('nav-transfers');
        const navDisposals = document.getElementById('nav-disposals');
        const navInventory = document.getElementById('nav-inventory');
        const navWarehouse = document.getElementById('nav-warehouse');
        const navReports = document.getElementById('nav-reports');
        const navDepreciation = document.getElementById('nav-depreciation');
        const navLogs = document.getElementById('nav-logs');
        const navLoginHistory = document.getElementById('nav-loginHistory');
        const navSettings = document.getElementById('nav-settings');

        if (currentUser.role === 'user') {
            if (navSectionAdmin) navSectionAdmin.style.display = 'none';
            if (navUsers) navUsers.style.display = 'none';
            if (navDepartments) navDepartments.style.display = 'none';
            if (navCategories) navCategories.style.display = 'none';
            if (navTransfers) navTransfers.style.display = 'none';
            if (navDisposals) navDisposals.style.display = 'none';
            if (navInventory) navInventory.style.display = 'none';
            if (navWarehouse) navWarehouse.style.display = 'none';
            if (navSectionReports) navSectionReports.style.display = 'none';
            if (navReports) navReports.style.display = 'none';
            if (navDepreciation) navDepreciation.style.display = 'none';
            if (navLogs) navLogs.style.display = 'none';
            if (navLoginHistory) navLoginHistory.style.display = 'none';
            if (navSettings) navSettings.style.display = 'none';
        }
        if (currentUser.role === 'admin') {
            if (navInventory) navInventory.style.display = '';
            if (navLogs) navLogs.style.display = '';
            if (navLoginHistory) navLoginHistory.style.display = '';
            if (navSettings) navSettings.style.display = '';
            if (navCategories) navCategories.style.display = 'none';
        } else if (currentUser.role === 'superadmin') {
            if (navInventory) navInventory.style.display = '';
            if (navLogs) navLogs.style.display = '';
            if (navLoginHistory) navLoginHistory.style.display = '';
            if (navSettings) navSettings.style.display = '';
            if (navCategories) navCategories.style.display = '';
        }

        // Load stats for header/badges
        const statsRes = await API.get('/devices/stats/summary');
        if (statsRes.ok) {
            dashboardStats = statsRes.data.data;
            updateHeaderStats(dashboardStats.stats);
            updateBadges(dashboardStats.stats);
        }

        // Load notification count and auto-refresh
        startNotifAutoRefresh();

        // Notification button → toggle dropdown
        const notifBtn = document.getElementById('notifBtn');
        const notifDropdown = document.getElementById('notifDropdown');
        if (notifBtn) {
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fetchAndShowDropdown();
            });
        }
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const wrapper = document.querySelector('.notif-wrapper');
            if (wrapper && notifDropdown && !wrapper.contains(e.target)) {
                notifDropdown.classList.remove('active');
            }
        });

        // "Xem tất cả thông báo" link
        const viewAllLink = document.getElementById('notifViewAll');
        if (viewAllLink) {
            viewAllLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (notifDropdown) notifDropdown.classList.remove('active');
                navigate('notifications');
            });
        }

        // Profile modal
        const userProfileBtn = document.getElementById('userProfileBtn');
        if (userProfileBtn) {
            userProfileBtn.addEventListener('click', () => showProfileModal());
        }

        // PWA Install
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    const result = await deferredInstallPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                        Toast.success('Đang cài đặt ứng dụng...');
                    }
                    deferredInstallPrompt = null;
                    installBtn.style.display = 'none';
                }
            });
        }

        // Ripple effect on all buttons
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.btn, .dev-btn-primary, .dev-btn-secondary, .dev-action-btn');
            if (!btn) return;
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    // Close SSE connection
                    if (eventSource) { eventSource.close(); eventSource = null; }
                    if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
                    API.clearAuth();
                    window.location.href = '/';
                }
            });
        }

        // Hamburger
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const toggleOverlay = () => {
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active', sidebar.classList.contains('open'));
        };
        const closeSidebar = () => {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        };

        if (hamburgerBtn && sidebar) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
                toggleOverlay();
            });
        }

        // Close sidebar on overlay click
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeSidebar);
        }

        // Close sidebar on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });

        // Close sidebar on swipe left
        let touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].screenX - touchStartX;
            if (dx < -80 && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        }, { passive: true });

        // Hash-based routing
        const handleHash = () => {
            const hashStr = window.location.hash.replace('#', '') || 'dashboard';
            const [page, query] = hashStr.split('?');
            
            // Parse params
            const params = {};
            if (query) {
                query.split('&').forEach(pair => {
                    const [k, v] = pair.split('=');
                    params[k] = v;
                });
            }
            window.__currentParams = params;
            navigate(page);
        };
        window.addEventListener('hashchange', handleHash);
        handleHash();
    };

    const saveProfile = async () => {
        const fullName = document.getElementById('profileFullName')?.value.trim();
        const email = document.getElementById('profileEmail')?.value.trim();
        const statusDiv = document.getElementById('profileSaveStatus');
        if (!statusDiv) return;
        if (!fullName) {
            statusDiv.textContent = 'Họ tên không được để trống';
            statusDiv.style.color = '#EF4444';
            statusDiv.style.display = 'block';
            return;
        }
        if (!email) {
            statusDiv.textContent = 'Email không được để trống';
            statusDiv.style.color = '#EF4444';
            statusDiv.style.display = 'block';
            return;
        }
        statusDiv.textContent = 'Đang lưu...';
        statusDiv.style.color = 'var(--text-muted)';
        statusDiv.style.display = 'block';
        try {
            const res = await fetch(`${API.BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API.getToken()}` },
                body: JSON.stringify({ full_name: fullName, email })
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                updateUserInfo(currentUser);
                statusDiv.textContent = 'Cập nhật thông tin thành công!';
                statusDiv.style.color = '#10B981';
            } else {
                statusDiv.textContent = data.message || 'Lưu thất bại';
                statusDiv.style.color = '#EF4444';
            }
        } catch (err) {
            statusDiv.textContent = 'Lỗi kết nối server';
            statusDiv.style.color = '#EF4444';
        }
        statusDiv.style.display = 'block';
    };

    const showProfileModal = () => {
        const user = currentUser;
        const roleColors = { superadmin: '#7C3AED', admin: '#2563EB', user: '#059669' };
        const roleColor = roleColors[user.role] || '#6B7280';
        const body = `
        <div style="text-align:center;padding:1rem 0">
            <div class="avatar-upload-wrap" id="avatarUploadWrap" style="position:relative;cursor:pointer;display:inline-block">
                <div id="profileAvatar" style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,${roleColor},${roleColor}cc);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;margin:0 auto;overflow:hidden;transition:all .2s">
                    ${user.avatar ? `<img src="${user.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover">` : fmt.initials(user.full_name)}
                </div>
                <div style="position:absolute;bottom:0;right:0;width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.12)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${roleColor}" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
                <input type="file" id="avatarFileInput" accept="image/*" style="display:none">
            </div>
            <span style="display:inline-block;margin-top:.75rem;padding:2px 12px;border-radius:100px;background:${roleColor}15;color:${roleColor};font-size:.75rem;font-weight:600">${fmt.roleLabel[user.role] || user.role}</span>
        </div>
        <div style="padding:0 0 .5rem">
            <div style="margin-bottom:.75rem">
                <label class="form-label">Họ và tên</label>
                <input class="form-control" id="profileFullName" value="${user.full_name}" style="font-size:.88rem">
            </div>
            <div style="margin-bottom:.75rem">
                <label class="form-label">Email</label>
                <input class="form-control" id="profileEmail" value="${user.email}" style="font-size:.88rem">
            </div>
            <div style="margin-bottom:.75rem">
                <label class="form-label">Tên đăng nhập</label>
                <input class="form-control" value="${user.username}" disabled style="font-size:.88rem;background:#F8FAFC;color:#94A3B8">
            </div>
            <div style="margin-bottom:.75rem">
                <label class="form-label">Phòng ban</label>
                <input class="form-control" value="${user.department?.name || '—'}" disabled style="font-size:.88rem;background:#F8FAFC;color:#94A3B8">
            </div>
        </div>
        <div id="profileSaveStatus" style="font-size:.82rem;display:none;text-align:center;padding:.5rem"></div>
        <div id="avatarUploadStatus" style="font-size:.82rem;display:none;text-align:center;padding:.25rem"></div>`;
        showModal('Thông tin tài khoản', body, true, saveProfile, '520px');

        const avatarWrap = document.getElementById('avatarUploadWrap');
        const fileInput = document.getElementById('avatarFileInput');
        const statusDiv = document.getElementById('avatarUploadStatus');
        if (avatarWrap && fileInput) {
            avatarWrap.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                    statusDiv.textContent = 'Ảnh không được quá 2MB';
                    statusDiv.style.color = '#EF4444';
                    statusDiv.style.display = 'block';
                    return;
                }
                statusDiv.textContent = 'Đang tải lên...';
                statusDiv.style.color = 'var(--text-muted)';
                statusDiv.style.display = 'block';
                const fd = new FormData();
                fd.append('avatar', file);
                try {
                    const res = await fetch(`${API.BASE_URL}/upload/avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${API.getToken()}` },
                        body: fd
                    });
                    const data = await res.json();
                    if (data.success) {
                        currentUser.avatar = data.data.url;
                        const avatarEl = document.getElementById('profileAvatar');
                        if (avatarEl) avatarEl.innerHTML = `<img src="${data.data.url}" alt="avatar" style="width:100%;height:100%;object-fit:cover">`;
                        const sidebarAvatar = document.getElementById('sidebarAvatar');
                        if (sidebarAvatar) sidebarAvatar.innerHTML = `<img src="${data.data.url}" alt="avatar">`;
                        statusDiv.textContent = 'Cập nhật ảnh đại diện thành công!';
                        statusDiv.style.color = '#10B981';
                    } else {
                        statusDiv.textContent = data.message || 'Tải ảnh thất bại';
                        statusDiv.style.color = '#EF4444';
                    }
                } catch (err) {
                    statusDiv.textContent = 'Lỗi kết nối server';
                    statusDiv.style.color = '#EF4444';
                }
                statusDiv.style.display = 'block';
            });
        }
    };

    // Generate skeleton loading HTML based on page type
    const getPageSkeleton = (page) => {
        const skeletons = {
            dashboard: `
            <div class="page-skeleton">
                <div class="sk-section">
                    <div class="sk-block" style="min-height:110px">
                        <div class="sk-line sk-line-lg"></div>
                        <div class="sk-line sk-line-sm"></div>
                    </div>
                </div>
                <div class="sk-section sk-row sk-row-5">
                    ${Array(5).fill('<div class="sk-block sk-block-sm"><div class="sk-bar" style="height:60px"></div></div>').join('')}
                </div>
                <div class="sk-section sk-row sk-row-2">
                    <div class="sk-block"><div class="sk-chart">${Array(6).fill('<div class="sk-chart-bar" style="height:' + (30 + Math.random()*70) + 'px"></div>').join('')}</div></div>
                    <div class="sk-block"><div class="sk-circle" style="width:160px;height:160px;margin:0 auto;border-radius:50%"></div></div>
                </div>
            </div>`,
            devices: `
            <div class="page-skeleton">
                <div class="sk-section">
                    <div class="sk-h">
                        <div class="sk-circle"></div>
                        <div><div class="sk-line sk-line-md"></div><div class="sk-line sk-line-sm"></div></div>
                    </div>
                </div>
                <div class="sk-section">
                    <div class="sk-block">
                        <div class="sk-table">
                            ${Array(5).fill('<div class="sk-table-row">' + Array(6).fill('<div class="sk-line"></div>').join('') + '</div>').join('')}
                        </div>
                    </div>
                </div>
            </div>`,
            default: `
            <div class="page-skeleton">
                <div class="sk-section">
                    <div class="sk-h">
                        <div class="sk-circle"></div>
                        <div><div class="sk-line sk-line-md"></div><div class="sk-line sk-line-sm"></div></div>
                    </div>
                </div>
                <div class="sk-section">
                    <div class="sk-block">
                        <div class="sk-table">
                            ${Array(4).fill('<div class="sk-table-row">' + Array(4).fill('<div class="sk-line"></div>').join('') + '</div>').join('')}
                        </div>
                    </div>
                </div>
            </div>`
        };
        return skeletons[page] || skeletons.default;
    };

    return { init, navigate, getCurrentUser: () => currentUser, getDashboardStats: () => dashboardStats };
})();

// PWA: online/offline detection
window.addEventListener('online', () => {
    const Toast = window.Toast || { success: () => {} };
    Toast.success('Đã kết nối lại mạng');
});
window.addEventListener('offline', () => {
    const Toast = window.Toast || { error: () => {} };
    Toast.error('Mất kết nối mạng. Một số tính năng có thể không hoạt động.');
});

// PWA: capture install prompt for custom install button
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.style.display = 'flex';
});
window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.style.display = 'none';
    const Toast = window.Toast || { success: () => {} };
    Toast.success('Ứng dụng đã được cài đặt thành công!');
});

document.addEventListener('DOMContentLoaded', App.init);
