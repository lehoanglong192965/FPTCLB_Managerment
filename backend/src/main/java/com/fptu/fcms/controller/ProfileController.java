package com.fptu.fcms.controller;

import com.fptu.fcms.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {

        // Lấy thông tin từ token cực kỳ dễ dàng mà không cần parse lại chuỗi jwt
        Integer userId = currentUser.getUserId();
        String email = currentUser.getEmail();
        Integer roleId = currentUser.getRoleId();

        System.out.println("User đang gọi API có ID là: " + userId);
        System.out.println("Role ID của User là: " + roleId);

        // Giả sử sau này bạn gọi xuống Service để chọc vào DB:
        // UserProfile profile = userService.getProfileById(userId);

        // Thử trả về một Map JSON chứa thông tin để test trên Swagger
        return ResponseEntity.ok(Map.of(
                "message", "Lấy thông tin profile thành công!",
                "userId", userId,
                "email", email,
                "roleId", roleId
        ));
    }
}