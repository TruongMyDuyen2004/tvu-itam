const DepreciationPage = (() => {
    let chartInstance = null;
    const DEFAULT_RATE = 20;

    const $ = id => { const el = document.getElementById(id); if (!el) console.warn('Element #' + id + ' not found'); return el; };

    function calcDepreciation(purchasePrice, purchaseDate, rate) {
        const price = Number(purchasePrice) || 0;
        if (!price || !purchaseDate) return { currentValue: 0, depreciatedAmount: 0, years: 0 };
        const pd = new Date(purchaseDate);
        const now = new Date();
        const years = Math.max(0, Math.floor((now - pd) / (365.25 * 24 * 60 * 60 * 1000)));
        const r = (rate != null ? rate : DEFAULT_RATE) / 100;
        const annualDep = price * r;
        const depreciatedAmount = Math.min(annualDep * years, price);
        const currentValue = price - depreciatedAmount;
        return {
            currentValue: Math.max(0, Math.round(currentValue)),
            depreciatedAmount: Math.max(0, Math.round(depreciatedAmount)),
            years
        };
    }

    function getDepreciationRate(device) {
        if (device.useful_life_years && device.useful_life_years > 0) {
            return 100 / device.useful_life_years;
        }
        return device.depreciation_rate != null ? Number(device.depreciation_rate) : DEFAULT_RATE;
    }

    const render = async () => {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
        <div class="page-section">
            <div class="dev-header">
                <div class="dev-header-top">
                    <div class="dev-header-left">
                        <div class="dev-header-title">
                            <div class="dev-title-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            </div>
                            <div>
                                <div class="dev-title">Khấu hao tài sản</div>
                                <div class="dev-subtitle">Theo dõi giá trị hao mòn theo thời gian</div>
                            </div>
                        </div>
                    </div>
                    <div class="dev-header-right">
                        <button class="btn btn-primary btn-sm" id="printDepBtn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            In báo cáo
                        </button>
                        <button class="btn btn-secondary btn-sm" id="refreshDepBtn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            <div class="dep-stats">
                <div class="dep-stat-card" onclick="DepreciationPage.filterBy('original')" style="--dep-stat-color:#4F46E5">
                    <div class="dep-stat-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </div>
                    <div class="dep-stat-info">
                        <div class="dep-stat-value" id="depTotalOriginal" style="color:#4F46E5">-</div>
                        <div class="dep-stat-label">Tổng nguyên giá</div>
                    </div>
                    <div class="dep-stat-glow"></div>
                </div>
                <div class="dep-stat-card" onclick="DepreciationPage.filterBy('depreciated')" style="--dep-stat-color:#6366F1">
                    <div class="dep-stat-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <div class="dep-stat-info">
                        <div class="dep-stat-value" id="depTotalDepreciated" style="color:#6366F1">-</div>
                        <div class="dep-stat-label">Tổng hao mòn</div>
                    </div>
                    <div class="dep-stat-glow"></div>
                </div>
                <div class="dep-stat-card" onclick="DepreciationPage.filterBy('remaining')" style="--dep-stat-color:#059669">
                    <div class="dep-stat-icon" style="background:linear-gradient(135deg,#059669,#34D399)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7v7c0 5 5 9 10 9s10-4 10-9V7L12 2z"/></svg>
                    </div>
                    <div class="dep-stat-info">
                        <div class="dep-stat-value" id="depTotalRemaining" style="color:#059669">-</div>
                        <div class="dep-stat-label">Giá trị còn lại</div>
                    </div>
                    <div class="dep-stat-glow"></div>
                </div>
                <div class="dep-stat-card" onclick="DepreciationPage.filterBy('all')" style="--dep-stat-color:#D97706">
                    <div class="dep-stat-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    </div>
                    <div class="dep-stat-info">
                        <div class="dep-stat-value" id="depTotalCount" style="color:#D97706">-</div>
                        <div class="dep-stat-label">Tổng tài sản</div>
                    </div>
                    <div class="dep-stat-glow"></div>
                </div>
            </div>

            <div class="dep-chart-card">
                <div class="rpt-card-header">
                    <div class="rpt-card-icon" style="background:linear-gradient(135deg,#EEF2FF,#E0E7FF)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <span class="rpt-card-title">Biểu đồ khấu hao theo năm</span>
                </div>
                <div class="dep-chart-body">
                    <canvas id="depreciationChart"></canvas>
                </div>
            </div>

            <div class="dep-table-card">
                <div class="dep-table-header">
                    <div class="dep-table-title">
                        <div class="dep-table-title-icon" style="background:linear-gradient(135deg,#EEF2FF,#E0E7FF)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        </div>
                        <span>Danh sách tài sản khấu hao</span>
                    </div>
                    <div class="dep-search">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
                        <input id="depSearchInput" placeholder="Tìm tên, mã tài sản...">
                    </div>
                </div>
                <div class="dep-table-wrap">
                    <table class="dep-table">
                        <thead>
                            <tr>
                                <th style="text-align:center;width:40px">STT</th>
                                <th style="max-width:110px">Mã TS</th>
                                <th style="max-width:200px">Tên thiết bị</th>
                                <th>Ngày mua</th>
                                <th>Nguyên giá</th>
                                <th>TG khấu hao</th>
                                <th>Đã dùng</th>
                                <th>Hao mòn</th>
                                <th>Giá trị còn lại</th>
                                <th style="text-align:right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="depTableBody">
                            <tr><td colspan="10"><div class="dev-loading" style="padding:2rem;text-align:center"><div class="spinner"></div></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="depModal">
            <div class="modal" style="max-width:480px">
                <div class="modal-header">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);display:flex;align-items:center;justify-content:center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        </div>
                        <div>
                            <div class="modal-title">Cập nhật tỷ lệ khấu hao</div>
                            <div class="text-xs text-muted" style="margin-top:1px">Điều chỉnh tỷ lệ hao mòn tài sản</div>
                        </div>
                    </div>
                    <button class="modal-close" id="depModalClose">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background:#FAFBFC;border:1px solid var(--border);border-radius:10px;padding:16px">
                        <p id="depModalAssetName" style="margin-bottom:1rem;font-weight:600;font-size:.95rem;color:var(--text-primary)"></p>
                        <div class="form-group">
                            <label class="form-label">Tỷ lệ khấu hao (%/năm)</label>
                            <input type="number" id="depRateInput" min="0" max="100" step="0.5" class="form-control" placeholder="Ví dụ: 20">
                        </div>
                        <div class="dep-preview-box" id="depPreview"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="depModalCancel">Hủy</button>
                    <button class="btn btn-primary" id="depModalSave">Lưu thay đổi</button>
                </div>
            </div>
        </div>`;

        document.getElementById('refreshDepBtn')?.addEventListener('click', loadData);
        document.getElementById('printDepBtn')?.addEventListener('click', printReport);
        document.getElementById('depSearchInput')?.addEventListener('input', (e) => filterTable(e.target.value));

        await loadData();
    };

    let allAssets = [];

    async function loadData() {
        try {
            const res = await API.get('/devices');
            if (!res.ok) throw new Error(res.data.message || 'Lỗi tải dữ liệu');
            const devices = res.data.data || [];

            allAssets = devices.filter(d => Number(d.purchase_price) > 0 && d.purchase_date).map(d => {
                const price = Number(d.purchase_price) || 0;
                const rate = getDepreciationRate(d);
                const life = d.useful_life_years || Math.round(100 / rate);
                const dep = calcDepreciation(price, d.purchase_date, rate);
                return { ...d, purchase_price: price, rate, useful_life_years: life, ...dep };
            });

            renderSummary();
            renderTable(allAssets);
            renderChart(devices);
        } catch (err) {
            console.error('loadData error:', err);
            Toast.error('Không thể tải dữ liệu khấu hao');
        }
    }

    function printReport() {
        const token = API.getToken();
        if (!token) { Toast.error('Vui lòng đăng nhập lại'); return; }
        window.open('/api/devices/depreciation/export-pdf?inline=1&token=' + encodeURIComponent(token), '_blank');
    }

    function renderSummary() {
        const totalOriginal = allAssets.reduce((s, a) => s + Number(a.purchase_price || 0), 0);
        const totalDepreciated = allAssets.reduce((s, a) => s + Number(a.depreciatedAmount || 0), 0);
        const totalRemaining = allAssets.reduce((s, a) => s + Number(a.currentValue || 0), 0);
        console.log('=== renderSummary ===', { totalOriginal, totalDepreciated, totalRemaining, count: allAssets.length, sample: allAssets[0] });

        const el1 = $('depTotalOriginal'); if (el1) el1.textContent = fmt.currency(totalOriginal);
        const el2 = $('depTotalDepreciated'); if (el2) el2.textContent = fmt.currency(totalDepreciated);
        const el3 = $('depTotalRemaining'); if (el3) el3.textContent = fmt.currency(totalRemaining);
        const el4 = $('depTotalCount'); if (el4) el4.textContent = allAssets.length;
    }

    function renderTable(assets) {
        const tbody = document.getElementById('depTableBody');
        if (!assets.length) {
            tbody.innerHTML = '<tr><td colspan="10"><div class="dev-empty" style="text-align:center;padding:2rem"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4CAD4" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg><h3 style="color:#94A3B8;margin-top:0.5rem">Không có tài sản nào</h3></div></td></tr>';
            return;
        }
        tbody.innerHTML = assets.map((a, i) => {
            const pct = a.purchase_price > 0 ? Math.round((a.depreciatedAmount / a.purchase_price) * 100) : 0;
            const depColor = pct < 25 ? '#22C55E' : pct < 50 ? '#EAB308' : pct < 75 ? '#F97316' : '#EF4444';
            const depLabel = pct < 25 ? 'Ít' : pct < 50 ? 'TB' : pct < 75 ? 'Nhiều' : 'Cao';
            return `<tr>
                <td style="text-align:center;color:#94A3B8;width:40px">${i + 1}</td>
                <td style="max-width:110px"><span title="${a.device_code || ''}" style="font-family:monospace;font-size:.82rem;color:#4F46E5">${a.device_code || '—'}</span></td>
                <td style="max-width:200px" title="${a.name || ''}${a.category_name ? ' (' + a.category_name + ')' : ''}"><div><div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.name || '—'}</div>${a.category_name ? `<div style="font-size:.7rem;color:#94A3B8">${a.category_name}</div>` : ''}</div></td>
                <td style="white-space:nowrap"><span style="color:var(--text-muted);font-size:.8rem">${fmt.date(a.purchase_date)}</span></td>
                <td style="white-space:nowrap;font-weight:500">${fmt.currency(a.purchase_price)}</td>
                <td style="white-space:nowrap"><span class="badge badge-pending" style="font-size:.68rem" title="Tỷ lệ KH: ${a.rate}%">${a.useful_life_years} năm</span></td>
                <td style="white-space:nowrap;color:var(--text-secondary)">${a.years} năm</td>
                <td style="white-space:nowrap"><div style="display:flex;flex-direction:column;gap:3px;min-width:90px"><span style="color:#6366F1;font-weight:500">${fmt.currency(a.depreciatedAmount)}</span><div style="display:flex;align-items:center;gap:5px"><div style="flex:1;height:4px;background:#E0E7FF;border-radius:2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${depColor};border-radius:2px;transition:width .5s ease"></div></div><span style="font-size:.62rem;font-weight:600;color:${depColor}">${depLabel}</span></div></div></td>
                <td style="white-space:nowrap"><span style="color:#4F46E5;font-weight:600">${fmt.currency(a.currentValue)}</span></td>
                <td style="text-align:right;white-space:nowrap">
                    <button class="dep-edit-btn-modern dep-edit-btn" title="Sửa tỷ lệ" data-id="${a.id}" data-name="${a.name}" data-rate="${a.rate}" data-price="${a.purchase_price}" data-date="${a.purchase_date}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </td>
            </tr>`;
        }).join('');

        document.querySelectorAll('.dep-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset));
        });
    }

    function filterTable(keyword) {
        const kw = keyword.toLowerCase();
        const filtered = allAssets.filter(a =>
            (a.device_code || '').toLowerCase().includes(kw) ||
            (a.name || '').toLowerCase().includes(kw)
        );
        renderTable(filtered);
    }

    function renderChart(devices) {
        const assetsWithData = devices.filter(d => Number(d.purchase_price) > 0 && d.purchase_date);
        if (!assetsWithData.length) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const yearly = {};

        assetsWithData.forEach(a => {
            const price = Number(a.purchase_price) || 0;
            const startYear = new Date(a.purchase_date).getFullYear();
            const rate = getDepreciationRate(a) / 100;

            for (let y = startYear; y <= currentYear; y++) {
                const years = y - startYear;
                const annualDep = price * rate;
                const depreciated = Math.min(annualDep * years, price);
                const remaining = price - depreciated;
                if (!yearly[y]) yearly[y] = { totalDepreciation: 0, totalRemaining: 0 };
                yearly[y].totalDepreciation += depreciated;
                yearly[y].totalRemaining += remaining;
            }
        });

        const labels = Object.keys(yearly).sort();
        const depData = labels.map(y => Math.round(yearly[y].totalDepreciation));
        const remData = labels.map(y => Math.round(yearly[y].totalRemaining));

        const ctx = document.getElementById('depreciationChart');
        if (!ctx) return;

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Giá trị còn lại',
                        data: remData,
                        backgroundColor: '#4F46E5',
                        borderWidth: 0,
                        borderRadius: 4,
                        order: 2
                    },
                    {
                        label: 'Hao mòn lũy kế',
                        data: depData,
                        backgroundColor: '#A5B4FC',
                        borderWidth: 0,
                        borderRadius: 4,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: { display: false },
                    legend: {
                        position: 'top',
                        labels: { color: '#64748B', font: { size: 11 }, usePointStyle: true, boxWidth: 10, padding: 12 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#64748B', font: { size: 10 }, maxRotation: window.innerWidth < 480 ? 30 : 0 },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94A3B8', font: { size: 10 }, callback: (v) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v) },
                        grid: { color: '#F1F5F9', drawBorder: false }
                    }
                }
            }
        });
    }

    let editingAssetId = null;

    function openEditModal(dataset) {
        editingAssetId = dataset.id;
        const modal = document.getElementById('depModal');
        document.getElementById('depModalAssetName').textContent = dataset.name;
        document.getElementById('depRateInput').value = dataset.rate;
        updatePreview(dataset.price, dataset.date, dataset.rate);

        modal.classList.add('active');

        const rateInput = document.getElementById('depRateInput');
        rateInput.oninput = () => updatePreview(dataset.price, dataset.date, rateInput.value);

        document.getElementById('depModalClose').onclick = closeDepModal;
        document.getElementById('depModalCancel').onclick = closeDepModal;
        document.getElementById('depModalSave').onclick = saveRate;
    }

    function updatePreview(price, date, rate) {
        const dep = calcDepreciation(Number(price), date, Number(rate));
        const life = Number(rate) > 0 ? Math.round(100 / Number(rate)) : 5;
        const preview = document.getElementById('depPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="dep-preview-row">
                    <span class="dep-preview-label">Nguyên giá:</span>
                    <span class="dep-preview-value">${fmt.currency(Number(price))}</span>
                </div>
                <div class="dep-preview-row">
                    <span class="dep-preview-label">Thời gian KH:</span>
                    <span class="dep-preview-value">${life} năm (${rate}%/năm)</span>
                </div>
                <div class="dep-preview-row">
                    <span class="dep-preview-label">Đã sử dụng:</span>
                    <span class="dep-preview-value">${dep.years} năm</span>
                </div>
                <div class="dep-preview-row" style="color:#6366F1">
                    <span class="dep-preview-label">Hao mòn lũy kế:</span>
                    <span class="dep-preview-value">${fmt.currency(dep.depreciatedAmount)}</span>
                </div>
                <div class="dep-preview-row" style="color:#4F46E5">
                    <span class="dep-preview-label">Giá trị còn lại:</span>
                    <span class="dep-preview-value">${fmt.currency(dep.currentValue)}</span>
                </div>
            `;
        }
    }

    function closeDepModal() {
        document.getElementById('depModal').classList.remove('active');
        editingAssetId = null;
    }

    async function saveRate() {
        const rate = parseFloat(document.getElementById('depRateInput').value);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            Toast.error('Tỷ lệ khấu hao phải từ 0 đến 100%');
            return;
        }
        try {
            const res = await API.put(`/devices/${editingAssetId}`, { depreciation_rate: rate });
            if (res.ok) {
                Toast.success('Cập nhật tỷ lệ khấu hao thành công!');
                closeDepModal();
                await loadData();
            } else {
                Toast.error(res.data.message || 'Lỗi cập nhật');
            }
        } catch (err) {
            Toast.error('Lỗi kết nối');
        }
    }

    function filterBy(key) {
        document.querySelectorAll('.dep-stat-card').forEach(c => c.classList.remove('active'));
        let sorted = [...allAssets];
        if (key === 'original') { sorted.sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0)); document.querySelector('.dep-stat-card:first-child').classList.add('active'); }
        else if (key === 'depreciated') { sorted.sort((a, b) => b.depreciatedAmount - a.depreciatedAmount); document.querySelector('.dep-stat-card:nth-child(2)').classList.add('active'); }
        else if (key === 'remaining') { sorted.sort((a, b) => b.currentValue - a.currentValue); document.querySelector('.dep-stat-card:nth-child(3)').classList.add('active'); }
        renderTable(sorted);
    }

    const api = { render, filterBy };
    window.DepreciationPage = api;
    return api;
})();
