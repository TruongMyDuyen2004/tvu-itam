window.ReportsPage = (() => {
    let charts = {};
    if (window.Chart && window.ChartDataLabels) { Chart.register(ChartDataLabels); }

    const render = async () => {
        document.getElementById('mainContent').innerHTML = `
        <div class="page-section">
            <div id="rptContent"><div style="display:flex;align-items:center;justify-content:center;padding:4rem"><div class="spinner"></div></div></div>
        </div>`;

        const res = await API.get('/devices/stats/summary');
        if (!res.ok) { Toast.error('Không thể tải báo cáo'); return; }
        const { stats, by_category, by_department } = res.data.data;

        const cu = App.getCurrentUser();
        const totalValue = by_department.reduce((sum, d) => sum + parseFloat(d.total_value || 0), 0);

        document.getElementById('rptContent').innerHTML = `
        <div class="dev-header">
            <div class="dev-header-top">
                <div class="dev-header-left">
                    <div class="dev-header-title">
                        <div class="dev-title-icon" style="background:linear-gradient(135deg,#4338CA,#6366F1)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <div>
                            <div class="dev-title">Báo cáo & Thống kê</div>
                            <div class="dev-subtitle">Tổng quan tài sản CNTT toàn hệ thống</div>
                        </div>
                    </div>
                </div>
                <div class="dev-header-right">
                    <button class="btn btn-primary btn-sm" id="exportStatsPdfBtn" title="Xuất PDF thống kê">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Báo cáo PDF
                    </button>
                    <button class="btn btn-secondary btn-sm" id="exportDeviceListPdfBtn" title="Xuất PDF danh sách thiết bị">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        DS thiết bị
                    </button>
                    <button class="btn btn-secondary btn-sm" id="exportDepreciationPdfBtn" title="Xuất PDF khấu hao">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        Khấu hao
                    </button>
                </div>
            </div>
        </div>

        <div class="rpt-stat-grid">
            <div class="rpt-stat-card" onclick="window.location.hash='#devices'" style="--rpt-stat-color:#4338CA">
                <div class="rpt-stat-icon" style="background:linear-gradient(135deg,#4338CA,#6366F1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </div>
                <div class="rpt-stat-info">
                    <div class="rpt-stat-value" style="color:#4338CA">${stats.total_devices}</div>
                    <div class="rpt-stat-label">Tổng tài sản CNTT</div>
                </div>
                <div class="rpt-stat-glow"></div>
            </div>
            <div class="rpt-stat-card" onclick="window.location.hash='#devices?status=active'" style="--rpt-stat-color:#6366F1">
                <div class="rpt-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div class="rpt-stat-info">
                    <div class="rpt-stat-value" style="color:#6366F1">${Math.round((stats.active_devices||0)/(stats.total_devices||1)*100)}%</div>
                    <div class="rpt-stat-label">Đang hoạt động</div>
                </div>
                <div class="rpt-stat-glow"></div>
            </div>
            <div class="rpt-stat-card" onclick="window.location.hash='#devices'" style="--rpt-stat-color:#059669">
                <div class="rpt-stat-icon" style="background:linear-gradient(135deg,#059669,#34D399)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7v7c0 5 5 9 10 9s10-4 10-9V7L12 2z"/></svg>
                </div>
                <div class="rpt-stat-info">
                    <div class="rpt-stat-value" style="color:#059669">${fmt.currency(totalValue)}</div>
                    <div class="rpt-stat-label">Tổng giá trị</div>
                </div>
                <div class="rpt-stat-glow"></div>
            </div>
            <div class="rpt-stat-card" onclick="window.location.hash='#maintenance'" style="--rpt-stat-color:#D97706">
                <div class="rpt-stat-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div class="rpt-stat-info">
                    <div class="rpt-stat-value" style="color:#D97706">${fmt.currency(stats.yearly_maintenance_cost)}</div>
                    <div class="rpt-stat-label">Chi phí bảo trì năm</div>
                </div>
                <div class="rpt-stat-glow"></div>
            </div>
        </div>

        <div class="rpt-grid">
            <div class="rpt-card">
                <div class="rpt-card-header">
                    <div class="rpt-card-icon" style="background:linear-gradient(135deg,#EEF2FF,#E0E7FF)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <span class="rpt-card-title">Phân bố theo loại thiết bị</span>
                </div>
                <div class="rpt-chart-wrap"><canvas id="rptCat" height="240"></canvas></div>
            </div>
            <div class="rpt-card">
                <div class="rpt-card-header">
                    <div class="rpt-card-icon" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <span class="rpt-card-title">Thiết bị theo phòng ban</span>
                </div>
                <div class="rpt-chart-wrap"><canvas id="rptDept" height="240"></canvas></div>
            </div>
        </div>

        <div class="rpt-grid" style="margin-bottom:0">
            <div class="rpt-card">
                <div class="rpt-card-header">
                    <div class="rpt-card-icon" style="background:linear-gradient(135deg,#FEF2F2,#FEE2E2)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                    <span class="rpt-card-title">Tỷ lệ tình trạng thiết bị</span>
                </div>
                <div class="rpt-chart-wrap"><canvas id="rptStatus" height="220"></canvas></div>
            </div>
            <div class="rpt-card">
                <div class="rpt-card-header">
                    <div class="rpt-card-icon" style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </div>
                    <span class="rpt-card-title">Giá trị tài sản theo phòng ban</span>
                </div>
                <div class="rpt-chart-wrap">
                    ${by_department.slice(0,8).map((d, i) => {
                        const pct = totalValue > 0 ? (d.total_value / totalValue * 100) : 0;
                        const barColors = ['#2563EB','#059669','#D97706','#7C3AED','#DC2626','#0891B2','#DB2777','#4F46E5'];
                        return `<div class="rpt-bar-item">
                            <div class="rpt-bar-header">
                                <span class="rpt-bar-label">
                                    <span class="rpt-bar-num" style="background:${barColors[i%barColors.length]}15;color:${barColors[i%barColors.length]}">${i+1}</span>
                                    <span>${d.name}</span>
                                </span>
                                <span class="rpt-bar-value" style="color:${barColors[i%barColors.length]}">${fmt.currency(d.total_value)}</span>
                            </div>
                            <div class="rpt-bar-track">
                                <div class="rpt-bar-fill" style="width:${pct.toFixed(1)}%;background:linear-gradient(90deg,${barColors[i%barColors.length]},${barColors[i%barColors.length]}BB)"></div>
                            </div>
                        </div>`;
                    }).join('')}
                    <div class="rpt-bar-footer">
                        <span style="font-size:.78rem;color:#64748B">Top ${Math.min(8, by_department.length)} phòng ban</span>
                        <span style="font-size:.78rem;font-weight:600;color:#1E293B">${fmt.currency(totalValue)}</span>
                    </div>
                </div>
            </div>
        </div>`;

        try {
            const rptCatEl = document.getElementById('rptCat');
            const catData = by_category.filter(c => c.total > 0);
            if (window.Chart && rptCatEl && rptCatEl.getContext) {
                const catCtx = rptCatEl.getContext('2d');
                charts.cat = new Chart(catCtx, {
                    type: 'bar',
                    data: {
                        labels: catData.map(c => c.name),
                        datasets: [{ data: catData.map(c => c.total), backgroundColor: (ctx) => { if (!ctx.chart.chartArea) return '#4F46E5'; const g = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.bottom, 0, ctx.chart.chartArea.top); g.addColorStop(0, '#C7D2FE'); g.addColorStop(1, '#4F46E5'); return g; }, borderRadius: 6, borderSkipped: false, barPercentage: 0.55, categoryPercentage: 0.8 }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#94A3B8', font: { size: 10 }, stepSize: 1 }, grid: { color: '#F1F5F9', drawBorder: false } },
                            x: { ticks: { color: '#64748B', font: { size: 10 }, maxRotation: window.innerWidth < 480 ? 30 : 0 }, grid: { display: false } }
                        },
                        plugins: {
                            legend: { display: false },
                            datalabels: { display: true, anchor: 'end', align: 'end', color: '#4F46E5', font: { weight: 'bold', size: 12 }, formatter: (val) => val, offset: 4 }
                        }
                    }
                });
            }

            const rptDeptEl = document.getElementById('rptDept');
            const topDepts = by_department.slice(0, 8);
            if (window.Chart && rptDeptEl && rptDeptEl.getContext) {
                const deptCtx = rptDeptEl.getContext('2d');
                charts.dept = new Chart(deptCtx, {
                    type: 'bar',
                    data: {
                        labels: topDepts.map(d => d.code || d.name.slice(0,14)),
                        datasets: [
                            { label: 'Đang dùng', data: topDepts.map(d => d.active||0), backgroundColor: '#4F46E5', borderRadius: 4 },
                            { label: 'Khác', data: topDepts.map(d => (d.total||0) - (d.active||0)), backgroundColor: '#A5B4FC', borderRadius: 4 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, ticks: { color: '#64748B', font: { size: 9 }, maxRotation: window.innerWidth < 480 ? 30 : 0 }, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { color: '#F1F5F9', drawBorder: false } } }, plugins: { legend: { labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 12, usePointStyle: true, pointStyle: 'circle' } }, datalabels: { display: false } } }
                });
            }

            const rptStatusEl = document.getElementById('rptStatus');
            if (window.Chart && rptStatusEl && rptStatusEl.getContext) {
                const statusCtx = rptStatusEl.getContext('2d');
                charts.status = new Chart(statusCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Đang dùng', 'Bảo trì', 'Hỏng', 'Thanh lý'],
                        datasets: [{ data: [stats.active_devices, stats.maintenance_devices, stats.broken_devices, stats.disposed_devices], backgroundColor: ['#4338CA', '#6366F1', '#A5B4FC', '#E0E7FF'], borderRadius: 6, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.8 }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { color: '#94A3B8', font: { size: 10 }, stepSize: 1 }, grid: { color: '#F1F5F9', drawBorder: false } },
                            x: { ticks: { color: '#64748B', font: { size: 10 } }, grid: { display: false } }
                        },
                        plugins: {
                            legend: { display: false },
                            datalabels: { display: true, anchor: 'end', align: 'end', color: '#64748B', font: { weight: 'bold', size: 12 }, formatter: (val) => val, offset: 4 }
                        }
                    }
                });
            }

            setupExportButtons();
        } catch (err) {
            console.error('Reports chart render failed:', err);
        }
    };

    const viewPdf = (url) => {
        const token = API.getToken();
        if (!token) { Toast.error('Vui lòng đăng nhập lại'); return; }
        const sep = url.includes('?') ? '&' : '?';
        window.open(url + sep + 'inline=1&token=' + encodeURIComponent(token), '_blank');
    };

    const setupExportButtons = () => {
        const statsBtn = document.getElementById('exportStatsPdfBtn');
        if (statsBtn) statsBtn.addEventListener('click', () => viewPdf('/api/devices/stats/export-pdf'));

        const deviceBtn = document.getElementById('exportDeviceListPdfBtn');
        if (deviceBtn) deviceBtn.addEventListener('click', () => viewPdf('/api/devices/export-pdf'));

        const deprBtn = document.getElementById('exportDepreciationPdfBtn');
        if (deprBtn) deprBtn.addEventListener('click', () => viewPdf('/api/devices/depreciation/export-pdf'));
    };

    return { render };
})();
