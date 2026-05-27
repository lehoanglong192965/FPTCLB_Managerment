package com.fptu.fcms.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public class ExcelHelper {

    /**
     * Writes standard tabular data to an Excel spreadsheet and returns the bytes.
     */
    public static byte[] writeToExcel(String sheetName, List<String> headers, List<List<Object>> dataRows) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            
            // Header Row
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < headers.size(); col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(headers.get(col));
                
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }
            
            // Data Rows
            int rowIdx = 1;
            for (List<Object> rowData : dataRows) {
                Row row = sheet.createRow(rowIdx++);
                for (int col = 0; col < rowData.size(); col++) {
                    Cell cell = row.createCell(col);
                    Object val = rowData.get(col);
                    if (val instanceof Number) {
                        cell.setCellValue(((Number) val).doubleValue());
                    } else if (val instanceof Boolean) {
                        cell.setCellValue((Boolean) val);
                    } else {
                        cell.setCellValue(val != null ? val.toString() : "");
                    }
                }
            }
            
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
