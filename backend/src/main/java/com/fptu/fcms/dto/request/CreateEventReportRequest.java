package com.fptu.fcms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CreateEventReportRequest {

    @NotNull(message = "eventID is required")
    private Integer eventID;

    @NotBlank(message = "summary is required")
    @Size(max = 1000, message = "summary must be <= 1000 characters")
    private String summary;

    @NotNull(message = "file is required")
    private MultipartFile file;
}
