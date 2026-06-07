package com.fptu.fcms.service;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.RegisterRequest;
import com.fptu.fcms.dto.response.AuthResponse;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

        newUser.setAccountStatus("Active");
        newUser.setIsDeleted(false);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setFullName(request.getFullName() != null ? request.getFullName() : "Chưa cập nhật");
        newUser.setStudentId(request.getStudentId()); // Lưu mã sinh viên
        newUser.setRoleID(3);
        newUser.setMajor(request.getMajor() != null ? request.getMajor() : "Chưa cập nhật");

        userRepository.save(newUser);
    }
}
