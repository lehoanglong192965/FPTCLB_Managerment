package com.fptu.fcms.service.impl;
import com.fptu.fcms.repository.ClubMembershipRepository;
import com.fptu.fcms.dto.request.ClubBlacklistRequest;
import com.fptu.fcms.entity.ClubBlacklist;
import com.fptu.fcms.repository.ClubBlacklistRepository;
import com.fptu.fcms.repository.ClubRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.ClubBlacklistService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ClubBlacklistServiceImpl
        implements ClubBlacklistService {

    private final ClubBlacklistRepository
            clubBlacklistRepository;

    private final ClubRepository
            clubRepository;
    private final ClubMembershipRepository
            clubMembershipRepository;

    private final UserRepository
            userRepository;

    // Lấy danh sách blacklist của CLB
    @Override
    public Object getBlacklist(Long clubID) {

        return clubBlacklistRepository
                .findByClubIDAndIsDeletedFalse(
                        clubID.intValue()
                );
    }

    // Thêm sinh viên vào blacklist
    @Override
    public Object addToBlacklist(
            Long clubID,
            ClubBlacklistRequest request
    ) {

        // Kiểm tra CLB tồn tại
        clubRepository.findById(
                        clubID.intValue()
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Club not found"
                        ));
        // Kiểm tra user tồn tại
        userRepository.findById(
                        request.getUserID().intValue()
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "User not found"
                        ));
        // Lấy thông tin tài khoản đang đăng nhập từ JWT
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        // Lấy email từ Security Context
        String email =
                authentication.getName();

        // Tìm user hiện tại trong database
        Integer currentUserID =
                userRepository
                        .findByEmailAndIsDeletedFalse(email)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Current user not found"
                                ))
                        .getUserID();

// Không cho phép Leader tự thêm chính mình vào blacklist
        if (currentUserID.equals(
                request.getUserID().intValue()
        )) {
            throw new RuntimeException(
                    "Leader cannot add himself to blacklist"
            );
        }

        // Kiểm tra user có thuộc CLB này không
        boolean isMember =
                clubMembershipRepository
                        .existsByClubIDAndUserIDAndIsDeletedFalse(
                                clubID.intValue(),
                                request.getUserID().intValue()
                        );

        if (!isMember) {
            throw new RuntimeException(
                    "Student does not belong to this club"
            );
        }

        // Kiểm tra user đã nằm trong blacklist chưa
        boolean exists =
                clubBlacklistRepository
                        .existsByClubIDAndUserIDAndIsDeletedFalse(
                                clubID.intValue(),
                                request.getUserID().intValue()
                        );

        if (exists) {
            throw new RuntimeException(
                    "User already in blacklist"
            );
        }

        // Tạo blacklist mới
        ClubBlacklist blacklist =
                new ClubBlacklist();

        blacklist.setClubID(
                clubID.intValue()
        );

        blacklist.setUserID(
                request.getUserID().intValue()
        );

        blacklist.setReason(
                request.getReason()
        );

        blacklist.setCreatedAt(
                LocalDateTime.now()
        );

        blacklist.setIsDeleted(false);

        return clubBlacklistRepository.save(
                blacklist
        );
    }

    // Cập nhật blacklist
    @Override
    public Object updateBlacklist(
            Long clubID,
            Long blacklistID,
            ClubBlacklistRequest request
    ) {

        // Tìm blacklist theo ID
        ClubBlacklist blacklist =
                clubBlacklistRepository
                        .findByBlacklistIDAndIsDeletedFalse(
                                blacklistID.intValue()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Blacklist not found"
                                ));

        // Chặn update nhầm blacklist của CLB khác
        if (!blacklist.getClubID().equals(clubID.intValue())) {
            throw new RuntimeException(
                    "Blacklist does not belong to this club"
            );
        }

        // Cập nhật lý do blacklist
        blacklist.setReason(
                request.getReason()
        );

        return clubBlacklistRepository.save(
                blacklist
        );
    }

    // Xóa mềm blacklist
    @Override
    public void removeBlacklist(
            Long clubID,
            Long blacklistID
    ) {

        // Tìm blacklist theo ID
        ClubBlacklist blacklist =
                clubBlacklistRepository
                        .findByBlacklistIDAndIsDeletedFalse(
                                blacklistID.intValue()
                        )
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Blacklist not found"
                                ));
        // check này sau khi tìm được blacklist
        if (!blacklist.getClubID().equals(clubID.intValue())) {
            throw new RuntimeException(
                    "Blacklist does not belong to this club"
            );
        }

        // Soft delete blacklist
        blacklist.setIsDeleted(true);

        clubBlacklistRepository.save(
                blacklist
        );
    }
}