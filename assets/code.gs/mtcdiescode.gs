// ==========================================
// CONFIGURATION
// ==========================================
const SHEET_NAMES = {
  MASTER: 'Master_Dies',
  BREAKDOWN: 'Data_Breakdown',
  MTTR: 'Dashboard_MTTR',
  MTBF: 'Dashboard_MTBF',
  AVAILABILITY: 'Availability_Dies'
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function toRoman(num) {
  const romanNumerals = [
    { value: 12, numeral: 'XII' }, { value: 11, numeral: 'XI' },
    { value: 10, numeral: 'X' },  { value: 9,  numeral: 'IX' },
    { value: 8,  numeral: 'VIII' },{ value: 7,  numeral: 'VII' },
    { value: 6,  numeral: 'VI' }, { value: 5,  numeral: 'V' },
    { value: 4,  numeral: 'IV' }, { value: 3,  numeral: 'III' },
    { value: 2,  numeral: 'II' }, { value: 1,  numeral: 'I' }
  ];
  for (let i = 0; i < romanNumerals.length; i++) {
    if (num === romanNumerals[i].value) return romanNumerals[i].numeral;
  }
  return 'I';
}

function generateNoLKD(userNumber, breakdownDate) {
  const date = new Date(breakdownDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().slice(-2);
  const romanMonth = toRoman(month);
  const paddedNumber = userNumber.toString().padStart(3, '0');
  return `${paddedNumber}/LKD/MTC/KMI/${romanMonth}/${year}`;
}

/**
 * Google Sheets kadang return waktu sebagai Date object (base 1899-12-30).
 * Fungsi ini handle kedua format: string maupun Date object.
 */
function extractTimeString(timeInput) {
  if (!timeInput) return '00:00';
  if (timeInput instanceof Date) {
    const h = timeInput.getHours().toString().padStart(2, '0');
    const m = timeInput.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  const str = timeInput.toString().trim();
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return str;
}

function calculateTimeDiff(startDate, startTime, endDate, endTime) {
  try {
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    const endDateStr = new Date(endDate).toISOString().split('T')[0];
    const cleanStartTime = extractTimeString(startTime);
    const cleanEndTime = extractTimeString(endTime);

    const start = new Date(`${startDateStr}T${cleanStartTime}:00`);
    const end = new Date(`${endDateStr}T${cleanEndTime}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffHours = (end - start) / (1000 * 60 * 60);
    return Math.max(0, parseFloat(diffHours.toFixed(2)));
  } catch (e) {
    Logger.log('calculateTimeDiff error: ' + e.toString());
    return 0;
  }
}

function getStatusBreakdown(repairTimeHours) {
  const h = parseFloat(repairTimeHours) || 0;
  if (h < 1) return 'Ringan';
  if (h < 3) return 'Sedang';
  return 'Berat';
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

// ==========================================
// MAIN API HANDLERS
// ==========================================

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'getMasterDies':            result = getMasterDies(); break;
      case 'getBreakdownData':         result = getBreakdownData(); break;
      case 'getMTTRDashboard':         result = getMTTRDashboard(); break;
      case 'getMTBFDashboard':         result = getMTBFDashboard(); break;
      case 'getAvailabilityDashboard': result = getAvailabilityDashboard(); break;
      case 'getLastNoLKD':             result = getLastNoLKD(); break;
      default: result = { status: 'error', message: 'Invalid action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString(), stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = e.parameter;
    const action = data.action;
    let result;

    switch (action) {
      case 'addBreakdown':    result = addBreakdown(data); break;
      case 'updateBreakdown': result = updateBreakdown(data); break;
      case 'deleteBreakdown': result = deleteBreakdown(data); break;
      default: result = { status: 'error', message: 'Invalid action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString(), stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

function getMasterDies() {
  try {
    const sheet = getSheet(SHEET_NAMES.MASTER);
    if (!sheet) return { status: 'error', message: 'Sheet Master_Dies tidak ditemukan' };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', data: [] };

    const headers = data[0];
    const result = data.slice(1)
      .filter(row => row[0]) // Skip baris kosong
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });

    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getBreakdownData() {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) return { status: 'error', message: 'Sheet Data_Breakdown tidak ditemukan' };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', data: [] };

    const headers = data[0];
    const result = data.slice(1)
      .filter(row => row[0])
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });

    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getLastNoLKD() {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) return { status: 'success', lastNumber: '000', suggestedNumber: '001' };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', lastNumber: '000', suggestedNumber: '001' };

    const noLkdColumn = data[0].indexOf('no_lkd');
    const allNumbers = [];

    for (let i = 1; i < data.length; i++) {
      const noLkd = data[i][noLkdColumn];
      if (noLkd) {
        const num = parseInt(noLkd.toString().split('/')[0]);
        if (!isNaN(num)) allNumbers.push(num);
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
    if (!sheet) return { status: 'error', message: 'Sheet Data_Breakdown tidak ditemukan' };

    const existingData = sheet.getDataRange().getValues();
    const headers = existingData[0];
    const noLkdColumn = headers.indexOf('no_lkd');

    // Generate & cek duplikat No LKD
    const fullNoLKD = generateNoLKD(data.no_lkd_number, data.tanggal_breakdown);
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][noLkdColumn] === fullNoLKD) {
        return { status: 'error', message: 'No LKD sudah ada, gunakan nomor lain!' };
      }
    }

    // Hitung waktu
    const repairTime = calculateTimeDiff(
      data.tanggal_mulai_perbaikan, data.jam_mulai_perbaikan,
      data.tanggal_selesai_perbaikan, data.jam_selesai_perbaikan
    );
    const totalDowntime = calculateTimeDiff(
      data.tanggal_breakdown, data.jam_breakdown,
      data.tanggal_selesai_perbaikan, data.jam_selesai_perbaikan
    );
    const statusBreakdown = getStatusBreakdown(repairTime);

    // ⭐ Build row dinamis sesuai urutan header sheet (anti-misalignment)
    const dataMap = {
      no_lkd:                    fullNoLKD,
      id_dies:                   data.id_dies || '',
      nama_dies:                 data.nama_dies || '',
      id_proses:                 data.id_proses || '',
      nama_proses:               data.nama_proses || '',
      id_cust:                   data.id_cust || '',
      tanggal_breakdown:         data.tanggal_breakdown || '',
      jam_breakdown:             extractTimeString(data.jam_breakdown),
      tanggal_mulai_perbaikan:   data.tanggal_mulai_perbaikan || '',
      jam_mulai_perbaikan:       extractTimeString(data.jam_mulai_perbaikan),
      tanggal_selesai_perbaikan: data.tanggal_selesai_perbaikan || '',
      jam_selesai_perbaikan:     extractTimeString(data.jam_selesai_perbaikan),
      problem_dies:              data.problem_dies || '',
      penyebab_breakdown:        data.penyebab_breakdown || '',
      tindakan_perbaikan:        data.tindakan_perbaikan || '',
      status_breakdown:          statusBreakdown,
      pic_maintenance:           data.pic_maintenance || '',
      repair_time:               repairTime,
      total_downtime:            totalDowntime
    };

    const rowData = headers.map(h => (dataMap[h] !== undefined ? dataMap[h] : ''));
    sheet.appendRow(rowData);

    updateMTTRDashboard();
    updateMTBFDashboard();
    updateAvailabilityDashboard();

    return {
      status: 'success',
      message: 'Data breakdown berhasil ditambahkan',
      data: { no_lkd: fullNoLKD, repair_time: repairTime, total_downtime: totalDowntime, status_breakdown: statusBreakdown }
    };
  } catch (error) {
    Logger.log('addBreakdown error: ' + error.toString());
    return { status: 'error', message: error.toString() };
  }
}

function updateBreakdown(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) return { status: 'error', message: 'Sheet Data_Breakdown tidak ditemukan' };

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const noLkdIndex = headers.indexOf('no_lkd');

    // Cari baris yang mau diupdate
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][noLkdIndex] === data.no_lkd) {
        rowIndex = i + 1; // Sheet rows 1-indexed
        break;
      }
    }
    if (rowIndex === -1) return { status: 'error', message: 'Data tidak ditemukan' };

    // Hitung waktu
    const repairTime = calculateTimeDiff(
      data.tanggal_mulai_perbaikan, data.jam_mulai_perbaikan,
      data.tanggal_selesai_perbaikan, data.jam_selesai_perbaikan
    );
    const totalDowntime = calculateTimeDiff(
      data.tanggal_breakdown, data.jam_breakdown,
      data.tanggal_selesai_perbaikan, data.jam_selesai_perbaikan
    );
    const statusBreakdown = getStatusBreakdown(repairTime);

    // ⭐ Build row dinamis sesuai urutan header sheet (anti-misalignment)
    const dataMap = {
      no_lkd:                    data.no_lkd,
      id_dies:                   data.id_dies || '',
      nama_dies:                 data.nama_dies || '',
      id_proses:                 data.id_proses || '',
      nama_proses:               data.nama_proses || '',
      id_cust:                   data.id_cust || '',
      tanggal_breakdown:         data.tanggal_breakdown || '',
      jam_breakdown:             extractTimeString(data.jam_breakdown),
      tanggal_mulai_perbaikan:   data.tanggal_mulai_perbaikan || '',
      jam_mulai_perbaikan:       extractTimeString(data.jam_mulai_perbaikan),
      tanggal_selesai_perbaikan: data.tanggal_selesai_perbaikan || '',
      jam_selesai_perbaikan:     extractTimeString(data.jam_selesai_perbaikan),
      problem_dies:              data.problem_dies || '',
      penyebab_breakdown:        data.penyebab_breakdown || '',
      tindakan_perbaikan:        data.tindakan_perbaikan || '',
      status_breakdown:          statusBreakdown,
      pic_maintenance:           data.pic_maintenance || '',
      repair_time:               repairTime,
      total_downtime:            totalDowntime
    };

    const rowData = headers.map(h => (dataMap[h] !== undefined ? dataMap[h] : ''));
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);

    updateMTTRDashboard();
    updateMTBFDashboard();
    updateAvailabilityDashboard();

    return {
      status: 'success',
      message: 'Data breakdown berhasil diupdate',
      data: { no_lkd: data.no_lkd, repair_time: repairTime, total_downtime: totalDowntime, status_breakdown: statusBreakdown }
    };
  } catch (error) {
    Logger.log('updateBreakdown error: ' + error.toString());
    return { status: 'error', message: error.toString() };
  }
}

function deleteBreakdown(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.BREAKDOWN);
    if (!sheet) return { status: 'error', message: 'Sheet Data_Breakdown tidak ditemukan' };

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const noLkdIndex = headers.indexOf('no_lkd');

    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][noLkdIndex] === data.no_lkd) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) return { status: 'error', message: 'Data tidak ditemukan' };

    sheet.deleteRow(rowIndex);

    updateMTTRDashboard();
    updateMTBFDashboard();
    updateAvailabilityDashboard();

    return { status: 'success', message: 'Data breakdown berhasil dihapus' };
  } catch (error) {
    Logger.log('deleteBreakdown error: ' + error.toString());
    return { status: 'error', message: error.toString() };
  }
}

// ==========================================
// DASHBOARD CALCULATIONS
// ==========================================

function updateMTTRDashboard() {
  try {
    const masterSheet = getSheet(SHEET_NAMES.MASTER);
    const breakdownSheet = getSheet(SHEET_NAMES.BREAKDOWN);
    const mttrSheet = getSheet(SHEET_NAMES.MTTR);

    if (!masterSheet || !breakdownSheet || !mttrSheet) return;

    const masterData = masterSheet.getDataRange().getValues();
    const breakdownData = breakdownSheet.getDataRange().getValues();

    const masterHeaders = masterData[0];
    const breakdownHeaders = breakdownData[0];

    // Index kolom Master
    const masterIdDiesIdx   = masterHeaders.indexOf('id_dies');
    const masterNamaDiesIdx = masterHeaders.indexOf('nama_dies');
    const masterIdProsesIdx = masterHeaders.indexOf('id_proses');
    const masterNamaProsesIdx = masterHeaders.indexOf('nama_proses');
    const masterIdCustIdx   = masterHeaders.indexOf('id_cust');

    // Index kolom Breakdown
    const brIdDiesIdx    = breakdownHeaders.indexOf('id_dies');
    const brIdProsesIdx  = breakdownHeaders.indexOf('id_proses');
    const brRepairTimeIdx = breakdownHeaders.indexOf('repair_time');

    // Agregasi: total breakdown + repair time per dies+proses
    const breakdownStats = {};
    for (let i = 1; i < breakdownData.length; i++) {
      const row = breakdownData[i];
      if (!row[brIdDiesIdx]) continue;

      // Key: kombinasi id_dies + id_proses (beda proses = beda entry)
      const key = `${row[brIdDiesIdx]}_${row[brIdProsesIdx] || ''}`;
      if (!breakdownStats[key]) breakdownStats[key] = { total_breakdown: 0, total_repair_time: 0 };

      breakdownStats[key].total_breakdown += 1;
      breakdownStats[key].total_repair_time += parseFloat(row[brRepairTimeIdx]) || 0;
    }

    // ⭐ Safe delete: hanya hapus kalau ada data
    if (mttrSheet.getLastRow() > 1) {
      mttrSheet.deleteRows(2, mttrSheet.getLastRow() - 1);
    }

    // Ambil header sheet MTTR untuk build row dinamis
    const mttrHeaders = mttrSheet.getRange(1, 1, 1, mttrSheet.getLastColumn()).getValues()[0];
    const mttrData = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      if (!row[masterIdDiesIdx]) continue;

      const idDies    = row[masterIdDiesIdx];
      const idProses  = row[masterIdProsesIdx] || '';
      const key       = `${idDies}_${idProses}`;
      const stats     = breakdownStats[key] || { total_breakdown: 0, total_repair_time: 0 };

      const mttrHours = stats.total_breakdown > 0
        ? stats.total_repair_time / stats.total_breakdown
        : 0;

      const dataMap = {
        id_cust:          row[masterIdCustIdx] || '',
        id_dies:          idDies,
        nama_dies:        row[masterNamaDiesIdx] || '',
        id_proses:        idProses,
        nama_proses:      row[masterNamaProsesIdx] || '',
        total_breakdown:  stats.total_breakdown,
        total_repair_time: parseFloat(stats.total_repair_time.toFixed(2)),
        mttr_hours:       parseFloat(mttrHours.toFixed(2)),
        mttr_days:        parseFloat((mttrHours / 24).toFixed(4))
      };

      mttrData.push(mttrHeaders.map(h => (dataMap[h] !== undefined ? dataMap[h] : '')));
    }

    if (mttrData.length > 0) {
      mttrSheet.getRange(2, 1, mttrData.length, mttrHeaders.length).setValues(mttrData);
      mttrSheet.getRange(2, mttrHeaders.indexOf('total_repair_time') + 1, mttrData.length, 3)
               .setNumberFormat('#,##0.00');
    }

    Logger.log('MTTR dashboard updated: ' + mttrData.length + ' rows');
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

    // Index kolom Master
    const masterIdDiesIdx     = masterHeaders.indexOf('id_dies');
    const masterNamaDiesIdx   = masterHeaders.indexOf('nama_dies');
    const masterIdProsesIdx   = masterHeaders.indexOf('id_proses');
    const masterNamaProsesIdx = masterHeaders.indexOf('nama_proses');
    const masterIdCustIdx     = masterHeaders.indexOf('id_cust');
    const masterTanggalIdx    = masterHeaders.indexOf('tanggal_pembuatan');

    // Index kolom Breakdown
    const brIdDiesIdx   = breakdownHeaders.indexOf('id_dies');
    const brIdProsesIdx = breakdownHeaders.indexOf('id_proses');
    const brDowntimeIdx = breakdownHeaders.indexOf('total_downtime');

    // Agregasi: count + total downtime per dies+proses
    const diesStats = {};
    for (let i = 1; i < breakdownData.length; i++) {
      const row = breakdownData[i];
      if (!row[brIdDiesIdx]) continue;

      const key = `${row[brIdDiesIdx]}_${row[brIdProsesIdx] || ''}`;
      if (!diesStats[key]) diesStats[key] = { count: 0, totalDowntime: 0 };

      diesStats[key].count += 1;
      diesStats[key].totalDowntime += parseFloat(row[brDowntimeIdx]) || 0;
    }

    // ⭐ Safe delete
    if (mtbfSheet.getLastRow() > 1) {
      mtbfSheet.deleteRows(2, mtbfSheet.getLastRow() - 1);
    }

    const mtbfHeaders = mtbfSheet.getRange(1, 1, 1, mtbfSheet.getLastColumn()).getValues()[0];
    const mtbfData = [];
    const today = new Date();

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      if (!row[masterIdDiesIdx]) continue;

      const idDies   = row[masterIdDiesIdx];
      const idProses = row[masterIdProsesIdx] || '';
      const key      = `${idDies}_${idProses}`;
      const stats    = diesStats[key] || { count: 0, totalDowntime: 0 };

      // ⭐ Safe date parse: fallback ke today kalau kosong/invalid
      let tanggalPembuatan;
      try {
        tanggalPembuatan = new Date(row[masterTanggalIdx]);
        if (isNaN(tanggalPembuatan.getTime())) tanggalPembuatan = new Date();
      } catch (_) { tanggalPembuatan = new Date(); }

      const totalCalendarHours = (today - tanggalPembuatan) / (1000 * 60 * 60);
      const uptimeHours = Math.max(0, totalCalendarHours - stats.totalDowntime);
      const mtbfHours = stats.count > 0 ? uptimeHours / stats.count : uptimeHours;

      const dataMap = {
        id_cust:          row[masterIdCustIdx] || '',
        id_dies:          idDies,
        nama_dies:        row[masterNamaDiesIdx] || '',
        id_proses:        idProses,
        nama_proses:      row[masterNamaProsesIdx] || '',
        tanggal_pembuatan: tanggalPembuatan,
        total_breakdown:  stats.count,
        operating_days:   parseFloat((totalCalendarHours / 24).toFixed(2)),
        mtbf_days:        parseFloat((mtbfHours / 24).toFixed(4)),
        mtbf_hours:       parseFloat(mtbfHours.toFixed(2))
      };

      mtbfData.push(mtbfHeaders.map(h => (dataMap[h] !== undefined ? dataMap[h] : '')));
    }

    if (mtbfData.length > 0) {
      mtbfSheet.getRange(2, 1, mtbfData.length, mtbfHeaders.length).setValues(mtbfData);
    }

    Logger.log('MTBF dashboard updated: ' + mtbfData.length + ' rows');
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
    const masterIdDiesIdx     = masterHeaders.indexOf('id_dies');
    const masterNamaDiesIdx   = masterHeaders.indexOf('nama_dies');
    const masterIdProsesIdx   = masterHeaders.indexOf('id_proses');
    const masterNamaProsesIdx = masterHeaders.indexOf('nama_proses');
    const masterIdCustIdx     = masterHeaders.indexOf('id_cust');
    const masterTanggalIdx    = masterHeaders.indexOf('tanggal_pembuatan');

    // Index kolom Breakdown
    const brIdDiesIdx   = breakdownHeaders.indexOf('id_dies');
    const brIdProsesIdx = breakdownHeaders.indexOf('id_proses');
    const brDowntimeIdx = breakdownHeaders.indexOf('total_downtime');

    // Hitung total downtime per dies+proses
    const downtimeByKey = {};
    for (let i = 1; i < breakdownData.length; i++) {
      const row = breakdownData[i];
      if (!row[brIdDiesIdx]) continue;

      const key = `${row[brIdDiesIdx]}_${row[brIdProsesIdx] || ''}`;
      downtimeByKey[key] = (downtimeByKey[key] || 0) + (parseFloat(row[brDowntimeIdx]) || 0);
    }

    // ⭐ Safe delete
    if (availabilitySheet.getLastRow() > 1) {
      availabilitySheet.deleteRows(2, availabilitySheet.getLastRow() - 1);
    }

    const availHeaders = availabilitySheet.getRange(1, 1, 1, availabilitySheet.getLastColumn()).getValues()[0];
    const availabilityData = [];
    const today = new Date();

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      if (!row[masterIdDiesIdx]) continue;

      const idDies   = row[masterIdDiesIdx];
      const idProses = row[masterIdProsesIdx] || '';
      const key      = `${idDies}_${idProses}`;

      // ⭐ Safe date parse
      let tanggalPembuatan;
      try {
        tanggalPembuatan = new Date(row[masterTanggalIdx]);
        if (isNaN(tanggalPembuatan.getTime())) tanggalPembuatan = new Date();
      } catch (_) { tanggalPembuatan = new Date(); }

      const totalOperatingHours = Math.max(0, (today - tanggalPembuatan) / (1000 * 60 * 60));
      const totalDowntimeHours  = downtimeByKey[key] || 0;
      const uptimeHours         = Math.max(0, totalOperatingHours - totalDowntimeHours);
      const availabilityPct     = totalOperatingHours > 0
        ? parseFloat(((uptimeHours / totalOperatingHours) * 100).toFixed(2))
        : 100;

      const dataMap = {
        id_cust:                  row[masterIdCustIdx] || '',
        id_dies:                  idDies,
        nama_dies:                row[masterNamaDiesIdx] || '',
        id_proses:                idProses,
        nama_proses:              row[masterNamaProsesIdx] || '',
        total_operating_hours:    parseFloat(totalOperatingHours.toFixed(2)),
        total_downtime_hours:     parseFloat(totalDowntimeHours.toFixed(2)),
        uptime_hours:             parseFloat(uptimeHours.toFixed(2)),
        availability_percentage:  availabilityPct
      };

      availabilityData.push(availHeaders.map(h => (dataMap[h] !== undefined ? dataMap[h] : '')));
    }

    if (availabilityData.length > 0) {
      availabilitySheet.getRange(2, 1, availabilityData.length, availHeaders.length).setValues(availabilityData);
    }

    Logger.log('Availability dashboard updated: ' + availabilityData.length + ' rows');
  } catch (error) {
    Logger.log('Error updating Availability dashboard: ' + error.toString());
  }
}

// ==========================================
// DASHBOARD GET FUNCTIONS
// ==========================================

function _getDashboardData(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    if (!sheet) return { status: 'error', message: `Sheet ${sheetName} tidak ditemukan` };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: 'success', data: [] };

    const headers = data[0];
    const result = data.slice(1)
      .filter(row => row[0])
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });

    return { status: 'success', data: result };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getMTTRDashboard()         { return _getDashboardData(SHEET_NAMES.MTTR); }
function getMTBFDashboard()         { return _getDashboardData(SHEET_NAMES.MTBF); }
function getAvailabilityDashboard() { return _getDashboardData(SHEET_NAMES.AVAILABILITY); }

// ==========================================
// TRIGGER FUNCTION
// ==========================================

function onEdit(e) {
  try {
    const sheetName = e.source.getActiveSheet().getName();
    if (sheetName === SHEET_NAMES.BREAKDOWN || sheetName === SHEET_NAMES.MASTER) {
      updateMTTRDashboard();
      updateMTBFDashboard();
      updateAvailabilityDashboard();
    }
  } catch (error) {
    Logger.log('Error in onEdit trigger: ' + error.toString());
  }
}

// ==========================================
// MANUAL UPDATE FUNCTION
// ==========================================

function updateAllDashboards() {
  updateMTTRDashboard();
  updateMTBFDashboard();
  updateAvailabilityDashboard();
  Logger.log('All dashboards updated successfully!');
}