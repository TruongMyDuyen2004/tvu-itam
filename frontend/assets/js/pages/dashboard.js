/* ============================================================
   TVU-ITAM - Dashboard Page
   ============================================================ */
window.DashboardPage = (() => {
    let charts = {};

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Chào buổi sáng';
        if (h < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const formatNumber = (n) => n?.toLocaleString('vi-VN') || '0';

    const formatDate = (d) => { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'}); };

    const renderUserDashboard = async (currentUser) => {
        const content = document.getElementById('mainContent');
        const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Chào buổi sáng'; if (h < 18) return 'Chào buổi chiều'; return 'Chào buổi tối'; })();
        content.innerHTML = `
        <style>
            @keyframes fIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
            @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
            @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
            .ud-wrap{max-width:1100px;margin:0 auto}
            .ud-wlc{background:linear-gradient(135deg,#2563EB,#0a6dd8,#0066cc);border-radius:20px;padding:1.75rem 2rem;margin-bottom:2rem;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;box-shadow:0 8px 32px rgba(0,87,184,.25)}
            .ud-wlc::before{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.06)}
            .ud-wlc::after{content:'';position:absolute;bottom:-30%;left:-10%;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.04)}
            .ud-wlc-l{position:relative;z-index:1}
            .ud-wlc-l h1{font-size:1.4rem;font-weight:700;color:#fff;margin:0;line-height:1.3}
            .ud-wlc-l p{font-size:.8rem;color:rgba(255,255,255,.75);margin:3px 0 0 0}
            .ud-wlc-r{position:relative;z-index:1;display:flex;align-items:center;gap:14px}
            .ud-wlc-bdg{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.15);backdrop-filter:blur(12px);color:#fff;padding:7px 18px;border-radius:100px;font-size:.75rem;font-weight:600;border:1px solid rgba(255,255,255,.18)}
            .ud-wlc-bdg svg{width:14px;height:14px}
            .ud-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:2.25rem}
            .ud-stat{animation:fIn .55s ease both;background:#fff;border-radius:16px;padding:1.25rem 1.35rem;border:1px solid #E8ECF0;cursor:pointer;transition:all .35s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.03);display:flex;align-items:center;gap:14px}
            .ud-stat:hover{box-shadow:0 8px 28px rgba(0,87,184,.1);border-color:#2563EB;transform:translateY(-3px)}
            .ud-stat-i{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .35s}
            .ud-stat:hover .ud-stat-i{transform:scale(1.08)}
            .ud-stat-inf{flex:1;min-width:0}
            .ud-stat-n{font-size:1.5rem;font-weight:800;color:#0F172A;letter-spacing:-.03em;line-height:1.2}
            .ud-stat-l{font-size:.73rem;color:#64748B;margin-top:1px}
            .ud-sec{margin-bottom:2.5rem}
            .ud-sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
            .ud-sec-h h2{font-size:1.1rem;font-weight:700;color:#0F172A;margin:0;display:flex;align-items:center;gap:8px}
            .ud-sec-h h2 svg{width:20px;height:20px;color:#2563EB}
            .ud-sec-h a{font-size:.73rem;color:#2563EB;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:5px;transition:all .25s;padding:6px 12px;border-radius:8px}
            .ud-sec-h a:hover{background:rgba(0,87,184,.06);gap:9px}
            .ud-fil{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1.15rem}
            .ud-fil span{font-size:.73rem;font-weight:600;padding:6px 16px;border-radius:100px;border:1px solid #E2E8F0;background:#fff;color:#64748B;cursor:pointer;transition:all .25s;user-select:none}
            .ud-fil span:hover{border-color:#2563EB;color:#2563EB;background:rgba(0,87,184,.03)}
            .ud-fil span.on{background:#2563EB;border-color:#2563EB;color:#fff;box-shadow:0 2px 8px rgba(0,87,184,.25)}
            .ud-grd{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
            .ud-crd{animation:fIn .5s ease both;background:#fff;border-radius:16px;border:1px solid #E8ECF0;padding:1.25rem;transition:all .35s cubic-bezier(.4,0,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.02);display:flex;flex-direction:column}
            .ud-crd:hover{box-shadow:0 12px 36px rgba(0,0,0,.07);border-color:#D0D5DD;transform:translateY(-4px)}
            .ud-crd-tp{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px}
            .ud-crd-n{font-size:.92rem;font-weight:700;color:#0F172A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
            .ud-crd-bdg{font-size:.6rem;font-weight:700;padding:2px 10px;border-radius:100px;flex-shrink:0;margin-top:1px}
            .ud-crd-s{font-size:.71rem;color:#94A3B8;margin-top:2px}
            .ud-crd-t{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0 8px}
            .ud-tg{display:inline-flex;align-items:center;gap:3px;font-size:.63rem;font-weight:600;padding:3px 8px;border-radius:6px}
            .ud-tg-b{background:rgba(0,87,184,.06);color:#2563EB}
            .ud-tg-o{background:rgba(255,169,68,.08);color:#D97706}
            .ud-crd-st{display:flex;align-items:center;gap:6px;font-size:.73rem;font-weight:600;padding:2px 0 10px}
            .ud-crd-st::before{content:'';width:7px;height:7px;border-radius:50%;flex-shrink:0}
            .ud-crd-a{display:flex;gap:8px;margin-top:auto}
            .ud-btn{flex:1;font-size:.72rem;font-weight:600;padding:8px 0;border-radius:10px;text-align:center;cursor:pointer;transition:all .25s;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:5px}
            .ud-btn-pri{border:1.5px solid #2563EB;color:#2563EB;background:transparent}
            .ud-btn-pri:hover{background:rgba(0,87,184,.06);box-shadow:0 2px 8px rgba(0,87,184,.1)}
            .ud-btn-sec{border:1.5px solid #D97706;color:#D97706;background:transparent}
            .ud-btn-sec:hover{background:rgba(217,119,6,.06);box-shadow:0 2px 8px rgba(217,119,6,.1)}
            .ud-notif{background:#fff;border-radius:16px;border:1px solid #E8ECF0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.02)}
            .ud-notif-it{display:flex;align-items:center;gap:12px;padding:.85rem 1.25rem;border-bottom:1px solid #F1F3F5;cursor:pointer;transition:all .2s}
            .ud-notif-it:last-child{border-bottom:none}
            .ud-notif-it:hover{background:#F8FAFC}
            .ud-notif-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
            .ud-notif-ic svg{width:16px;height:16px}
            .ud-notif-bd{flex:1;min-width:0}
            .ud-notif-t{font-size:.85rem;font-weight:600;color:#0F172A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .ud-notif-d{font-size:.71rem;color:#94A3B8;margin-top:1px}
            .ud-empty{padding:48px 24px;text-align:center}
            .ud-empty-ic{width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,rgba(0,87,184,.05),rgba(0,87,184,.01));display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:1px solid rgba(0,87,184,.08)}
            .ud-empty-ic svg{width:28px;height:28px;color:#2563EB;opacity:.6}
            .ud-empty h4{font-size:.9rem;font-weight:600;color:#64748B;margin:0}
            .ud-empty p{font-size:.75rem;color:#94A3B8;margin:4px 0 0}
            @media(max-width:768px){
                .ud-wrap{padding:0 4px}
                .ud-wlc{padding:1.25rem 1.15rem;flex-direction:column;align-items:flex-start;gap:10px}
                .ud-wlc-l h1{font-size:1.15rem;word-break:break-word}
                .ud-wlc-l p{font-size:.73rem}
                .ud-wlc-bdg{font-size:.7rem;padding:5px 14px}
                .ud-stats{grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:1.75rem}
                .ud-stats .ud-stat:nth-child(3){grid-column:1/-1}
                .ud-stat{padding:1rem;gap:10px}
                .ud-stat-i{width:38px;height:38px}
                .ud-stat-i svg{width:16px;height:16px}
                .ud-stat-n{font-size:1.2rem}
                .ud-stat-l{font-size:.68rem;word-break:break-word}
                .ud-sec-h h2{font-size:.95rem;word-break:break-word}
                .ud-sec-h h2 svg{width:17px;height:17px}
                .ud-sec-h a{font-size:.68rem;padding:4px 8px;flex-shrink:0}
                .ud-fil{flex-wrap:nowrap;overflow-x:auto;gap:5px;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
                .ud-fil::-webkit-scrollbar{display:none}
                .ud-fil span{font-size:.68rem;padding:5px 12px;white-space:nowrap;flex-shrink:0}
                .ud-grd{grid-template-columns:1fr;gap:12px}
                .ud-crd{padding:1rem}
                .ud-crd-n{font-size:.85rem}
                .ud-crd-bdg{font-size:.55rem;padding:2px 8px}
                .ud-crd-s{font-size:.68rem}
                .ud-tg{font-size:.6rem;padding:2px 7px}
                .ud-btn{font-size:.68rem;padding:7px 0}
                .ud-notif-it{padding:.7rem 1rem;gap:10px}
                .ud-notif-ic{width:32px;height:32px}
                .ud-notif-ic svg{width:14px;height:14px}
                .ud-notif-t{font-size:.8rem}
                .ud-notif-d{font-size:.68rem}
                .ud-empty{padding:36px 16px}
            }
            @media(max-width:480px){
                .ud-wlc{border-radius:14px;padding:1rem}
                .ud-wlc-l h1{font-size:1rem}
                .ud-stats{grid-template-columns:1fr;gap:10px}
                .ud-stat{padding:.85rem;border-radius:12px}
                .ud-stat-i{width:34px;height:34px;border-radius:10px}
                .ud-stat-n{font-size:1.1rem}
                .ud-sec{margin-bottom:1.75rem}
                .ud-crd{border-radius:12px}
                .ud-crd-tp{flex-direction:column;gap:4px}
                .ud-crd-bdg{align-self:flex-start}
                .ud-crd-a{flex-direction:column;gap:6px}
                .ud-notif{padding:0 0 0 0}
                .ud-notif-it{padding:.65rem .85rem}
            }
        </style>

        <div class="ud-wrap">
        <div class="ud-wlc">
            <div class="ud-wlc-l">
                <h1>${greeting}, <span style="font-weight:600">${currentUser?.full_name || currentUser?.username || 'bạn'}</span></h1>
                <p>${today}</p>
            </div>
            <div class="ud-wlc-r">
                <div class="ud-wlc-bdg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <span id="devCountBadge">0</span> thiết bị
                </div>
            </div>
        </div>

        <div class="ud-stats" id="statsGrid">
            ${[0,1,2].map(i => `<div class="ud-stat stat-skel" style="animation-delay:${i*0.07}s"><div style="display:flex;align-items:center;gap:14px;width:100%"><div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%"></div><div style="flex:1"><div style="height:14px;width:45px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:4px;margin-bottom:5px"></div><div style="height:10px;width:75px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:4px"></div></div></div></div>`).join('')}
        </div>

        <div class="ud-sec">
            <div class="ud-sec-h">
                <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Thiết bị của tôi</h2>
                <a href="#devices">Xem tất cả <span style="font-size:1rem">→</span></a>
            </div>
            <div class="ud-fil" id="filterBar">
                <span class="on" data-filter="all">Tất cả</span>
                <span data-filter="active">Đang dùng</span>
                <span data-filter="maintenance">Bảo trì</span>
                <span data-filter="broken">Hỏng</span>
                <span data-filter="disposed">Đã thanh lý</span>
            </div>
            <div class="ud-grd" id="deviceGrid">
                ${[0,1,2,3,4,5].map(i => `<div class="ud-crd" style="animation-delay:${i*0.05}s;min-height:150px"><div style="height:14px;width:60%;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:4px;margin-bottom:8px"></div><div style="height:10px;width:40%;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:4px;margin-bottom:16px"></div><div style="display:flex;gap:6px;margin-bottom:16px"><div style="height:22px;width:70px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:6px"></div><div style="height:22px;width:80px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:6px"></div></div><div style="height:10px;width:50%;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:4px;margin-bottom:12px"></div><div style="display:flex;gap:8px"><div style="flex:1;height:34px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:10px"></div><div style="flex:1;height:34px;background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%);background-size:200% 100%;border-radius:10px"></div></div></div>`).join('')}
            </div>
        </div>

        <div class="ud-sec">
            <div class="ud-sec-h">
                <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Thông báo mới nhất</h2>
                <a href="#notifications">Xem tất cả <span style="font-size:1rem">→</span></a>
            </div>
            <div class="ud-notif" id="notifList"><div style="padding:36px 24px;text-align:center"><div class="spinner" style="width:20px;height:20px;border-width:2px;border-color:#E2E8F0;border-top-color:#2563EB"></div></div></div>
        </div>
        </div>`;

        const [summaryRes, devRes, notifRes] = await Promise.all([
            API.get('/devices/stats/summary'),
            API.get('/devices?limit=100'),
            API.get('/notifications?limit=5')
        ]);

        let myDevices = [];
        if (devRes.ok) {
            myDevices = (devRes.data.data || []).filter(d => d.assigned_user_id === currentUser.id);
        }

        document.getElementById('devCountBadge').textContent = myDevices.length;

        const incRes = await API.get('/incidents?limit=100');
        let myIncCount = '0';
        if (incRes.ok) {
            const myInc = (incRes.data.data || []).filter(i => i.reported_by === currentUser.id || i.assigned_to === currentUser.id);
            myIncCount = myInc.filter(i => i.status === 'open').length;
        }

        let myMaintCount = '0';
        if (myDevices.length > 0) {
            const maintRes = await API.get('/maintenance?limit=100');
            if (maintRes.ok) {
                const deviceIds = myDevices.map(d => d.id);
                myMaintCount = (maintRes.data.data || []).filter(m => deviceIds.includes(m.device_id) && (m.status === 'cho_xu_ly' || m.status === 'da_duyet')).length;
            }
        }

        document.getElementById('statsGrid').innerHTML = `
            <div class="ud-stat" style="animation-delay:0s" onclick="window.location.hash='#devices'">
                <div class="ud-stat-i" style="background:linear-gradient(135deg,rgba(0,87,184,.12),rgba(0,87,184,.04));color:#2563EB"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
                <div class="ud-stat-inf"><div class="ud-stat-n">${myDevices.length}</div><div class="ud-stat-l">Thiết bị của tôi</div></div>
            </div>
            <div class="ud-stat" style="animation-delay:.06s" onclick="window.location.hash='#incidents'">
                <div class="ud-stat-i" style="background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.04));color:#EF4444"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                <div class="ud-stat-inf"><div class="ud-stat-n">${myIncCount}</div><div class="ud-stat-l">Sự cố đang xử lý</div></div>
            </div>
            <div class="ud-stat" style="animation-delay:.12s" onclick="window.location.hash='#maintenance'">
                <div class="ud-stat-i" style="background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(245,158,11,.04));color:#F59E0B"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
                <div class="ud-stat-inf"><div class="ud-stat-n">${myMaintCount}</div><div class="ud-stat-l">Bảo trì sắp đến</div></div>
            </div>`;

        document.querySelectorAll('.stat-skel').forEach(el => el.remove());

        const statusColors = { active: {bdg:'#2563EB',bg:'rgba(0,87,184,.06)',clr:'#2563EB',dot:'#2563EB',label:'Đang dùng'}, maintenance: {bdg:'#D97706',bg:'rgba(217,119,6,.06)',clr:'#D97706',dot:'#D97706',label:'Bảo trì'}, broken: {bdg:'#DC2626',bg:'rgba(220,38,38,.06)',clr:'#DC2626',dot:'#DC2626',label:'Hỏng'}, disposed: {bdg:'#64748B',bg:'rgba(100,116,139,.06)',clr:'#64748B',dot:'#94A3B8',label:'Đã thanh lý'} };
        const deviceGrid = document.getElementById('deviceGrid');

        function renderDevices(filter) {
            const filtered = filter && filter !== 'all' ? myDevices.filter(d => d.status === filter) : myDevices;
            if (filtered.length === 0) {
                deviceGrid.innerHTML = '<div class="ud-empty" style="grid-column:1/-1"><div class="ud-empty-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><h4>Không có thiết bị nào</h4><p>Liên hệ phòng CNTT để được cấp thiết bị</p></div>';
                return;
            }
            deviceGrid.innerHTML = filtered.map((d, i) => {
                const sc = statusColors[d.status] || statusColors.active;
                return `
                <div class="ud-crd" style="animation-delay:${i*0.04}s">
                    <div class="ud-crd-tp">
                        <div class="ud-crd-n">${d.name}</div>
                        <span class="ud-crd-bdg" style="background:${sc.bg};color:${sc.clr}">${sc.label}</span>
                    </div>
                    <div class="ud-crd-s">${d.category_name || '—'} · ${d.department_name || '—'}</div>
                    <div class="ud-crd-t">
                        <span class="ud-tg ud-tg-b"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>${d.device_code || '—'}</span>
                        <span class="ud-tg ud-tg-o"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${d.assigned_date ? formatDate(d.assigned_date) : '—'}</span>
                    </div>
                    <div class="ud-crd-a">
                        <a href="#devices" class="ud-btn ud-btn-pri">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Chi tiết
                        </a>
                        <a href="#incidents" class="ud-btn ud-btn-sec">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Báo cáo
                        </a>
                    </div>
                </div>`;
            }).join('');
        }

        renderDevices('all');

        document.getElementById('filterBar').addEventListener('click', function(e) {
            const el = e.target.closest('span');
            if (!el || !el.dataset.filter) return;
            document.querySelectorAll('#filterBar span').forEach(s => s.classList.remove('on'));
            el.classList.add('on');
            renderDevices(el.dataset.filter);
        });

        const notifEl = document.getElementById('notifList');
        if (notifRes.ok) {
            const notifs = (notifRes.data.data || []).slice(0, 5);
            if (notifs.length === 0) {
                notifEl.innerHTML = '<div class="ud-empty"><div class="ud-empty-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div><h4>Không có thông báo</h4><p>Mọi thứ đều ổn, bạn không có thông báo mới</p></div>';
            } else {
                const typeMeta = {
                    maintenance: { icon:'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', label:'Bảo trì' },
                    warranty: { icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label:'Bảo hành' },
                    incident: { icon:'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', label:'Sự cố' },
                    transfer: { icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label:'Điều chuyển' },
                    disposal: { icon:'M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16', label:'Thanh lý' }
                };
                const prioMeta = { high:{clr:'#EF4444',bg:'linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.04))',dot:'#EF4444',label:'Cao'}, medium:{clr:'#F59E0B',bg:'linear-gradient(135deg,rgba(245,158,11,.12),rgba(245,158,11,.04))',dot:'#F59E0B',label:'TB'}, low:{clr:'#2563EB',bg:'linear-gradient(135deg,rgba(0,87,184,.1),rgba(0,87,184,.03))',dot:'#2563EB',label:'Thấp'} };
                const timeAgo = (d) => { if (!d) return ''; const s = Math.floor((new Date()-new Date(d))/1000); if (s<60) return 'Vừa xong'; const m=Math.floor(s/60); if(m<60) return m+'ph trước'; const h=Math.floor(m/60); if(h<24) return h+'giờ trước'; const day=Math.floor(h/24); if(day<7) return day+' ngày trước'; return formatDate(d); };
                notifEl.innerHTML = notifs.map(n => {
                    const tm = typeMeta[n.type] || typeMeta.maintenance;
                    const pm = prioMeta[n.priority] || prioMeta.low;
                    return `
                    <div class="ud-notif-it" onclick="window.location.hash='#notifications'">
                        <div class="ud-notif-ic" style="background:${pm.bg};color:${pm.clr};position:relative">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="${tm.icon}"/></svg>
                            <span style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:${pm.dot};border:2px solid #fff"></span>
                        </div>
                        <div class="ud-notif-bd">
                            <div class="ud-notif-t">${n.title}</div>
                            <div class="ud-notif-d" style="display:flex;align-items:center;gap:6px;margin-top:2px">
                                <span style="display:inline-flex;align-items:center;gap:3px;font-size:.65rem;font-weight:600;color:${pm.clr};background:${pm.bg};padding:1px 8px;border-radius:100px">${pm.label}</span>
                                <span>${timeAgo(n.date)}</span>
                            </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>`;
                }).join('');
            }
        }
    };

    const render = async () => {
        const currentUser = App.getCurrentUser();
        if (currentUser?.role === 'user') {
            await renderUserDashboard(currentUser);
            return;
        }

        const content = document.getElementById('mainContent');
        const canExportPdf = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
        const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const isMobile = window.innerWidth <= 1024;
        content.innerHTML = `
        <style>
        @media (max-width: 1024px) {
            .dash-row { grid-template-columns: 1fr !important; gap: 1rem !important; }
            .dash-card-chart { min-height: auto !important; }
            .dash-card-body[style*="height:300px"] { height: ${isMobile ? '220px' : '300px'} !important; }
        }
        </style>
        <div class="dash-welcome card-anim-1">
            <div class="dash-welcome-bg"></div>
            <div class="dash-welcome-content">
                <div class="dash-welcome-text">
                    <div class="dash-greeting">${getGreeting()}, <strong>${currentUser?.full_name || currentUser?.username || 'bạn'}</strong></div>
                    <div class="dash-date">${today}</div>
                </div>
                <div class="dash-welcome-actions">
                    ${canExportPdf ? `<button class="dash-btn-outline" id="exportStatsPdfBtn" title="Xuất báo cáo PDF">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Xuất báo cáo
                    </button>` : ''}
                </div>
            </div>
        </div>

        <div class="dash-stats" id="statsGrid">
            ${[1,2,3,4,5].map(() => `
                <div class="dash-stat-skeleton"><div class="spinner"></div></div>
            `).join('')}
        </div>

        <div class="dash-row">
            <div class="dash-card dash-card-chart card-anim-2">
                <div class="dash-card-header">
                    <span class="dash-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Phân bổ theo phòng ban
                    </span>
                </div>
                <div class="dash-card-body" style="height:300px">
                    <canvas id="chartByDept"></canvas>
                </div>
            </div>
            <div class="dash-card dash-card-chart card-anim-3">
                <div class="dash-card-header">
                    <span class="dash-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                        Cơ cấu loại thiết bị
                    </span>
                </div>
                <div class="dash-card-body" style="height:300px;display:flex;align-items:center;justify-content:center">
                    <canvas id="chartByCategory"></canvas>
                </div>
            </div>
        </div>

        <div class="dash-row card-anim-4">
            <div class="dash-card">
                <div class="dash-card-header">
                    <span class="dash-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Lịch bảo trì sắp đến
                    </span>
                    <a href="#maintenance" class="dash-view-all">Xem tất cả</a>
                </div>
                <div id="upcomingMaint" style="padding:6px 0 0 0"></div>
            </div>
            <div class="dash-card">
                <div class="dash-card-header">
                    <span class="dash-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Cảnh báo bảo hành
                    </span>
                </div>
                <div id="expiringWarranty" style="padding:6px 0 0 0"></div>
            </div>
        </div>`;

        const res = await API.get('/devices/stats/summary');
        if (!res.ok) { Toast.error('Không thể tải dữ liệu dashboard'); return; }
        const { stats, by_category, by_department, upcoming_maintenance, expiring_warranty } = res.data.data;

        const cards = [
            { icon: 'devices', gradient: 'indigo-deep', label: 'Tổng thiết bị', value: stats.total_devices, sub: 'Tất cả tài sản CNTT', target: '#devices', filter: '' },
            { icon: 'active', gradient: 'indigo', label: 'Đang hoạt động', value: stats.active_devices, sub: `${Math.round(stats.active_devices/stats.total_devices*100)||0}% tổng số`, target: '#devices', filter: 'active' },
            { icon: 'maintenance', gradient: 'indigo-light', label: 'Đang bảo trì', value: stats.maintenance_devices, sub: 'Cần kiểm tra', target: '#devices', filter: 'maintenance' },
            { icon: 'broken', gradient: 'indigo-lighter', label: 'Sự cố', value: stats.broken_devices, sub: 'Đang chờ xử lý', target: '#devices', filter: 'broken' },
            { icon: 'schedule', gradient: 'indigo-lightest', label: 'Bảo trì đã lên lịch', value: stats.pending_maintenance, sub: 'Chờ thực hiện', target: '#maintenance', filter: '' },
        ];

        document.getElementById('statsGrid').innerHTML = cards.map((c, i) => {
            const icons = {
                devices: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
                active: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
                maintenance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
                broken: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                schedule: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>'
            };
            const gradientMap = {
                'indigo-deep': 'linear-gradient(135deg, #4338CA, #4F46E5)',
                'indigo': 'linear-gradient(135deg, #4F46E5, #6366F1)',
                'indigo-light': 'linear-gradient(135deg, #6366F1, #818CF8)',
                'indigo-lighter': 'linear-gradient(135deg, #818CF8, #A5B4FC)',
                'indigo-lightest': 'linear-gradient(135deg, #4338CA, #818CF8)',
            };
            return `
            <div class="dash-stat-card" onclick="window.location.hash='${c.target}${c.filter ? '?status='+c.filter : ''}'" style="--stat-gradient: ${gradientMap[c.gradient]}">
                <div class="dash-stat-icon">${icons[c.icon]}</div>
                <div class="dash-stat-info">
                    <div class="dash-stat-value">${formatNumber(c.value)}</div>
                    <div class="dash-stat-label">${c.label}</div>
                    <div class="dash-stat-sub">${c.sub}</div>
                </div>
                <div class="dash-stat-glow"></div>
            </div>`;
        }).join('');

        const catCtx = document.getElementById('chartByCategory').getContext('2d');
        const activeCats = by_category.filter(c => c.total > 0);
        const isPhone = window.innerWidth <= 480;
        charts.cat = new Chart(catCtx, {
            type: 'bar',
            data: {
                labels: activeCats.map(c => c.name),
                datasets: [{ 
                    label: 'Thiết bị',
                    data: activeCats.map(c => c.total),
                    backgroundColor: '#818CF8',
                    borderRadius: 4,
                    barThickness: isPhone ? 20 : 28,
                    hoverBackgroundColor: '#6366F1',
                    categoryPercentage: 0.7
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 15, right: isPhone ? 15 : 15 } },
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                        ticks: { color: '#94A3B8', font: { size: isPhone ? 10 : 11 }, maxRotation: isPhone ? 45 : 0, autoSkip: true, maxTicksLimit: isPhone ? 6 : 12 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { color: '#64748B', font: { size: isPhone ? 9 : 11 } }
                    }
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0F172A',
                        titleColor: '#F8FAFC',
                        bodyColor: '#CBD5E1',
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: false
                    },
                    datalabels: isPhone ? false : {
                        anchor: 'end',
                        align: 'end',
                        color: '#6366F1',
                        font: { weight: 'bold', size: 11 },
                        offset: 2,
                        formatter: v => v
                    }
                }
            },
            plugins: isPhone ? [] : [ChartDataLabels]
        });

        const deptCtx = document.getElementById('chartByDept').getContext('2d');
        const topDepts = by_department.slice(0, 10);
        const isDeptPhone = window.innerWidth <= 480;
        charts.dept = new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: topDepts.map(d => d.code || d.name),
                datasets: [{ 
                    label: 'Thiết bị', 
                    data: topDepts.map(d => d.total),
                    backgroundColor: '#A5B4FC',
                    borderRadius: 4,
                    barThickness: isDeptPhone ? 20 : 28,
                    hoverBackgroundColor: '#818CF8',
                    categoryPercentage: 0.7
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 15, right: isDeptPhone ? 15 : 15 } },
                scales: { 
                    x: { 
                        ticks: { color: '#94A3B8', font: { size: isDeptPhone ? 10 : 11 }, maxRotation: isDeptPhone ? 45 : 0, autoSkip: true, maxTicksLimit: isDeptPhone ? 6 : 12 },
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }
                    },
                    y: { 
                        beginAtZero: true,
                        ticks: { color: '#64748B', font: { size: isDeptPhone ? 9 : 11 } },
                        grid: { display: false }
                    } 
                },
                plugins: {
                    legend: { display: false },
                    datalabels: isDeptPhone ? false : {
                        anchor: 'end',
                        align: 'end',
                        color: '#818CF8',
                        font: { weight: 'bold', size: 11 },
                        offset: 2,
                        formatter: v => v
                    }
                }
            },
            plugins: isDeptPhone ? [] : [ChartDataLabels]
        });

        const maintEl = document.getElementById('upcomingMaint');
        if (upcoming_maintenance.length === 0) {
            maintEl.innerHTML = `<div class="dash-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><p>Không có lịch bảo trì sắp tới</p></div>`;
        } else {
            const prioDot = { low:'#10B981', medium:'#F59E0B', high:'#EF4444', critical:'#DC2626' };
            maintEl.innerHTML = upcoming_maintenance.map(m => `
                <div class="dl-item" onclick="window.location.hash='#maintenance'">
                    <span class="dl-dot" style="background:${prioDot[m.priority]||'#3B82F6'}"></span>
                    <div class="dl-body">
                        <div class="dl-name">${m.device_name}</div>
                        <div class="dl-meta">${fmt.date(m.request_date)}</div>
                    </div>
                    <span class="dl-badge ${m.priority}">${fmt.priorityLabel[m.priority]}</span>
                </div>`).join('');
        }

        const warnEl = document.getElementById('expiringWarranty');
        if (expiring_warranty.length === 0) {
            warnEl.innerHTML = `<div class="dash-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><p>Mọi thiết bị đều ổn</p></div>`;
        } else {
            warnEl.innerHTML = expiring_warranty.map(d => {
                const days = Math.ceil((new Date(d.warranty_expiry) - new Date()) / 86400000);
                const clr = days <= 30 ? '#EF4444' : days <= 60 ? '#F59E0B' : '#3B82F6';
                return `
                <div class="dl-item">
                    <span class="dl-dot" style="background:${clr}"></span>
                    <div class="dl-body">
                        <div class="dl-name">${d.name}</div>
                        <div class="dl-meta">${d.device_code}</div>
                    </div>
                    <div class="dl-right">
                        <div class="dl-num" style="color:${clr}">${days}</div>
                        <div class="dl-unit">ngày</div>
                    </div>
                </div>`;
            }).join('');
        }
    };

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'exportStatsPdfBtn') {
            exportStatsPdf();
        }
    });

    const exportStatsPdf = () => {
        const token = API.getToken();
        if (!token) { Toast.error('Vui lòng đăng nhập lại'); return; }
        window.open(API.BASE_URL + '/devices/stats/export-pdf?inline=1&token=' + encodeURIComponent(token), '_blank');
    };

    return { render, exportStatsPdf };
})();
