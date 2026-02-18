// ========================================
// PRODUCTION REPORT EXPORT V7.1
// PRODUCTION-READY VERSION
// ========================================
// Features:
// ✓ Real-time group line detection from database
// ✓ Database-connected record estimation (no fake data)
// ✓ Optimized A4 Landscape PDF export (full page)
// ✓ Multi-line filtering (P, A, B, C) with validation
// ✓ Debounced date selection for better UX
// ✓ Enhanced error handling and user feedback
// ✓ Fixed machine filtering (Line B now works!)
// ========================================

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbykiHeQ4KnFeATEhmr0t9x24Mufgfe8wvhJczDrmnPgTBmR0Ss1AagEjQv0Z-aLm5Bk/exec',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 30000,
    MAX_LINES_SELECTION: 3,
    OPTIMAL_RECORDS_PER_PAGE: 25
};

// ========================================
// GLOBAL STATE
// ========================================
let reportData = null;
let chartInstance = null;
let availableGroupLines = [];
let estimatedRecords = {};
let dateChangeTimeout = null;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ Production Report Export V7.1 - PRODUCTION READY');
    console.log('📊 Features:');
    console.log('   ✓ Real-time group line detection');
    console.log('   ✓ Database-connected record estimation');
    console.log('   ✓ Optimized A4 Landscape PDF export');
    console.log('   ✓ Multi-line filtering (P, A, B, C)');
    console.log('   ✓ Debounced date selection');
    console.log('🔗 API:', CONFIG.API_URL);
    
    const urlParams = new URLSearchParams(window.location.search);
    const dateFrom = urlParams.get('dateFrom');
    const dateTo = urlParams.get('dateTo');
    
    if (dateFrom && dateTo) {
        await loadReportData();
    } else {
        await initializeDatePicker();
    }
});

// ========================================
// INITIALIZE DATE PICKER
// ========================================
async function initializeDatePicker() {
    const today = getTodayString();
    document.getElementById('inputDateFrom').value = today;
    document.getElementById('inputDateTo').value = today;
    document.getElementById('inputDateFrom').max = today;
    document.getElementById('inputDateTo').max = today;
    
    document.getElementById('inputDateFrom').addEventListener('change', onDateChange);
    document.getElementById('inputDateTo').addEventListener('change', onDateChange);
    
    await loadGroupLines();
    
    document.getElementById('datePickerModal').classList.add('active');
}

// ========================================
// LOAD GROUP LINES FROM API
// ========================================
async function loadGroupLines() {
    try {
        showLoading('Loading production lines from database...');
        
        const url = `${CONFIG.API_URL}?action=getDropdowns`;
        console.log('📡 API Call:', url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        availableGroupLines = data.groupLines || [];
        
        console.log('📊 API Response:', {
            groupLines: availableGroupLines,
            parts: data.parts?.length || 0,
            machines: data.machines?.length || 0
        });
        
        if (!Array.isArray(availableGroupLines) || availableGroupLines.length === 0) {
            console.warn('⚠️ API returned empty/invalid groupLines, extracting from parts...');
            
            if (data.parts && Array.isArray(data.parts)) {
                const extracted = [...new Set(
                    data.parts
                        .map(p => p.groupLine)
                        .filter(g => g && g.length === 1)
                )].sort();
                
                if (extracted.length > 0) {
                    availableGroupLines = extracted;
                    console.log('✅ Extracted from parts:', availableGroupLines);
                } else {
                    throw new Error('No valid group lines found in API response');
                }
            } else {
                throw new Error('Invalid API response structure');
            }
        }
        
        availableGroupLines = availableGroupLines
            .map(line => line.toString().trim().toUpperCase())
            .filter(line => /^[A-Z]$/.test(line))
            .sort();
        
        console.log('✅ Validated group lines:', availableGroupLines);
        
        if (availableGroupLines.length === 0) {
            throw new Error('No valid group lines after validation');
        }
        
        renderGroupLineCheckboxes();
        hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading group lines:', error);
        hideLoading();
        
        const container = document.getElementById('groupLineCheckboxes');
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #dc3545; background: #f8d7da; border-radius: 8px;">
                <strong>⚠️ Failed to load production lines</strong><br>
                <small>${escapeHtml(error.message)}</small><br>
                <button onclick="loadGroupLines()" style="margin-top: 12px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// ========================================
// RENDER GROUP LINE CHECKBOXES
// ========================================
function renderGroupLineCheckboxes(isError = false) {
    const container = document.getElementById('groupLineCheckboxes');
    
    if (isError) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #dc3545; background: #f8d7da; border-radius: 8px;">
                <strong>⚠️ Failed to load production lines</strong><br>
                <small>Using default configuration</small>
            </div>
        `;
        return;
    }
    
    if (!availableGroupLines || availableGroupLines.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #999; background: #f8f9fa; border-radius: 8px;">
                <strong>No production lines available</strong><br>
                <small>Please check database configuration</small>
            </div>
        `;
        return;
    }
    
    const lineDetails = {
        'P': { name: 'Line P', desc: 'Progressive Press', color: '#2196f3', icon: '⚙️' },
        'A': { name: 'Line A', desc: 'Bending Operation', color: '#4caf50', icon: '🔧' },
        'B': { name: 'Line B', desc: 'General Assembly', color: '#9c27b0', icon: '🔩' },
        'C': { name: 'Line C', desc: 'Cutting Process', color: '#ff9800', icon: '✂️' }
    };
    
    container.innerHTML = '';
    
    availableGroupLines.forEach(line => {
        const detail = lineDetails[line] || { 
            name: `Line ${line}`, 
            desc: 'Production Line', 
            color: '#666',
            icon: '📦'
        };
        
        const records = estimatedRecords[line];
        const recordDisplay = records === 0 ? '0' : (records || '...');
        const isDisabled = records === 0;
        
        const item = document.createElement('div');
        item.className = 'checkbox-item' + (isDisabled ? ' disabled' : '');
        
        if (!isDisabled) {
            item.onclick = function() { toggleCheckbox(this); };
        }
        
        item.innerHTML = `
            <input 
                type="checkbox" 
                name="groupLine" 
                value="${line}" 
                ${isDisabled ? 'disabled' : ''}
                onclick="event.stopPropagation(); updatePreview();"
            >
            <div class="line-info">
                <div class="line-name">${detail.icon} ${detail.name}</div>
                <div class="line-desc">${detail.desc}</div>
            </div>
            <span class="record-badge" style="background: ${isDisabled ? '#ccc' : detail.color};">
                ${recordDisplay}
            </span>
        `;
        
        container.appendChild(item);
    });
    
    console.log('✅ Rendered', availableGroupLines.length, 'line options');
}

// ========================================
// CHECKBOX INTERACTIONS
// ========================================
function toggleCheckbox(item) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        item.classList.add('checked');
    } else {
        item.classList.remove('checked');
    }
    
    updatePreview();
}

function selectAllLines() {
    const checkboxes = document.querySelectorAll('input[name="groupLine"]');
    const items = document.querySelectorAll('.checkbox-item');
    
    checkboxes.forEach((cb, index) => {
        if (!cb.disabled) {
            cb.checked = true;
            items[index].classList.add('checked');
        }
    });
    
    updatePreview();
}

function deselectAllLines() {
    const checkboxes = document.querySelectorAll('input[name="groupLine"]');
    const items = document.querySelectorAll('.checkbox-item');
    
    checkboxes.forEach((cb, index) => {
        cb.checked = false;
        items[index].classList.remove('checked');
    });
    
    updatePreview();
}

// ========================================
// DATE CHANGE HANDLER (DEBOUNCED)
// ========================================
async function onDateChange() {
    const dateFrom = document.getElementById('inputDateFrom').value;
    const dateTo = document.getElementById('inputDateTo').value;
    
    if (!dateFrom || !dateTo) {
        updatePreview();
        return;
    }
    
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    
    if (from > to) {
        const preview = document.getElementById('selectionPreview');
        const content = document.getElementById('previewContent');
        
        preview.style.display = 'block';
        content.innerHTML = `
            <div class="preview-warning">
                ⚠️ Invalid date range: "From Date" cannot be after "To Date"
            </div>
        `;
        
        document.getElementById('btnGenerate').disabled = true;
        return;
    }
    
    clearTimeout(dateChangeTimeout);
    
    dateChangeTimeout = setTimeout(async () => {
        await estimateRecords(dateFrom, dateTo);
    }, 500);
}

// ========================================
// ESTIMATE RECORDS (REAL API CALL)
// ========================================
async function estimateRecords(dateFrom, dateTo) {
    try {
        document.querySelectorAll('.record-badge').forEach(badge => {
            badge.classList.add('loading');
            badge.textContent = '...';
        });
        
        showLoading('Analyzing data availability...');
        
        const url = `${CONFIG.API_URL}?action=getReportData&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        console.log('📊 Estimating records:', url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        estimatedRecords = {};
        
        availableGroupLines.forEach(line => {
            estimatedRecords[line] = 0;
        });
        
        if (data.records && Array.isArray(data.records)) {
            data.records.forEach(record => {
                const groupLine = record.groupLine;
                if (groupLine && estimatedRecords.hasOwnProperty(groupLine)) {
                    estimatedRecords[groupLine]++;
                }
            });
        }
        
        console.log('✅ Record counts:', estimatedRecords);
        
        renderGroupLineCheckboxes();
        
        const checkboxes = document.querySelectorAll('input[name="groupLine"]');
        const items = document.querySelectorAll('.checkbox-item');
        
        checkboxes.forEach((cb, index) => {
            const line = cb.value;
            const count = estimatedRecords[line] || 0;
            
            if (count === 0) {
                cb.disabled = true;
                cb.checked = false;
                items[index].classList.add('disabled');
                items[index].classList.remove('checked');
            } else {
                cb.disabled = false;
                items[index].classList.remove('disabled');
            }
        });
        
        document.querySelectorAll('.record-badge').forEach(badge => {
            badge.classList.remove('loading');
        });
        
        hideLoading();
        updatePreview();
        
    } catch (error) {
        console.error('❌ Estimation error:', error);
        
        document.querySelectorAll('.record-badge').forEach(badge => {
            badge.classList.remove('loading');
        });
        
        hideLoading();
        
        estimatedRecords = {};
        availableGroupLines.forEach(line => {
            estimatedRecords[line] = '?';
        });
        
        renderGroupLineCheckboxes();
        updatePreview();
        
        showNotification('Failed to estimate records: ' + error.message, 'error');
    }
}

// ========================================
// UPDATE PREVIEW
// ========================================
function updatePreview() {
    const dateFrom = document.getElementById('inputDateFrom').value;
    const dateTo = document.getElementById('inputDateTo').value;
    const selectedLines = getSelectedLines();
    
    const preview = document.getElementById('selectionPreview');
    const content = document.getElementById('previewContent');
    const generateBtn = document.getElementById('btnGenerate');
    
    if (!dateFrom || !dateTo || selectedLines.length === 0) {
        preview.style.display = 'none';
        generateBtn.disabled = true;
        return;
    }
    
    const totalRecords = selectedLines.reduce((sum, line) => sum + (estimatedRecords[line] || 0), 0);
    const dateRange = calculateDateRange(dateFrom, dateTo);
    
    let layoutWarning = '';
    if (totalRecords > CONFIG.OPTIMAL_RECORDS_PER_PAGE * 2) {
        layoutWarning = `
            <div class="preview-warning">
                ⚠️ High record count (${totalRecords} records) - Report may span multiple pages
            </div>
        `;
    } else if (totalRecords > CONFIG.OPTIMAL_RECORDS_PER_PAGE) {
        layoutWarning = `
            <div class="preview-warning">
                ℹ️ Moderate record count (${totalRecords} records) - Using compressed layout
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="preview-item">
            <strong>Date Range:</strong>
            <span>${dateRange} days</span>
        </div>
        <div class="preview-item">
            <strong>Selected Lines:</strong>
            <span>${selectedLines.join(', ')}</span>
        </div>
        <div class="preview-item">
            <strong>Est. Records:</strong>
            <span>${totalRecords} records</span>
        </div>
        ${layoutWarning}
    `;
    
    preview.style.display = 'block';
    generateBtn.disabled = false;
    
    if (selectedLines.length > CONFIG.MAX_LINES_SELECTION) {
        content.innerHTML += `
            <div class="preview-warning">
                ⚠️ Too many lines selected! Maximum ${CONFIG.MAX_LINES_SELECTION} lines recommended for optimal layout
            </div>
        `;
        generateBtn.disabled = true;
    }
}

function getSelectedLines() {
    return Array.from(document.querySelectorAll('input[name="groupLine"]:checked'))
        .map(cb => cb.value);
}

function calculateDateRange(from, to) {
    const d1 = new Date(from);
    const d2 = new Date(to);
    const diff = Math.abs(d2 - d1);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

// ========================================
// GENERATE REPORT
// ========================================
function generateReport() {
    const dateFrom = document.getElementById('inputDateFrom').value;
    const dateTo = document.getElementById('inputDateTo').value;
    const selectedLines = getSelectedLines();
    
    if (!dateFrom || !dateTo) {
        alert('Please select date range!');
        return;
    }
    
    if (selectedLines.length === 0) {
        alert('Please select at least one production line!');
        return;
    }
    
    if (selectedLines.length > CONFIG.MAX_LINES_SELECTION) {
        alert(`Maximum ${CONFIG.MAX_LINES_SELECTION} lines can be selected!`);
        return;
    }
    
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    
    if (from > to) {
        alert('From Date cannot be after To Date!');
        return;
    }
    
    const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) {
        alert('Date range cannot exceed 90 days!');
        return;
    }
    
    const groupLineParam = selectedLines.join(',');
    const newUrl = `${window.location.pathname}?dateFrom=${dateFrom}&dateTo=${dateTo}&groupLine=${groupLineParam}`;
    
    window.history.pushState({}, '', newUrl);
    
    closeDatePicker();
    loadReportData();
}

function closeDatePicker() {
    document.getElementById('datePickerModal').classList.remove('active');
}

// ========================================
// LOAD REPORT DATA
// ========================================
async function loadReportData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const dateFrom = urlParams.get('dateFrom');
        const dateTo = urlParams.get('dateTo');
        const groupLine = urlParams.get('groupLine');
        
        if (!dateFrom || !dateTo) {
            throw new Error('Missing date parameters!');
        }
        
        console.log('📅 Loading:', dateFrom, 'to', dateTo, '| Lines:', groupLine || 'ALL');
        
        showLoading('Fetching report data...');
        
        let url = `${CONFIG.API_URL}?action=getReportData&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        if (groupLine) {
            url += `&groupLine=${groupLine}`;
        }
        
        const response = await fetch(url, { timeout: CONFIG.TIMEOUT });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        reportData = data;
        console.log('✅ Data loaded:', reportData.records.length, 'records');
        
        document.documentElement.style.setProperty('--row-count', reportData.records.length);
        
        await renderReport();
        
        document.getElementById('reportWrapper').style.display = 'flex';
        document.getElementById('actionBar').style.display = 'flex';
        
        hideLoading();
        enableExportButton();
        
    } catch (error) {
        console.error('❌ Load error:', error);
        hideLoading();
        showError(error.message, true);
    }
}

// ========================================
// RENDER REPORT
// ========================================
async function renderReport() {
    showLoading('Rendering report...');
    
    renderHeader();
    renderTable();
    await renderChart();
    renderSummary();
    
    console.log('✅ Report rendered');
}

// ========================================
// RENDER HEADER
// ========================================
function renderHeader() {
    const { dateFrom, dateTo, achievementNo, groupLineFilter } = reportData.header;
    
    let dateDisplay;
    if (dateFrom === dateTo) {
        const date = new Date(dateFrom + 'T00:00:00');
        dateDisplay = date.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } else {
        const from = new Date(dateFrom + 'T00:00:00');
        const to = new Date(dateTo + 'T00:00:00');
        dateDisplay = `${from.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - ${to.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    
    document.getElementById('reportDate').textContent = dateDisplay;
    document.getElementById('achievementNo').textContent = achievementNo || '-';
    
    if (groupLineFilter && groupLineFilter.length > 0) {
        document.getElementById('filteredLines').textContent = groupLineFilter.join(', ');
        document.getElementById('lineName').textContent = `LINE ${groupLineFilter.join(' + ')} | ${reportData.records.length} Records`;
    } else {
        document.getElementById('filteredLines').textContent = 'ALL LINES';
        document.getElementById('lineName').textContent = `ALL PRODUCTION LINES`;
    }
}

// ========================================
// RENDER TABLE
// ========================================
function renderTable() {
    const { records, machines } = reportData;
    const tbody = document.getElementById('reportTableBody');
    
    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="20" style="text-align: center; padding: 30px; color: #dc3545;">No data available</td></tr>';
        return;
    }
    
    const filteredMachines = filterMachinesBySelectedLines(machines, records);
    
    updateMachineHeaders(filteredMachines);
    
    tbody.innerHTML = '';
    
    records.forEach(record => {
        const row = createTableRow(record, filteredMachines);
        tbody.appendChild(row);
    });
    
    console.log(`✅ Table: ${records.length} rows, ${filteredMachines.length} machines (filtered)`);
}

// ========================================
// FILTER MACHINES BY SELECTED LINES
// ========================================
function filterMachinesBySelectedLines(machines, records) {
    if (!machines || machines.length === 0) {
        console.warn('⚠️ No machines to filter');
        return [];
    }
    
    if (!records || records.length === 0) {
        console.warn('⚠️ No records to analyze');
        return machines;
    }
    
    const activeGroupLines = [...new Set(
        records
            .map(r => r.groupLine)
            .filter(g => g && g.trim() !== '')
            .map(g => g.toUpperCase())
    )].sort();
    
    console.log('🔍 Active group lines from records:', activeGroupLines);
    
    if (activeGroupLines.length === 0) {
        console.warn('⚠️ No valid group lines in records, showing all machines');
        return machines;
    }
    
    const filteredMachines = machines.filter(machine => {
        const shortName = machine.shortName || machine.name || '';
        const machinePrefix = shortName.charAt(0).toUpperCase();
        
        const isRelevant = activeGroupLines.includes(machinePrefix);
        
        if (isRelevant) {
            console.log(`  ✅ Keep: ${shortName} (Line ${machinePrefix})`);
        } else {
            console.log(`  ⏭️  Skip: ${shortName} (Line ${machinePrefix} not in active lines)`);
        }
        
        return isRelevant;
    });
    
    console.log(`✅ Filtered machines: ${machines.length} → ${filteredMachines.length}`);
    console.log('   Machines:', filteredMachines.map(m => m.shortName).join(', '));
    
    return filteredMachines;
}

function updateMachineHeaders(machines) {
    const header = document.getElementById('machineLoadingHeader');
    const placeholder = document.getElementById('machineHeaderPlaceholder');
    
    if (!header || !placeholder) return;
    
    header.setAttribute('colspan', machines.length);
    
    const headerRow = placeholder.parentElement;
    const existing = headerRow.querySelectorAll('.machine-header-dynamic');
    existing.forEach(h => h.remove());
    
    machines.forEach((machine, index) => {
        const th = document.createElement('th');
        th.className = 'section-loading machine-header-dynamic';
        th.textContent = machine.shortName || `M${index + 1}`;
        headerRow.insertBefore(th, placeholder);
    });
    
    placeholder.remove();
}

function createTableRow(record, machines) {
    const tr = document.createElement('tr');
    
    const perfScore = parseFloat(record.performanceScore) || 0;
    const performanceClass = perfScore >= 90 ? 'performance-excellent' : 
                            perfScore >= 70 ? 'performance-good' : 'performance-poor';
    
    const needTime = parseFloat(record.needTime) || 0;
    const processTime = needTime + (parseFloat(record.dandori) || 0);
    
    // SPH ACT - ROUNDED (no decimals)
    const sphAct = parseFloat(record.sphAct) || 0;
    const sphActRounded = Math.round(sphAct);
    
    let html = `
        <td class="col-part-name">${escapeHtml(record.partName || '')}</td>
        <td class="col-part-no">${escapeHtml(record.partNo || '')}</td>
        <td>${escapeHtml(record.idProses || '-')}</td>
        <td class="col-proses">${escapeHtml(record.proses || '')}</td>
        <td>${escapeHtml(record.idMesin || '-')}</td>
        <td>${escapeHtml(record.mesin || '')}</td>
        <td>${formatNumber(record.sph || 0)}</td>
        <td>${formatNumber(record.qtySpk || 0)}</td>
        <td>${formatNumber(record.qtyProd || 0)}</td>
        <td>${formatNumber(record.actTime || 0, 2)}</td>
        <td>${sphActRounded}</td>
        <td>${formatNumber(record.cycleTime || 0, 1)}</td>
        <td>${formatNumber(record.dandori || 0)}</td>
        <td>${formatNumber(needTime, 2)}</td>
        <td>${formatNumber(processTime, 2)}</td>
        <td class="col-performance ${performanceClass}">${perfScore.toFixed(1)}%</td>
    `;
    
    machines.forEach(machine => {
        const loading = record.machineLoading && record.machineLoading[machine.name] 
            ? parseFloat(record.machineLoading[machine.name]) 
            : 0;
        
        html += loading > 0 
            ? `<td class="machine-loading-cell">${formatNumber(loading, 1)}</td>` 
            : `<td></td>`;
    });
    
    html += `<td>${escapeHtml(record.kodeProblem || '')}</td>`;
    
    tr.innerHTML = html;
    return tr;
}

// ========================================
// RENDER CHART
// ========================================
async function renderChart() {
    const canvas = document.getElementById('reportChart');
    if (!canvas) {
        console.warn('⚠️ Chart canvas not found');
        return;
    }
    
    const { chartData, records } = reportData;
    
    if (!chartData || !chartData.labels || !chartData.values) {
        console.warn('⚠️ Chart data missing');
        return;
    }
    
    const uniqueGroupLines = [...new Set(records.map(r => r.groupLine).filter(g => g))];
    
    const filteredLabels = [];
    const filteredValues = [];
    
    chartData.labels.forEach((label, index) => {
        const machineGroupLine = label.charAt(0).toUpperCase();
        
        if (uniqueGroupLines.includes(machineGroupLine)) {
            filteredLabels.push(label);
            filteredValues.push(chartData.values[index]);
        }
    });
    
    console.log('📊 Chart data filtered:', {
        original: chartData.labels.length,
        filtered: filteredLabels.length,
        labels: filteredLabels
    });
    
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    
    try {
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredLabels,
                datasets: [{
                    label: 'Performance %',
                    data: filteredValues,
                    backgroundColor: filteredValues.map(v => {
                        if (v >= 90) return '#d4edda';
                        if (v >= 70) return '#fff3cd';
                        return '#f8d7da';
                    }),
                    borderColor: filteredValues.map(v => {
                        if (v >= 90) return '#155724';
                        if (v >= 70) return '#856404';
                        return '#721c24';
                    }),
                    borderWidth: 2,
                    borderRadius: 4,
                    barThickness: 'flex',
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Performance: ${context.parsed.y.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 10, weight: 'bold' },
                            color: '#333'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 10 },
                            color: '#666',
                            callback: (value) => value + '%'
                        }
                    }
                },
                layout: {
                    padding: { top: 10, bottom: 5, left: 5, right: 5 }
                }
            }
        });
        
        console.log('✅ Chart rendered successfully');
        
    } catch (error) {
        console.error('❌ Chart render error:', error);
    }
}

// ========================================
// RENDER SUMMARY
// ========================================
function renderSummary() {
    const { summary, machines, records } = reportData;
    
    if (!summary) return;
    
    const filteredMachines = filterMachinesBySelectedLines(machines, records);
    
    const kapasitasGrid = document.getElementById('kapasitasGrid');
    if (kapasitasGrid && summary.kapasitasTerpakai) {
        kapasitasGrid.innerHTML = '';
        
        if (filteredMachines.length === 0) {
            kapasitasGrid.innerHTML = '<div style="text-align: center; padding: 10px; color: #999;">No machines for selected lines</div>';
        } else {
            filteredMachines.forEach(machine => {
                const value = summary.kapasitasTerpakai[machine.name] || 0;
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; padding: 3px 5px; background: var(--color-header-bg); border: 1px solid var(--color-border); font-size: 7px;';
                item.innerHTML = `
                    <span style="font-weight: 700;">${machine.shortName || machine.name}</span>
                    <span style="font-weight: 700; color: var(--color-blue);">${formatNumber(value, 2)} hrs</span>
                `;
                kapasitasGrid.appendChild(item);
            });
        }
    }
    
    const summaryTableBody = document.getElementById('summaryTableBody');
    if (summaryTableBody && summary.machinePerformance) {
        summaryTableBody.innerHTML = '';
        
        const filteredPerformance = summary.machinePerformance.filter(item => {
            return filteredMachines.some(m => m.name === item.machine);
        });
        
        if (filteredPerformance.length === 0) {
            summaryTableBody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 10px; color: #999;">No data</td></tr>';
        } else {
            filteredPerformance.forEach(item => {
                const machineInfo = filteredMachines.find(m => m.name === item.machine);
                const displayName = machineInfo ? machineInfo.shortName : item.machine;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="border: 1px solid var(--color-border); padding: 4px; text-align: left; font-weight: 600;">${escapeHtml(displayName)}</td>
                    <td style="border: 1px solid var(--color-border); padding: 4px; text-align: center; font-weight: 700; color: var(--color-blue);">${formatNumber(item.avgPerformance || 0, 1)}%</td>
                `;
                summaryTableBody.appendChild(tr);
            });
        }
    }
    
    console.log('✅ Summary rendered (filtered machines)');
}

// ========================================
// EXPORT TO PDF - OPTIMIZED A4 LANDSCAPE
// ========================================
async function exportToPDF() {
    const button = document.getElementById('btnExport');
    button.disabled = true;
    
    try {
        showLoading('Preparing PDF export...');
        
        const { jsPDF } = window.jspdf;
        const reportContainer = document.getElementById('reportContainer');
        
        const actionBar = document.getElementById('actionBar');
        actionBar.style.display = 'none';
        
        reportContainer.style.transform = 'scale(1)';
        reportContainer.style.boxShadow = 'none';
        
        showLoading('Rendering high-quality snapshot...');
        
        const canvas = await html2canvas(reportContainer, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: reportContainer.scrollWidth,
            windowHeight: reportContainer.scrollHeight,
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.getElementById('reportContainer');
                clonedContainer.style.width = '297mm';
                clonedContainer.style.minHeight = '210mm';
                clonedContainer.style.padding = '8mm';
            }
        });
        
        showLoading('Generating PDF document...');
        
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        const pdfWidth = 297;
        const pdfHeight = 210;
        
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (imgHeight > pdfHeight) {
            const scaleFactor = pdfHeight / imgHeight;
            const scaledWidth = imgWidth * scaleFactor;
            const scaledHeight = pdfHeight;
            const xOffset = (pdfWidth - scaledWidth) / 2;
            
            pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, scaledHeight);
        } else {
            const yOffset = (pdfHeight - imgHeight) / 2;
            pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const dateFrom = urlParams.get('dateFrom') || 'unknown';
        const dateTo = urlParams.get('dateTo') || 'unknown';
        const groupLine = urlParams.get('groupLine') || 'ALL';
        
        const filename = `Production_Report_${dateFrom}_to_${dateTo}_Line_${groupLine.replace(/,/g, '-')}.pdf`;
        
        showLoading('Saving PDF file...');
        
        pdf.save(filename);
        
        actionBar.style.display = 'flex';
        reportContainer.style.transform = '';
        reportContainer.style.boxShadow = '';
        
        hideLoading();
        
        console.log('✅ PDF exported:', filename);
        
        showNotification('PDF exported successfully!', 'success');
        
    } catch (error) {
        console.error('❌ PDF export error:', error);
        hideLoading();
        
        document.getElementById('actionBar').style.display = 'flex';
        
        alert('Failed to export PDF: ' + error.message);
    } finally {
        button.disabled = false;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return num.toFixed(decimals);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    
    if (overlay && text) {
        text.textContent = message;
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function enableExportButton() {
    const button = document.getElementById('btnExport');
    if (button) {
        button.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 24px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        font-family: var(--font-family);
        font-size: 14px;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message, canRetry = false) {
    hideLoading();
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 40px;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        text-align: center;
        z-index: 10000;
        max-width: 600px;
    `;
    
    let buttons = `<button onclick="location.reload()" style="padding: 12px 32px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; border: none; border-radius: 8px; font-family: var(--font-family); font-size: 14px; font-weight: 600; cursor: pointer;">Reload Page</button>`;
    
    if (canRetry) {
        buttons = `
            <button onclick="location.reload()" style="padding: 12px 32px; background: linear-gradient(135deg, #28a745 0%, #5cb85c 100%); color: white; border: none; border-radius: 8px; font-family: var(--font-family); font-size: 14px; font-weight: 600; cursor: pointer; margin: 0 8px;">Retry</button>
            <button onclick="backToDashboard()" style="padding: 12px 32px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; border: none; border-radius: 8px; font-family: var(--font-family); font-size: 14px; font-weight: 600; cursor: pointer; margin: 0 8px;">Back</button>
        `;
    }
    
    errorDiv.innerHTML = `
        <h3 style="font-size: 24px; color: #dc3545; margin-bottom: 16px; font-weight: 700;">⚠️ Error Loading Report</h3>
        <p style="font-size: 14px; color: #666; margin-bottom: 24px; line-height: 1.6;">${escapeHtml(message)}</p>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; color: #495057; text-align: left; margin-bottom: 24px;">
            <strong>Troubleshooting:</strong><br>
            1. Pastikan URL Apps Script sudah benar<br>
            2. Pastikan Web App di-deploy dengan akses "Anyone"<br>
            3. Cek parameter URL dateFrom dan dateTo<br>
            4. Cek Console (F12) untuk error detail
        </div>
        ${buttons}
    `;
    
    document.body.appendChild(errorDiv);
}

function backToDashboard() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        initializeDatePicker();
    }
}