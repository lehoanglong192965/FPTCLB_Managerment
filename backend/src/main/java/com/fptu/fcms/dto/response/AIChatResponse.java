package com.fptu.fcms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private String answer;
    private List<CitationDto> citations;
    private String status; // "Success" or "Fallback"

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CitationDto {
        private Integer archiveId;
        private String title;
        private Integer chunkIndex;
    }
}
