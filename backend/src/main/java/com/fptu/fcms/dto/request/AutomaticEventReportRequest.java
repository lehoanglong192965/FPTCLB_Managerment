package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.Size;

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
