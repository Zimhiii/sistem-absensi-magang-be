import jwt from "jsonwebtoken";
import ExcelJS from "exceljs";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export function generateJWT(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "14d" });
}

export function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export async function generateExcel(data: any[], title: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Laporan Kehadiran");

  // Add title
  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = title;
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  // Add headers
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Style headers
  const headerRow = worksheet.getRow(2);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
  });

  // Add data
  data.forEach((item) => {
    worksheet.addRow(Object.values(item));
  });

  // Auto fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column?.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    if (column && column.width) {
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export const getWIBDate = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );
};

export const getWIBStartOfDay = () => {
  const date = getWIBDate();
  date.setHours(0, 0, 0, 0);
  return date;
};
