package com.fptu.fcms.controller;

import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.KnowledgeArchiveService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class KnowledgeArchiveFileSecurityIntegrationTest {

    private static final Integer OWN_CLUB_ID = 10;
    private static final Integer OTHER_CLUB_ID = 20;
    private static final byte[] PDF_CONTENT = "%PDF-1.4 knowledge archive fixture"
            .getBytes(StandardCharsets.UTF_8);

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KnowledgeArchiveService knowledgeArchiveService;

    private Path testFile;

    @BeforeEach
    void createTestFile() throws Exception {
        Path uploadRoot = Paths.get("uploads", "knowledge-archive").toAbsolutePath().normalize();
        Files.createDirectories(uploadRoot);
        testFile = Files.createTempFile(uploadRoot, "knowledge-archive-security-", ".pdf");
        Files.write(testFile, PDF_CONTENT);
    }

    @AfterEach
    void cleanUpTestFile() throws Exception {
        Files.deleteIfExists(testFile);
    }

    @Test
    void unauthenticatedRequestIsRejectedBySecurityFilterChain() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 501))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(knowledgeArchiveService);
    }

    @Test
    void memberCanOpenPublicFile() throws Exception {
        when(knowledgeArchiveService.getById(502))
                .thenReturn(archive(502, OTHER_CLUB_ID, "Public", testFile));

        expectPdf(502, principal("Member", null, null));
    }

    @Test
    void memberCannotOpenClubInternalFile() throws Exception {
        when(knowledgeArchiveService.getById(503))
                .thenReturn(archive(503, OTHER_CLUB_ID, "ClubInternal", testFile));

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 503)
                        .with(user(principal("Member", null, null))))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Leader", "ViceLeader"})
    void leaderAndViceLeaderCanOpenOwnClubInternalFile(String clubRole) throws Exception {
        when(knowledgeArchiveService.getById(504))
                .thenReturn(archive(504, OWN_CLUB_ID, "ClubInternal", testFile));

        expectPdf(504, principal("Student", clubRole, OWN_CLUB_ID));
    }

    @ParameterizedTest
    @ValueSource(strings = {"Leader", "ViceLeader"})
    void leaderAndViceLeaderCannotOpenAnotherClubInternalFile(String clubRole) throws Exception {
        when(knowledgeArchiveService.getById(505))
                .thenReturn(archive(505, OTHER_CLUB_ID, "ClubInternal", testFile));

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 505)
                        .with(user(principal("Student", clubRole, OWN_CLUB_ID))))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Admin", "ICPDP"})
    void adminAndIcpdpCanOpenAnyClubFile(String roleName) throws Exception {
        when(knowledgeArchiveService.getById(506))
                .thenReturn(archive(506, OTHER_CLUB_ID, "ClubInternal", testFile));

        expectPdf(506, principal(roleName, null, null));
    }

    @Test
    void missingOriginalFileReturnsNotFound() throws Exception {
        Path missingFile = testFile.getParent().resolve("missing-original-file.pdf");
        Files.deleteIfExists(missingFile);
        when(knowledgeArchiveService.getById(507))
                .thenReturn(archive(507, OTHER_CLUB_ID, "Public", missingFile));

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 507)
                        .with(user(principal("Member", null, null))))
                .andExpect(status().isNotFound());
    }

    @Test
    void pathOutsideKnowledgeArchiveRootIsForbidden() throws Exception {
        Path outsideRoot = Paths.get("..", "secret.pdf");
        when(knowledgeArchiveService.getById(508))
                .thenReturn(archive(508, OTHER_CLUB_ID, "Public", outsideRoot));

        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", 508)
                        .with(user(principal("Member", null, null))))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.CONTENT_DISPOSITION));
    }

    private void expectPdf(Integer archiveId, UserPrincipal principal) throws Exception {
        mockMvc.perform(get("/api/v1/knowledge-archive/{id}/file", archiveId)
                        .with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(content().bytes(PDF_CONTENT));
    }

    private UserPrincipal principal(String roleName, String clubRole, Integer clubId) {
        return new UserPrincipal(
                99,
                roleName.toLowerCase() + "@fpt.edu.vn",
                3,
                roleName,
                clubRole,
                clubId,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
    }

    private KnowledgeArchive archive(
            Integer archiveId,
            Integer clubId,
            String visibilityScope,
            Path filePath
    ) {
        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(archiveId);
        archive.setClubID(clubId);
        archive.setTitle("Archive " + archiveId);
        archive.setVisibilityScope(visibilityScope);
        archive.setSourceFormat("PDF");
        archive.setFileUrl(filePath.toString());
        archive.setIsDeleted(false);
        return archive;
    }
}
