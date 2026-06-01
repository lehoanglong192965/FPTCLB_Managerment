package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.dto.request.LoginRequest; // Đổi thành LoginRequest
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        String email = request.getEmail();

        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Hệ thống chỉ chấp nhận email nội bộ (@fpt.edu.vn hoặc @fe.edu.vn)"));
        }

        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Không tìm thấy tài khoản với email này!"));
        }

        UserAccount userEntity = userOptional.get();

        if (!passwordEncoder.matches(request.getPassword(), userEntity.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sai mật khẩu!"));
        }

        Integer roleId = userEntity.getRoleID();

        String token = jwtTokenProvider.generateToken(
                userEntity.getEmail(),
                userEntity.getUserID(),
                roleId
        );

        return ResponseEntity.ok(Map.of(
                "type", "Bearer",
                "token", token
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest  request) { // Dùng RegisterRequest

        String email = request.getEmail();

        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Hệ thống chỉ chấp nhận email nội bộ (@fpt.edu.vn hoặc @fe.edu.vn)"));
        }

        Optional<UserAccount> existingUser = userRepository.findByEmailAndIsDeletedFalse(email);
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email này đã được đăng ký trong hệ thống!"));
        }

        UserAccount newUser = new UserAccount();
        newUser.setEmail(email);

        // BẮT BUỘC: Mã hóa mật khẩu trước khi lưu
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        newUser.setPassword(hashedPassword);

        // THIẾT LẬP CÁC GIÁ TRỊ MẶC ĐỊNH
        newUser.setAccountStatus("Active");
        newUser.setIsDeleted(false);

        // LỖI THIẾU THỜI GIAN:
        newUser.setCreatedAt(LocalDateTime.now());

        // Nếu database của bạn thiết lập các cột dưới đây là NOT NULL, hãy mở comment ra:
         newUser.setFullName("Chưa cập nhật");
         newUser.setRoleID(3);
         newUser.setMajor("Chưa cập nhật");

        try {
            // Lưu xuống Database
            userRepository.save(newUser);
            return ResponseEntity.ok(Map.of("message", "Đăng ký tài khoản thành công!"));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra console nếu có biến cố
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi lưu Database: " + e.getMessage()));
        }
    }
}