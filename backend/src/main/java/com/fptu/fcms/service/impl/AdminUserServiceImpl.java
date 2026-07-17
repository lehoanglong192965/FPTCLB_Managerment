package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateIcpdpRequest;
import com.fptu.fcms.dto.response.AdminUserResponse;
import com.fptu.fcms.dto.response.ProvisionIcpdpResponse;
import com.fptu.fcms.entity.AllowedEmail;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.ProvisionIcpdpAction;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final AllowedEmailRepository allowedEmailRepository;

    @Override
    @Transactional
    public ProvisionIcpdpResponse provisionIcpdp(CreateIcpdpRequest request, Integer currentAdminId) {
        // 1. Normalize email and fullName
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String fullName = request.getFullName().trim();

        // 2. Lấy Role Admin và ICPDP
        SystemRole adminRole = systemRoleRepository.findByRoleName("Admin")
                .orElseThrow(() -> new RuntimeException("Lỗi cấu hình: Không tìm thấy Role Admin trong hệ thống."));
        SystemRole icpdpRole = systemRoleRepository.findByRoleName("ICPDP")
                .orElseThrow(() -> new RuntimeException("Lỗi cấu hình: Không tìm thấy Role ICPDP trong hệ thống."));

        // 3. Lấy thông tin user hiện tại (current admin)
        UserAccount currentAdmin = userRepository.findByUserIDAndIsDeletedFalse(currentAdminId)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy thông tin Admin hiện tại.", HttpStatus.NOT_FOUND));

        if (!currentAdmin.getRoleID().equals(adminRole.getRoleID())) {
            throw new BusinessRuleException("Bạn không có quyền thực hiện chức năng này.", HttpStatus.FORBIDDEN);
        }

        // 4. Tìm kiếm active UserAccount theo email
        Optional<UserAccount> activeUserOpt = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(email);
        UserAccount targetUser;
        ProvisionIcpdpAction action;
        String message;

        if (activeUserOpt.isEmpty()) {
            // 5. Nếu không có active user -> tìm user soft-deleted
            Optional<UserAccount> deletedUserOpt = userRepository.findAnyByEmailIgnoreCase(email);
            if (deletedUserOpt.isPresent()) {
                throw new BusinessRuleException("Email này thuộc một tài khoản đã bị xóa. Vui lòng khôi phục hoặc xử lý tài khoản cũ trước.", HttpStatus.CONFLICT);
            }

            // Tạo mới user hoàn toàn
            targetUser = new UserAccount();
            targetUser.setEmail(email);
            targetUser.setFullName(fullName);
            targetUser.setRoleID(icpdpRole.getRoleID());
            targetUser.setAccountStatus("Active");
            targetUser.setIsDeleted(false);
            targetUser.setCreatedAt(LocalDateTime.now());
            // password có thể để null
            
            targetUser = userRepository.save(targetUser);
            action = ProvisionIcpdpAction.CREATED;
            message = "Đã tạo và cấp trước tài khoản ICPDP.";
        } else {
            // 6. Nếu active user tồn tại
            targetUser = activeUserOpt.get();

            if (targetUser.getUserID().equals(currentAdminId)) {
                throw new BusinessRuleException("Không thể tự thay đổi quyền của chính mình.", HttpStatus.FORBIDDEN);
            }
            if (targetUser.getRoleID().equals(adminRole.getRoleID())) {
                throw new BusinessRuleException("Không thể thay đổi quyền của Admin khác.", HttpStatus.FORBIDDEN);
            }
            if ("Suspended".equalsIgnoreCase(targetUser.getAccountStatus())) {
                throw new BusinessRuleException("Tài khoản đang bị tạm khóa. Vui lòng mở khóa trước khi cấp quyền ICPDP.", HttpStatus.CONFLICT);
            }

            if (targetUser.getRoleID().equals(icpdpRole.getRoleID())) {
                // Đã là ICPDP
                targetUser.setFullName(fullName);
                targetUser = userRepository.save(targetUser);
                action = ProvisionIcpdpAction.ALREADY_ICPDP;
                message = "Tài khoản đã có quyền ICPDP. Thông tin đã được cập nhật.";
            } else {
                // Nâng cấp lên ICPDP
                targetUser.setRoleID(icpdpRole.getRoleID());
                targetUser.setFullName(fullName);
                targetUser = userRepository.save(targetUser);
                action = ProvisionIcpdpAction.UPGRADED;
                message = "Đã nâng cấp tài khoản hiện có lên ICPDP.";
            }
        }

        // 7. Xử lý Whitelist cho email không thuộc FPT/FE
        boolean whitelistAdded = false;
        if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")) {
            Optional<AllowedEmail> whitelistOpt = allowedEmailRepository.findAnyByEmailIgnoreCase(email);
            if (whitelistOpt.isPresent()) {
                AllowedEmail allowedEmail = whitelistOpt.get();
                if (Boolean.TRUE.equals(allowedEmail.getIsDeleted())) {
                    allowedEmail.setIsDeleted(false);
                    allowedEmailRepository.save(allowedEmail);
                    whitelistAdded = true; // Restored
                }
            } else {
                AllowedEmail newAllowedEmail = new AllowedEmail();
                newAllowedEmail.setEmail(email);
                allowedEmailRepository.save(newAllowedEmail);
                whitelistAdded = true; // Created
            }
        }

        // 8. Map to Response
        AdminUserResponse userResponse = AdminUserResponse.builder()
                .userID(targetUser.getUserID())
                .roleID(targetUser.getRoleID())
                .email(targetUser.getEmail())
                .fullName(targetUser.getFullName())
                .studentId(targetUser.getStudentId())
                .phoneNumber(targetUser.getPhoneNumber())
                .major(targetUser.getMajor())
                .accountStatus(targetUser.getAccountStatus())
                .createdAt(targetUser.getCreatedAt())
                .build();

        return ProvisionIcpdpResponse.builder()
                .user(userResponse)
                .action(action)
                .whitelistAdded(whitelistAdded)
                .message(message)
                .build();
    }
}
