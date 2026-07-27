package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Data Transfer Object (DTO) chứa 6 mục nhận xét & đánh giá bổ sung của Ban tổ chức khi tạo báo cáo tự động.
 * Layer: DTO.
 * Trách nhiệm chính: Tiếp nhận 6 phần văn bản nhận xét từ Frontend (kết quả nổi bật, mục tiêu, khó khăn, tài chính, bài học, đề xuất) kèm annotation validate độ dài.
 * Phụ thuộc/Sử dụng: Được gửi lên từ Frontend qua API auto-preview / auto-submit, sau đó truyền xuống AutomaticEventReportService và EventReportPdfRenderer để chèn vào Mục 9 của PDF báo cáo.
 */
public record AutomaticEventReportRequest(
        @Size(max = 3000, message = "Kết quả nổi bật không được quá 3000 ký tự.")
        String overallResult,

        @Size(max = 3000, message = "Đánh giá mục tiêu không được quá 3000 ký tự.")
        String objectiveEvaluation,

        @Size(max = 3000, message = "Khó khăn phát sinh không được quá 3000 ký tự.")
        String challenges,

        @Size(max = 3000, message = "Giải trình tài chính không được quá 3000 ký tự.")
        String financialExplanation,

        @Size(max = 3000, message = "Bài học kinh nghiệm không được quá 3000 ký tự.")
        String lessonsLearned,

        @Size(max = 3000, message = "Đề xuất không được quá 3000 ký tự.")
        String recommendations
) {}
