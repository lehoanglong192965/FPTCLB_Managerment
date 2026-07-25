package com.fptu.fcms.service.impl;

import com.fptu.fcms.entity.Event;
import com.fptu.fcms.enums.EventStatus;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class EventServiceImplScheduleConflictTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventServiceImpl service;

    @Test
    void conflictMessageContainsEventNameLocationAndTimeWindow() {
        LocalDateTime requestedStart = LocalDateTime.of(2026, 7, 20, 10, 0);
        LocalDateTime requestedEnd = LocalDateTime.of(2026, 7, 20, 12, 0);
        Event requested = event(20, "Hội trường A", requestedStart, requestedEnd, "Sự kiện mới");
        Event conflict = event(
                10,
                "Hội trường A",
                LocalDateTime.of(2026, 7, 20, 9, 30),
                LocalDateTime.of(2026, 7, 20, 11, 0),
                "Workshop AI"
        );
        when(eventRepository.findFirstByLocationAndEventIDNotAndEventStatusInAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
                eq("Hội trường A"), eq(20), anyList(), eq(requestedEnd), eq(requestedStart)
        )).thenReturn(Optional.of(conflict));

        BusinessRuleException error = assertThrows(
                BusinessRuleException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateScheduleConflict", requested)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertTrue(error.getMessage().contains("Workshop AI"));
        assertTrue(error.getMessage().contains("Hội trường A"));
        assertTrue(error.getMessage().contains("09:30 20/07/2026"));
        assertTrue(error.getMessage().contains("11:00 20/07/2026"));
    }

    @Test
    void noConflictDoesNotThrow() {
        Event requested = event(
                20,
                "Hội trường A",
                LocalDateTime.of(2026, 7, 20, 10, 0),
                LocalDateTime.of(2026, 7, 20, 12, 0),
                "Sự kiện mới"
        );
        when(eventRepository.findFirstByLocationAndEventIDNotAndEventStatusInAndStartDateBeforeAndEndDateAfterAndIsDeletedFalse(
                eq("Hội trường A"), eq(20), anyList(), eq(requested.getEndDate()), eq(requested.getStartDate())
        )).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> ReflectionTestUtils.invokeMethod(service, "validateScheduleConflict", requested));
    }

    private Event event(Integer id, String location, LocalDateTime start, LocalDateTime end, String name) {
        Event event = new Event();
        event.setEventID(id);
        event.setLocation(location);
        event.setStartDate(start);
        event.setEndDate(end);
        event.setEventName(name);
        return event;
    }
}
