package com.fptu.fcms.controller;

import com.fptu.fcms.dto.request.UpdateProfileRequest;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user") // Đổi một chút thành /api/user cho đúng chuẩn RESTful
public class ProfileController {

    private final UserRepository userRepository;

    // Inject UserRepository thông qua Constructor
    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {

        Integer userId = currentUser.getUserId();

        // Query xuống Database để lấy thông tin mới nhất
        Optional<UserAccount> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy thông tin người dùng trong hệ thống!"));
        }

        UserAccount user = userOptional.get();

        // Trả về dữ liệu chi tiết cho Frontend
        return ResponseEntity.ok(Map.of(
                "userId", user.getUserID(),
                "email", user.getEmail(),
                "fullName", user.getFullName(), // Tên thật lưu từ hệ thống hoặc Google
                "major", user.getMajor() != null ? user.getMajor() : "NULL", // Frontend sẽ check cái này
                "roleId", user.getRoleID()
        ));
    } // <--- ĐÂY CHÍNH LÀ DẤU ĐÓNG NGOẶC BỊ THIẾU NÀY!

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        // 1. Lấy ID người dùng từ Token
        Integer userId = currentUser.getUserId();

        // 2. Tìm người dùng trong Database
        Optional<UserAccount> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy thông tin người dùng trong hệ thống!"));
        }

        UserAccount user = userOptional.get();

        // 3. Cập nhật thông tin mới từ Request (nếu người dùng có gửi lên)
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        if (request.getMajor() != null && !request.getMajor().trim().isEmpty()) {
            user.setMajor(request.getMajor());
        }

        // 4. Lưu lại vào Database
        userRepository.save(user);

        // 5. Trả về kết quả thành công
        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật hồ sơ thành công!",
                "fullName", user.getFullName(),
                "major", user.getMajor()
        ));
    }
}