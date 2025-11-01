const { parsePesertaExcel, savePesertaNames, exportHariToExcelBuffer } = require('../services/excelService')

async function uploadPesertaExcel(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'File is required (xlsx)' })
    }
    const names = await parsePesertaExcel(req.file.buffer)
    const result = await savePesertaNames(names)
    return res.status(201).json({
      message: 'Upload processed',
      ...result,
    })
  } catch (e) { next(e) }
}

async function exportHariExcel(req, res, next) {
  try {
    const id_hari = Number(req.params.id_hari)
    const buffer = await exportHariToExcelBuffer(id_hari)
    const fileName = `rekap_hari_${id_hari}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`)
    return res.status(200).send(buffer)
  } catch (e) { next(e) }
}

module.exports = { uploadPesertaExcel, exportHariExcel }
