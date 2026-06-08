package com.fptu.fcms.security.oauth2;

import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final SystemRoleRepository roleRepository;

    public CustomOAuth2UserService(UserRepository userRepository, SystemRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. Lấy thông tin User từ Google (thông qua class cha)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. Trích xuất Email và Tên từ dữ liệu Google trả về
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            throw new OAuth2AuthenticationException(new OAuth2Error("email_not_found"), "Không lấy được email từ Google.");
        }




        // 3. Kiểm tra User đã tồn tại trong Database chưa
        Optional<UserAccount> userOptional = userRepository.findByEmailAndIsDeletedFalse(email);
        UserAccount userEntity;

        if (userOptional.isPresent()) {
            // Đã tồn tại -> Lấy lên
            userEntity = userOptional.get();
        } else {
            // Chưa tồn tại -> Tự động tạo mới (JIT Provisioning)
            // Sinh viên mới đăng nhập lần đầu sẽ mặc định được cấp Role "Student"
            SystemRole studentRole = roleRepository.findByRoleName("Student")
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Role 'Student' trong hệ thống."));

            userEntity = new UserAccount();
            userEntity.setEmail(email);
            userEntity.setFullName(name != null ? name : "Unknown");


            userEntity.setRoleID(studentRole.getRoleID());

            userEntity.setAccountStatus("Active");
            userEntity.setIsDeleted(false);

            userEntity.setCreatedAt(java.time.LocalDateTime.now());
            userEntity = userRepository.save(userEntity);
        }

        // 5. Đóng gói vào UserPrincipal để hệ thống nội bộ xử lý
        return new UserPrincipal(
                userEntity.getUserID(),
                userEntity.getEmail(),
                userEntity.getRoleID(),
                new ArrayList<>() // Authorities (Quyền) để sau này xử lý
        );
    }
}