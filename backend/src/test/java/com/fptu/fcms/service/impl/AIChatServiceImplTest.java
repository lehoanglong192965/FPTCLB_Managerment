package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.AIChatRequest;
import com.fptu.fcms.dto.response.AIChatResponse;
import com.fptu.fcms.entity.AIChatAuditLog;
import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.repository.AIChatAuditLogRepository;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.SystemConfigService;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.exception.ModelNotFoundException;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.output.TokenUsage;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AIChatServiceImplTest {

    private KnowledgeArchiveRepository archiveRepository;
    private AIChatAuditLogRepository auditLogRepository;
    private SystemConfigService systemConfigService;
    private ChatModel geminiChatModel;
    private EmbeddingModel queryEmbeddingModel;
    private EmbeddingStore<TextSegment> embeddingStore;
    private ObjectMapper objectMapper;
    private AIChatServiceImpl service;

    @BeforeEach
    void setUp() {
        archiveRepository = mock(KnowledgeArchiveRepository.class);
        auditLogRepository = mock(AIChatAuditLogRepository.class);
        systemConfigService = mock(SystemConfigService.class);
        geminiChatModel = mock(ChatModel.class);
        queryEmbeddingModel = mock(EmbeddingModel.class);
        embeddingStore = new InMemoryEmbeddingStore<>();
        objectMapper = new ObjectMapper();

        service = new AIChatServiceImpl(
                archiveRepository,
                auditLogRepository,
                systemConfigService,
                geminiChatModel,
                queryEmbeddingModel,
                embeddingStore,
                objectMapper
        );
    }

    // ─────────────────────── TC3-08 Fallback ───────────────────────
    @Test
    @DisplayName("TC3-08: RAG Fallback when no chunk meets threshold - geminiChatModel.chat is NEVER called")
    void tc3_08_fallbackWhenNoRelevantChunks() {
        // Mock configs
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Xin lỗi, mình chưa tìm thấy thông tin.");

        // Mock visible archives for a regular student
        UserPrincipal user = studentUser();
        KnowledgeArchive publicArchive = new KnowledgeArchive();
        publicArchive.setArchiveID(101);
        publicArchive.setTitle("Test Public Doc");
        publicArchive.setVisibilityScope("Public");
        publicArchive.setIsDeleted(false);
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(publicArchive));

        // Let the store be empty (no matched chunks)
        // Mock query embedding model
        float[] vector = new float[768];
        Arrays.fill(vector, 0.1f);
        when(queryEmbeddingModel.embed(anyString())).thenReturn(Response.from(Embedding.from(vector)));
        when(queryEmbeddingModel.embed(any(TextSegment.class))).thenReturn(Response.from(Embedding.from(vector)));

        // Send request
        AIChatRequest request = AIChatRequest.builder()
                .message("Làm thế nào để đăng ký CLB?")
                .history(Collections.emptyList())
                .build();

        AIChatResponse response = service.chat(request, user);

        // Verify response matches fallback message
        assertThat(response.getStatus()).isEqualTo("Fallback");
        assertThat(response.getAnswer()).isEqualTo("Xin lỗi, mình chưa tìm thấy thông tin.");
        assertThat(response.getCitations()).isEmpty();

        // Verify geminiChatModel.chat was NEVER called
        verify(geminiChatModel, never()).chat(anyList());
        verify(geminiChatModel, never()).chat(any(ChatMessage[].class));

        // Verify audit log was saved as Fallback
        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        AIChatAuditLog savedLog = logCaptor.getValue();
        assertThat(savedLog.getStatus()).isEqualTo("Fallback");
        assertThat(savedLog.getUserID()).isEqualTo(user.getUserId());
        assertThat(savedLog.getUserPrompt()).isEqualTo("Làm thế nào để đăng ký CLB?");
        assertThat(savedLog.getAiResponse()).isEqualTo("Xin lỗi, mình chưa tìm thấy thông tin.");
        assertThat(savedLog.getCitationsJson()).isEqualTo("[]");
        assertThat(savedLog.getTokensUsed()).isZero();
    }

    // ─────────────────────── TC3-09 History ───────────────────────
    @Test
    @DisplayName("Fallback retains the complete prompt and response in the audit log")
    void fallbackLongerThanLegacyAuditColumnIsRetained() {
        String longFallback = "F".repeat(300);
        String longPrompt = "P".repeat(300);
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn(longFallback);
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(Collections.emptyList());

        AIChatResponse response = service.chat(AIChatRequest.builder()
                .message(longPrompt)
                .history(Collections.emptyList())
                .build(), studentUser());

        assertThat(response.getStatus()).isEqualTo("Fallback");
        assertThat(response.getAnswer()).isEqualTo(longFallback);
        assertThat(response.getCitations()).isEmpty();
        verify(geminiChatModel, never()).chat(anyList());

        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getAiResponse()).isEqualTo(longFallback);
        assertThat(logCaptor.getValue().getUserPrompt()).isEqualTo(longPrompt);
        assertThat(logCaptor.getValue().getTokensUsed()).isZero();
    }

    @Test
    @DisplayName("TC3-09: Conversation history limit - keeps only last 10 messages")
    void tc3_09_conversationHistoryLimit() {
        // Mock configs
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Fallback");

        // Mock visible archives
        UserPrincipal user = studentUser();
        KnowledgeArchive publicArchive = new KnowledgeArchive();
        publicArchive.setArchiveID(101);
        publicArchive.setTitle("Test Public Doc");
        publicArchive.setVisibilityScope("Public");
        publicArchive.setIsDeleted(false);
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(publicArchive));

        // Populate embedding store to yield a match
        float[] vector = new float[768];
        vector[0] = 1.0f; // simplify vector
        Embedding embedding = Embedding.from(vector);
        TextSegment segment = TextSegment.from("Thủ tục đăng ký CLB F-Code gồm 2 bước.",
                dev.langchain4j.data.document.Metadata.from(Map.of("archiveId", "101", "title", "Test Public Doc", "index", 0)));
        embeddingStore.add(embedding, segment);

        // Mock embedding models
        when(queryEmbeddingModel.embed(anyString())).thenReturn(Response.from(embedding));
        when(queryEmbeddingModel.embed(any(TextSegment.class))).thenReturn(Response.from(embedding));

        // Create actual gemini chat response using builder to avoid mocking final class on Java 26
        dev.langchain4j.model.chat.response.ChatResponse mockChatResponse = dev.langchain4j.model.chat.response.ChatResponse.builder()
                .aiMessage(AiMessage.from("Bạn cần làm 2 bước."))
                .tokenUsage(new TokenUsage(11, 7))
                .build();
        when(geminiChatModel.chat(anyList())).thenReturn(mockChatResponse);

        // Create history with 20 messages (10 rounds of Q&A)
        List<AIChatRequest.ChatMessageDto> longHistory = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            longHistory.add(new AIChatRequest.ChatMessageDto("user", "Question " + i));
            longHistory.add(new AIChatRequest.ChatMessageDto("assistant", "Answer " + i));
        }
        // Total messages in longHistory is 20.
        // Expecting only the last 9 messages from history (since maxMessages is 10, and 1 slot is occupied by the new user message)
        // or up to 10 messages from history if new user message takes the 10th.
        // Let's verify that the total size of messages sent to Gemini chat is 11 (1 system message + 10 memory messages).

        AIChatRequest request = AIChatRequest.builder()
                .message("Làm thế nào để đăng ký CLB?")
                .history(longHistory)
                .build();

        AIChatResponse response = service.chat(request, user);

        assertThat(response.getStatus()).isEqualTo("Success");
        assertThat(response.getAnswer()).isEqualTo("Bạn cần làm 2 bước.");
        assertThat(response.getCitations()).hasSize(1);
        assertThat(response.getCitations().get(0).getArchiveId()).isEqualTo(101);
        assertThat(response.getCitations().get(0).getTitle()).isEqualTo("Test Public Doc");
        assertThat(response.getCitations().get(0).getChunkIndex()).isZero();

        // Capture ChatMessages sent to Gemini
        ArgumentCaptor<List<ChatMessage>> messagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(geminiChatModel).chat(messagesCaptor.capture());
        List<ChatMessage> sentMessages = messagesCaptor.getValue();

        // 1 SystemMessage + max 10 messages in memory = 11 total messages
        assertThat(sentMessages).hasSize(11);
        assertThat(sentMessages.get(0)).isInstanceOf(SystemMessage.class);

        // Verify they are the last 10 messages (9 history messages + 1 new user message)
        // History messages from index 11 to 19:
        // Question 6 (index 10 in longHistory), Answer 6 (11), Question 7 (12), Answer 7 (13), Question 8 (14), Answer 8 (15), Question 9 (16), Answer 9 (17), Question 10 (18), Answer 10 (19).
        // Since we have new user message, that is 10 messages total in ChatMemory.
        // Let's verify that the last memory message is our new user question.
        ChatMessage lastMessage = sentMessages.get(sentMessages.size() - 1);
        assertThat(((UserMessage) lastMessage).singleText()).isEqualTo("Làm thế nào để đăng ký CLB?");

        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getStatus()).isEqualTo("Success");
        assertThat(logCaptor.getValue().getTokensUsed()).isEqualTo(18);
    }

    @Test
    @DisplayName("Provider failure after a RAG match returns audited fallback")
    void providerFailureAfterMatchReturnsFallback() {
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Fallback");

        UserPrincipal user = studentUser();
        KnowledgeArchive publicArchive = new KnowledgeArchive();
        publicArchive.setArchiveID(101);
        publicArchive.setTitle("Test Public Doc");
        publicArchive.setVisibilityScope("Public");
        publicArchive.setIsDeleted(false);
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(publicArchive));

        float[] vector = new float[768];
        vector[0] = 1.0f;
        Embedding embedding = Embedding.from(vector);
        embeddingStore.add(embedding, TextSegment.from("RAG context",
                dev.langchain4j.data.document.Metadata.from(Map.of(
                        "archiveId", "101", "title", "Test Public Doc", "index", 0))));
        when(queryEmbeddingModel.embed(anyString())).thenReturn(Response.from(embedding));
        when(geminiChatModel.chat(anyList()))
                .thenThrow(new ModelNotFoundException("Gemini model unavailable"));

        AIChatResponse response = service.chat(AIChatRequest.builder()
                .message("Question with matching context")
                .history(Collections.emptyList())
                .build(), user);

        assertThat(response.getStatus()).isEqualTo("Fallback");
        assertThat(response.getAnswer()).isEqualTo("Fallback");
        assertThat(response.getCitations()).isEmpty();

        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        AIChatAuditLog savedLog = logCaptor.getValue();
        assertThat(savedLog.getStatus()).isEqualTo("Fallback");
        assertThat(savedLog.getTokensUsed()).isZero();
        assertThat(savedLog.getCitationsJson()).isEqualTo("[]");
    }

    @Test
    @DisplayName("A semantic false positive returns the configured audited fallback")
    void semanticFalsePositiveReturnsConfiguredFallback() {
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Configured fallback");

        KnowledgeArchive publicArchive = archive(101, "Public archive", "Public");
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(publicArchive));

        Embedding embedding = embedding();
        embeddingStore.add(embedding, TextSegment.from("Unrelated retrieved excerpt",
                dev.langchain4j.data.document.Metadata.from(Map.of(
                        "archiveId", "101", "title", "Public archive", "index", 0))));
        when(queryEmbeddingModel.embed(anyString())).thenReturn(Response.from(embedding));
        when(geminiChatModel.chat(anyList())).thenReturn(chatResponse("NO_RELEVANT_CONTEXT", 12));

        AIChatResponse response = service.chat(AIChatRequest.builder()
                .message("Question not answered by the excerpt")
                .history(List.of(new AIChatRequest.ChatMessageDto("assistant", "CLUB2_PRIVATE_UAT_2026")))
                .build(), studentUser());

        assertThat(response.getStatus()).isEqualTo("Fallback");
        assertThat(response.getAnswer()).isEqualTo("Configured fallback");
        assertThat(response.getCitations()).isEmpty();

        ArgumentCaptor<List<ChatMessage>> messagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(geminiChatModel).chat(messagesCaptor.capture());
        String systemPrompt = ((SystemMessage) messagesCaptor.getValue().get(0)).text();
        assertThat(systemPrompt)
                .contains("CURRENT user question")
                .contains("never a factual source")
                .contains("untrusted reference data")
                .contains("[Retrieved excerpt 1]")
                .contains("NO_RELEVANT_CONTEXT");

        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getStatus()).isEqualTo("Fallback");
        assertThat(logCaptor.getValue().getTokensUsed()).isZero();
        assertThat(logCaptor.getValue().getCitationsJson()).isEqualTo("[]");
    }

    @Test
    @DisplayName("An answer containing the sentinel as normal text remains a success")
    void sentinelMentionInsideNormalAnswerRemainsSuccess() {
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Fallback");

        KnowledgeArchive publicArchive = archive(101, "Public archive", "Public");
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(publicArchive));

        Embedding embedding = embedding();
        embeddingStore.add(embedding, TextSegment.from("Direct answer context",
                dev.langchain4j.data.document.Metadata.from(Map.of(
                        "archiveId", "101", "title", "Public archive", "index", 0))));
        when(queryEmbeddingModel.embed(anyString())).thenReturn(Response.from(embedding));
        String normalAnswer = "The sentinel NO_RELEVANT_CONTEXT is only a protocol value.";
        when(geminiChatModel.chat(anyList())).thenReturn(chatResponse(normalAnswer, 9));

        AIChatResponse response = service.chat(AIChatRequest.builder()
                .message("Question with a direct answer")
                .history(Collections.emptyList())
                .build(), studentUser());

        assertThat(response.getStatus()).isEqualTo("Success");
        assertThat(response.getAnswer()).isEqualTo(normalAnswer);
        assertThat(response.getCitations()).hasSize(1);

        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getStatus()).isEqualTo("Success");
        assertThat(logCaptor.getValue().getTokensUsed()).isEqualTo(9);
    }

    @Test
    @DisplayName("Embedding provider failure returns an audited fallback without calling chat")
    void embeddingProviderFailureReturnsAuditedFallback() {
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Fallback");
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(archive(101, "Public archive", "Public")));
        when(queryEmbeddingModel.embed(anyString()))
                .thenThrow(new ModelNotFoundException("Embedding model unavailable"));

        AIChatResponse response = service.chat(AIChatRequest.builder()
                .message("Question with a visible archive")
                .history(Collections.emptyList())
                .build(), studentUser());

        assertThat(response.getStatus()).isEqualTo("Fallback");
        assertThat(response.getAnswer()).isEqualTo("Fallback");
        assertThat(response.getCitations()).isEmpty();
        verify(geminiChatModel, never()).chat(anyList());

        ArgumentCaptor<AIChatAuditLog> logCaptor = ArgumentCaptor.forClass(AIChatAuditLog.class);
        verify(auditLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getStatus()).isEqualTo("Fallback");
        assertThat(logCaptor.getValue().getTokensUsed()).isZero();
    }

    @Test
    @DisplayName("A Club 2 leader never receives Club 3 context or citations")
    void leaderRetrievalFiltersOtherClubArchives() {
        when(systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD")).thenReturn("0.70");
        when(systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE")).thenReturn("Fallback");

        KnowledgeArchive publicArchive = archive(101, "Public archive", "Public");
        KnowledgeArchive club2Archive = archive(202, "Club 2 internal", "ClubInternal");
        when(archiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public"))
                .thenReturn(List.of(publicArchive));
        when(archiveRepository.findByClubIDAndIsDeletedFalse(2))
                .thenReturn(List.of(club2Archive));

        Embedding embedding = embedding();
        embeddingStore.add(embedding, TextSegment.from("CLUB2_PRIVATE_UAT_2026 allowed context",
                dev.langchain4j.data.document.Metadata.from(Map.of(
                        "archiveId", "202", "title", "Club 2 internal", "index", 0))));
        embeddingStore.add(embedding, TextSegment.from("CLUB3_PRIVATE_UAT_2026 must be filtered",
                dev.langchain4j.data.document.Metadata.from(Map.of(
                        "archiveId", "303", "title", "Club 3 internal", "index", 0))));
        when(queryEmbeddingModel.embed(anyString())).thenReturn(Response.from(embedding));
        when(geminiChatModel.chat(anyList())).thenReturn(chatResponse("Club 2 answer", 8));

        AIChatResponse response = service.chat(AIChatRequest.builder()
                .message("Club 2 question")
                .history(Collections.emptyList())
                .build(), leaderOfClub2());

        assertThat(response.getStatus()).isEqualTo("Success");
        assertThat(response.getCitations())
                .extracting(AIChatResponse.CitationDto::getArchiveId)
                .containsExactly(202);

        ArgumentCaptor<List<ChatMessage>> messagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(geminiChatModel).chat(messagesCaptor.capture());
        assertThat(((SystemMessage) messagesCaptor.getValue().get(0)).text())
                .doesNotContain("CLUB3_PRIVATE_UAT_2026");
    }

    private UserPrincipal studentUser() {
        return new UserPrincipal(
                12,
                "student@fpt.edu.vn",
                3,
                "Student",
                null,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );
    }

    private UserPrincipal leaderOfClub2() {
        return new UserPrincipal(
                22,
                "leader2@fpt.edu.vn",
                3,
                "Student",
                "Leader",
                2,
                List.of(new SimpleGrantedAuthority("ROLE_Student"))
        );
    }

    private KnowledgeArchive archive(int archiveId, String title, String visibilityScope) {
        KnowledgeArchive archive = new KnowledgeArchive();
        archive.setArchiveID(archiveId);
        archive.setTitle(title);
        archive.setVisibilityScope(visibilityScope);
        archive.setIsDeleted(false);
        return archive;
    }

    private Embedding embedding() {
        float[] vector = new float[768];
        vector[0] = 1.0f;
        return Embedding.from(vector);
    }

    private dev.langchain4j.model.chat.response.ChatResponse chatResponse(String answer, int tokens) {
        return dev.langchain4j.model.chat.response.ChatResponse.builder()
                .aiMessage(AiMessage.from(answer))
                .tokenUsage(new TokenUsage(tokens, 0))
                .build();
    }
}
