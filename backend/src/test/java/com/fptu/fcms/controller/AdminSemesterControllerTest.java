package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.ForceCloseSemesterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminSemesterControllerTest {

    @Test
    void controllerUsesExpectedAdminSemesterBasePath() {
        RequestMapping requestMapping = AdminSemesterController.class.getAnnotation(RequestMapping.class);

        assertEquals(1, requestMapping.value().length);
        assertEquals("/api/admin/semesters", requestMapping.value()[0]);
    }

    @Test
    void closeEndpointAllowsOnlyAdmin() throws Exception {
        Method method = AdminSemesterController.class.getDeclaredMethod(
                "closeSemester",
                Integer.class,
                com.fptu.fcms.security.UserPrincipal.class
        );

        PutMapping putMapping = method.getAnnotation(PutMapping.class);
        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
        assertEquals("/{semesterId}/close", putMapping.value()[0]);
        assertEquals("hasRole('Admin')", preAuthorize.value());
    }

    @Test
    void forceCloseEndpointAllowsOnlyAdmin() throws Exception {
        Method method = AdminSemesterController.class.getDeclaredMethod(
                "forceCloseSemester",
                Integer.class,
                ForceCloseSemesterRequest.class,
                com.fptu.fcms.security.UserPrincipal.class
        );

        PutMapping putMapping = method.getAnnotation(PutMapping.class);
        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
        assertEquals("/{semesterId}/force-close", putMapping.value()[0]);
        assertEquals("hasRole('Admin')", preAuthorize.value());
    }

    @Test
    void forceCloseReasonIsRequiredAndLengthLimited() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        ForceCloseSemesterRequest blankRequest = new ForceCloseSemesterRequest();
        blankRequest.setReason(" ");

        Set<ConstraintViolation<ForceCloseSemesterRequest>> blankViolations = validator.validate(blankRequest);

        assertFalse(blankViolations.isEmpty());
        ForceCloseSemesterRequest longRequest = new ForceCloseSemesterRequest();
        longRequest.setReason("a".repeat(1001));
        Set<ConstraintViolation<ForceCloseSemesterRequest>> longViolations = validator.validate(longRequest);
        assertTrue(longViolations.stream().anyMatch(violation -> "reason".equals(violation.getPropertyPath().toString())));
    }
}
