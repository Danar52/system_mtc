// ==========================================
// CONFIGURATION
// ==========================================
const SHEET_NAMES = {
  MASTER: 'Master_Mesin',
  BREAKDOWN: 'Data_Breakdown',
  MTTR: 'Dashboard_MTTR',
  MTBF: 'Dashboard_MTBF',
  AVAILABILITY: 'Availability_Mesin'  // ✅ TAMBAHAN BARU
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function toRoman(num) {
  const romanNumerals = [
    { value: 12, numeral: 'XII' },
    { value: 11, numeral: 'XI' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 8, numeral: 'VIII' },
    { value: 7, numeral: 'VII' },
    { value: 6, numeral: 'VI' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 3, numeral: 'III' },
    { value: 2, numeral: 'II' },
    { value: 1, numeral: 'I' }
  ];
  
  for (let i = 0; i < romanNumerals.length; i++) {
    if (num === romanNumerals[i].value) {
      return romanNumerals[i].numeral;
    }
  }
  return 'I';
}

function generateNoLKM(userNumber, breakdownDate) {
  const date = new Date(breakdownDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().slice(-2);
  const romanMonth = toRoman(month);
  
  return `${userNumber}/LKM/MTC/KMI/${romanMonth}/${year}`;
}

function calculateTimeDiff(startDate, startTime, endDate, endTime) {
  try {
    const start = new Date(`${startDate} ${startTime}`);
    const end = new Date(`${endDate} ${endTime}`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours);
  } catch (e) {
    return 0;
  }
}

function getStatusBreakdown(repairTimeHours) {
  if (repairTimeHours < 1) return 'Ringan';
  if (repairTimeHours >= 1 && repairTimeHours < 3) return 'Sedang';
  return 'Berat';
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

// ==========================================
// MAIN API HANDLERS - FIXED
// ==========================================

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    
    switch(action) {
      case 'getMasterMesin':
        result = getMasterMesin();
        break;
      case 'getBreakdownData':
        result = getBreakdownData();
        break;
      case 'getMTTRDashboard':
        result = getMTTRDashboard();
        break;
      case 'getMTBFDashboard':
        result = getMTBFDashboard();
        break;
      case 'getAvailabilityDashboard':  // ✅ TAMBAHAN BARU
        result = getAvailabilityDashboard();
        break;
      case 'getLastNoLKM':
        result = getLastNoLKM();
        break;
      default:
        result = { status: 'error', message: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // ⭐ PERBAIKAN: Gunakan e.parameter langsung untuk URLSearchParams
    const data = e.parameter;
    const action = data.action;
    let result;
    
    switch(action) {
      case 'addBreakdown':
        result = addBreakdown(data);
        break;
      case 'updateBreakdown':
        result = updateBreakdown(data);
        break;
      case 'deleteBreakdown':
        result = deleteBreakdown(data);
        break;
      default:
        result = { status: 'error', message: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

function getMasterMesin() {
  try {
    const sheet = getSheet(SHEET_NAMES.MASTER);
    if (!sheet) {
      return { status: 'error', message: 'Sheet Master_Mesin tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { status: 'success', data: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    }).filter(row => row.status_aktif === 'Aktif' || row.status_aktif === true);
    
    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getBreakdownData() {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) {
      return { status: 'error', message: 'Sheet Data_Breakdown tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { status: 'success', data: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getLastNoLKM() {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) {
      return { status: 'success', lastNumber: '000', suggestedNumber: '001' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { status: 'success', lastNumber: '000', suggestedNumber: '001' };
    }
    
    const noLkmColumn = data[0].indexOf('no_lkm');
    const allNumbers = [];
    
    for (let i = 1; i < data.length; i++) {
      const noLkm = data[i][noLkmColumn];
      if (noLkm) {
        const parts = noLkm.toString().split('/');
        if (parts.length > 0) {
          const num = parseInt(parts[0]);
          if (!isNaN(num)) {
            allNumbers.push(num);
          }
        }
      }
    }
    
    const maxNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    
    return { 
      status: 'success', 
      lastNumber: maxNumber.toString().padStart(3, '0'),
      suggestedNumber: nextNumber 
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function addBreakdown(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) {
      return { status: 'error', message: 'Sheet Data_Breakdown tidak ditemukan' };
    }
    
    const existingData = sheet.getDataRange().getValues();
    const headers = existingData[0];
    const noLkmColumn = headers.indexOf('no_lkm');
    const fullNoLKM = generateNoLKM(data.no_lkm_number, data.tanggal_breakdown);
    
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][noLkmColumn] === fullNoLKM) {
        return { status: 'error', message: 'No LKM sudah ada, gunakan nomor lain!' };
      }
    }
    
    const repairTime = calculateTimeDiff(
      data.tanggal_mulai_perbaikan,
      data.jam_mulai_perbaikan,
      data.tanggal_selesai_perbaikan,
      data.jam_selesai_perbaikan
    );
    
    const totalDowntime = calculateTimeDiff(
      data.tanggal_breakdown,
      data.jam_breakdown,
      data.tanggal_selesai_perbaikan,
      data.jam_selesai_perbaikan
    );
    
    const statusBreakdown = getStatusBreakdown(repairTime);
    
    const rowData = [
      fullNoLKM,
      data.id_mesin,
      data.nama_mesin,
      data.tanggal_breakdown,
      data.jam_breakdown,
      data.tanggal_mulai_perbaikan,
      data.jam_mulai_perbaikan,
      data.tanggal_selesai_perbaikan,
      data.jam_selesai_perbaikan,
      data.problem_mesin,
      data.penyebab_breakdown,
      data.tindakan_perbaikan,
      statusBreakdown,
      data.pic_maintenance,
      repairTime,
      totalDowntime
    ];
    
    sheet.appendRow(rowData);
    
    updateMTTRDashboard();
    updateMTBFDashboard();
    updateAvailabilityDashboard();  // ✅ BARU
    
    return { 
      status: 'success', 
      message: 'Data breakdown berhasil ditambahkan',
      data: {
        no_lkm: fullNoLKM,
        repair_time: repairTime,
        total_downtime: totalDowntime,
        status_breakdown: statusBreakdown
      }
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function updateBreakdown(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const noLkmIndex = headers.indexOf('no_lkm');
    
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][noLkmIndex] === data.no_lkm) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { status: 'error', message: 'Data tidak ditemukan' };
    }
    
    const repairTime = calculateTimeDiff(
      data.tanggal_mulai_perbaikan,
      data.jam_mulai_perbaikan,
      data.tanggal_selesai_perbaikan,
      data.jam_selesai_perbaikan
    );
    
    const totalDowntime = calculateTimeDiff(
      data.tanggal_breakdown,
      data.jam_breakdown,
      data.tanggal_selesai_perbaikan,
      data.jam_selesai_perbaikan
    );
    
    const statusBreakdown = getStatusBreakdown(repairTime);
    
    const rowData = [
      data.no_lkm,
      data.id_mesin,
      data.nama_mesin,
      data.tanggal_breakdown,
      data.jam_breakdown,
      data.tanggal_mulai_perbaikan,
      data.jam_mulai_perbaikan,
      data.tanggal_selesai_perbaikan,
      data.jam_selesai_perbaikan,
      data.problem_mesin,
      data.penyebab_breakdown,
      data.tindakan_perbaikan,
      statusBreakdown,
      data.pic_maintenance,
      repairTime,
      totalDowntime
    ];
    
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    updateMTTRDashboard();
    updateMTBFDashboard();
    updateAvailabilityDashboard();  // ✅ BARU
    
    return { status: 'success', message: 'Data breakdown berhasil diupdate' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function deleteBreakdown(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const noLkmIndex = headers.indexOf('no_lkm');
    
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][noLkmIndex] === data.no_lkm) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { status: 'error', message: 'Data tidak ditemukan' };
    }
    
    sheet.deleteRow(rowIndex);
    
    updateMTTRDashboard();
    updateMTBFDashboard();
    updateAvailabilityDashboard();  // ✅ BARU
    
    return { status: 'success', message: 'Data breakdown berhasil dihapus' };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// ==========================================
// DASHBOARD CALCULATIONS
// ==========================================

function updateMTTRDashboard() {
  try {
    // 1. Ambil Semua Sheet yang Diperlukan
    const masterSheet = getSheet(SHEET_NAMES.MASTER);      // Sumber List Mesin
    const breakdownSheet = getSheet(SHEET_NAMES.BREAKDOWN); // Sumber Data Kerusakan
    const mttrSheet = getSheet(SHEET_NAMES.MTTR);          // Target Dashboard
    
    if (!masterSheet || !breakdownSheet || !mttrSheet) return;
    
    // 2. Ambil Data
    const masterData = masterSheet.getDataRange().getValues();
    const breakdownData = breakdownSheet.getDataRange().getValues();
    
    // 3. Mapping Index Kolom (Biar aman kalau kolom geser)
    const masterHeaders = masterData[0];
    const breakdownHeaders = breakdownData[0];
    
    const masterIdIdx = masterHeaders.indexOf('id_mesin');
    const masterNamaIdx = masterHeaders.indexOf('nama_mesin');
    
    const brIdIdx = breakdownHeaders.indexOf('id_mesin');
    const brRepairTimeIdx = breakdownHeaders.indexOf('repair_time');
    
    // 4. Tahap Agregasi Data Breakdown (Kumpulkan dulu stats-nya)
    const breakdownStats = {};
    
    for (let i = 1; i < breakdownData.length; i++) {
      const row = breakdownData[i];
      const idMesin = row[brIdIdx];
      const repairTime = parseFloat(row[brRepairTimeIdx]) || 0;
      
      if (!breakdownStats[idMesin]) {
        breakdownStats[idMesin] = {
          total_breakdown: 0,
          total_repair_time: 0
        };
      }
      
      breakdownStats[idMesin].total_breakdown += 1;
      breakdownStats[idMesin].total_repair_time += repairTime;
    }
    
    // 5. Tahap Penyusunan Dashboard (Loop berdasarkan MASTER MESIN)
    // Hapus data lama (sisakan header)
    if (mttrSheet.getLastRow() > 1) {
      mttrSheet.deleteRows(2, mttrSheet.getLastRow() - 1);
    }
    
    const mttrData = [];
    
    // Loop mulai dari baris 1 (karena baris 0 adalah header)
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const idMesin = row[masterIdIdx];
      const namaMesin = row[masterNamaIdx];
      
      // Cek apakah mesin ini punya history breakdown?
      // Jika tidak ada, default nilainya 0
      const stats = breakdownStats[idMesin] || { total_breakdown: 0, total_repair_time: 0 };
      
      const totalBreakdown = stats.total_breakdown;
      const totalRepairTime = stats.total_repair_time;
      
      // Rumus MTTR: Total Repair Time / Jumlah Breakdown
      const mttrHours = totalBreakdown > 0 ? totalRepairTime / totalBreakdown : 0;
      const mttrDays = mttrHours / 24;
      
      mttrData.push([
        idMesin,
        namaMesin,
        totalBreakdown,
        totalRepairTime,
        mttrHours,
        mttrDays
      ]);
    }
    
    // 6. Tulis ke Sheet
    if (mttrData.length > 0) {
      mttrSheet.getRange(2, 1, mttrData.length, 6).setValues(mttrData);
      
      // FORMATTING (Optional: Biar rapi 2 desimal)
      // Kolom 4 (Repair Time), 5 (MTTR Hours), 6 (MTTR Days)
      mttrSheet.getRange(2, 4, mttrData.length, 3).setNumberFormat("#,##0.00");
    }
    
  } catch (error) {
    Logger.log('Error updating MTTR dashboard: ' + error.toString());
  }
}

function updateMTBFDashboard() {
  try {
    const masterSheet = getSheet(SHEET_NAMES.MASTER);
    const breakdownSheet = getSheet(SHEET_NAMES.BREAKDOWN);
    const mtbfSheet = getSheet(SHEET_NAMES.MTBF);
    
    if (!masterSheet || !breakdownSheet || !mtbfSheet) return;
    
    const masterData = masterSheet.getDataRange().getValues();
    const breakdownData = breakdownSheet.getDataRange().getValues();
    
    const masterHeaders = masterData[0];
    const breakdownHeaders = breakdownData[0];
    
    const masterIdIdx = masterHeaders.indexOf('id_mesin');
    const masterNamaIdx = masterHeaders.indexOf('nama_mesin');
    const masterTanggalIdx = masterHeaders.indexOf('tanggal_instalasi');
    
    const breakdownIdIdx = breakdownHeaders.indexOf('id_mesin');
    const downtimeIdx = breakdownHeaders.indexOf('total_downtime'); // Ambil kolom downtime
    
    // 1. Hitung Breakdown Count & Total Downtime per Mesin
    const machineStats = {};
    for (let i = 1; i < breakdownData.length; i++) {
      const row = breakdownData[i];
      const idMesin = row[breakdownIdIdx];
      const downtime = parseFloat(row[downtimeIdx]) || 0;
      
      if (!machineStats[idMesin]) {
        machineStats[idMesin] = { count: 0, totalDowntime: 0 };
      }
      machineStats[idMesin].count += 1;
      machineStats[idMesin].totalDowntime += downtime;
    }
    
    if (mtbfSheet.getLastRow() > 1) {
      mtbfSheet.deleteRows(2, mtbfSheet.getLastRow() - 1);
    }
    
    const mtbfData = [];
    const today = new Date();
    
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const idMesin = row[masterIdIdx];
      const namaMesin = row[masterNamaIdx];
      const tanggalInstalasi = new Date(row[masterTanggalIdx]);
      
      const stats = machineStats[idMesin] || { count: 0, totalDowntime: 0 };
      const totalBreakdown = stats.count;
      const totalDowntimeHours = stats.totalDowntime;
      
      // 2. PERBAIKAN: Hitung langsung ke JAM (Presisi tinggi), jangan di-floor ke hari
      const diffMs = today - tanggalInstalasi;
      const totalCalendarHours = diffMs / (1000 * 60 * 60); 
      
      // 3. PERBAIKAN RUMUS: MTBF = (Total Time - Downtime) / Frekuensi
      // Jika ingin MTBF murni berdasarkan Uptime:
      const totalUptimeHours = Math.max(0, totalCalendarHours - totalDowntimeHours);
      
      let mtbfHours = 0;
      if (totalBreakdown > 0) {
        mtbfHours = totalUptimeHours / totalBreakdown;
      } else {
        mtbfHours = totalUptimeHours; // Jika belum pernah rusak, MTBF = Umur mesin
      }
      
      const mtbfDays = mtbfHours / 24; // Konversi balik ke hari untuk display saja
      
      // Tampilkan Operating Days (Display purpose only)
      const operatingDaysDisplay = totalCalendarHours / 24; 

      mtbfData.push([
        idMesin,
        namaMesin,
        tanggalInstalasi,
        totalBreakdown,
        operatingDaysDisplay, // Ini sekarang akan desimal (cth: 346.9)
        mtbfDays,
        mtbfHours
      ]);
    }
    
    if (mtbfData.length > 0) {
      mtbfSheet.getRange(2, 1, mtbfData.length, 7).setValues(mtbfData);
    }
  } catch (error) {
    Logger.log('Error updating MTBF dashboard: ' + error.toString());
  }
}

function updateAvailabilityDashboard() {
  try {
    const masterSheet = getSheet(SHEET_NAMES.MASTER);
    const breakdownSheet = getSheet(SHEET_NAMES.BREAKDOWN);
    const availabilitySheet = getSheet(SHEET_NAMES.AVAILABILITY);
    
    if (!masterSheet || !breakdownSheet || !availabilitySheet) {
      Logger.log('Sheet tidak ditemukan');
      return;
    }
    
    const masterData = masterSheet.getDataRange().getValues();
    const breakdownData = breakdownSheet.getDataRange().getValues();
    
    const masterHeaders = masterData[0];
    const breakdownHeaders = breakdownData[0];
    
    // Index kolom Master
    const masterIdIdx = masterHeaders.indexOf('id_mesin');
    const masterTanggalIdx = masterHeaders.indexOf('tanggal_instalasi');
    
    // Index kolom Breakdown
    const breakdownIdIdx = breakdownHeaders.indexOf('id_mesin');
    const downtimeIdx = breakdownHeaders.indexOf('total_downtime');
    
    // Hitung total downtime per mesin
    const downtimeByMesin = {};
    for (let i = 1; i < breakdownData.length; i++) {
      const row = breakdownData[i];
      const idMesin = row[breakdownIdIdx];
      const downtime = parseFloat(row[downtimeIdx]) || 0;
      
      if (!downtimeByMesin[idMesin]) {
        downtimeByMesin[idMesin] = 0;
      }
      downtimeByMesin[idMesin] += downtime;
    }
    
    // Clear existing data (keep headers)
    if (availabilitySheet.getLastRow() > 1) {
      availabilitySheet.deleteRows(2, availabilitySheet.getLastRow() - 1);
    }
    
    const availabilityData = [];
    const today = new Date();
    
    // Hitung availability per mesin
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const idMesin = row[masterIdIdx];
      const tanggalInstalasi = new Date(row[masterTanggalIdx]);
      
      // Hitung total operating hours (dari instalasi sampai sekarang)
      const diffMs = today - tanggalInstalasi;
      const totalOperatingHours = diffMs / (1000 * 60 * 60); // Convert to hours
      
      // Total downtime hours dari breakdown
      const totalDowntimeHours = downtimeByMesin[idMesin] || 0;
      
      // Uptime hours = Total operating - Downtime
      const uptimeHours = Math.max(0, totalOperatingHours - totalDowntimeHours);
      
      // Availability percentage
      const availabilityPercentage = totalOperatingHours > 0 
        ? (uptimeHours / totalOperatingHours) * 100 
        : 100;
      
      availabilityData.push([
        idMesin,
        totalOperatingHours,
        totalDowntimeHours,
        uptimeHours,
        availabilityPercentage
      ]);
    }
    
    // Write data to sheet
    if (availabilityData.length > 0) {
      availabilitySheet.getRange(2, 1, availabilityData.length, 5).setValues(availabilityData);
    }
    
    Logger.log('Availability dashboard updated successfully');
  } catch (error) {
    Logger.log('Error updating Availability dashboard: ' + error.toString());
  }
}

function getAvailabilityDashboard() {
  try {
    const sheet = getSheet(SHEET_NAMES.AVAILABILITY);
    if (!sheet) {
      return { status: 'error', message: 'Sheet Availability_Mesin tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { status: 'success', data: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getMTTRDashboard() {
  try {
    const sheet = getSheet(SHEET_NAMES.MTTR);
    if (!sheet) {
      return { status: 'error', message: 'Sheet Dashboard_MTTR tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { status: 'success', data: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getMTBFDashboard() {
  try {
    const sheet = getSheet(SHEET_NAMES.MTBF);
    if (!sheet) {
      return { status: 'error', message: 'Sheet Dashboard_MTBF tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { status: 'success', data: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// ==========================================
// TRIGGER FUNCTION
// ==========================================

function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    
    if (sheet.getName() === SHEET_NAMES.BREAKDOWN) {
      updateMTTRDashboard();
      updateMTBFDashboard();
      updateAvailabilityDashboard();  // ✅ BARU
    }
  } catch (error) {
    Logger.log('Error in onEdit trigger: ' + error.toString());
  }
}

// ==========================================
// ✅ MANUAL UPDATE FUNCTION - BONUS
// ==========================================

function updateAllDashboards() {
  updateMTTRDashboard();
  updateMTBFDashboard();
  updateAvailabilityDashboard();
  Logger.log('All dashboards updated successfully!');
}