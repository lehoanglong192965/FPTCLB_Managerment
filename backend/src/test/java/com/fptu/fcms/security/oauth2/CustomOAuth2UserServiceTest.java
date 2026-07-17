package com.fptu.fcms.security.oauth2;

import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import com.fptu.fcms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomOAuth2UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private AllowedEmailRepository allowedEmailRepository;

    private CustomOAuth2UserService customOAuth2UserService;

    @BeforeEach
    void setUp() {
        customOAuth2UserService = spy(new CustomOAuth2UserService(userRepository, systemRoleRepository, allowedEmailRepository));
        
        org.springframework.security.oauth2.core.user.OAuth2User mockGoogleUser = new org.springframework.security.oauth2.core.user.DefaultOAuth2User(
                null, 
                Map.of("email", " PRESEED@gmail.com ", "name", "Preseed User"), 
                "email"
        );
        doReturn(mockGoogleUser).when(customOAuth2UserService).getGoogleUser(any());
    }

    @Test
    void testLoadUser_PreSeededIcpdp_ShouldNotCreateStudent() {
        // Arrange
        when(allowedEmailRepository.existsByEmailIgnoreCase("preseed@gmail.com")).thenReturn(true);
        
        UserAccount preSeededUser = new UserAccount();
        preSeededUser.setUserID(999);
        preSeededUser.setEmail("preseed@gmail.com");
        preSeededUser.setRoleID(2); // ICPDP role

        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("preseed@gmail.com")).thenReturn(Optional.of(preSeededUser));

        // Act
        OAuth2UserRequest dummyRequest = mock(OAuth2UserRequest.class); // Ignored by our overridden loadUser
        UserPrincipal principal = (UserPrincipal) customOAuth2UserService.loadUser(dummyRequest);

        // Assert
        assertEquals(999, principal.getUserId());
        assertEquals(2, principal.getRoleId());
        assertEquals("preseed@gmail.com", principal.getEmail());
        
        // Verify we didn't try to save a new user (which would happen if they weren't found)
        verify(userRepository, never()).save(any());
        verify(systemRoleRepository, never()).findByRoleName(anyString());
    }
}
