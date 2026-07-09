package com.fptu.fcms.controller;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.exception.GlobalExceptionHandler;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.KnowledgeArchiveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class KnowledgeArchiveControllerTest {

    private static final Integer F_CODE_CLUB_ID = 10;
    private static final Integer JS_CLUB_ID = 20;

    private MockMvc mockMvc;
    private KnowledgeArchiveService knowledgeArchiveService;

    @BeforeEach
    void setUp() {
        knowledgeArchiveService = mock(KnowledgeArchiveService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new KnowledgeArchiveController(knowledgeArchiveService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("TC2-12: ViceLeader CLB F-Code gọi GET /club/{id JS Club} -> 403")
    void tc2_12_viceLeaderCannotListOtherClubArchives() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge-archive/club/{clubID}", JS_CLUB_ID)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isForbidden());

        verify(knowledgeArchiveService, never()).getByClub(any());
    }

    @Test
    @DisplayName("TC2-13: ViceLeader bị chặn tài liệu ClubInternal CLB khác nhưng xem được Public")
    void tc2_13_viceLeaderCannotReadOtherClubInternalButCanReadPublic() throws Exception {
        KnowledgeArchive internalArchive = archive(101, JS_CLUB_ID, "ClubInternal", "Completed");
        when(knowledgeArchiveService.getById(101)).thenReturn(internalArchive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}", 101)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isForbidden());

        KnowledgeArchive publicArchive = archive(102, JS_CLUB_ID, "Public", "Completed");
        when(knowledgeArchiveService.getById(102)).thenReturn(publicArchive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}", 102)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC2-14: ViceLeader không được DELETE tài liệu CLB khác và không gọi service.delete")
    void tc2_14_viceLeaderCannotDeleteOtherClubArchive() throws Exception {
        KnowledgeArchive otherClubArchive = archive(201, JS_CLUB_ID, "ClubInternal", "Completed");
        when(knowledgeArchiveService.getById(201)).thenReturn(otherClubArchive);

        mockMvc.perform(delete("/api/v1/knowledge-archive/{id}", 201)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isForbidden());

        assertThat(otherClubArchive.getIsDeleted()).isFalse();
        verify(knowledgeArchiveService, never()).delete(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Student", "Member"})
    @DisplayName("DELETE Public: Member/Student không được xoá tài liệu Public")
    void memberOrStudentCannotDeletePublicArchive(String roleName) throws Exception {
        KnowledgeArchive publicArchive = archive(211, JS_CLUB_ID, "Public", "Completed");
        when(knowledgeArchiveService.getById(211)).thenReturn(publicArchive);

        mockMvc.perform(delete("/api/v1/knowledge-archive/{id}", 211)
                        .principal(regularUser(roleName)))
                .andExpect(status().isForbidden());

        assertThat(publicArchive.getIsDeleted()).isFalse();
        verify(knowledgeArchiveService, never()).delete(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Student", "Member"})
    @DisplayName("Reindex Public: Member/Student không được reindex tài liệu Public")
    void memberOrStudentCannotReindexPublicArchive(String roleName) throws Exception {
        KnowledgeArchive publicArchive = archive(212, JS_CLUB_ID, "Public", "Failed");
        when(knowledgeArchiveService.getById(212)).thenReturn(publicArchive);

        mockMvc.perform(post("/api/v1/knowledge-archive/{id}/reindex", 212)
                        .principal(regularUser(roleName)))
                .andExpect(status().isForbidden());

        verify(knowledgeArchiveService, never()).reindex(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Public", "ClubInternal"})
    @DisplayName("ViceLeader đúng club được DELETE/reindex Public hoặc ClubInternal của chính CLB")
    void ownClubViceLeaderCanDeleteAndReindexOwnClubArchive(String visibilityScope) throws Exception {
        KnowledgeArchive archive = archive(221, F_CODE_CLUB_ID, visibilityScope, "Failed");
        when(knowledgeArchiveService.getById(221)).thenReturn(archive);

        mockMvc.perform(delete("/api/v1/knowledge-archive/{id}", 221)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/knowledge-archive/{id}/reindex", 221)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isOk());

        verify(knowledgeArchiveService).delete(221);
        verify(knowledgeArchiveService).reindex(221);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Admin", "ICPDP"})
    @DisplayName("TC2-15: ADMIN/ICPDP gọi cả 4 endpoint với CLB bất kỳ không bị 403")
    void tc2_15_adminAndIcpdpCanAccessAllProtectedEndpoints(String roleName) throws Exception {
        Authentication principal = adminOrIcpdp(roleName);
        KnowledgeArchive archive = archive(301, JS_CLUB_ID, "ClubInternal", "Failed");

        when(knowledgeArchiveService.getByClub(JS_CLUB_ID)).thenReturn(List.of(archive));
        when(knowledgeArchiveService.getById(301)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/club/{clubID}", JS_CLUB_ID)
                        .principal(principal))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}", 301)
                        .principal(principal))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/knowledge-archive/{id}", 301)
                        .principal(principal))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/knowledge-archive/{id}/reindex", 301)
                        .principal(principal))
                .andExpect(status().isOk());

        verify(knowledgeArchiveService).getByClub(JS_CLUB_ID);
        verify(knowledgeArchiveService, times(3)).getById(301);
        verify(knowledgeArchiveService).delete(301);
        verify(knowledgeArchiveService).reindex(301);
    }

    private Authentication viceLeaderOfFCode() {
        UserPrincipal principal = new UserPrincipal(
                11,
                "viceleader@fpt.edu.vn",
                3,
                "Student",
                "ViceLeader",
                F_CODE_CLUB_ID,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private Authentication adminOrIcpdp(String roleName) {
        UserPrincipal principal = new UserPrincipal(
                1,
                roleName.toLowerCase() + "@fpt.edu.vn",
                "Admin".equals(roleName) ? 1 : 2,
                roleName,
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private Authentication regularUser(String roleName) {
        UserPrincipal principal = new UserPrincipal(
                21,
                roleName.toLowerCase() + "@fpt.edu.vn",
                3,
                roleName,
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private KnowledgeArchive archive(Integer archiveID, Integer clubID, String visibilityScope, String indexingStatus) {
        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(archiveID);
        archive.setClubID(clubID);
        archive.setTitle("Knowledge " + archiveID);
        archive.setContent("Knowledge content");
        archive.setFileUrl("uploads/knowledge-archive/" + archiveID + ".md");
        archive.setVisibilityScope(visibilityScope);
        archive.setIndexingStatus(indexingStatus);
        archive.setSourceFormat("MD");
        archive.setUploadedBy(1);
        archive.setIsDeleted(false);
        return archive;
    }
}
