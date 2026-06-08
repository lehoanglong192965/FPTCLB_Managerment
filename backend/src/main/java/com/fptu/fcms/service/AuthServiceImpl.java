package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.dto.request.VerifyOTPRequest;
import com.fptu.fcms.dto.response.AuthResponse;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OTPService otpService;
    private final EmailService emailService;

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail();

        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")){
            throw new IllegalArgumentException("Hệ thống chỉ chấp nhận email nội bộ (@fpt.edu.vn hoặc @fe.edu.vn)");
        }

        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);

        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản với email này!");
        }

        UserAccount userEntity = userOptional.get();

        if (!"Active".equalsIgnoreCase(userEntity.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa. Vui lòng kiểm tra email của bạn.");
        }

        if (!passwordEncoder.matches(request.getPassword(), userEntity.getPassword())) {
            throw new IllegalArgumentException("Sai mật khẩu!");
        }

        Integer roleId = userEntity.getRoleID();

        String token = jwtTokenProvider.generateToken(
                userEntity.getEmail(),
                userEntity.getUserID(),
                roleId
        );

        return new AuthResponse(token);
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String email = request.getEmail();

        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")){
            throw new IllegalArgumentException("Hệ thống chỉ chấp nhận email nội bộ (@fpt.edu.vn hoặc @fe.edu.vn)");
        }

        Optional<UserAccount> existingUser = userRepository.findByEmailAndIsDeletedFalse(email);
        if (existingUser.isPresent()) {
            throw new IllegalStateException("Email này đã được đăng ký trong hệ thống!");
        }

        UserAccount newUser = new UserAccount();
        newUser.setEmail(email);

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        newUser.setPassword(hashedPassword);

        // Bắt đầu với status PENDING cho đến khi xác thực OTP
        newUser.setAccountStatus("PENDING");
        newUser.setIsDeleted(false);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setFullName(request.getFullName() != null ? request.getFullName() : "Chưa cập nhật");
        newUser.setStudentId(request.getStudentId());
        newUser.setRoleID(3);
        newUser.setMajor(request.getMajor() != null ? request.getMajor() : "Chưa cập nhật");

        userRepository.save(newUser);

        // Tạo và gửi OTP
        otpService.generateAndSendOTP(email);
    }

    @Override
    @Transactional
    public void verifyOTPAndActivateAccount(VerifyOTPRequest request) {
        String email = request.getEmail();
        String otpCode = request.getOtpCode();

        // Kiểm tra OTP
        if (!otpService.verifyOTP(email, otpCode)) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ!");
        }

        // Tìm user account
        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản!");
        }

        UserAccount user = userOptional.get();

        // Kiểm tra status có phải PENDING không
        if (!"PENDING".equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản không cần xác thực hoặc đã bị khóa!");
        }

        // Kích hoạt tài khoản
        user.setAccountStatus("Active");
        userRepository.save(user);

        // Gửi email thông báo kích hoạt thành công
        emailService.sendAccountActivationEmail(email, user.getFullName());
    }

    @Override
    @Transactional
    public void resendOTP(String email) {
        // Kiểm tra email có tồn tại không
        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản với email này!");
        }

        UserAccount user = userOptional.get();

        // Kiểm tra account status có là PENDING không
        if (!"PENDING".equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản không cần xác thực!");
        }

        // Tạo và gửi lại OTP
        otpService.generateAndSendOTP(email);
    }
}
