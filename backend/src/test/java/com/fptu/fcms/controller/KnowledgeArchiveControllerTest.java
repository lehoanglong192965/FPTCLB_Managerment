package com.fptu.fcms.controller;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.exception.GlobalExceptionHandler;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.KnowledgeArchiveService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class KnowledgeArchiveControllerTest {

    private static final Integer F_CODE_CLUB_ID = 10;
    private static final Integer JS_CLUB_ID = 20;

    private MockMvc mockMvc;
    private KnowledgeArchiveService knowledgeArchiveService;
    private final List<Path> testFiles = new ArrayList<>();

    @BeforeEach
    void setUp() {
        knowledgeArchiveService = mock(KnowledgeArchiveService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new KnowledgeArchiveController(knowledgeArchiveService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }
    @AfterEach
    void cleanUpFiles() throws IOException {
        for (Path testFile : testFiles) {
            Files.deleteIfExists(testFile);
        }
    }

    @Test
    @DisplayName("TC2-13: ViceLeader GET /club/{otherClub} -> 403")
    void tc2_12_viceLeaderCannotListOtherClubArchives() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge-archive/club/{clubID}", JS_CLUB_ID)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isForbidden());

        verify(knowledgeArchiveService, never()).getByClub(any());
    }

    @Test
    @DisplayName("TC2-14: ViceLeader GET /{id} other ClubInternal -> 403; Public -> 200")
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
    @DisplayName("GET /{id}: response must not expose internal fileUrl")
    void getByIdDoesNotExposeInternalFileUrl() throws Exception {
        KnowledgeArchive publicArchive = archive(501, JS_CLUB_ID, "Public", "Completed");
        publicArchive.setFileUrl("uploads/knowledge-archive/internal-secret.pdf");
        when(knowledgeArchiveService.getById(501)).thenReturn(publicArchive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}", 501)
                        .principal(regularUser("Student")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileUrl").doesNotExist());
    }

    @Test
    @DisplayName("TC2-15: ViceLeader DELETE archive from other club -> 403")
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
    @DisplayName("TC2-16: Admin/ICPDP protected endpoints for any club -> no 403")
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

    @ParameterizedTest
    @ValueSource(strings = {"Admin", "ICPDP"})
    @DisplayName("File download: Admin/ICPDP can download a file from any club -> 200")
    void adminOrIcpdpCanDownloadAnyArchiveFile(String roleName) throws Exception {
        KnowledgeArchive archive = archive(401, JS_CLUB_ID, "ClubInternal", "Completed");
        archive.setSourceFormat("PDF");
        archive.setFileUrl(createArchiveFile(".pdf"));
        when(knowledgeArchiveService.getById(401)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 401)
                        .principal(adminOrIcpdp(roleName)))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                        .bytes("Knowledge Archive test file".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Standalone controller: request without UserPrincipal is forbidden")
    void requestWithoutUserPrincipalIsForbiddenInStandaloneControllerTest() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 407))
                .andExpect(status().isForbidden());

        verify(knowledgeArchiveService, never()).getById(any());
    }

    @Test
    @DisplayName("File download: missing original file returns 404")
    void missingOriginalFileReturnsNotFound() throws Exception {
        KnowledgeArchive archive = archive(408, JS_CLUB_ID, "Public", "Completed");
        Path missingFile = Paths.get("uploads", "knowledge-archive", "missing-original-file.pdf")
                .toAbsolutePath()
                .normalize();
        Files.deleteIfExists(missingFile);
        archive.setSourceFormat("PDF");
        archive.setFileUrl(missingFile.toString());
        when(knowledgeArchiveService.getById(408)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 408)
                        .principal(regularUser("Student")))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("File download: own-club ViceLeader can download ClubInternal file -> 200")
    void viceLeaderCanDownloadOwnClubFile() throws Exception {
        KnowledgeArchive archive = archive(402, F_CODE_CLUB_ID, "ClubInternal", "Completed");
        archive.setFileUrl(createArchiveFile(".md"));
        when(knowledgeArchiveService.getById(402)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 402)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("File download: ViceLeader from another club is forbidden")
    void viceLeaderCannotDownloadOtherClubFile() throws Exception {
        KnowledgeArchive archive = archive(403, JS_CLUB_ID, "ClubInternal", "Completed");
        when(knowledgeArchiveService.getById(403)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 403)
                        .principal(viceLeaderOfFCode()))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Student", "Member"})
    @DisplayName("File download: Student/Member can download Public file -> 200")
    void studentOrMemberCanDownloadPublicFile(String roleName) throws Exception {
        KnowledgeArchive archive = archive(404, JS_CLUB_ID, "Public", "Completed");
        archive.setFileUrl(createArchiveFile(".txt"));
        when(knowledgeArchiveService.getById(404)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 404)
                        .principal(regularUser(roleName)))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Student", "Member"})
    @DisplayName("File download: Student/Member cannot download ClubInternal file -> 403")
    void studentOrMemberCannotDownloadClubInternalFile(String roleName) throws Exception {
        KnowledgeArchive archive = archive(405, JS_CLUB_ID, "ClubInternal", "Completed");
        when(knowledgeArchiveService.getById(405)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 405)
                        .principal(regularUser(roleName)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("File download: path outside knowledge-archive upload root is rejected")
    void downloadRejectsPathOutsideKnowledgeArchiveUploadRoot() throws Exception {
        KnowledgeArchive archive = archive(406, JS_CLUB_ID, "Public", "Completed");
        archive.setFileUrl(Paths.get("..", "secret.pdf").toString());
        when(knowledgeArchiveService.getById(406)).thenReturn(archive);

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 406)
                        .principal(regularUser("Student")))
                .andExpect(status().isForbidden())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .doesNotExist(HttpHeaders.CONTENT_DISPOSITION));
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
    private String createArchiveFile(String suffix) throws IOException {
        Path uploadRoot = Paths.get("uploads", "knowledge-archive").toAbsolutePath().normalize();
        Files.createDirectories(uploadRoot);
        Path testFile = Files.createTempFile(uploadRoot, "knowledge-archive-controller-", suffix);
        Files.writeString(testFile, "Knowledge Archive test file");
        testFiles.add(testFile);
        return testFile.toString();
    }
}
