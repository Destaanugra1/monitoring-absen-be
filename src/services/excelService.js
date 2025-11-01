const { prisma } = require('../utils/prisma')
const { dedupeNames, normalizeName } = require('./validationService')

async function importExcelJS() {
  try {
    return require('exceljs')
  } catch (e) {
    const err = new Error('exceljs is required. Please install it: npm i exceljs')
    err.status = 500
    throw err
  }
}

// Parse peserta names from uploaded Excel (Buffer from multer)
// Accepts first worksheet; will try to detect header `nama` if present, else read first column.
async function parsePesertaExcel(buffer) {
  const ExcelJS = await importExcelJS()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []

  // Try to detect header row
  let startRow = 1
  let namaColIdx = 1
  const headerRow = ws.getRow(1)
  const headerValues = headerRow.values
    .map?.(v => (typeof v === 'string' ? v.trim().toLowerCase() : v)) || []
  const idx = headerValues.findIndex(v => v === 'nama' || v === 'name' || v === 'nama_peserta')
  if (idx > -1) {
    startRow = 2
    namaColIdx = idx
  }

  const names = []
  for (let r = startRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const cell = row.getCell(namaColIdx)
    const raw = (cell?.text || cell?.value || '').toString().trim()
    if (raw) names.push(raw)
  }

  return dedupeNames(names)
}

// Insert new Peserta, skipping existing ones by normalized name comparison
async function savePesertaNames(names) {
  const normalized = names.map(n => ({ raw: n, norm: normalizeName(n) })).filter(n => !!n.norm)
  if (normalized.length === 0) return { inserted: 0, skipped_existing: 0, total_in_file: 0 }

  // Load all existing peserta names
  const existing = await prisma.peserta.findMany({ select: { id: true, nama: true } })
  const existingSet = new Set(existing.map(p => normalizeName(p.nama)))

  const toInsert = normalized
    .filter(n => !existingSet.has(n.norm))
    .map(n => ({ nama: n.raw.trim() }))

  if (toInsert.length > 0) {
    // Use createMany for efficiency
    await prisma.peserta.createMany({ data: toInsert, skipDuplicates: true })
  }

  const skipped_existing = normalized.length - toInsert.length
  return { inserted: toInsert.length, skipped_existing, total_in_file: normalized.length }
}

const STATUS_COLOR = {
  HIJAU: 'FF92D050', // green
  KUNING: 'FFFFFF00', // yellow
  MERAH: 'FFFF0000', // red
}

// Export rekap keaktifan per hari ke Excel (returns Buffer)
async function exportHariToExcelBuffer(id_hari) {
  const ExcelJS = await importExcelJS()
  const hari = await prisma.hari.findUnique({ where: { id: Number(id_hari) } })
  if (!hari) {
    const err = new Error('Hari not found')
    err.status = 404
    throw err
  }

  const materi = await prisma.materi.findMany({ where: { id_hari: hari.id }, orderBy: { waktu_mulai: 'asc' } })
  const peserta = await prisma.peserta.findMany({ orderBy: { id: 'asc' } })
  const materiIds = materi.map(m => m.id)

  const keaktifan = await prisma.keaktifan.findMany({
    where: { id_materi: { in: materiIds } },
    select: { id_peserta: true, id_materi: true, status: true }
  })

  const kMap = new Map()
  for (const k of keaktifan) {
    kMap.set(`${k.id_peserta}:${k.id_materi}`, k.status)
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Rekap')

  // Header
  const header = ['Nama', ...materi.map(m => m.judul_materi)]
  ws.addRow(header)

  // Rows
  for (const p of peserta) {
    const rowValues = [p.nama]
    const row = ws.addRow(rowValues)
    // Fill status cells per materi
    materi.forEach((m, idx) => {
      const status = kMap.get(`${p.id}:${m.id}`) || ''
      const cell = row.getCell(idx + 2) // +2 because first column is Nama
      cell.value = status
      const color = STATUS_COLOR[status]
      if (color) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
      }
    })
  }

  // Styling
  ws.columns = header.map(() => ({ width: 24 }))
  ws.getRow(1).font = { bold: true }

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

module.exports = {
  parsePesertaExcel,
  savePesertaNames,
  exportHariToExcelBuffer,
}
