package com.fptu.fcms.controller;

import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.TokenInvalidationService;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AdminUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTokenInvalidationTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AdminUserService adminUserService;
    @Mock
    private TokenInvalidationService tokenInvalidationService;

    @InjectMocks
    private AdminUserController controller;

    @Test
    void suspendUserInvalidatesPreviouslyIssuedTokens() {
        UserAccount target = user(7, "Active");
        when(userRepository.findByUserIDAndIsDeletedFalse(7)).thenReturn(Optional.of(target));
        UserPrincipal currentAdmin = new UserPrincipal(
                99,
                "admin@fpt.edu.vn",
                1,
                List.of(new SimpleGrantedAuthority("ROLE_Admin"))
        );

        controller.suspendUser(7, currentAdmin);

        assertEquals("Suspended", target.getAccountStatus());
        verify(userRepository).save(target);
        verify(tokenInvalidationService).invalidateFor(7);
    }

    @Test
    void activateUserInvalidatesTokensIssuedBeforeReactivation() {
        UserAccount target = user(7, "Suspended");
        when(userRepository.findByUserIDAndIsDeletedFalse(7)).thenReturn(Optional.of(target));

        controller.activateUser(7);

        assertEquals("Active", target.getAccountStatus());
        verify(userRepository).save(target);
        verify(tokenInvalidationService).invalidateFor(7);
    }

    private UserAccount user(Integer userID, String status) {
        UserAccount user = new UserAccount();
        user.setUserID(userID);
        user.setAccountStatus(status);
        user.setIsDeleted(false);
        return user;
    }
}