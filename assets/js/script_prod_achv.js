// ========================================
// PRODUCTION INPUT SYSTEM V2
// ========================================

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbxR5tICOc_bBlUxJ49RTpaI2_TlYwfAsM78jAvVxfg_wri3hZR0gDu7iSo-KYuTurmw/exec",
    DEBOUNCE_DELAY: 300
};

// ========================================
// STATE MANAGEMENT
// ========================================
let masterData = {
    parts: [],
    processes: [],
    machines: []
};

let selectedPart = '';
let selectedProses = '';

// ========================================
// DOM ELEMENTS
// ========================================
const elements = {
    // Modals & Overlay
    loadingOverlay: null,
    successModal: null,
    errorModal: null,
    
    // Modal Content
    modalPerformance: null,
    modalQtyAch: null,
    modalEffAch: null,
    modalSph: null,
    performanceProgress: null,
    alertFlags: null,
    errorMessage: null,
    
    // Date
    currentDate: null,
    tglProduksi: null,
    
    // Part & Process
    partName: null,
    partList: null,
    partCount: null,
    proses: null,
    prosesList: null,
    prosesCount: null,
    
    // Machine
    mesinAktual: null,
    mesinCount: null,
    
    // Quantity
    qtySpk: null,
    actQty: null,
    
    // Time inputs
    actMenit: null,
    jamHint: null,
    jamMulai: null,
    jamSelesai: null,
    durasiHint: null,
    
    // Sections
    minutesSection: null,
    startEndSection: null,
    
    // Form
    prodForm: null,
    btnSubmit: null
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Production System V2 Initialized');
    
    initializeElements();
    setCurrentDate();
    setDefaultProductionDate();
    loadMasterData();
    initializeEventListeners();
});

function initializeElements() {
    // Modals & Overlay
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.successModal = document.getElementById('successModal');
    elements.errorModal = document.getElementById('errorModal');
    
    // Modal Content
    elements.modalPerformance = document.getElementById('modalPerformance');
    elements.modalQtyAch = document.getElementById('modalQtyAch');
    elements.modalEffAch = document.getElementById('modalEffAch');
    elements.modalSph = document.getElementById('modalSph');
    elements.performanceProgress = document.getElementById('performanceProgress');
    elements.alertFlags = document.getElementById('alertFlags');
    elements.errorMessage = document.getElementById('errorMessage');
    
    // Date
    elements.currentDate = document.getElementById('currentDate');
    elements.tglProduksi = document.getElementById('tglProduksi');
    
    // Part & Process
    elements.partName = document.getElementById('partName');
    elements.partList = document.getElementById('partList');
    elements.partCount = document.getElementById('partCount');
    elements.proses = document.getElementById('proses');
    elements.prosesList = document.getElementById('prosesList');
    elements.prosesCount = document.getElementById('prosesCount');
    
    // Machine
    elements.mesinAktual = document.getElementById('mesinAktual');
    elements.mesinCount = document.getElementById('mesinCount');
    
    // Quantity
    elements.qtySpk = document.getElementById('qtySpk');
    elements.actQty = document.getElementById('actQty');
    
    // Time inputs
    elements.actMenit = document.getElementById('actMenit');
    elements.jamHint = document.getElementById('jamHint');
    elements.jamMulai = document.getElementById('jamMulai');
    elements.jamSelesai = document.getElementById('jamSelesai');
    elements.durasiHint = document.getElementById('durasiHint');
    
    // Sections
    elements.minutesSection = document.getElementById('minutesSection');
    elements.startEndSection = document.getElementById('startEndSection');
    
    // Form
    elements.prodForm = document.getElementById('prodForm');
    elements.btnSubmit = document.getElementById('btnSubmit');
}

// ========================================
// DATE FUNCTIONS
// ========================================
function setCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = today.toLocaleDateString('id-ID', options);
}

function setDefaultProductionDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    elements.tglProduksi.value = `${year}-${month}-${day}`;
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

function showSuccessModal(metrics) {
    // Populate metrics
    elements.modalPerformance.textContent = metrics.performanceScore;
    elements.modalQtyAch.textContent = metrics.achievementQty;
    elements.modalEffAch.textContent = metrics.achievementEff;
    elements.modalSph.textContent = metrics.sphAct + ' pcs/jam';
    
    // Animate progress bar
    const performanceValue = parseFloat(metrics.performanceScore);
    setTimeout(() => {
        elements.performanceProgress.style.width = performanceValue + '%';
    }, 100);
    
    // Update progress color based on performance
    if (performanceValue >= 90) {
        elements.performanceProgress.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
    } else if (performanceValue >= 70) {
        elements.performanceProgress.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
    } else {
        elements.performanceProgress.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
    }
    
    // Show alert flags
    elements.alertFlags.innerHTML = '';
    
    if (metrics.overproduction) {
        elements.alertFlags.innerHTML += `
            <div class="alert-item alert-warning">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 6V11M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M10 2L2 17H18L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
                <span><strong>Overproduction:</strong> Qty produksi melebihi SPK target</span>
            </div>
        `;
    }
    
    if (metrics.delayed) {
        elements.alertFlags.innerHTML += `
            <div class="alert-item alert-danger">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 5V10L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span><strong>Delayed:</strong> Waktu produksi lebih lama dari standard</span>
            </div>
        `;
    }
    
    if (!metrics.overproduction && !metrics.delayed) {
        elements.alertFlags.innerHTML = `
            <div class="alert-item" style="background: #d1fae5; color: #065f46; border-color: #10b981;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M16 6L8 14L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span><strong>Excellent!</strong> Produksi berjalan optimal sesuai target</span>
            </div>
        `;
    }
    
    elements.successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    elements.successModal.classList.remove('active');
    document.body.style.overflow = '';
    elements.performanceProgress.style.width = '0';
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

// Make modal functions global for onclick handlers
window.closeSuccessModal = closeSuccessModal;
window.closeErrorModal = closeErrorModal;

// ========================================
// VALIDATION FUNCTIONS
// ========================================
function validateField(field, value, rules) {
    const errorElement = document.getElementById(field + 'Error');
    
    if (!errorElement) return true;
    
    // Reset error state
    elements[field].classList.remove('error');
    errorElement.classList.remove('active');
    errorElement.textContent = '';
    
    // Check rules
    if (rules.required && (!value || value.toString().trim() === '')) {
        showFieldError(field, 'Field ini wajib diisi');
        return false;
    }
    
    if (rules.min !== undefined && Number(value) < rules.min) {
        showFieldError(field, `Nilai minimal ${rules.min}`);
        return false;
    }
    
    if (rules.max !== undefined && Number(value) > rules.max) {
        showFieldError(field, `Nilai maksimal ${rules.max}`);
        return false;
    }
    
    if (rules.custom && !rules.custom(value)) {
        showFieldError(field, rules.customMessage || 'Input tidak valid');
        return false;
    }
    
    return true;
}

function showFieldError(field, message) {
    const errorElement = document.getElementById(field + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
        elements[field].classList.add('error');
    }
}

function validateForm() {
    let isValid = true;
    
    // Validate date
    if (!validateField('tglProduksi', elements.tglProduksi.value, { required: true })) {
        isValid = false;
    }
    
    // Validate part
    if (!selectedPart) {
        showFieldError('partName', 'Pilih part dari list autocomplete');
        isValid = false;
    }
    
    // Validate proses
    if (!selectedProses) {
        showFieldError('proses', 'Pilih proses dari list autocomplete');
        isValid = false;
    }
    
    // Validate mesin
    if (!validateField('mesinAktual', elements.mesinAktual.value, { required: true })) {
        isValid = false;
    }
    
    // Validate quantities
    if (!validateField('qtySpk', elements.qtySpk.value, { required: true, min: 1 })) {
        isValid = false;
    }
    
    if (!validateField('actQty', elements.actQty.value, { required: true, min: 0 })) {
        isValid = false;
    }
    
    // Validate time
    const method = getActiveTimeMethod();
    if (method === 'minutes') {
        if (!validateField('actMenit', elements.actMenit.value, { required: true, min: 1 })) {
            isValid = false;
        }
    } else {
        if (!validateField('jamMulai', elements.jamMulai.value, { required: true })) {
            isValid = false;
        }
        if (!validateField('jamSelesai', elements.jamSelesai.value, { required: true })) {
            isValid = false;
        }
        
        const duration = calculateDurationFromStartEnd(elements.jamMulai.value, elements.jamSelesai.value);
        if (duration <= 0) {
            showFieldError('jamSelesai', 'Jam selesai harus lebih besar dari jam mulai');
            isValid = false;
        }
    }
    
    return isValid;
}

// ========================================
// API FUNCTIONS
// ========================================
async function loadMasterData() {
    const url = `${CONFIG.API_URL}?action=getDropdowns`;
    console.log('📡 Fetching master data from:', url);

    showLoading();

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        if (!data.parts || !data.machines) {
            throw new Error('Invalid data structure: missing parts or machines');
        }

        masterData.parts = data.parts;
        masterData.machines = data.machines;

        console.log(`✅ Loaded ${masterData.parts.length} parts and ${masterData.machines.length} machines`);

        populateMachineDropdown();
        updatePartCount();

        hideLoading();

    } catch (error) {
        console.error('❌ Load master data error:', error);
        hideLoading();
        showErrorModal('GAGAL LOAD DATABASE!\n\nError: ' + error.message + '\n\nPeriksa:\n1. URL API sudah benar?\n2. Deployment set "Anyone"?\n3. Console log untuk detail');
    }
}

function populateMachineDropdown() {
    elements.mesinAktual.innerHTML = '<option value="">Pilih Mesin...</option>';
    
    if (masterData.machines.length === 0) {
        elements.mesinAktual.innerHTML += '<option value="" disabled>⚠️ NO DATA FOUND</option>';
        console.warn('⚠️ No machines data available');
    } else {
        masterData.machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine;
            option.textContent = machine;
            elements.mesinAktual.appendChild(option);
        });
        elements.mesinAktual.disabled = false;
    }
    
    elements.mesinCount.textContent = `${masterData.machines.length} items loaded`;
}

function updatePartCount() {
    const uniqueParts = getUniqueParts();
    elements.partCount.textContent = `${uniqueParts.length} items loaded`;
}

// ========================================
// AUTOCOMPLETE FUNCTIONS
// ========================================
function getUniqueParts() {
    return [...new Set(masterData.parts.map(p => p.partName))];
}

function filterPartsBySearch(searchTerm) {
    const uniqueParts = getUniqueParts();
    
    if (!searchTerm) {
        return uniqueParts;
    }
    
    return uniqueParts.filter(part => 
        part.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function showPartAutocomplete(searchTerm) {
    const filtered = filterPartsBySearch(searchTerm);
    
    if (filtered.length === 0) {
        elements.partList.innerHTML = '<div class="autocomplete-empty">Tidak ada part yang cocok</div>';
        elements.partList.classList.add('active');
        return;
    }
    
    elements.partList.innerHTML = '';
    filtered.forEach((part) => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerHTML = highlightMatch(part, searchTerm);
        div.dataset.value = part;
        
        div.addEventListener('click', () => {
            selectPart(part);
        });
        
        elements.partList.appendChild(div);
    });
    
    elements.partList.classList.add('active');
}

function selectPart(partName) {
    selectedPart = partName;
    elements.partName.value = partName;
    elements.partList.classList.remove('active');
    
    // Clear error if exists
    elements.partName.classList.remove('error');
    const errorEl = document.getElementById('partNameError');
    if (errorEl) errorEl.classList.remove('active');
    
    console.log(`✅ Part selected: ${partName}`);
    
    // Enable and reset process input
    elements.proses.disabled = false;
    elements.proses.value = '';
    elements.proses.placeholder = 'Ketik untuk mencari proses...';
    selectedProses = '';
    
    // Load processes for selected part
    loadProcessesForPart(partName);
}

function loadProcessesForPart(partName) {
    masterData.processes = masterData.parts.filter(p => p.partName === partName);
    
    console.log(`📊 Loaded ${masterData.processes.length} processes for "${partName}"`);
    elements.prosesCount.textContent = `${masterData.processes.length} items`;
}

function filterProcessesBySearch(searchTerm) {
    const processes = masterData.processes.map(p => p.proses);
    
    if (!searchTerm) {
        return processes;
    }
    
    return processes.filter(proses => 
        proses.toLowerCase().includes(searchTerm.toLowerCase())
    );
}

function showProsesAutocomplete(searchTerm) {
    if (masterData.processes.length === 0) {
        elements.prosesList.innerHTML = '<div class="autocomplete-empty">Pilih part terlebih dahulu</div>';
        elements.prosesList.classList.add('active');
        return;
    }
    
    const filtered = filterProcessesBySearch(searchTerm);
    
    if (filtered.length === 0) {
        elements.prosesList.innerHTML = '<div class="autocomplete-empty">Tidak ada proses yang cocok</div>';
        elements.prosesList.classList.add('active');
        return;
    }
    
    elements.prosesList.innerHTML = '';
    filtered.forEach((proses) => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.innerHTML = highlightMatch(proses, searchTerm);
        div.dataset.value = proses;
        
        div.addEventListener('click', () => {
            selectProses(proses);
        });
        
        elements.prosesList.appendChild(div);
    });
    
    elements.prosesList.classList.add('active');
}

function selectProses(proses) {
    selectedProses = proses;
    elements.proses.value = proses;
    elements.prosesList.classList.remove('active');
    
    // Clear error if exists
    elements.proses.classList.remove('error');
    const errorEl = document.getElementById('prosesError');
    if (errorEl) errorEl.classList.remove('active');
    
    console.log(`✅ Proses selected: ${proses}`);
}

// ========================================
// TIME CALCULATION FUNCTIONS
// ========================================
function calculateJamFromMenit(menit) {
    const jam = (menit / 60).toFixed(2);
    const hours = Math.floor(menit / 60);
    const minutes = Math.round(menit % 60);
    
    elements.jamHint.textContent = `${jam} Jam (${hours} Jam ${minutes} Menit)`;
}

function calculateDurationFromStartEnd(startTime, endTime) {
    if (!startTime || !endTime) {
        elements.durasiHint.textContent = '0 menit (0.00 jam)';
        return 0;
    }
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    // Handle overnight shifts
    if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
    }
    
    const jam = (totalMinutes / 60).toFixed(2);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    elements.durasiHint.textContent = `${totalMinutes} menit (${jam} jam) → ${hours} Jam ${minutes} Menit`;
    
    return totalMinutes;
}

function getActiveTimeMethod() {
    const minutesRadio = document.querySelector('input[name="timeMethod"][value="minutes"]');
    return minutesRadio.checked ? 'minutes' : 'startEnd';
}

function getActualMinutes() {
    const method = getActiveTimeMethod();
    
    if (method === 'minutes') {
        const menit = parseInt(elements.actMenit.value) || 0;
        return menit;
    } else {
        return calculateDurationFromStartEnd(elements.jamMulai.value, elements.jamSelesai.value);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function initializeEventListeners() {
    // Part Name Autocomplete
    elements.partName.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length === 0) {
            elements.partList.classList.remove('active');
            selectedPart = '';
            elements.proses.disabled = true;
            elements.proses.value = '';
            elements.proses.placeholder = 'Pilih part terlebih dahulu...';
            masterData.processes = [];
            elements.prosesCount.textContent = '0 items';
            return;
        }
        
        showPartAutocomplete(searchTerm);
    });
    
    elements.partName.addEventListener('focus', (e) => {
        if (e.target.value.trim()) {
            showPartAutocomplete(e.target.value.trim());
        }
    });
    
    // Proses Autocomplete
    elements.proses.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length === 0) {
            elements.prosesList.classList.remove('active');
            selectedProses = '';
            return;
        }
        
        showProsesAutocomplete(searchTerm);
    });
    
    elements.proses.addEventListener('focus', (e) => {
        if (masterData.processes.length > 0) {
            showProsesAutocomplete(e.target.value.trim());
        }
    });
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.partName.contains(e.target) && !elements.partList.contains(e.target)) {
            elements.partList.classList.remove('active');
        }
        
        if (!elements.proses.contains(e.target) && !elements.prosesList.contains(e.target)) {
            elements.prosesList.classList.remove('active');
        }
    });
    
    // Keyboard navigation for autocomplete
    elements.partName.addEventListener('keydown', (e) => handleAutocompleteKeyboard(e, elements.partList));
    elements.proses.addEventListener('keydown', (e) => handleAutocompleteKeyboard(e, elements.prosesList));
    
    // Time Method Toggle
    const timeMethodRadios = document.querySelectorAll('input[name="timeMethod"]');
    timeMethodRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'minutes') {
                elements.minutesSection.style.display = 'block';
                elements.startEndSection.style.display = 'none';
                elements.actMenit.required = true;
                elements.jamMulai.required = false;
                elements.jamSelesai.required = false;
            } else {
                elements.minutesSection.style.display = 'none';
                elements.startEndSection.style.display = 'block';
                elements.actMenit.required = false;
                elements.jamMulai.required = true;
                elements.jamSelesai.required = true;
            }
        });
    });
    
    // Time Calculations
    elements.actMenit.addEventListener('input', (e) => {
        const menit = parseInt(e.target.value) || 0;
        calculateJamFromMenit(menit);
    });
    
    elements.jamMulai.addEventListener('change', () => {
        calculateDurationFromStartEnd(elements.jamMulai.value, elements.jamSelesai.value);
    });
    
    elements.jamSelesai.addEventListener('change', () => {
        calculateDurationFromStartEnd(elements.jamMulai.value, elements.jamSelesai.value);
    });
    
    // Form Submission
    elements.prodForm.addEventListener('submit', handleFormSubmit);
}

function handleAutocompleteKeyboard(e, listElement) {
    if (!listElement.classList.contains('active')) return;
    
    const items = listElement.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;
    
    let currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
    
    switch(e.key) {
        case 'ArrowDown':
            e.preventDefault();
            currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            break;
        case 'ArrowUp':
            e.preventDefault();
            currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            break;
        case 'Enter':
            e.preventDefault();
            if (currentIndex >= 0) {
                items[currentIndex].click();
            }
            return;
        case 'Escape':
            listElement.classList.remove('active');
            return;
        default:
            return;
    }
    
    items.forEach(item => item.classList.remove('selected'));
    items[currentIndex].classList.add('selected');
    items[currentIndex].scrollIntoView({ block: 'nearest' });
}

// ========================================
// FORM SUBMISSION
// ========================================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        console.warn('⚠️ Form validation failed');
        return;
    }
    
    const actualMinutes = getActualMinutes();
    
    if (actualMinutes <= 0) {
        showErrorModal('Waktu kerja harus lebih dari 0 menit!');
        return;
    }
    
    showLoading();
    
    const payload = {
        tglProduksi: elements.tglProduksi.value,
        partName: selectedPart,
        proses: selectedProses,
        mesinAktual: elements.mesinAktual.value,
        qtySpk: elements.qtySpk.value,
        actQty: elements.actQty.value,
        actMenit: actualMinutes
    };
    
    console.log('📤 Sending payload:', payload);
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('📥 POST Response:', data);
        
        hideLoading();
        
        if (data.status === 'success') {
            showSuccessModal(data.metrics);
            resetFormFields();
        } else {
            showErrorModal(data.message || 'Terjadi kesalahan saat menyimpan data');
        }
        
    } catch (error) {
        console.error('❌ POST ERROR:', error);
        hideLoading();
        showErrorModal('ERROR JARINGAN: ' + error.message + '\n\nPastikan koneksi internet stabil dan URL API sudah benar.');
    }
}

function resetFormFields() {
    // Reset quantity fields
    elements.qtySpk.value = '';
    elements.actQty.value = '';
    
    // Reset time fields
    elements.actMenit.value = '';
    elements.jamHint.textContent = '0.00 Jam (0 Jam 0 Menit)';
    elements.jamMulai.value = '';
    elements.jamSelesai.value = '';
    elements.durasiHint.textContent = '0 menit (0.00 jam)';
    
    // Reset selection
    selectedPart = '';
    selectedProses = '';
    elements.partName.value = '';
    elements.proses.value = '';
    elements.proses.disabled = true;
    elements.proses.placeholder = 'Pilih part terlebih dahulu...';
    elements.mesinAktual.value = '';
    
    // Clear all errors
    document.querySelectorAll('.field-error.active').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.field-input.error, .field-select.error').forEach(el => el.classList.remove('error'));
    
    console.log('✅ Form reset successfully');
}