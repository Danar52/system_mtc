 // ========================================
        // CONFIGURATION
        // ========================================
        const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz_d98hagrN6lw5JIvB7gkACpKMZ75QGcdGx0J9JRKRggYOWq4qmVDNeGShdjM-pv0/exec"; 

        // State Management
        let masterData = {};
        let lossMap = {};
        let partsList = [];
        let selectedPartData = null;

        // ========================================
        // INITIALIZATION
        // ========================================
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            loadMasterData();
            setCurrentDate();
            setDefaultDate();
            addRow();
            initializeAutocomplete();
        }

        function setCurrentDate() {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('currentDate').textContent = today.toLocaleDateString('id-ID', options);
        }

        function setDefaultDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            document.getElementById('tanggal').value = `${year}-${month}-${day}`;
        }

        // ========================================
        // MASTER DATA FUNCTIONS
        // ========================================
        async function loadMasterData() {
            try {
                const response = await fetch(`${WEB_APP_URL}?action=getMaster&_=${Date.now()}`);
                const data = await response.json();
                masterData = data;
                populateDropdowns(data);
            } catch (error) {
                console.error('Error loading master data:', error);
                showAlert('❌ Gagal memuat data master. Periksa koneksi dan URL deployment.', 'error');
            }
        }

        function populateDropdowns(data) {
            // Populate Mesin dropdown
            const selMesin = document.getElementById('selectMesin');
            selMesin.innerHTML = '<option value="" disabled selected>Pilih Mesin...</option>';
            data.mesin.forEach(row => {
                let opt = new Option(`${row[1]}`, row[1]); 
                opt.dataset.line = row[2];
                selMesin.add(opt);
            });

            // Store parts data for autocomplete
            // Create unique entries for each part-process combination
            partsList = data.dies.map(row => ({
                partNo: row[0],
                partName: row[1],
                idProses: row[2],
                namaProses: row[3],
                stdTime: row[4],
                uniqueKey: `${row[0]}-${row[2]}` // Unique key: partNo-idProses
            }));

            // Create loss time lookup map
            data.losstime.forEach(row => lossMap[row[0].toString()] = row[1]);
        }

        // ========================================
        // AUTOCOMPLETE FUNCTIONALITY
        // ========================================
        function initializeAutocomplete() {
            const searchInput = document.getElementById('searchPartName');
            const autocompleteList = document.getElementById('autocompleteList');

            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.trim().toLowerCase();
                
                if (searchTerm.length < 2) {
                    autocompleteList.classList.remove('active');
                    return;
                }

                const filteredParts = partsList.filter(part => 
                    part.partName.toLowerCase().includes(searchTerm) ||
                    part.partNo.toLowerCase().includes(searchTerm)
                );

                displayAutocompleteResults(filteredParts);
            });

            searchInput.addEventListener('focus', function() {
                if (this.value.trim().length >= 2) {
                    const searchTerm = this.value.trim().toLowerCase();
                    const filteredParts = partsList.filter(part => 
                        part.partName.toLowerCase().includes(searchTerm) ||
                        part.partNo.toLowerCase().includes(searchTerm)
                    );
                    displayAutocompleteResults(filteredParts);
                }
            });

            document.addEventListener('click', function(e) {
                if (!e.target.closest('.autocomplete-container')) {
                    autocompleteList.classList.remove('active');
                }
            });
        }

        function displayAutocompleteResults(parts) {
            const autocompleteList = document.getElementById('autocompleteList');
            
            if (parts.length === 0) {
                autocompleteList.innerHTML = '<div class="autocomplete-no-results">Tidak ada hasil ditemukan</div>';
                autocompleteList.classList.add('active');
                return;
            }

            autocompleteList.innerHTML = parts.map(part => `
                <div class="autocomplete-item" onclick="selectPart('${part.uniqueKey}')">
                    <div class="autocomplete-item-main">
                        <div class="autocomplete-item-name">${part.partName}</div>
                        <div class="autocomplete-item-id">Part No: ${part.partNo}</div>
                    </div>
                    <div class="autocomplete-item-sub">
                        <span class="autocomplete-item-badge">${part.namaProses}</span>
                        <span class="autocomplete-item-time">${part.stdTime} min</span>
                    </div>
                </div>
            `).join('');

            autocompleteList.classList.add('active');
        }

        function selectPart(uniqueKey) {
            const part = partsList.find(p => p.uniqueKey === uniqueKey);
            if (!part) return;

            selectedPartData = part;
            
            document.getElementById('searchPartName').value = part.partName;
            document.getElementById('displayPartNo').value = part.partNo;
            document.getElementById('displayIdProses').value = part.idProses;
            document.getElementById('displayNamaProses').value = part.namaProses;
            document.getElementById('displayStdTime').value = part.stdTime;
            
            document.getElementById('autocompleteList').classList.remove('active');
            
            calculateTotal();
        }

        // ========================================
        // UI UPDATE FUNCTIONS
        // ========================================
        function updateLine() {
            const sel = document.getElementById('selectMesin');
            if (sel.selectedIndex > 0) {
                const line = sel.options[sel.selectedIndex].dataset.line;
                document.getElementById('lineBadge').innerText = line;
            }
        }

        function lookupLoss(el) {
            const code = el.value.trim();
            const desc = el.closest('tr').querySelector('.desc-text');
            if(lossMap[code]) {
                desc.innerText = lossMap[code];
                desc.className = "desc-text text-success";
            } else {
                desc.innerText = code ? "Tidak Dikenal" : "-";
                desc.className = "desc-text";
            }
        }

        // ========================================
        // TABLE MANAGEMENT
        // ========================================
        function addRow() {
            const tbody = document.getElementById('matrixBody');
            const tr = document.createElement('tr');
            tr.className = 'input-row';
            tr.innerHTML = `
                <td>
                    <input type="text" class="code-input" placeholder="00" oninput="lookupLoss(this)" onkeydown="checkEnter(event, this)">
                </td>
                <td>
                    <div class="desc-text">-</div>
                </td>
                <td>
                    <input type="number" class="min-input" placeholder="0" oninput="calculateTotal()" onkeydown="checkEnter(event, this)">
                </td>
                <td style="text-align: center;">
                    <button type="button" class="btn-delete" onclick="deleteRow(this)" title="Hapus baris">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6.5 7.5V11.5M9.5 7.5V11.5M4 4H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.code-input').focus();
        }

        function deleteRow(btn) {
            if(document.querySelectorAll('.input-row').length > 1) {
                btn.closest('tr').remove();
                calculateTotal();
            } else {
                showAlert('⚠️ Minimal harus ada 1 baris aktivitas', 'error');
            }
        }

        function checkEnter(e, el) {
            if (e.key === "Enter") {
                e.preventDefault();
                const row = el.closest('tr');
                if (el.classList.contains('code-input')) {
                    row.querySelector('.min-input').focus();
                } else if (el.classList.contains('min-input')) {
                    addRow();
                }
            }
        }

        // ========================================
        // CALCULATION
        // ========================================
        function calculateTotal() {
            let total = 0;
            document.querySelectorAll('.min-input').forEach(i => {
                total += Number(i.value || 0);
            });
            document.getElementById('totalAktual').innerText = total;

            const std = Number(document.getElementById('displayStdTime').value || 0);
            const label = document.getElementById('statusLabel');

            if(total > std && std > 0) {
                label.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3V8M8 11H8.01M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    OVER +${total - std}
                `;
                label.className = "status-badge status-over";
            } else if(total > 0 && std > 0) {
                label.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    OK
                `;
                label.className = "status-badge status-ok";
            } else {
                label.innerHTML = '-';
                label.className = "status-badge";
            }
        }

        // ========================================
        // FORM SUBMISSION
        // ========================================
        document.getElementById('dandoriForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const total = Number(document.getElementById('totalAktual').innerText);
            if(total === 0) {
                showAlert('⚠️ Isi aktivitas dandori terlebih dahulu!', 'error');
                return;
            }

            const searchInput = document.getElementById('searchPartName');
            if (!selectedPartData && searchInput.value.trim() === '') {
                showAlert('⚠️ Pilih nama part/dies terlebih dahulu!', 'error');
                searchInput.focus();
                return;
            }

            const btn = document.getElementById('btnSubmit');
            const originalHTML = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2" stroke-dasharray="32" stroke-dashoffset="8"/>
                </svg>
                <span>Menyimpan...</span>
            `;

            let rincianArr = [];
            document.querySelectorAll('.input-row').forEach(row => {
                const k = row.querySelector('.code-input').value;
                const m = row.querySelector('.min-input').value;
                if(k && m) rincianArr.push({kode: k, menit: m});
            });

            const selMesin = document.getElementById('selectMesin');

            const payload = {
                tanggal: document.getElementById('tanggal').value,
                shift: document.getElementById('shift').value,
                operator: document.getElementById('operator').value,
                nama_mesin: selMesin.value,
                line: selMesin.options[selMesin.selectedIndex].dataset.line,
                part_no: document.getElementById('displayPartNo').value,
                part_name: searchInput.value.trim(),
                id_proses: document.getElementById('displayIdProses').value,
                nama_proses: document.getElementById('displayNamaProses').value,
                standard_time: document.getElementById('displayStdTime').value,
                rincian_detail: rincianArr
            };

            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if(result.status === 'SUCCESS') {
                    const successMessage = `
                        <div class="alert-content">
                            <div class="alert-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="alert-text">
                                <div class="alert-title">Data berhasil disimpan!</div>
                                <div class="alert-details">
                                    <div class="alert-detail-item">
                                        <span class="label">Tanggal:</span>
                                        <span class="value">${new Date(payload.tanggal).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <div class="alert-detail-item">
                                        <span class="label">Operator:</span>
                                        <span class="value">${payload.operator}</span>
                                    </div>
                                    <div class="alert-detail-item">
                                        <span class="label">Part:</span>
                                        <span class="value">${payload.part_name}</span>
                                    </div>
                                    <div class="alert-detail-item">
                                        <span class="label">Total Dandori:</span>
                                        <span class="value">${total} menit</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    showAlert(successMessage, 'success');
                    
                    setTimeout(() => {
                        resetForm();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 3000);
                } else {
                    showAlert('❌ Error: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showAlert('❌ Gagal menyimpan data: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        });

        // ========================================
        // UTILITY FUNCTIONS
        // ========================================
        function showAlert(message, type) {
            const container = document.getElementById('alertContainer');
            const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
            
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert ${alertClass}`;
            alertDiv.innerHTML = message;
            
            container.appendChild(alertDiv);
            
            setTimeout(() => {
                alertDiv.style.animation = 'slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1)';
                setTimeout(() => alertDiv.remove(), 200);
            }, 6000);
        }

        function resetForm() {
            if (confirm('Apakah Anda yakin ingin mereset form? Semua data yang belum disimpan akan hilang.')) {
                document.getElementById('dandoriForm').reset();
                document.getElementById('matrixBody').innerHTML = '';
                document.getElementById('searchPartName').value = '';
                document.getElementById('displayPartNo').value = '';
                document.getElementById('displayIdProses').value = '';
                document.getElementById('displayNamaProses').value = '';
                document.getElementById('displayStdTime').value = '';
                document.getElementById('lineBadge').innerText = '-';
                document.getElementById('totalAktual').innerText = '0';
                document.getElementById('statusLabel').innerHTML = '-';
                document.getElementById('statusLabel').className = 'status-badge';
                document.getElementById('autocompleteList').classList.remove('active');
                selectedPartData = null;
                setDefaultDate();
                addRow();
            }
        }