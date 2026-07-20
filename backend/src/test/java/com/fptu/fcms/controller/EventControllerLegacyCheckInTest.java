package com.fptu.fcms.controller;

import com.fptu.fcms.service.ContributionBatchService;
import com.fptu.fcms.service.EventRegistrationService;
import com.fptu.fcms.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class EventControllerLegacyCheckInTest {

    @Test
    void legacyCheckInIsGoneAndNeverDelegatesToEventService() {
        EventService eventService = mock(EventService.class);
        EventController controller = new EventController(
                eventService,
                mock(EventRegistrationService.class),
                mock(ContributionBatchService.class)
        );

        ResponseEntity<Map<String, String>> response = controller.checkIn(100, "SE000001", null);

        assertEquals(HttpStatus.GONE, response.getStatusCode());
        assertEquals(
                "This endpoint is retired. Use POST /api/v1/attendance-sessions/{sessionId}/check-ins.",
                response.getBody().get("message")
        );
        verifyNoInteractions(eventService);
    }
}
