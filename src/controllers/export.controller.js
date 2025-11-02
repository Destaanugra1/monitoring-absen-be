const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const exportHariExcel = async (req, res) => {
  try {
    const { id_hari } = req.params;

    // Get hari info
    const hari = await prisma.hari.findUnique({
      where: { id: Number(id_hari) }
    });

    if (!hari) {
      return res.status(404).json({ error: 'Hari not found' });
    }

    // Get all materi for this hari
    const materiList = await prisma.materi.findMany({
      where: { id_hari: Number(id_hari) },
      orderBy: { waktu_mulai: 'asc' }
    });

    // Get all peserta
    const pesertaList = await prisma.peserta.findMany({
      orderBy: { nama: 'asc' }
    });

    // Get all keaktifan data for all materi in this hari
    const keaktifanData = await prisma.keaktifan.findMany({
      where: {
        materi: {
          id_hari: Number(id_hari)
        }
      },
      include: {
        peserta: true,
        materi: true
      }
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Keaktifan ${hari.nama_hari}`);

    // Set up headers
    const headers = ['No', 'Nama Peserta', 'NPM', 'Semester'];
    materiList.forEach(materi => {
      headers.push(`${materi.judul_materi}\n(${materi.waktu_mulai} - ${materi.waktu_selesai})`);
    });

    // Add headers to worksheet
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    pesertaList.forEach((peserta, index) => {
      const row = [
        index + 1,
        peserta.nama,
        peserta.npm,
        peserta.semester
      ];

      // Add status for each materi
      materiList.forEach(materi => {
        const keaktifan = keaktifanData.find(k => 
          k.id_peserta === peserta.id && k.id_materi === materi.id
        );
        
        // Default to MERAH if no status found
        let status = 'MERAH';
        if (keaktifan) {
          status = keaktifan.status;
        }

        // Convert status to readable text
        const statusText = {
          'HIJAU': 'Aktif',
          'KUNING': 'Cukup', 
          'MERAH': 'Tidak Aktif'
        }[status] || 'Tidak Aktif';

        row.push(statusText);
      });

      const dataRow = worksheet.addRow(row);

      // Color code the status cells
      materiList.forEach((materi, materiIndex) => {
        const cellIndex = 4 + materiIndex + 1; // Start from column 5 (after No, Nama, NPM, Semester)
        const cell = dataRow.getCell(cellIndex);
        const keaktifan = keaktifanData.find(k => 
          k.id_peserta === peserta.id && k.id_materi === materi.id
        );
        
        const status = keaktifan?.status || 'MERAH';
        
        // Set cell color based on status
        switch (status) {
          case 'HIJAU':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' } // Light green
            };
            break;
          case 'KUNING':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' } // Yellow
            };
            break;
          case 'MERAH':
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFA0A0' } // Light red
            };
            break;
        }
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellValue = cell.value ? cell.value.toString() : '';
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Keaktifan_${hari.nama_hari}_${new Date().toISOString().split('T')[0]}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export Excel file' });
  }
};

module.exports = {
  exportHariExcel
};