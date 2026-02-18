// ============================================
// CONFIGURATION
// ============================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEbWdMn0nNnZeL35btUunBKcYJT3Hl39q8dHjlpgy63pie0FBgbLYLX83W8jKSK0Sz/exec';

// ============================================
// STATE
// ============================================
let masterDiesData = [];
let selectedIndex  = -1;
let isLoaded       = false;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    loadMasterDies();
    loadLastNoLKD();
    setupEventListeners();
    setDefaultDates();
    updateNoLkdPreview();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const idDiesInput      = document.getElementById('id_dies');
    const autocompleteList = document.getElementById('autocompleteList');

    // Autocomplete events
    idDiesInput.addEventListener('input',   handleDiesInput);
    idDiesInput.addEventListener('focus',   handleDiesFocus);
    idDiesInput.addEventListener('keydown', handleKeyNavigation);

    // Close autocomplete on outside click
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.autocomplete-container')) {
            hideAutocomplete();
        }
    });

    // LKD preview update
    document.getElementById('no_lkd_number').addEventListener('input', updateNoLkdPreview);
    document.getElementById('tanggal_breakdown').addEventListener('change', updateNoLkdPreview);

    // Duration preview — update when any time/date field changes
    ['tanggal_breakdown', 'jam_breakdown',
     'tanggal_mulai_perbaikan', 'jam_mulai_perbaikan',
     'tanggal_selesai_perbaikan', 'jam_selesai_perbaikan'
    ].forEach(id => {
        document.getElementById(id).addEventListener('change', updateDurationPreview);
    });

    // Form submission
    document.getElementById('formBreakdown').addEventListener('submit', handleFormSubmit);
}

// ============================================
// DEFAULT DATES
// ============================================
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal_breakdown').value        = today;
    document.getElementById('tanggal_mulai_perbaikan').value  = today;
    document.getElementById('tanggal_selesai_perbaikan').value = today;
}

// ============================================
// LOAD MASTER DIES
// ============================================
async function loadMasterDies() {
    showDiesLoader(true);
    try {
        const url      = `${SCRIPT_URL}?action=getMasterDies&_=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result   = await response.json();

        if (result.status === 'success') {
            masterDiesData = result.data || [];
            isLoaded = true;
        } else {
            showAlert('Gagal memuat data dies: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading master dies:', error);
        showAlert('Gagal memuat data master dies. Periksa koneksi internet.', 'error');
    } finally {
        showDiesLoader(false);
    }
}

function showDiesLoader(show) {
    const loader = document.getElementById('diesLoader');
    if (loader) loader.classList.toggle('active', show);
}

// ============================================
// AUTOCOMPLETE — BUG FIX UTAMA
// ============================================

// Saat field di-focus: tampilkan semua data atau filter
function handleDiesFocus() {
    if (!isLoaded) return;

    const input = document.getElementById('id_dies').value.trim();
    if (!input) {
        // Tampilkan semua dies saat field kosong dan di-klik
        showAutocomplete(masterDiesData);
    } else {
        const matches = filterDies(input);
        if (matches.length > 0) {
            showAutocomplete(matches);
        }
    }
}

// Saat user mengetik
function handleDiesInput(e) {
    const input = e.target.value.trim();

    if (!input) {
        clearDiesFields();
        hideAutocomplete();
        return;
    }

    const matches = filterDies(input);

    if (matches.length > 0) {
        showAutocomplete(matches);
    } else {
        showNoResults();
        clearDiesFields();
    }

    // Auto-fill jika exact match (case-insensitive)
    const exactMatch = masterDiesData.find(d =>
        safeStr(d.id_dies).toUpperCase() === input.toUpperCase()
    );
    if (exactMatch) {
        fillDiesData(exactMatch);
        hideAutocomplete();
    }
}

// Filter helper: cari di id_dies, nama_dies, nama_proses, id_cust
// Konversi ke string dulu karena data dari Sheets bisa berupa angka/null
function safeStr(val) {
    if (val === null || val === undefined) return '';
    return String(val);
}

function filterDies(query) {
    const q = safeStr(query).toUpperCase();
    return masterDiesData.filter(d =>
        safeStr(d.id_dies).toUpperCase().includes(q)    ||
        safeStr(d.nama_dies).toUpperCase().includes(q)  ||
        safeStr(d.nama_proses).toUpperCase().includes(q) ||
        safeStr(d.id_cust).toUpperCase().includes(q)
    );
}

// Highlight teks yang cocok
function highlightMatch(text, query) {
    if (!text || !query) return text || '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function showAutocomplete(matches) {
    const list = document.getElementById('autocompleteList');
    const query = document.getElementById('id_dies').value.trim();
    selectedIndex = -1;

    list.innerHTML = '';

    matches.slice(0, 50).forEach((dies) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';

        item.innerHTML = `
            <div class="autocomplete-item-id">${highlightMatch(dies.id_dies, query)}</div>
            <div class="autocomplete-item-name">
                ${highlightMatch(dies.nama_dies, query)}
                ${dies.nama_proses ? ` &middot; ${highlightMatch(dies.nama_proses, query)}` : ''}
                ${dies.id_cust    ? ` &middot; ${dies.id_cust}` : ''}
            </div>
        `;

        item.addEventListener('mousedown', function (e) {
            // mousedown before blur so we can capture the click
            e.preventDefault();
            document.getElementById('id_dies').value = dies.id_dies;
            fillDiesData(dies);
            hideAutocomplete();
        });

        list.appendChild(item);
    });

    list.classList.add('active');
}

function showNoResults() {
    const list = document.getElementById('autocompleteList');
    list.innerHTML = '<div class="autocomplete-no-results">Tidak ada dies yang cocok</div>';
    list.classList.add('active');
}

function hideAutocomplete() {
    const list = document.getElementById('autocompleteList');
    list.classList.remove('active');
    selectedIndex = -1;
}

// Keyboard navigation: ArrowDown, ArrowUp, Enter, Escape
function handleKeyNavigation(e) {
    const list  = document.getElementById('autocompleteList');
    const items = list.querySelectorAll('.autocomplete-item');

    if (!list.classList.contains('active') || !items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateKeySelection(items);

    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateKeySelection(items);

    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        items[selectedIndex].dispatchEvent(new MouseEvent('mousedown'));

    } else if (e.key === 'Escape') {
        hideAutocomplete();
    }
}

function updateKeySelection(items) {
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedIndex);
        if (i === selectedIndex) item.scrollIntoView({ block: 'nearest' });
    });
}

// ============================================
// FILL & CLEAR DIES FIELDS
// ============================================
function fillDiesData(dies) {
    document.getElementById('nama_dies').value  = dies.nama_dies  || '';
    document.getElementById('id_proses').value  = dies.id_proses  || '';
    document.getElementById('nama_proses').value = dies.nama_proses || '';
    document.getElementById('id_cust').value    = dies.id_cust    || '';
}

function clearDiesFields() {
    ['nama_dies', 'id_proses', 'nama_proses', 'id_cust'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// ============================================
// LKD NUMBER & PREVIEW
// ============================================
async function loadLastNoLKD() {
    try {
        const url      = `${SCRIPT_URL}?action=getLastNoLKD&_=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const result   = await response.json();

        if (result.status === 'success') {
            document.getElementById('lastNoLkd').textContent       = result.lastNumber  || '-';
            document.getElementById('suggestedNoLkd').textContent  = result.suggestedNumber || '001';
            document.getElementById('no_lkd_number').placeholder   = result.suggestedNumber || '001';
        }
    } catch (error) {
        console.error('Error loading last NoLKD:', error);
        document.getElementById('lastNoLkd').textContent = 'Error';
    }
}

function updateNoLkdPreview() {
    const rawNumber     = document.getElementById('no_lkd_number').value;
    const number        = rawNumber ? rawNumber.padStart(3, '0') : '___';
    const breakdownDate = document.getElementById('tanggal_breakdown').value;

    let preview = `/${number}/LKD/MTC/KMI`;

    if (breakdownDate) {
        const date  = new Date(breakdownDate + 'T00:00:00');
        const month = toRoman(date.getMonth() + 1);
        const year  = date.getFullYear().toString().slice(-2);
        preview += `/${month}/${year}`;
    } else {
        preview += '/—/—';
    }

    document.getElementById('noLkdPreview').textContent = preview;
}

function toRoman(num) {
    const map = [
        [12,'XII'],[11,'XI'],[10,'X'],[9,'IX'],[8,'VIII'],
        [7,'VII'],[6,'VI'],[5,'V'],[4,'IV'],[3,'III'],[2,'II'],[1,'I']
    ];
    for (const [v, r] of map) { if (num === v) return r; }
    return 'I';
}

// ============================================
// DURATION PREVIEW
// ============================================
function updateDurationPreview() {
    const tanggalBreakdown = document.getElementById('tanggal_breakdown').value;
    const jamBreakdown     = document.getElementById('jam_breakdown').value;
    const tanggalMulai     = document.getElementById('tanggal_mulai_perbaikan').value;
    const jamMulai         = document.getElementById('jam_mulai_perbaikan').value;
    const tanggalSelesai   = document.getElementById('tanggal_selesai_perbaikan').value;
    const jamSelesai       = document.getElementById('jam_selesai_perbaikan').value;

    const preview = document.getElementById('durationPreview');

    if (!tanggalMulai || !jamMulai || !tanggalSelesai || !jamSelesai) {
        preview.style.display = 'none';
        return;
    }

    const repairTime = calcHours(tanggalMulai, jamMulai, tanggalSelesai, jamSelesai);
    const downtime   = (tanggalBreakdown && jamBreakdown)
        ? calcHours(tanggalBreakdown, jamBreakdown, tanggalSelesai, jamSelesai)
        : null;

    if (repairTime < 0) {
        preview.style.display = 'none';
        return;
    }

    const status      = getStatus(repairTime);
    const statusClass = status.toLowerCase();

    document.getElementById('previewRepairTime').textContent = repairTime.toFixed(2) + ' jam';
    document.getElementById('previewDowntime').textContent   = downtime !== null
        ? downtime.toFixed(2) + ' jam'
        : '—';

    const statusEl = document.getElementById('previewStatus');
    statusEl.textContent = status;
    statusEl.className   = `duration-value status-badge ${statusClass}`;

    preview.style.display = 'flex';
}

function calcHours(dateA, timeA, dateB, timeB) {
    const start = new Date(`${dateA}T${timeA}:00`);
    const end   = new Date(`${dateB}T${timeB}:00`);
    return (end - start) / (1000 * 60 * 60);
}

function getStatus(hours) {
    if (hours < 1) return 'Ringan';
    if (hours < 3) return 'Sedang';
    return 'Berat';
}

// ============================================
// FORM SUBMISSION
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate dies
    const idDiesVal  = document.getElementById('id_dies').value.trim();
    const diesExists = masterDiesData.find(d =>
        safeStr(d.id_dies).toUpperCase() === idDiesVal.toUpperCase()
    );

    if (!idDiesVal || !diesExists) {
        showAlert('❌ ID Dies tidak valid atau tidak ditemukan di master data!', 'error');
        document.getElementById('id_dies').focus();
        return;
    }

    // Validate no_lkd_number
    const noLkdNum = document.getElementById('no_lkd_number').value.trim();
    if (!noLkdNum) {
        showAlert('❌ Nomor LKD wajib diisi!', 'error');
        document.getElementById('no_lkd_number').focus();
        return;
    }

    const btn          = document.getElementById('btnSubmit');
    const originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="animation:spin 700ms linear infinite;">
            <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"/>
        </svg>
        Menyimpan...
    `;

    const formData = new URLSearchParams();
    formData.append('action',                    'addBreakdown');
    formData.append('no_lkd_number',             noLkdNum);
    formData.append('id_dies',                   idDiesVal.toUpperCase());
    formData.append('nama_dies',                 document.getElementById('nama_dies').value);
    formData.append('id_proses',                 document.getElementById('id_proses').value);
    formData.append('nama_proses',               document.getElementById('nama_proses').value);
    formData.append('id_cust',                   document.getElementById('id_cust').value);
    formData.append('tanggal_breakdown',          document.getElementById('tanggal_breakdown').value);
    formData.append('jam_breakdown',              document.getElementById('jam_breakdown').value);
    formData.append('tanggal_mulai_perbaikan',    document.getElementById('tanggal_mulai_perbaikan').value);
    formData.append('jam_mulai_perbaikan',        document.getElementById('jam_mulai_perbaikan').value);
    formData.append('tanggal_selesai_perbaikan',  document.getElementById('tanggal_selesai_perbaikan').value);
    formData.append('jam_selesai_perbaikan',      document.getElementById('jam_selesai_perbaikan').value);
    formData.append('problem_dies',              document.getElementById('problem_dies').value);
    formData.append('penyebab_breakdown',         document.getElementById('penyebab_breakdown').value);
    formData.append('tindakan_perbaikan',         document.getElementById('tindakan_perbaikan').value);
    formData.append('pic_maintenance',            document.getElementById('pic_maintenance').value);

    try {
        const response = await fetch(SCRIPT_URL, {
            method:   'POST',
            body:     formData,
            redirect: 'follow'
        });

        const result = await response.json();

        if (result.status === 'success') {
            showAlert(`
                <div style="font-weight:700;margin-bottom:8px;">✅ Data berhasil disimpan!</div>
                <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:0.85rem;">
                    <span>No LKD</span><span style="font-family:monospace;font-weight:600;">${result.data.no_lkd}</span>
                    <span>Status</span><span>${result.data.status_breakdown}</span>
                    <span>Repair Time</span><span>${parseFloat(result.data.repair_time).toFixed(2)} jam</span>
                    <span>Total Downtime</span><span>${parseFloat(result.data.total_downtime).toFixed(2)} jam</span>
                </div>
            `, 'success');

            // Reset form
            document.getElementById('formBreakdown').reset();
            clearDiesFields();
            setDefaultDates();
            loadLastNoLKD();
            updateNoLkdPreview();
            document.getElementById('durationPreview').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } else {
            showAlert('❌ ' + result.message, 'error');
        }

    } catch (error) {
        console.error('Submit error:', error);
        showAlert('❌ Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = originalHTML;
    }
}

// ============================================
// RESET FORM
// ============================================
function resetForm() {
    if (!confirm('Reset form? Semua data yang belum disimpan akan hilang.')) return;
    document.getElementById('formBreakdown').reset();
    clearDiesFields();
    setDefaultDates();
    updateNoLkdPreview();
    hideAutocomplete();
    document.getElementById('durationPreview').style.display = 'none';
    document.getElementById('alertContainer').innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// ALERT
// ============================================
function showAlert(message, type) {
    const container  = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';

    const alertDiv       = document.createElement('div');
    alertDiv.className   = `alert ${alertClass}`;
    alertDiv.innerHTML   = message;
    container.appendChild(alertDiv);

    const duration = type === 'success' ? 7000 : 5000;
    setTimeout(() => {
        alertDiv.style.transition = 'opacity 300ms, transform 300ms';
        alertDiv.style.opacity    = '0';
        alertDiv.style.transform  = 'translateY(-8px)';
        setTimeout(() => alertDiv.remove(), 300);
    }, duration);
}

// ============================================
// INJECT SPIN ANIMATION
// ============================================
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);