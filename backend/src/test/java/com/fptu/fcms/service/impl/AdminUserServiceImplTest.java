package com.fptu.fcms.service.impl;

import com.fptu.fcms.dto.request.CreateIcpdpRequest;
import com.fptu.fcms.dto.response.ProvisionIcpdpResponse;
import com.fptu.fcms.entity.AllowedEmail;
import com.fptu.fcms.entity.SystemRole;
import com.fptu.fcms.entity.UserAccount;
import com.fptu.fcms.enums.ProvisionIcpdpAction;
import com.fptu.fcms.exception.BusinessRuleException;
import com.fptu.fcms.repository.AllowedEmailRepository;
import com.fptu.fcms.repository.SystemRoleRepository;
import com.fptu.fcms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private AllowedEmailRepository allowedEmailRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private CreateIcpdpRequest defaultRequest;
    private UserAccount adminUser;
    private SystemRole adminRole;
    private SystemRole icpdpRole;

    @BeforeEach
    void setUp() {
        defaultRequest = new CreateIcpdpRequest(" test@gmail.com ", " Test User ");

        adminRole = new SystemRole();
        adminRole.setRoleID(1);
        adminRole.setRoleName("Admin");

        icpdpRole = new SystemRole();
        icpdpRole.setRoleID(2);
        icpdpRole.setRoleName("ICPDP");

        adminUser = new UserAccount();
        adminUser.setUserID(100);
        adminUser.setRoleID(1);

        lenient().when(systemRoleRepository.findByRoleName("Admin")).thenReturn(Optional.of(adminRole));
        lenient().when(systemRoleRepository.findByRoleName("ICPDP")).thenReturn(Optional.of(icpdpRole));
        lenient().when(userRepository.findByUserIDAndIsDeletedFalse(100)).thenReturn(Optional.of(adminUser));
    }

    @Test
    void testAdminCreateIcpdp_NewGmail_ShouldCreateUserAndWhitelist() {
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.empty());
        when(allowedEmailRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(UserAccount.class))).thenAnswer(i -> {
            UserAccount u = i.getArgument(0);
            u.setUserID(200);
            return u;
        });

        ProvisionIcpdpResponse response = adminUserService.provisionIcpdp(defaultRequest, 100);

        assertEquals(ProvisionIcpdpAction.CREATED, response.getAction());
        assertTrue(response.isWhitelistAdded());
        verify(allowedEmailRepository).save(any(AllowedEmail.class));
        verify(userRepository).save(any(UserAccount.class));
    }

    @Test
    void testAdminCreateIcpdp_NewFptEmail_ShouldCreateUserNoWhitelist() {
        defaultRequest.setEmail("test@fpt.edu.vn");
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@fpt.edu.vn")).thenReturn(Optional.empty());
        when(userRepository.findAnyByEmailIgnoreCase("test@fpt.edu.vn")).thenReturn(Optional.empty());
        when(userRepository.save(any(UserAccount.class))).thenAnswer(i -> {
            UserAccount u = i.getArgument(0);
            u.setUserID(200);
            return u;
        });

        ProvisionIcpdpResponse response = adminUserService.provisionIcpdp(defaultRequest, 100);

        assertEquals(ProvisionIcpdpAction.CREATED, response.getAction());
        assertFalse(response.isWhitelistAdded());
        verify(allowedEmailRepository, never()).save(any());
    }

    @Test
    void testAdminCreateIcpdp_WhitelistActive_ShouldNotDuplicate() {
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.empty());
        
        AllowedEmail activeWhitelist = new AllowedEmail();
        activeWhitelist.setIsDeleted(false);
        when(allowedEmailRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.of(activeWhitelist));
        
        when(userRepository.save(any(UserAccount.class))).thenAnswer(i -> i.getArgument(0));

        ProvisionIcpdpResponse response = adminUserService.provisionIcpdp(defaultRequest, 100);

        assertEquals(ProvisionIcpdpAction.CREATED, response.getAction());
        assertFalse(response.isWhitelistAdded()); // Since it was already there and active
        verify(allowedEmailRepository, never()).save(any());
    }

    @Test
    void testAdminCreateIcpdp_WhitelistSoftDeleted_ShouldRestore() {
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.empty());
        
        AllowedEmail deletedWhitelist = new AllowedEmail();
        deletedWhitelist.setIsDeleted(true);
        when(allowedEmailRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.of(deletedWhitelist));
        
        when(userRepository.save(any(UserAccount.class))).thenAnswer(i -> i.getArgument(0));

        ProvisionIcpdpResponse response = adminUserService.provisionIcpdp(defaultRequest, 100);

        assertEquals(ProvisionIcpdpAction.CREATED, response.getAction());
        assertTrue(response.isWhitelistAdded());
        assertFalse(deletedWhitelist.getIsDeleted());
        verify(allowedEmailRepository).save(deletedWhitelist);
    }

    @Test
    void testAdminCreateIcpdp_ExistingStudent_ShouldUpgrade() {
        UserAccount student = new UserAccount();
        student.setUserID(200);
        student.setRoleID(3); // Student role
        student.setAccountStatus("Active");
        student.setEmail("test@gmail.com");

        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.of(student));
        when(userRepository.save(any(UserAccount.class))).thenAnswer(i -> i.getArgument(0));

        ProvisionIcpdpResponse response = adminUserService.provisionIcpdp(defaultRequest, 100);

        assertEquals(ProvisionIcpdpAction.UPGRADED, response.getAction());
        assertEquals("Test User", student.getFullName());
        assertEquals(2, student.getRoleID());
    }

    @Test
    void testAdminCreateIcpdp_ExistingIcpdp_ShouldBeIdempotent() {
        UserAccount icpdp = new UserAccount();
        icpdp.setUserID(200);
        icpdp.setRoleID(2);
        icpdp.setAccountStatus("Active");
        icpdp.setEmail("test@gmail.com");

        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.of(icpdp));
        when(userRepository.save(any(UserAccount.class))).thenAnswer(i -> i.getArgument(0));

        ProvisionIcpdpResponse response = adminUserService.provisionIcpdp(defaultRequest, 100);

        assertEquals(ProvisionIcpdpAction.ALREADY_ICPDP, response.getAction());
        assertEquals("Test User", icpdp.getFullName());
    }

    @Test
    void testAdminCreateIcpdp_SelfAdmin_ShouldReject403() {
        adminUser.setEmail("test@gmail.com");
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.of(adminUser));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> 
            adminUserService.provisionIcpdp(defaultRequest, 100)
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void testAdminCreateIcpdp_OtherAdmin_ShouldReject403() {
        UserAccount otherAdmin = new UserAccount();
        otherAdmin.setUserID(101);
        otherAdmin.setRoleID(1);
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.of(otherAdmin));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> 
            adminUserService.provisionIcpdp(defaultRequest, 100)
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void testAdminCreateIcpdp_SuspendedUser_ShouldReject409() {
        UserAccount suspended = new UserAccount();
        suspended.setUserID(200);
        suspended.setRoleID(3);
        suspended.setAccountStatus("Suspended");
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.of(suspended));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> 
            adminUserService.provisionIcpdp(defaultRequest, 100)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void pendingUserShouldBeRejected409() {
        UserAccount pending = new UserAccount();
        pending.setUserID(200);
        pending.setRoleID(3);
        pending.setAccountStatus("PENDING");

        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com"))
                .thenReturn(Optional.of(pending));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> adminUserService.provisionIcpdp(defaultRequest, 100)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(userRepository, never()).save(pending);
    }
    @Test
    void testAdminCreateIcpdp_SoftDeletedUser_ShouldReject409() {
        when(userRepository.findByEmailIgnoreCaseAndIsDeletedFalse("test@gmail.com")).thenReturn(Optional.empty());
        UserAccount deleted = new UserAccount();
        deleted.setIsDeleted(true);
        when(userRepository.findAnyByEmailIgnoreCase("test@gmail.com")).thenReturn(Optional.of(deleted));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> 
            adminUserService.provisionIcpdp(defaultRequest, 100)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }
}
