package com.fptu.fcms.service;

import com.fptu.fcms.dto.response.FeedbackCompetitionInput;

public interface FeedbackSummaryService {
    FeedbackCompetitionInput getCompetitionInput(Integer eventId);
}
