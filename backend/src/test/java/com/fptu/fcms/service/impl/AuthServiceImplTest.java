package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.OTPService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AllowedEmailRepository allowedEmailRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OTPService otpService;

    @Mock
    private EmailService emailService;

    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(
                jwtTokenProvider,
                userRepository,
                allowedEmailRepository,
                passwordEncoder,
                otpService,
                emailService
        );
    }

    @Test
    void isStudentIdAvailable_whenStudentIdExists_returnsFalse() {
        when(userRepository.existsByStudentIdIgnoreCaseAndIsDeletedFalse("SE123456")).thenReturn(true);

        boolean available = service.isStudentIdAvailable(" se123456 ");

        assertFalse(available);
        verify(userRepository).existsByStudentIdIgnoreCaseAndIsDeletedFalse("SE123456");
    }

    @Test
    void register_whenStudentIdExists_throwsConflictBeforeSaving() {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@fpt.edu.vn")
                .password("Password123!")
                .fullName("Student Name")
                .studentId(" se123456 ")
                .major("SE")
                .build();

        when(userRepository.findByEmailAndIsDeletedFalse("student@fpt.edu.vn")).thenReturn(Optional.empty());
        when(userRepository.existsByStudentIdIgnoreCaseAndIsDeletedFalse("SE123456")).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.register(request));

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(otpService, never()).generateAndSendOTP(org.mockito.ArgumentMatchers.anyString());
    }
}
