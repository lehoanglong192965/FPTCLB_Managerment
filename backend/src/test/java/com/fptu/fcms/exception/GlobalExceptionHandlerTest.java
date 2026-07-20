package com.fptu.fcms.exception;

import com.fptu.fcms.dto.response.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void dataIntegrityViolationDoesNotExposeDatabaseDetail() {
        var response = handler.handleDataIntegrityViolation(
                new DataIntegrityViolationException("UX_EventRegistration_TicketCode_Active violated")
        );

        ApiErrorResponse body = response.getBody();
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(body);
        assertEquals("Data conflicts with an existing record.", body.getMessage());
        assertFalse(body.getMessage().contains("UX_EventRegistration"));
    }

    @Test
    void unexpectedExceptionDoesNotExposeInternalDetail() {
        var response = handler.handleGenericException(
                new IllegalStateException("SQL Server connection string leaked")
        );

        ApiErrorResponse body = response.getBody();
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(body);
        assertEquals("An unexpected error occurred.", body.getMessage());
        assertFalse(body.getMessage().contains("SQL Server"));
    }
}
