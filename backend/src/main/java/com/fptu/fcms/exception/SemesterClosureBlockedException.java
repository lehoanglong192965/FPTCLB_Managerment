package com.fptu.fcms.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.List;

@Getter
public class SemesterClosureBlockedException extends BusinessRuleException {
    private final Integer semesterId;
    private final long unfinishedEventCount;
    private final long lockedScoreCount;
    private final List<String> blockers;

    public SemesterClosureBlockedException(
            Integer semesterId,
            long unfinishedEventCount,
            long lockedScoreCount,
            List<String> blockers
    ) {
        super("Không thể đóng học kỳ vì còn dữ liệu chưa hoàn tất", HttpStatus.CONFLICT);
        this.semesterId = semesterId;
        this.unfinishedEventCount = unfinishedEventCount;
        this.lockedScoreCount = lockedScoreCount;
        this.blockers = blockers;
    }
}
