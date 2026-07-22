package com.fptu.fcms.dto.response;

public record CsvExportResult(byte[] content, int dataRowCount) {
}