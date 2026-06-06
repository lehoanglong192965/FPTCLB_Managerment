package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplyClubRequestDTO {
    
    @NotNull(message = "Club ID is required")
    private Integer clubID;
    
    private String cvUrl;
    
    private String introduction;
    
    private String answersJson;
}
