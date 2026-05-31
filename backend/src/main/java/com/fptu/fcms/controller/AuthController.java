package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.LoginRequest;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.jwt.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Inject toàn bộ các dependency cần thiết vào Constructor
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
                    .body(Map.of("error","Hệ thống chỉ chấp nhận email nội bộ (@fpt.edu.vn hoặc @fe.edu.vn"));
        }
        // 1. Tìm user trong Database dựa vào email
        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(request.getEmail());

        // Nếu không tìm thấy user
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Không tìm thấy tài khoản với email này!"));
        }

        UserAccount userEntity = userOptional.get();

        // 2. Kiểm tra mật khẩu (Sử dụng PasswordEncoder để so sánh chuỗi mã hóa)
        if (!passwordEncoder.matches(request.getPassword(), userEntity.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sai mật khẩu!"));
        }

        // 3. Lấy thông tin Role ID thông qua khóa ngoại (ManyToOne)
        Integer roleId = userEntity.getRoleID();

        // 4. Lấy data thật từ DB để tạo Token
        String token = jwtTokenProvider.generateToken(
                userEntity.getEmail(),
                userEntity.getUserID(),
                roleId
        );

        // 5. Trả về Token thành công
        return ResponseEntity.ok(Map.of(
                "type", "Bearer",
                "token", token
        ));
    }


}