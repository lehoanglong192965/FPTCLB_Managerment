package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.AttendanceCheckInRequest;
import com.fptu.fcms.dto.response.AttendanceCheckInResponse;
import com.fptu.fcms.enums.AttendanceStatus;
import com.fptu.fcms.enums.VerificationMethod;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AttendanceService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AttendanceControllerTest {

    @Test
    void checkInReturnsOkForSuccessfulServiceResult() {
        AttendanceService attendanceService = mock(AttendanceService.class);
        AttendanceController controller = new AttendanceController(attendanceService);
        AttendanceCheckInRequest request = new AttendanceCheckInRequest();
        request.setVerificationMethod(VerificationMethod.QR_TICKET.name());
        request.setVerificationValue("ticket-201-301");
        UserPrincipal principal = new UserPrincipal(
                901,
                "staff@fpt.edu.vn",
                3,
                "Student",
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );
        AttendanceCheckInResponse expected = new AttendanceCheckInResponse(
                201,
                301,
                401,
                AttendanceStatus.PRESENT,
                "Checked in."
        );
        when(attendanceService.checkIn(101, request, principal)).thenReturn(expected);

        ResponseEntity<AttendanceCheckInResponse> response = controller.checkIn(101, request, principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expected, response.getBody());
        verify(attendanceService).checkIn(101, request, principal);
    }
}
