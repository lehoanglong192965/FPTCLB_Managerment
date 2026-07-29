package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.VerifyOTPRequest;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import com.fptu.fcms.service.EmailService;
import com.fptu.fcms.service.OTPService;
import com.fptu.fcms.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplSecurityTest {

    private static final String INVALID_CREDENTIALS =
            "Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng h\u1ee3p l\u1ec7.";
    private static final String INVALID_OTP =
            "M\u00e3 OTP kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n.";
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private UserRepository userRepository;
    @Mock private AllowedEmailRepository allowedEmailRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private OTPService otpService;
    @Mock private EmailService emailService;
    @Mock private UserService userService;
    @Mock private SystemRoleRepository systemRoleRepository;

    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(
                jwtTokenProvider,
                userRepository,
                allowedEmailRepository,
                passwordEncoder,
                otpService,
                emailService,
                userService,
                systemRoleRepository);
    }

    @Test
    void login_unknownUserRunsDummyPasswordVerificationAndReturnsGenericError() {
        LoginRequest request = login("missing@fpt.edu.vn", "guess");
        when(userRepository.findByEmailAndIsDeletedFalse(request.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.matches(
                eq("guess"),
                argThat(hash -> hash != null && hash.length() == 60 && hash.startsWith("$2"))))
                .thenReturn(false);

        assertThatThrownBy(() -> service.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(INVALID_CREDENTIALS);

        verify(passwordEncoder).matches(
                eq("guess"),
                argThat(hash -> hash != null && hash.length() == 60 && hash.startsWith("$2")));
        verify(allowedEmailRepository, never()).existsByEmail(request.getEmail());
    }

    @Test
    void login_wrongPasswordReturnsSameGenericErrorAsUnknownUser() {
        UserAccount user = user("student@fpt.edu.vn", "Active");
        LoginRequest request = login(user.getEmail(), "wrong");
        when(userRepository.findByEmailAndIsDeletedFalse(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> service.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(INVALID_CREDENTIALS);
    }

    @Test
    void login_pendingAccountDoesNotRevealStatusUntilPasswordIsCorrect() {
        UserAccount user = user("pending@fpt.edu.vn", "PENDING");
        LoginRequest request = login(user.getEmail(), "wrong");
        when(userRepository.findByEmailAndIsDeletedFalse(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> service.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(INVALID_CREDENTIALS);
    }

    @Test
    void login_pendingAccountWithCorrectPasswordPreservesActivationGuidance() {
        UserAccount user = user("pending@fpt.edu.vn", "PENDING");
        LoginRequest request = login(user.getEmail(), "correct");
        when(userRepository.findByEmailAndIsDeletedFalse(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", user.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> service.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("OTP");
    }

    @Test
    void forgotPassword_unknownUserReturnsNormallyWithoutIssuingOtp() {
        when(userRepository.findByEmailAndIsDeletedFalse("missing@fpt.edu.vn")).thenReturn(Optional.empty());

        assertThatCode(() -> service.forgotPassword("missing@fpt.edu.vn")).doesNotThrowAnyException();

        verify(otpService, never()).generateAndSendOTP("missing@fpt.edu.vn");
    }

    @Test
    void forgotPassword_existingUserStillIssuesOtp() {
        UserAccount user = user("student@fpt.edu.vn", "Active");
        when(userRepository.findByEmailAndIsDeletedFalse(user.getEmail())).thenReturn(Optional.of(user));

        service.forgotPassword(user.getEmail());

        verify(otpService).generateAndSendOTP(user.getEmail());
    }

    @Test
    void resendForgotPasswordOtp_unknownUserReturnsNormallyWithoutIssuingOtp() {
        when(userRepository.findByEmailAndIsDeletedFalse("missing@fpt.edu.vn")).thenReturn(Optional.empty());

        assertThatCode(() -> service.resendForgotPasswordOTP("missing@fpt.edu.vn"))
                .doesNotThrowAnyException();

        verify(otpService, never()).generateAndSendOTP("missing@fpt.edu.vn");
    }

    @Test
    void resendActivationOtp_unknownOrActiveUserReturnsNormallyWithoutIssuingOtp() {
        UserAccount activeUser = user("active@fpt.edu.vn", "Active");
        when(userRepository.findByEmailAndIsDeletedFalse("missing@fpt.edu.vn")).thenReturn(Optional.empty());
        when(userRepository.findByEmailAndIsDeletedFalse(activeUser.getEmail())).thenReturn(Optional.of(activeUser));

        assertThatCode(() -> service.resendOTP("missing@fpt.edu.vn")).doesNotThrowAnyException();
        assertThatCode(() -> service.resendOTP(activeUser.getEmail())).doesNotThrowAnyException();

        verify(otpService, never()).generateAndSendOTP("missing@fpt.edu.vn");
        verify(otpService, never()).generateAndSendOTP(activeUser.getEmail());
    }

    @Test
    void resendActivationOtp_pendingUserStillIssuesOtp() {
        UserAccount pendingUser = user("pending@fpt.edu.vn", "PENDING");
        when(userRepository.findByEmailAndIsDeletedFalse(pendingUser.getEmail()))
                .thenReturn(Optional.of(pendingUser));

        service.resendOTP(pendingUser.getEmail());

        verify(otpService).generateAndSendOTP(pendingUser.getEmail());
    }

    @Test
    void verifyActivationOtp_orphanOtpUsesSameGenericInvalidOtpError() {
        VerifyOTPRequest request = new VerifyOTPRequest();
        request.setEmail("missing@fpt.edu.vn");
        request.setOtpCode("123456");
        when(otpService.verifyOTP(request.getEmail(), request.getOtpCode())).thenReturn(true);
        when(userRepository.findByEmailAndIsDeletedFalse(request.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyOTPAndActivateAccount(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(INVALID_OTP);
    }

    private LoginRequest login(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private UserAccount user(String email, String status) {
        UserAccount user = new UserAccount();
        user.setUserID(10);
        user.setRoleID(3);
        user.setEmail(email);
        user.setPassword("$2a$10$storedHash");
        user.setAccountStatus(status);
        user.setIsDeleted(false);
        return user;
    }
}