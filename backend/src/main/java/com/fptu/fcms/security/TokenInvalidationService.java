package com.fptu.fcms.security;

import com.fptu.fcms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Thu hồi các JWT đã cấp cho một tài khoản.
 *
 * Access token mang sẵn claim roleID/roleName/clubRole/clubId và sống 24h, nên sau khi quyền
 * thay đổi, token cũ vẫn dùng được quyền cũ cho tới lúc hết hạn. Gọi hàm này ở mọi chỗ làm
 * đổi quyền để dập mốc thời gian; AccountStatusFilter sẽ từ chối token cấp trước mốc đó và
 * client tự gọi /api/auth/refresh để lấy claim mới.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenInvalidationService {

    private final UserRepository userRepository;

    @Transactional
    public void invalidateFor(Integer userId) {
        if (userId == null) {
            return;
        }
        userRepository.findById(userId).ifPresent(user -> {
            user.setTokenInvalidatedAt(LocalDateTime.now());
            userRepository.save(user);
            log.info("Đã thu hồi token hiện có của userID={} do quyền thay đổi", userId);
        });
    }
}
