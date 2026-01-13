// ========================================
// DASHBOARD ACHIEVEMENT - JAVASCRIPT V2.0
// Production Performance Analytics System
// ========================================

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbxR5tICOc_bBlUxJ49RTpaI2_TlYwfAsM78jAvVxfg_wri3hZR0gDu7iSo-KYuTurmw/exec",
    DEBOUNCE_DELAY: 300,
    CHART_COLORS: {
        excellent: '#10b981',    // Green >= 90%
        good: '#f59e0b',         // Yellow 70-89%
        poor: '#ef4444',         // Red < 70%
        gradient1: '#667eea',
        gradient2: '#764ba2',
        line: '#3b82f6'
    }
};

// ========================================
// GLOBAL STATE
// ========================================
let rawData = [];           // Raw data dari API
let filteredData = [];      // Data setelah filter
let chartInstances = {};    // Chart.js instances

// ========================================
// DOM ELEMENTS
// ========================================
const elements = {
    // Modals & Overlay
    loadingOverlay: null,
    errorModal: null,
    errorMessage: null,
    
    // Header
    lastUpdateTime: null,
    
    // Filters
    filterDateFrom: null,
    filterDateTo: null,
    filterMesin: null,
    filterPartName: null,
    filterPartNo: null,
    btnApplyFilter: null,
    btnReset: null,
    
    // Metrics Cards
    metricTotalRecords: null,
    metricAvgPerformance: null,
    metricBestMachine: null,
    metricBestScore: null,
    metricWorstMachine: null,
    metricWorstScore: null,
    
    // Charts
    chartPerformanceByMachine: null,
    chartPerformanceTrend: null,
    chartPerformanceDistribution: null,
    
    // Table
    performanceTableBody: null,
    btnExport: null
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard Achievement Initialized');
    
    initializeElements();
    initializeEventListeners();
    loadDashboardData();
});

function initializeElements() {
    // Modals
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.errorModal = document.getElementById('errorModal');
    elements.errorMessage = document.getElementById('errorMessage');
    
    // Header
    elements.lastUpdateTime = document.getElementById('lastUpdateTime');
    
    // Filters
    elements.filterDateFrom = document.getElementById('filterDateFrom');
    elements.filterDateTo = document.getElementById('filterDateTo');
    elements.filterMesin = document.getElementById('filterMesin');
    elements.filterPartName = document.getElementById('filterPartName');
    elements.filterPartNo = document.getElementById('filterPartNo');
    elements.btnApplyFilter = document.getElementById('btnApplyFilter');
    elements.btnReset = document.getElementById('btnReset');
    
    // Metrics
    elements.metricTotalRecords = document.getElementById('metricTotalRecords');
    elements.metricAvgPerformance = document.getElementById('metricAvgPerformance');
    elements.metricBestMachine = document.getElementById('metricBestMachine');
    elements.metricBestScore = document.getElementById('metricBestScore');
    elements.metricWorstMachine = document.getElementById('metricWorstMachine');
    elements.metricWorstScore = document.getElementById('metricWorstScore');
    
    // Charts
    elements.chartPerformanceByMachine = document.getElementById('chartPerformanceByMachine');
    elements.chartPerformanceTrend = document.getElementById('chartPerformanceTrend');
    elements.chartPerformanceDistribution = document.getElementById('chartPerformanceDistribution');
    
    // Table
    elements.performanceTableBody = document.getElementById('performanceTableBody');
    elements.btnExport = document.getElementById('btnExport');
}

function initializeEventListeners() {
    // Filter buttons
    elements.btnApplyFilter.addEventListener('click', applyFilters);
    elements.btnReset.addEventListener('click', resetFilters);
    
    // Export button
    elements.btnExport.addEventListener('click', exportToCSV);
    
    // Enter key on filters
    [elements.filterDateFrom, elements.filterDateTo].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    });
}

// ========================================
// MODAL FUNCTIONS
// ========================================
function showLoading() {
    elements.loadingOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function showErrorModal(message) {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeErrorModal() {
    elements.errorModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Make global for onclick
window.closeErrorModal = closeErrorModal;

// ========================================
// DATA LOADING
// ========================================
async function loadDashboardData() {
    showLoading();
    
    try {
        // Fetch data dari Apps Script
        const url = `${CONFIG.API_URL}?action=getAchievementData`;
        console.log('📡 Fetching dashboard data from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.records || data.records.length === 0) {
            throw new Error('Tidak ada data achievement yang tersedia!');
        }
        
        console.log(`✅ Loaded ${data.records.length} records`);
        
        rawData = data.records;
        filteredData = [...rawData];
        
        // Set default date range (latest date in data)
        setDefaultDateRange();
        
        // Populate filter dropdowns
        populateFilterDropdowns();
        
        // Apply initial filter (latest date only)
        applyFilters();
        
        // Update last update time
        updateLastUpdateTime();
        
        hideLoading();
        
    } catch (error) {
        console.error('❌ Load dashboard error:', error);
        hideLoading();
        showErrorModal('GAGAL LOAD DATA!\n\nError: ' + error.message + '\n\nPeriksa:\n1. URL API sudah benar?\n2. Endpoint getAchievementData sudah dibuat?\n3. Ada data di sheets?');
    }
}

function setDefaultDateRange() {
    if (rawData.length === 0) return;
    
    // Find latest date in data
    const dates = rawData.map(r => new Date(r.date)).filter(d => !isNaN(d));
    
    if (dates.length === 0) return;
    
    const latestDate = new Date(Math.max(...dates));
    
    // Set both from and to as latest date
    const dateStr = formatDateForInput(latestDate);
    elements.filterDateFrom.value = dateStr;
    elements.filterDateTo.value = dateStr;
    
    console.log('📅 Default date range set to:', dateStr);
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function populateFilterDropdowns() {
    // Get unique values
    const uniqueMesins = [...new Set(rawData.map(r => r.mesin))].sort();
    const uniqueParts = [...new Set(rawData.map(r => r.partName))].sort();
    const uniquePartNos = [...new Set(rawData.map(r => r.partNo))].sort();
    
    // Populate Mesin dropdown
    elements.filterMesin.innerHTML = '<option value="">Semua Mesin</option>';
    uniqueMesins.forEach(mesin => {
        const option = document.createElement('option');
        option.value = mesin;
        option.textContent = mesin;
        elements.filterMesin.appendChild(option);
    });
    
    // Populate Part Name dropdown
    elements.filterPartName.innerHTML = '<option value="">Semua Part</option>';
    uniqueParts.forEach(part => {
        const option = document.createElement('option');
        option.value = part;
        option.textContent = part;
        elements.filterPartName.appendChild(option);
    });
    
    // Populate Part No dropdown
    elements.filterPartNo.innerHTML = '<option value="">Semua Part No</option>';
    uniquePartNos.forEach(partNo => {
        const option = document.createElement('option');
        option.value = partNo;
        option.textContent = partNo;
        elements.filterPartNo.appendChild(option);
    });
    
    console.log(`✅ Dropdowns populated: ${uniqueMesins.length} mesins, ${uniqueParts.length} parts`);
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    elements.lastUpdateTime.textContent = `Updated: ${timeStr}`;
}

// ========================================
// FILTER FUNCTIONS
// ========================================
function applyFilters() {
    const dateFrom = elements.filterDateFrom.value;
    const dateTo = elements.filterDateTo.value;
    const mesin = elements.filterMesin.value;
    const partName = elements.filterPartName.value;
    const partNo = elements.filterPartNo.value;
    
    console.log('🔍 Applying filters:', { dateFrom, dateTo, mesin, partName, partNo });
    
    filteredData = rawData.filter(record => {
        // Date filter
        if (dateFrom || dateTo) {
            const recordDate = new Date(record.date);
            
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (recordDate < fromDate) return false;
            }
            
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                if (recordDate > toDate) return false;
            }
        }
        
        // Mesin filter
        if (mesin && record.mesin !== mesin) return false;
        
        // Part Name filter
        if (partName && record.partName !== partName) return false;
        
        // Part No filter
        if (partNo && record.partNo !== partNo) return false;
        
        return true;
    });
    
    console.log(`✅ Filtered: ${filteredData.length} / ${rawData.length} records`);
    
    if (filteredData.length === 0) {
        showErrorModal('Tidak ada data yang sesuai dengan filter!\n\nCoba ubah kriteria filter.');
        return;
    }
    
    // Update dashboard
    updateMetricsCards();
    updateCharts();
    updateTable();
}

function resetFilters() {
    // Reset to default (latest date)
    setDefaultDateRange();
    elements.filterMesin.value = '';
    elements.filterPartName.value = '';
    elements.filterPartNo.value = '';
    
    applyFilters();
}

// ========================================
// METRICS CALCULATION
// ========================================
function calculateMetrics() {
    // Group by machine
    const byMachine = {};
    
    filteredData.forEach(record => {
        if (!byMachine[record.mesin]) {
            byMachine[record.mesin] = {
                records: [],
                totalQtyProd: 0
            };
        }
        
        byMachine[record.mesin].records.push(record);
        byMachine[record.mesin].totalQtyProd += record.qtyProd || 0;
    });
    
    // Calculate averages
    const machineMetrics = Object.keys(byMachine).map(mesin => {
        const records = byMachine[mesin].records;
        
        const avgPerformance = records.reduce((sum, r) => sum + r.performanceScore, 0) / records.length;
        const avgQtyAch = records.reduce((sum, r) => sum + r.achievementQty, 0) / records.length;
        const avgEffAch = records.reduce((sum, r) => sum + r.achievementEff, 0) / records.length;
        
        return {
            mesin,
            count: records.length,
            avgPerformance,
            avgQtyAch,
            avgEffAch,
            totalQtyProd: byMachine[mesin].totalQtyProd
        };
    });
    
    // Sort by performance
    machineMetrics.sort((a, b) => b.avgPerformance - a.avgPerformance);
    
    return machineMetrics;
}

function updateMetricsCards() {
    const metrics = calculateMetrics();
    
    // Total Records
    elements.metricTotalRecords.textContent = filteredData.length.toLocaleString('id-ID');
    
    // Average Performance
    const overallAvg = metrics.reduce((sum, m) => sum + m.avgPerformance, 0) / metrics.length;
    elements.metricAvgPerformance.textContent = overallAvg.toFixed(1) + '%';
    
    // Best Machine
    if (metrics.length > 0) {
        const best = metrics[0];
        elements.metricBestMachine.textContent = best.mesin;
        elements.metricBestScore.textContent = best.avgPerformance.toFixed(1) + '% avg';
    } else {
        elements.metricBestMachine.textContent = 'N/A';
        elements.metricBestScore.textContent = '-';
    }
    
    // Worst Machine
    if (metrics.length > 0) {
        const worst = metrics[metrics.length - 1];
        elements.metricWorstMachine.textContent = worst.mesin;
        elements.metricWorstScore.textContent = worst.avgPerformance.toFixed(1) + '% avg';
    } else {
        elements.metricWorstMachine.textContent = 'N/A';
        elements.metricWorstScore.textContent = '-';
    }
}

// ========================================
// CHART RENDERING
// ========================================
function updateCharts() {
    renderPerformanceByMachineChart();
    renderPerformanceTrendChart();
    renderPerformanceDistributionChart();
}

function getPerformanceColor(score) {
    if (score >= 90) return CONFIG.CHART_COLORS.excellent;
    if (score >= 70) return CONFIG.CHART_COLORS.good;
    return CONFIG.CHART_COLORS.poor;
}

function renderPerformanceByMachineChart() {
    const metrics = calculateMetrics();
    
    const labels = metrics.map(m => m.mesin);
    const data = metrics.map(m => m.avgPerformance);
    const colors = data.map(score => getPerformanceColor(score));
    
    // Destroy existing chart
    if (chartInstances.performanceByMachine) {
        chartInstances.performanceByMachine.destroy();
    }
    
    const ctx = elements.chartPerformanceByMachine.getContext('2d');
    
    chartInstances.performanceByMachine = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Performance Score (%)',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const mesin = metrics[context.dataIndex];
                            return [
                                `Performance: ${context.parsed.y.toFixed(1)}%`,
                                `Total Records: ${mesin.count}`,
                                `Qty Achievement: ${mesin.avgQtyAch.toFixed(1)}%`,
                                `Eff Achievement: ${mesin.avgEffAch.toFixed(1)}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12, weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderPerformanceTrendChart() {
    // Group by date
    const byDate = {};
    
    filteredData.forEach(record => {
        const dateStr = record.date;
        
        if (!byDate[dateStr]) {
            byDate[dateStr] = [];
        }
        
        byDate[dateStr].push(record.performanceScore);
    });
    
    // Calculate daily average
    const dates = Object.keys(byDate).sort();
    const avgByDate = dates.map(date => {
        const scores = byDate[date];
        return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    });
    
    // Destroy existing chart
    if (chartInstances.performanceTrend) {
        chartInstances.performanceTrend.destroy();
    }
    
    const ctx = elements.chartPerformanceTrend.getContext('2d');
    
    chartInstances.performanceTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            }),
            datasets: [{
                label: 'Daily Average Performance',
                data: avgByDate,
                borderColor: CONFIG.CHART_COLORS.line,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: CONFIG.CHART_COLORS.line,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Performance: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderPerformanceDistributionChart() {
    // Categorize performance scores
    let excellent = 0;
    let good = 0;
    let poor = 0;
    
    filteredData.forEach(record => {
        const score = record.performanceScore;
        
        if (score >= 90) excellent++;
        else if (score >= 70) good++;
        else poor++;
    });
    
    // Destroy existing chart
    if (chartInstances.performanceDistribution) {
        chartInstances.performanceDistribution.destroy();
    }
    
    const ctx = elements.chartPerformanceDistribution.getContext('2d');
    
    chartInstances.performanceDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Excellent (≥90%)', 'Good (70-89%)', 'Needs Improvement (<70%)'],
            datasets: [{
                data: [excellent, good, poor],
                backgroundColor: [
                    CONFIG.CHART_COLORS.excellent,
                    CONFIG.CHART_COLORS.good,
                    CONFIG.CHART_COLORS.poor
                ],
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} records (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// TABLE RENDERING
// ========================================
function updateTable() {
    const metrics = calculateMetrics();
    
    if (metrics.length === 0) {
        elements.performanceTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty">Tidak ada data yang ditampilkan</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    metrics.forEach(m => {
        const performanceClass = m.avgPerformance >= 90 ? 'status-excellent' : 
                                  m.avgPerformance >= 70 ? 'status-good' : 
                                  'status-poor';
        
        html += `
            <tr>
                <td class="table-cell-bold">${m.mesin}</td>
                <td>${m.count}</td>
                <td class="${performanceClass}">${m.avgPerformance.toFixed(1)}%</td>
                <td>${m.avgQtyAch.toFixed(1)}%</td>
                <td>${m.avgEffAch.toFixed(1)}%</td>
                <td>${m.totalQtyProd.toLocaleString('id-ID')}</td>
                <td>
                    <span class="status-badge ${performanceClass}">
                        ${m.avgPerformance >= 90 ? '✓ Excellent' : 
                          m.avgPerformance >= 70 ? '⚠ Good' : 
                          '✗ Needs Attention'}
                    </span>
                </td>
            </tr>
        `;
    });
    
    elements.performanceTableBody.innerHTML = html;
}

// ========================================
// EXPORT TO CSV
// ========================================
function exportToCSV() {
    const metrics = calculateMetrics();
    
    if (metrics.length === 0) {
        showErrorModal('Tidak ada data untuk di-export!');
        return;
    }
    
    // CSV Header
    let csv = 'Mesin,Total Records,Avg Performance (%),Avg Qty Achievement (%),Avg Eff Achievement (%),Total Qty Produced,Status\n';
    
    // CSV Rows
    metrics.forEach(m => {
        const status = m.avgPerformance >= 90 ? 'Excellent' : 
                       m.avgPerformance >= 70 ? 'Good' : 
                       'Needs Improvement';
        
        csv += `${m.mesin},${m.count},${m.avgPerformance.toFixed(1)},${m.avgQtyAch.toFixed(1)},${m.avgEffAch.toFixed(1)},${m.totalQtyProd},${status}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateFrom = elements.filterDateFrom.value || 'all';
    const dateTo = elements.filterDateTo.value || 'all';
    const filename = `performance_report_${dateFrom}_to_${dateTo}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSV exported:', filename);
}

// ========================================
// GENERATE FULL REPORT (Excel/PDF)
// ========================================
function generateFullReport() {
    console.log('🔥 === GENERATE REPORT CLICKED ===');
    
    // Test 1: Check filtered data
    if (!filteredData || filteredData.length === 0) {
        alert('❌ ERROR: Tidak ada data!\n\nSilakan apply filter dengan tanggal yang ada datanya.');
        console.error('filteredData is empty:', filteredData);
        return;
    }
    
    console.log('✅ Test 1 PASSED: filteredData =', filteredData.length, 'records');
    
    // Test 2: Prepare minimal data
    const testData = {
        header: {
            dateFrom: elements.filterDateFrom.value || '2026-01-11',
            dateTo: elements.filterDateTo.value || '2026-01-11',
            achievementNo: '99/STP/I/26',
            lineName: 'TEST LINE'
        },
        records: filteredData.slice(0, 5).map(r => ({
            partName: r.partName || 'TEST PART',
            partNo: r.partNo || 'TEST-001',
            idProses: '-',
            proses: r.proses || 'TESTING',
            idMesin: '-',
            mesin: r.mesin || 'TEST MESIN',
            sph: 400,
            qtySpk: r.qtySpk || 100,
            qtyProd: r.qtyProd || 100,
            actTime: r.actTime || 1,
            sphAct: 100,
            cycleTime: 36,
            dandori: 15,
            needTime: 1,
            performanceScore: r.performanceScore || 95,
            machineLoading: { [r.mesin]: r.actTime || 1 },
            kodeProblem: ''
        })),
        machines: [
            { name: filteredData[0].mesin, shortName: 'M1' }
        ],
        chartData: {
            labels: ['M1'],
            values: [95]
        },
        summary: {
            kapasitasTerpakai: { [filteredData[0].mesin]: 1 },
            machinePerformance: [
                { machine: filteredData[0].mesin, avgPerformance: 95 }
            ]
        }
    };
    
    console.log('✅ Test 2 PASSED: testData prepared');
    console.log('testData:', testData);
    
    // Test 3: Store to sessionStorage
    try {
        const jsonString = JSON.stringify(testData);
        console.log('📦 JSON size:', (jsonString.length / 1024).toFixed(2), 'KB');
        
        sessionStorage.setItem('reportData', jsonString);
        console.log('✅ Test 3 PASSED: Data stored in sessionStorage');
        
        // Test 4: Verify storage
        const stored = sessionStorage.getItem('reportData');
        if (!stored) {
            throw new Error('sessionStorage.getItem returned NULL!');
        }
        console.log('✅ Test 4 PASSED: Data verified in sessionStorage');
        
        // Test 5: Redirect
        console.log('🚀 Redirecting to export page...');
        window.location.href = 'prod_report_export.html';
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        alert('ERROR GENERATE REPORT!\n\n' + error.message);
    }
}

function prepareReportData() {
    const dateFrom = elements.filterDateFrom.value;
    const dateTo = elements.filterDateTo.value;
    
    console.log('  → dateFrom:', dateFrom);
    console.log('  → dateTo:', dateTo);
    
    // Generate achievement number
    const achievementNo = generateAchievementNumber(dateTo || dateFrom);
    console.log('  → achievementNo:', achievementNo);
    
    // Detect line name
    const firstMesin = filteredData.length > 0 ? filteredData[0].mesin : '';
    const lineName = firstMesin.split(' ')[0] || 'LINE A';
    console.log('  → lineName:', lineName);
    
    // Get FILTERED unique machines
    const uniqueMachines = [...new Set(filteredData.map(r => r.mesin))].sort();
    const machines = uniqueMachines.map((mesin, index) => {
        const shortName = mesin.split(' ')[0] || `M${index + 1}`;
        return {
            name: mesin,
            shortName: shortName
        };
    });
    
    console.log('  → machines:', machines);
    
    // Prepare records
    const records = filteredData.map(record => {
        const sphAct = record.actTime > 0 ? Math.round(record.qtyProd / record.actTime) : 0;
        const cycleTime = record.qtyProd > 0 ? ((record.actTime * 60 * 60) / record.qtyProd) : 0;
        
        const machineLoading = {};
        machines.forEach(machine => {
            machineLoading[machine.name] = machine.name === record.mesin ? (record.actTime || 0) : 0;
        });
        
        return {
            partName: record.partName,
            partNo: record.partNo,
            idProses: '-',
            proses: record.proses,
            idMesin: '-',
            mesin: record.mesin,
            sph: 400,
            qtySpk: record.qtySpk || 0,
            qtyProd: record.qtyProd || 0,
            actTime: record.actTime || 0,
            sphAct: sphAct,
            cycleTime: cycleTime,
            dandori: 15,
            needTime: record.actTime || 0,
            performanceScore: record.performanceScore || 0,
            machineLoading: machineLoading,
            kodeProblem: ''
        };
    });
    
    console.log('  → records prepared:', records.length);
    
    // Calculate chart data
    const metrics = calculateMetrics();
    const chartData = {
        labels: metrics.map(m => {
            const machine = machines.find(mc => mc.name === m.mesin);
            return machine ? machine.shortName : m.mesin;
        }),
        values: metrics.map(m => m.avgPerformance)
    };
    
    console.log('  → chartData:', chartData);
    
    // Calculate summary
    const kapasitasTerpakai = {};
    machines.forEach(machine => {
        const totalTime = filteredData
            .filter(r => r.mesin === machine.name)
            .reduce((sum, r) => sum + (r.actTime || 0), 0);
        kapasitasTerpakai[machine.name] = totalTime;
    });
    
    const machinePerformance = metrics.map(m => ({
        machine: m.mesin,
        avgPerformance: m.avgPerformance
    }));
    
    console.log('  → summary calculated');
    
    return {
        header: {
            dateFrom: dateFrom,
            dateTo: dateTo,
            achievementNo: achievementNo,
            lineName: lineName
        },
        records: records,
        machines: machines,
        chartData: chartData,
        summary: {
            kapasitasTerpakai: kapasitasTerpakai,
            machinePerformance: machinePerformance
        }
    };
}

function getMasterInfo(partName, proses) {
    // This would normally query your master data
    // For now, return placeholder
    return {
        idProses: '1/3',
        idMesin: 'P3',
        sph: 400,
        dandori: 15,
        needTime: 2
    };
}

function generateAchievementNumber(date) {
    const d = new Date(date);
    const month = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    const sequential = Math.floor(Math.random() * 100) + 1;
    return `${sequential}/STP/${month}/${year}`;
}

// Make functions globally accessible
window.generateFullReport = generateFullReport;
window.closeErrorModal = closeErrorModal;

console.log('✅ Dashboard Script Loaded - generateFullReport is ready');