package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ClubRegistrationRequestDTO;
import com.fptu.fcms.dto.request.ReviewRegistrationRequestDTO;
import com.fptu.fcms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClubRegistrationControllerTest {

    @Test
    void submitRegistration_allowsOnlyAdminOrIcpdp() throws Exception {
        Method method = ClubRegistrationController.class.getDeclaredMethod(
                "submitRegistration",
                ClubRegistrationRequestDTO.class,
                UserPrincipal.class
        );

        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);

        assertEquals("hasAnyRole('Admin', 'ICPDP')", preAuthorize.value());
    }

    @Test
    void getRegistrations_allowsOnlyAdminOrIcpdp() throws Exception {
        Method method = ClubRegistrationController.class.getDeclaredMethod(
                "getRegistrations",
                String.class
        );

        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);

        assertEquals("hasAnyRole('Admin', 'ICPDP')", preAuthorize.value());
    }

    @Test
    void getRegistrationById_allowsOnlyAdminOrIcpdp() throws Exception {
        Method method = ClubRegistrationController.class.getDeclaredMethod(
                "getRegistrationById",
                Integer.class
        );

        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);

        assertEquals("hasAnyRole('Admin', 'ICPDP')", preAuthorize.value());
    }

    @Test
    void reviewRegistration_allowsOnlyAdminOrIcpdp() throws Exception {
        Method method = ClubRegistrationController.class.getDeclaredMethod(
                "reviewRegistration",
                Integer.class,
                ReviewRegistrationRequestDTO.class,
                UserPrincipal.class
        );

        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);

        assertEquals("hasAnyRole('Admin', 'ICPDP')", preAuthorize.value());
    }
}
