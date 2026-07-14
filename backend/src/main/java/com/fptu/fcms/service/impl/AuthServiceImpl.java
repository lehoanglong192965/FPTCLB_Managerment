package com.fptu.fcms.service.impl;

import com.fptu.fcms.service.*;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.dto.request.VerifyOTPRequest;
import com.fptu.fcms.dto.response.AuthResponse;
import com.fptu.fcms.dto.response.ClubRoleResponse;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final AllowedEmailRepository allowedEmailRepository;
    private final PasswordEncoder passwordEncoder;
    private final OTPService otpService;
    private final EmailService emailService;
    private final UserService userService;
    private final SystemRoleRepository systemRoleRepository;

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail();

        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")){
            if (!allowedEmailRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Tài khoản email này chưa được cấp phép trong hệ thống.");
            }
        }

        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);

        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản với email này!");
        }

        UserAccount userEntity = userOptional.get();

        if ("PENDING".equalsIgnoreCase(userEntity.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản của bạn chưa được xác thực OTP. Vui lòng kiểm tra email để nhận mã xác thực.");
        }

        if (!"Active".equalsIgnoreCase(userEntity.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản của bạn đã bị khóa (Suspended). Vui lòng liên hệ Admin.");
        }

        if (!passwordEncoder.matches(request.getPassword(), userEntity.getPassword())) {
            throw new IllegalArgumentException("Sai mật khẩu!");
        }

        Integer roleId = userEntity.getRoleID();

        // [Batch 2] Resolve roleName từ SystemRole
        String roleName = systemRoleRepository.findById(roleId)
                .map(SystemRole::getRoleName)
                .orElse(null);

        // [Batch 2] Resolve clubRole/clubId — tái dùng UserService.getClubRole(), KHÔNG viết lại logic
        ClubRoleResponse clubRoleResponse = userService.getClubRole(userEntity.getUserID());
        String clubRoleClaim = null;
        Integer clubIdClaim = null;
        if ("Leader".equals(clubRoleResponse.getRoleName()) || "ViceLeader".equals(clubRoleResponse.getRoleName())) {
            clubRoleClaim = clubRoleResponse.getRoleName();
            clubIdClaim = clubRoleResponse.getClubID();
        }

        String token = jwtTokenProvider.generateToken(
                userEntity.getEmail(),
                userEntity.getUserID(),
                roleId,
                roleName,
                clubRoleClaim,
                clubIdClaim
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(userEntity.getEmail());

        return new AuthResponse(token, refreshToken);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (jwtTokenProvider.validateToken(refreshToken)) {
            String email = jwtTokenProvider.getEmailFromJwt(refreshToken);
            Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);
            
            if (userOptional.isPresent()) {
                UserAccount user = userOptional.get();

                // [Batch 2] Resolve roleName từ SystemRole
                String roleName = systemRoleRepository.findById(user.getRoleID())
                        .map(SystemRole::getRoleName)
                        .orElse(null);

                // [Batch 2] Resolve clubRole/clubId — tái dùng UserService.getClubRole()
                ClubRoleResponse clubRoleResponse = userService.getClubRole(user.getUserID());
                String clubRoleClaim = null;
                Integer clubIdClaim = null;
                if ("Leader".equals(clubRoleResponse.getRoleName()) || "ViceLeader".equals(clubRoleResponse.getRoleName())) {
                    clubRoleClaim = clubRoleResponse.getRoleName();
                    clubIdClaim = clubRoleResponse.getClubID();
                }

                String newToken = jwtTokenProvider.generateToken(
                        user.getEmail(),
                        user.getUserID(),
                        user.getRoleID(),
                        roleName,
                        clubRoleClaim,
                        clubIdClaim
                );
                // Có thể tạo refresh token mới hoặc dùng lại cái cũ
                return new AuthResponse(newToken, refreshToken);
            }
        }
        throw new IllegalArgumentException("Refresh token không hợp lệ hoặc đã hết hạn!");
    }

    @Override
    public boolean isStudentIdAvailable(String studentId) {
        String normalizedStudentId = normalizeStudentId(studentId);
        return StringUtils.hasText(normalizedStudentId)
                && !userRepository.existsByStudentIdIgnoreCaseAndIsDeletedFalse(normalizedStudentId);
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String email = request.getEmail();

        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")){
            if (!allowedEmailRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Tài khoản email này chưa được cấp phép trong hệ thống.");
            }
        }

        Optional<UserAccount> existingUser = userRepository.findByEmailAndIsDeletedFalse(email);
        if (existingUser.isPresent()) {
            throw new IllegalStateException("Email này đã được đăng ký trong hệ thống!");
        }

        String studentId = normalizeStudentId(request.getStudentId());
        if (StringUtils.hasText(studentId) && userRepository.existsByStudentIdIgnoreCaseAndIsDeletedFalse(studentId)) {
            throw new IllegalStateException("MSSV này đã được đăng ký trong hệ thống!");
        }

        UserAccount newUser = new UserAccount();
        newUser.setEmail(email);

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        newUser.setPassword(hashedPassword);

        // Bắt đầu ở trạng thái PENDING để yêu cầu xác thực OTP
        newUser.setAccountStatus("PENDING");
        newUser.setIsDeleted(false);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setFullName(request.getFullName() != null ? request.getFullName() : "Chưa cập nhật");
        newUser.setStudentId(studentId); // Lưu mã sinh viên
        newUser.setPhoneNumber(request.getPhoneNumber()); // Lưu SĐT
        newUser.setRoleID(3);
        newUser.setMajor(request.getMajor() != null ? request.getMajor() : "Chưa cập nhật");

        userRepository.save(newUser);

        // Tạo mã OTP và gửi qua email
        otpService.generateAndSendOTP(email);
    }

    private String normalizeStudentId(String studentId) {
        return StringUtils.hasText(studentId) ? studentId.trim().toUpperCase(Locale.ROOT) : null;
    }

    @Override
    @Transactional
    public void verifyOTPAndActivateAccount(VerifyOTPRequest request) {
        String email = request.getEmail();
        String otpCode = request.getOtpCode();

        // Xác minh mã OTP qua OTPService
        if (!otpService.verifyOTP(email, otpCode)) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ!");
        }

        // Tìm kiếm thông tin tài khoản người dùng
        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản người dùng tương ứng!");
        }

        UserAccount user = userOptional.get();

        // Đảm bảo tài khoản thực sự đang ở trạng thái PENDING
        if (!"PENDING".equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản đã được kích hoạt trước đó hoặc đã bị khóa!");
        }

        // Cập nhật trạng thái sang Active
        user.setAccountStatus("Active");
        userRepository.save(user);

        // Gửi email thông báo kích hoạt tài khoản thành công
        emailService.sendAccountActivationEmail(email, user.getFullName());
    }

    @Override
    @Transactional
    public void resendOTP(String email) {
        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản tương ứng với email này!");
        }

        UserAccount user = userOptional.get();

        // Chỉ gửi lại OTP nếu tài khoản vẫn ở trạng thái PENDING
        if (!"PENDING".equalsIgnoreCase(user.getAccountStatus())) {
            throw new IllegalArgumentException("Tài khoản này đã được kích hoạt thành công!");
        }

        // Tạo mã OTP mới và gửi lại
        otpService.generateAndSendOTP(email);
    }

    @Override
    public void forgotPassword(String email) {
        if (!userRepository.findByEmailAndIsDeletedFalse(email).isPresent()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản với email này.");
        }
        otpService.generateAndSendOTP(email);
    }

    @Override
    public void resendForgotPasswordOTP(String email) {
        if (!userRepository.findByEmailAndIsDeletedFalse(email).isPresent()) {
            throw new IllegalArgumentException("Không tìm thấy tài khoản với email này.");
        }
        // Gọi lại service để gửi OTP mới
        otpService.generateAndSendOTP(email);
    }

    @Override
    @Transactional
    public void resetPassword(com.fptu.fcms.dto.request.ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }

        if (!otpService.verifyOTP(request.getEmail(), request.getOtp())) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        UserAccount user = userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản."));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
