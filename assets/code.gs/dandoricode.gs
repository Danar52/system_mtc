// ========================================
// DANDORI SYSTEM - VERSION 2.5
// Upgrade: Tambah kolom C (month) dan D (week)
// Total: 16 kolom di db_rincian
// ========================================

// --- CONFIGURATION ---
const CONFIG = {
  SHEETS: {
    MASTER_MESIN    : 'master_mesin',
    MASTER_DIES     : 'master_dies',
    MASTER_LOSSTIME : 'master_losstime',
    TRANSAKSI       : 'transaksi_dandori',
    DB_RINCIAN      : 'db_rincian'
  },
  COLUMNS: {
    MESIN     : 4,
    DIES      : 5,
    LOSSTIME  : 3,
    TRANSAKSI : 13,
    RINCIAN   : 16  // ✅ UPGRADED: 14 -> 16 kolom
  },
  CACHE_DURATION: 300,

  // Standard time untuk kalkulasi menit_over
  STANDARD_TIME: {
    SETTING_DIES_PROGRESSIVE : 15,
    SETTING_DIES_DEFAULT     : 10,
    TRIAL_QC                 : 5
  },

  // Abbreviasi bulan
  MONTH_ABBR: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
};

// ========================================
// STRUKTUR db_rincian v2.5 (16 KOLOM)
// ========================================
// A  - timestamp    : Waktu data diinput ke sistem
// B  - tanggal      : Tanggal produksi (pilihan user)
// C  - month        : ✅ BARU - Bulan singkatan (Jan, Feb, ...)
// D  - week         : ✅ BARU - Minggu dalam bulan (WEEK 1 - WEEK 5)
// E  - shift        : Shift (1/2/3)
// F  - operator     : Nama operator
// G  - line         : Line produksi
// H  - nama_mesin   : Nama mesin
// I  - part_name    : Nama part
// J  - part_no      : Nomor part
// K  - id_proses    : ID proses dandori
// L  - nama_proses  : Nama proses dandori
// M  - kode_loss    : Kode loss time
// N  - jenis_loss   : Jenis loss
// O  - menit_loss   : Durasi loss aktual (menit)
// P  - menit_over   : Menit loss di luar standar

// ========================================
// WEEK LOGIC:
// Tgl  1 -  7 → WEEK 1
// Tgl  8 - 14 → WEEK 2
// Tgl 15 - 21 → WEEK 3
// Tgl 22 - 28 → WEEK 4
// Tgl 29 - 31 → WEEK 5
// ========================================

// ========================================
// HELPER: AMBIL BULAN SINGKATAN
// ========================================

function getMonthAbbr(tanggal) {
  try {
    const date = tanggal instanceof Date ? tanggal : new Date(tanggal);
    return CONFIG.MONTH_ABBR[date.getMonth()]; // getMonth() return 0-11
  } catch (e) {
    Logger.log('⚠️ Error getMonthAbbr: ' + e);
    return '-';
  }
}

// ========================================
// HELPER: AMBIL WEEK OF MONTH
// ========================================

function getWeekOfMonth(tanggal) {
  try {
    const date = tanggal instanceof Date ? tanggal : new Date(tanggal);
    const day  = date.getDate(); // 1-31

    if (day <= 7)  return 'WEEK 1';
    if (day <= 14) return 'WEEK 2';
    if (day <= 21) return 'WEEK 3';
    if (day <= 28) return 'WEEK 4';
    return 'WEEK 5';
  } catch (e) {
    Logger.log('⚠️ Error getWeekOfMonth: ' + e);
    return '-';
  }
}

// ========================================
// HELPER: HITUNG MENIT_OVER
// ========================================

function hitungMenitOver(jenisLoss, namaProses, menitLoss) {
  const menit = parseInt(menitLoss || 0);

  if (jenisLoss === 'Setting_Dies') {
    const isProgressive = namaProses && namaProses.toString().toUpperCase() === 'PROGRESSIVE';
    const standard      = isProgressive
      ? CONFIG.STANDARD_TIME.SETTING_DIES_PROGRESSIVE  // 15
      : CONFIG.STANDARD_TIME.SETTING_DIES_DEFAULT;     // 10
    return Math.max(menit - standard, 0);
  }

  if (jenisLoss === 'Trial_QC') {
    return Math.max(menit - CONFIG.STANDARD_TIME.TRIAL_QC, 0); // 5
  }

  // Jenis lain (Tunggu_Dies, Tunggu_Material, dll) → as-is
  return menit;
}

// ========================================
// API ENDPOINTS
// ========================================

function doGet(e) {
  try {
    const action = e.parameter.action;

    switch(action) {
      case 'getMaster':
        return sendJSON(getMasterDataCached());
      case 'getTransactions':
        const limit = parseInt(e.parameter.limit) || 100;
        return sendJSON(getRecentTransactions(limit));
      case 'getStats':
        return sendJSON(getDashboardStats());
      case 'getDashboardDandori':
        return sendJSON(getDashboardDandoriData());
      case 'health':
        return sendJSON({
          status    : 'OK',
          timestamp : new Date().toISOString(),
          version   : '2.5 - Added month & week columns'
        });
      default:
        return sendJSON({
          status   : 'OK',
          message  : 'Dandori System API v2.5',
          endpoints: ['getMaster', 'getTransactions', 'getStats', 'health']
        });
    }
  } catch (error) {
    Logger.log('doGet Error: ' + error);
    return sendJSON({ status: 'ERROR', message: error.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const data = JSON.parse(e.postData.contents);

    const validation = validateFormData(data);
    if (!validation.isValid) {
      return sendJSON({
        status  : 'ERROR',
        message : 'Validasi gagal: ' + validation.errors.join(', ')
      });
    }

    const result = submitDandoriTransaction(data);

    if (result.status === 'SUCCESS') {
      const rincianResult = updateRincianRealtime(result.rowId, data);

      if (rincianResult.success) {
        result.rincian_updated = true;
        result.rincian_count   = rincianResult.count;
        Logger.log('✅ Real-time update SUCCESS: ' + rincianResult.count + ' items');
      } else {
        result.rincian_updated = false;
        result.rincian_error   = rincianResult.error;
        Logger.log('⚠️ Real-time update FAILED: ' + rincianResult.error);
      }
    }

    return sendJSON(result);

  } catch (error) {
    Logger.log('❌ doPost Error: ' + error);
    return sendJSON({ status: 'ERROR', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function sendJSON(content) {
  return ContentService
    .createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" tidak ditemukan`);
  return sheet;
}

// ========================================
// DATA VALIDATION
// ========================================

function validateFormData(data) {
  const errors = [];

  const requiredFields = [
    'tanggal', 'shift', 'operator', 'nama_mesin',
    'part_name', 'id_proses', 'rincian_detail'
  ];

  requiredFields.forEach(field => {
    if (!data[field]) errors.push(`Field "${field}" harus diisi`);
  });

  if (data.shift && ![1, 2, 3, '1', '2', '3'].includes(data.shift)) {
    errors.push('Shift harus antara 1-3');
  }

  if (data.rincian_detail) {
    if (!Array.isArray(data.rincian_detail)) {
      errors.push('Rincian detail harus berupa array');
    } else if (data.rincian_detail.length === 0) {
      errors.push('Minimal harus ada 1 aktivitas');
    } else {
      data.rincian_detail.forEach((item, idx) => {
        if (!item.kode || !item.menit)
          errors.push(`Rincian item ${idx + 1}: Kode dan Menit harus diisi`);
      });
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ========================================
// MASTER DATA WITH CACHING
// ========================================

function getMasterDataCached() {
  const cache    = CacheService.getScriptCache();
  const cacheKey = 'master_data';
  const cached   = cache.get(cacheKey);

  if (cached) {
    Logger.log('Returning cached master data');
    return JSON.parse(cached);
  }

  const data = getMasterDataFresh();
  cache.put(cacheKey, JSON.stringify(data), CONFIG.CACHE_DURATION);
  return data;
}

function getMasterDataFresh() {
  const ss = getSpreadsheet();

  const getSheetData = (sheetName, colCount) => {
    try {
      const sheet   = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return [];
      return sheet.getRange(2, 1, lastRow - 1, colCount).getValues();
    } catch (error) {
      Logger.log(`Error loading ${sheetName}: ${error}`);
      return [];
    }
  };

  return {
    mesin     : getSheetData(CONFIG.SHEETS.MASTER_MESIN, CONFIG.COLUMNS.MESIN),
    dies      : getSheetData(CONFIG.SHEETS.MASTER_DIES, CONFIG.COLUMNS.DIES),
    losstime  : getSheetData(CONFIG.SHEETS.MASTER_LOSSTIME, CONFIG.COLUMNS.LOSSTIME),
    timestamp : new Date().toISOString()
  };
}

function clearMasterCache() {
  CacheService.getScriptCache().remove('master_data');
  Logger.log('Master data cache cleared');
}

// ========================================
// TRANSACTION SUBMISSION
// ========================================

function submitDandoriTransaction(formData) {
  const sheet        = getSheet(CONFIG.SHEETS.TRANSAKSI);
  const rincianArray = formData.rincian_detail;

  let totalAktual = 0;
  rincianArray.forEach(item => { totalAktual += parseInt(item.menit || 0); });

  const stdTime = parseInt(formData.standard_time || 0);
  const status  = totalAktual > stdTime ? 'OVER' : 'OK';

  let tanggalInput;
  try {
    const parts  = formData.tanggal.split('-');
    tanggalInput = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(tanggalInput.getTime())) throw new Error('Invalid date');
  } catch (e) {
    Logger.log('⚠️ Error parsing date, using today: ' + e);
    tanggalInput = new Date();
  }

  const newRow = [
    tanggalInput,                   // A: Tanggal
    formData.shift,                 // B: Shift
    formData.nama_mesin,            // C: Nama Mesin
    formData.line || '-',           // D: Line
    formData.part_no || '-',        // E: Part No
    formData.part_name,             // F: Part Name
    formData.id_proses || '-',      // G: ID Proses
    formData.nama_proses || '-',    // H: Nama Proses
    totalAktual,                    // I: Total Aktual
    stdTime,                        // J: Standard Time
    status,                         // K: Status
    JSON.stringify(rincianArray),   // L: Rincian JSON
    formData.operator               // M: Operator
  ];

  sheet.appendRow(newRow);
  const rowId = sheet.getLastRow();

  return {
    status  : 'SUCCESS',
    message : `Data berhasil disimpan! Tanggal: ${formData.tanggal}, Total: ${totalAktual} Menit (${status})`,
    rowId   : rowId,
    data    : {
      tanggal       : formData.tanggal,
      total_aktual  : totalAktual,
      standard_time : stdTime,
      status        : status
    }
  };
}

// ========================================
// REAL-TIME RINCIAN UPDATE - v2.5
// ========================================

function updateRincianRealtime(rowId, formData) {
  Logger.log('🔄 updateRincianRealtime v2.5 for rowId: ' + rowId);

  try {
    const targetSheet   = getSheet(CONFIG.SHEETS.DB_RINCIAN);
    const sourceSheet   = getSheet(CONFIG.SHEETS.TRANSAKSI);
    const lossTimeSheet = getSheet(CONFIG.SHEETS.MASTER_LOSSTIME);

    const rowData = sourceSheet.getRange(rowId, 1, 1, CONFIG.COLUMNS.TRANSAKSI).getValues()[0];

    // Build loss map
    const lossTimeData = lossTimeSheet.getRange(2, 1, lossTimeSheet.getLastRow() - 1, 3).getValues();
    const lossMap = {};
    lossTimeData.forEach(row => { lossMap[row[0].toString()] = row[1]; });

    // Extract dari transaksi_dandori
    const tanggal    = rowData[0];   // A
    const shift      = rowData[1];   // B
    const namaMesin  = rowData[2];   // C
    const line       = rowData[3];   // D
    const partNo     = rowData[4];   // E
    const partName   = rowData[5];   // F
    const idProses   = rowData[6];   // G
    const namaProses = rowData[7];   // H
    const operator   = rowData[12];  // M

    // ✅ Hitung month & week dari tanggal
    const month = getMonthAbbr(tanggal);
    const week  = getWeekOfMonth(tanggal);

    const rincianArray = formData.rincian_detail;
    if (!rincianArray || !Array.isArray(rincianArray) || rincianArray.length === 0) {
      return { success: false, error: 'No rincian data', count: 0 };
    }

    const timestamp    = new Date();
    const unpackedData = [];

    rincianArray.forEach((item, index) => {
      const kodeLoss  = item.kode;
      const jenisLoss = lossMap[kodeLoss] || 'Unknown';
      const menitLoss = parseInt(item.menit || 0);
      const menitOver = hitungMenitOver(jenisLoss, namaProses, menitLoss);

      Logger.log(`  Item ${index + 1}: ${kodeLoss} | ${jenisLoss} | ${menitLoss} menit | over=${menitOver} | ${month} | ${week}`);

      unpackedData.push([
        timestamp,    // A: timestamp
        tanggal,      // B: tanggal
        month,        // C: month     ✅ BARU
        week,         // D: week      ✅ BARU
        shift,        // E: shift
        operator,     // F: operator
        line,         // G: line
        namaMesin,    // H: nama_mesin
        partName,     // I: part_name
        partNo,       // J: part_no
        idProses,     // K: id_proses
        namaProses,   // L: nama_proses
        kodeLoss,     // M: kode_loss
        jenisLoss,    // N: jenis_loss
        menitLoss,    // O: menit_loss
        menitOver     // P: menit_over
      ]);
    });

    const lastRow     = targetSheet.getLastRow();
    const targetRange = targetSheet.getRange(lastRow + 1, 1, unpackedData.length, 16);
    targetRange.setValues(unpackedData);
    SpreadsheetApp.flush();

    Logger.log('✅ Wrote ' + unpackedData.length + ' rows to db_rincian (16 kolom)');
    return { success: true, count: unpackedData.length, targetRow: lastRow + 1 };

  } catch (error) {
    Logger.log('❌ ERROR updateRincianRealtime: ' + error);
    return { success: false, error: error.toString(), count: 0 };
  }
}

// ========================================
// FULL REBUILD db_rincian - v2.5
// ========================================

function batchUpdateRincian() {
  Logger.log('🔄 Full rebuild db_rincian v2.5 (16 kolom)...');

  const sourceSheet   = getSheet(CONFIG.SHEETS.TRANSAKSI);
  const targetSheet   = getSheet(CONFIG.SHEETS.DB_RINCIAN);
  const lossTimeSheet = getSheet(CONFIG.SHEETS.MASTER_LOSSTIME);

  // Build loss map
  const lossTimeData = lossTimeSheet.getRange(2, 1, lossTimeSheet.getLastRow() - 1, 3).getValues();
  const lossMap = {};
  lossTimeData.forEach(row => { lossMap[row[0].toString()] = row[1]; });

  const lastRow = sourceSheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('Tidak ada data di transaksi_dandori');
    return { success: false, message: 'Tidak ada data transaksi' };
  }

  const data         = sourceSheet.getRange(2, 1, lastRow - 1, CONFIG.COLUMNS.TRANSAKSI).getValues();
  const unpackedData = [];
  const timestamp    = new Date();

  data.forEach((row, idx) => {
    const tanggal    = row[0];   // A
    const shift      = row[1];   // B
    const namaMesin  = row[2];   // C
    const line       = row[3];   // D
    const partNo     = row[4];   // E
    const partName   = row[5];   // F
    const idProses   = row[6];   // G
    const namaProses = row[7];   // H
    const operator   = row[12];  // M
    const jsonString = row[11];  // L

    // ✅ Hitung month & week dari tanggal
    const month = getMonthAbbr(tanggal);
    const week  = getWeekOfMonth(tanggal);

    if (jsonString && jsonString.toString().length > 2) {
      try {
        const rincianArr = JSON.parse(jsonString);

        rincianArr.forEach(item => {
          const kodeLoss  = item.kode;
          const jenisLoss = lossMap[kodeLoss] || 'Unknown';
          const menitLoss = parseInt(item.menit || 0);
          const menitOver = hitungMenitOver(jenisLoss, namaProses, menitLoss);

          unpackedData.push([
            timestamp,    // A: timestamp
            tanggal,      // B: tanggal
            month,        // C: month     ✅ BARU
            week,         // D: week      ✅ BARU
            shift,        // E: shift
            operator,     // F: operator
            line,         // G: line
            namaMesin,    // H: nama_mesin
            partName,     // I: part_name
            partNo,       // J: part_no
            idProses,     // K: id_proses
            namaProses,   // L: nama_proses
            kodeLoss,     // M: kode_loss
            jenisLoss,    // N: jenis_loss
            menitLoss,    // O: menit_loss
            menitOver     // P: menit_over
          ]);
        });
      } catch (e) {
        Logger.log(`⚠️ Error parsing JSON row ${idx + 2}: ${e}`);
      }
    }
  });

  // Clear semua data lama A2:P
  targetSheet.getRange('A2:P').clearContent();

  if (unpackedData.length > 0) {
    targetSheet.getRange(2, 1, unpackedData.length, 16).setValues(unpackedData);
    SpreadsheetApp.flush();
    Logger.log(`✅ Rebuild COMPLETE: ${unpackedData.length} baris, 16 kolom`);
    return { success: true, count: unpackedData.length };
  } else {
    Logger.log('⚠️ Tidak ada data rincian ditemukan');
    return { success: false, message: 'Tidak ada data rincian' };
  }
}

// ========================================
// UPDATE HEADER db_rincian - v2.5
// ========================================

function updateRincianHeaders() {
  const sheet   = getSheet(CONFIG.SHEETS.DB_RINCIAN);
  const headers = [
    'timestamp', 'tanggal',               // A, B
    'month', 'week',                       // C, D ✅ BARU
    'shift', 'operator',                   // E, F
    'line', 'nama_mesin',                  // G, H
    'part_name', 'part_no',               // I, J
    'id_proses', 'nama_proses',           // K, L
    'kode_loss', 'jenis_loss',            // M, N
    'menit_loss', 'menit_over'            // O, P
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  Logger.log('✅ Headers updated (16 kolom): ' + headers.join(' | '));
  return { success: true, headers };
}

// ========================================
// DASHBOARD DANDORI DATA
// ========================================

function getDashboardDandoriData() {
  try {
    const sheet   = getSheet(CONFIG.SHEETS.DB_RINCIAN);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { rows: [], meta: { mesin: [], months: [], weeks: [] } };

    const allData = sheet.getRange(2, 1, lastRow - 1, 16).getValues();

    const rows       = [];
    const mesinSet   = new Set();
    const monthSet   = new Set();
    const weekSet    = new Set();
    const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const WEEK_ORDER  = ['WEEK 1','WEEK 2','WEEK 3','WEEK 4','WEEK 5'];

    allData.forEach(row => {
      const tanggal   = row[1];   // B: tanggal
      const month     = row[2];   // C: month
      const week      = row[3];   // D: week
      const namaMesin = row[7];   // H: nama_mesin
      const jenisLoss = row[13];  // N: jenis_loss
      const menitLoss = parseFloat(row[14]) || 0; // O: menit_loss

      if (!tanggal || !namaMesin || menitLoss <= 0) return;

      let tanggalStr = '';
      if (tanggal instanceof Date) {
        const y = tanggal.getFullYear();
        const m = String(tanggal.getMonth() + 1).padStart(2, '0');
        const d = String(tanggal.getDate()).padStart(2, '0');
        tanggalStr = `${y}-${m}-${d}`;
      } else {
        tanggalStr = String(tanggal).substring(0, 10);
      }

      rows.push([tanggalStr, month || '', week || '', namaMesin, jenisLoss || 'Unknown', menitLoss]);

      if (namaMesin) mesinSet.add(namaMesin);
      if (month)     monthSet.add(month);
      if (week)      weekSet.add(week);
    });

    return {
      rows: rows,
      meta: {
        mesin  : Array.from(mesinSet).sort(),
        months : MONTH_ORDER.filter(m => monthSet.has(m)),
        weeks  : WEEK_ORDER.filter(w => weekSet.has(w))
      }
    };
  } catch (error) {
    Logger.log('getDashboardDandoriData error: ' + error);
    return { rows: [], meta: { mesin: [], months: [], weeks: [] }, error: error.toString() };
  }
}

// ========================================
// ADDITIONAL API ENDPOINTS
// ========================================

function getRecentTransactions(limit = 100) {
  try {
    const sheet   = getSheet(CONFIG.SHEETS.TRANSAKSI);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { data: [], count: 0 };

    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows  = lastRow - startRow + 1;
    const data     = sheet.getRange(startRow, 1, numRows, CONFIG.COLUMNS.TRANSAKSI).getValues();

    const formatted = data.map(row => ({
      tanggal       : row[0],
      shift         : row[1],
      mesin         : row[2],
      line          : row[3],
      part_no       : row[4],
      part_name     : row[5],
      id_proses     : row[6],
      nama_proses   : row[7],
      total_aktual  : row[8],
      standard_time : row[9],
      status        : row[10],
      operator      : row[12]
    }));

    return { data: formatted.reverse(), count: formatted.length };
  } catch (error) {
    return { data: [], count: 0, error: error.toString() };
  }
}

function getDashboardStats() {
  try {
    const sheet   = getSheet(CONFIG.SHEETS.TRANSAKSI);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { total_transactions: 0, ok_count: 0, over_count: 0 };

    const data = sheet.getRange(2, 1, lastRow - 1, CONFIG.COLUMNS.TRANSAKSI).getValues();
    let okCount = 0, overCount = 0, totalAktual = 0, totalStandard = 0;

    data.forEach(row => {
      if (row[10] === 'OK')   okCount++;
      if (row[10] === 'OVER') overCount++;
      totalAktual   += row[8] || 0;
      totalStandard += row[9] || 0;
    });

    return {
      total_transactions : data.length,
      ok_count           : okCount,
      over_count         : overCount,
      ok_percentage      : ((okCount / data.length) * 100).toFixed(2),
      avg_aktual         : (totalAktual / data.length).toFixed(2),
      avg_standard       : (totalStandard / data.length).toFixed(2)
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

// ========================================
// MANUAL TRIGGERS — URUTAN EKSEKUSI
// ========================================

// STEP 1: Update header (16 kolom)
function manualUpdateHeaders() {
  const result = updateRincianHeaders();
  Logger.log('✅ Headers: ' + JSON.stringify(result));
}

// STEP 2: Rebuild total db_rincian dengan struktur v2.5
function manualRebuildRincian() {
  const result = batchUpdateRincian();
  Logger.log('✅ Rebuild: ' + JSON.stringify(result));
}

function manualClearCache() {
  clearMasterCache();
  Logger.log('✅ Cache cleared');
}

// ========================================
// VERIFY & TEST
// ========================================

function verifyRincianStructure() {
  try {
    const sheet   = getSheet(CONFIG.SHEETS.DB_RINCIAN);
    const lastRow = sheet.getLastRow();

    Logger.log('📊 DB Rincian v2.5 — 16 kolom:');
    Logger.log('  A:timestamp  | B:tanggal');
    Logger.log('  C:month      | D:week');
    Logger.log('  E:shift      | F:operator');
    Logger.log('  G:line       | H:nama_mesin');
    Logger.log('  I:part_name  | J:part_no');
    Logger.log('  K:id_proses  | L:nama_proses');
    Logger.log('  M:kode_loss  | N:jenis_loss');
    Logger.log('  O:menit_loss | P:menit_over');
    Logger.log('  Last row: ' + lastRow);

    if (lastRow >= 2) {
      const s = sheet.getRange(2, 1, 1, 16).getValues()[0];
      Logger.log('  Sample row 2:');
      Logger.log('    A (timestamp)  : ' + s[0]);
      Logger.log('    B (tanggal)    : ' + s[1]);
      Logger.log('    C (month)      : ' + s[2]);
      Logger.log('    D (week)       : ' + s[3]);
      Logger.log('    E (shift)      : ' + s[4]);
      Logger.log('    F (operator)   : ' + s[5]);
      Logger.log('    G (line)       : ' + s[6]);
      Logger.log('    H (nama_mesin) : ' + s[7]);
      Logger.log('    I (part_name)  : ' + s[8]);
      Logger.log('    J (part_no)    : ' + s[9]);
      Logger.log('    K (id_proses)  : ' + s[10]);
      Logger.log('    L (nama_proses): ' + s[11]);
      Logger.log('    M (kode_loss)  : ' + s[12]);
      Logger.log('    N (jenis_loss) : ' + s[13]);
      Logger.log('    O (menit_loss) : ' + s[14]);
      Logger.log('    P (menit_over) : ' + s[15]);
    }

    Logger.log('✅ Verification complete');
  } catch (error) {
    Logger.log('❌ Error: ' + error);
  }
}

// Test month & week helper
function testMonthWeek() {
  Logger.log('🧪 Test getMonthAbbr & getWeekOfMonth...');

  const cases = [
    ['2026-01-01', 'Jan', 'WEEK 1'],
    ['2026-01-07', 'Jan', 'WEEK 1'],
    ['2026-01-08', 'Jan', 'WEEK 2'],
    ['2026-01-14', 'Jan', 'WEEK 2'],
    ['2026-01-15', 'Jan', 'WEEK 3'],
    ['2026-01-21', 'Jan', 'WEEK 3'],
    ['2026-01-22', 'Jan', 'WEEK 4'],
    ['2026-01-28', 'Jan', 'WEEK 4'],
    ['2026-01-29', 'Jan', 'WEEK 5'],
    ['2026-01-31', 'Jan', 'WEEK 5'],
    ['2026-04-30', 'Apr', 'WEEK 5'],
    ['2026-12-25', 'Dec', 'WEEK 4'],
  ];

  let passed = 0, failed = 0;

  cases.forEach((c, i) => {
    const parts    = c[0].split('-');
    const date     = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const month    = getMonthAbbr(date);
    const week     = getWeekOfMonth(date);
    const okMonth  = month === c[1];
    const okWeek   = week  === c[2];
    const ok       = okMonth && okWeek;

    Logger.log(`  Case ${i + 1}: ${c[0]} → Month=${month}(${okMonth ? '✅' : '❌'}) Week=${week}(${okWeek ? '✅' : '❌'})`);
    if (ok) passed++; else failed++;
  });

  Logger.log(`🧪 Result: ${passed} passed, ${failed} failed`);
}

function testRealTimeUpdate() {
  const sampleData = {
    tanggal        : '2026-01-08',
    shift          : '1',
    operator       : 'Test Operator',
    nama_mesin     : 'Press 100T',
    line           : 'Line A',
    part_no        : 'TEST-001',
    part_name      : 'Test Part',
    id_proses      : 'PR001',
    nama_proses    : 'PROGRESSIVE',
    standard_time  : '30',
    rincian_detail : [
      { kode: '09', menit: '20' },  // Setting_Dies PROGRESSIVE → over=5
      { kode: '07', menit: '8'  },  // Trial_QC → over=3
      { kode: '04', menit: '15' }   // Tunggu_Dies → over=15
    ]
    // Harusnya: month=Jan, week=WEEK 2 (tgl 8)
  };

  Logger.log('🧪 Test real-time update v2.5...');
  Logger.log('   Expected: month=Jan, week=WEEK 2');

  const result = submitDandoriTransaction(sampleData);
  Logger.log('📝 Transaction: ' + JSON.stringify(result));

  if (result.status === 'SUCCESS') {
    const rincianResult = updateRincianRealtime(result.rowId, sampleData);
    Logger.log('📊 Rincian: ' + JSON.stringify(rincianResult));
    Logger.log(rincianResult.success
      ? '✅ Test PASSED: ' + rincianResult.count + ' items (16 kolom)'
      : '❌ Test FAILED: ' + rincianResult.error
    );
  }
}