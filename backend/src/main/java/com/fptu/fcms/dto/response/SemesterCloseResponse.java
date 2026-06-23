package com.fptu.fcms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SemesterCloseResponse {
    private boolean success;
    private String message;
    private Integer semesterId;
    private String semesterCode;
    private String semesterStatus;
    private boolean forced;
    private long unfinishedEventCount;
    private long lockedScoreCount;
    private List<String> blockers;
    private String auditAction;
}
