package com.fptu.fcms.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fptu.fcms.dto.request.AIChatRequest;
import com.fptu.fcms.dto.response.AIChatResponse;
import com.fptu.fcms.dto.response.AIChatResponse.CitationDto;
import com.fptu.fcms.entity.AIChatAuditLog;
import com.fptu.fcms.entity.KnowledgeArchive;
import com.fptu.fcms.repository.AIChatAuditLogRepository;
import com.fptu.fcms.repository.KnowledgeArchiveRepository;
import com.fptu.fcms.security.UserPrincipal;
import com.fptu.fcms.service.AIChatService;
import com.fptu.fcms.service.SystemConfigService;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

@Service
@Slf4j
public class AIChatServiceImpl implements AIChatService {

    private final KnowledgeArchiveRepository knowledgeArchiveRepository;
    private final AIChatAuditLogRepository aiChatAuditLogRepository;
    private final SystemConfigService systemConfigService;
    private final ChatModel geminiChatModel;
    private final EmbeddingModel queryEmbeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final ObjectMapper objectMapper;

    public AIChatServiceImpl(
            KnowledgeArchiveRepository knowledgeArchiveRepository,
            AIChatAuditLogRepository aiChatAuditLogRepository,
            SystemConfigService systemConfigService,
            ChatModel geminiChatModel,
            @Qualifier("queryEmbeddingModel") EmbeddingModel queryEmbeddingModel,
            EmbeddingStore<TextSegment> embeddingStore,
            ObjectMapper objectMapper) {
        this.knowledgeArchiveRepository = knowledgeArchiveRepository;
        this.aiChatAuditLogRepository = aiChatAuditLogRepository;
        this.systemConfigService = systemConfigService;
        this.geminiChatModel = geminiChatModel;
        this.queryEmbeddingModel = queryEmbeddingModel;
        this.embeddingStore = embeddingStore;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public AIChatResponse chat(AIChatRequest request, UserPrincipal principal) {
        Integer userId = principal.getUserId();
        String userMessage = request.getMessage();

        // 1. Đọc config từ SystemConfig
        String thresholdStr;
        try {
            thresholdStr = systemConfigService.getConfigValue("AI_CONFIDENCE_THRESHOLD");
        } catch (Exception e) {
            throw new IllegalArgumentException("Không tìm thấy cấu hình AI_CONFIDENCE_THRESHOLD trong hệ thống.", e);
        }

        double ragConfidenceThreshold;
        try {
            ragConfidenceThreshold = Double.parseDouble(thresholdStr.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Cấu hình AI_CONFIDENCE_THRESHOLD không hợp lệ: " + thresholdStr, e);
        }

        String fallbackMessage;
        try {
            fallbackMessage = systemConfigService.getConfigValue("RAG_FALLBACK_MESSAGE");
        } catch (Exception e) {
            throw new IllegalArgumentException("Không tìm thấy cấu hình RAG_FALLBACK_MESSAGE trong hệ thống.", e);
        }

        // 2. Tính danh sách các archive user được phép xem
        List<String> visibleArchiveIds = getVisibleArchiveIds(principal);

        // 3. Nếu không có archive nào, trả fallback ngay lập tức không cần retrieve
        if (visibleArchiveIds.isEmpty()) {
            return saveAuditLogAndReturnFallback(userId, userMessage, fallbackMessage);
        }

        // 4. Build retriever với filter theo visible archive ids
        Filter filter = metadataKey("archiveId").isIn(visibleArchiveIds);
        ContentRetriever retriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(queryEmbeddingModel)
                .maxResults(3)
                .minScore(ragConfidenceThreshold)
                .filter(filter)
                .build();

        // 5. Gọi retriever
        List<Content> matches = retriever.retrieve(Query.from(userMessage));

        // 6. Nếu rỗng: trả fallback, KHÔNG gọi Gemini chat
        if (matches == null || matches.isEmpty()) {
            return saveAuditLogAndReturnFallback(userId, userMessage, fallbackMessage);
        }

        // 7. Có match -> Build prompt thủ công gồm context + history + user question
        String contextText = buildContextText(matches);

        // Dùng MessageWindowChatMemory tối đa 10 messages
        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(10)
                .build();

        // Nạp history gửi lên từ FE (nếu có, tối đa 10 messages gần nhất)
        List<AIChatRequest.ChatMessageDto> history = request.getHistory();
        if (history != null) {
            // Giới hạn history nếu FE gửi quá nhiều
            int startIdx = Math.max(0, history.size() - 10);
            for (int i = startIdx; i < history.size(); i++) {
                AIChatRequest.ChatMessageDto msg = history.get(i);
                if ("user".equalsIgnoreCase(msg.getRole())) {
                    chatMemory.add(dev.langchain4j.data.message.UserMessage.from(msg.getContent()));
                } else if ("assistant".equalsIgnoreCase(msg.getRole()) || "ai".equalsIgnoreCase(msg.getRole())) {
                    chatMemory.add(dev.langchain4j.data.message.AiMessage.from(msg.getContent()));
                }
            }
        }

        // Thêm câu hỏi hiện tại vào chatMemory
        chatMemory.add(dev.langchain4j.data.message.UserMessage.from(userMessage));

        // Build system prompt chứa context
        String systemPrompt = "Bạn là trợ lý AI thông minh hỗ trợ quản lý câu lạc bộ của FPT University (FCMS).\n"
                + "Hãy trả lời câu hỏi của người dùng một cách chính xác, ngắn gọn, lịch sự bằng Tiếng Việt dựa trên ngữ cảnh (context) được cung cấp từ kho tài liệu tri thức dưới đây.\n\n"
                + "Ngữ cảnh:\n" + contextText;

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(SystemMessage.from(systemPrompt));
        messages.addAll(chatMemory.messages());

        // 8. Gọi Gemini Chat Model
        dev.langchain4j.model.chat.response.ChatResponse modelResponse = geminiChatModel.chat(messages);
        String answer = modelResponse.aiMessage().text();

        // 9. Map citations từ metadata của TextSegment
        List<CitationDto> citations = new ArrayList<>();
        for (Content match : matches) {
            TextSegment segment = match.textSegment();
            if (segment != null && segment.metadata() != null) {
                Integer archiveIdVal = null;
                String archiveIdStr = segment.metadata().getString("archiveId");
                if (archiveIdStr == null) {
                    archiveIdStr = String.valueOf(segment.metadata().getInteger("archiveId"));
                }
                if (archiveIdStr != null && !archiveIdStr.equals("null")) {
                    try {
                        archiveIdVal = Integer.parseInt(archiveIdStr);
                    } catch (NumberFormatException ignored) {}
                }

                String title = segment.metadata().getString("title");

                Integer chunkIdxVal = segment.metadata().getInteger("index");
                if (chunkIdxVal == null) {
                    String indexStr = segment.metadata().getString("index");
                    if (indexStr != null) {
                        try {
                            chunkIdxVal = Integer.parseInt(indexStr);
                        } catch (NumberFormatException ignored) {}
                    }
                }
                if (chunkIdxVal == null) {
                    chunkIdxVal = 0;
                }

                if (archiveIdVal != null) {
                    citations.add(CitationDto.builder()
                            .archiveId(archiveIdVal)
                            .title(title != null ? title : "")
                            .chunkIndex(chunkIdxVal)
                            .build());
                }
            }
        }

        // Lưu audit log
        String citationsJson = serializeCitations(citations);
        AIChatAuditLog auditLog = new AIChatAuditLog();
        auditLog.setUserID(userId);
        auditLog.setUserPrompt(userMessage);
        auditLog.setAiResponse(answer);
        auditLog.setStatus("Success");
        auditLog.setCitationsJson(citationsJson);
        auditLog.setCreatedAt(LocalDateTime.now());
        aiChatAuditLogRepository.save(auditLog);

        return AIChatResponse.builder()
                .answer(answer)
                .citations(citations)
                .status("Success")
                .build();
    }

    private List<String> getVisibleArchiveIds(UserPrincipal me) {
        List<KnowledgeArchive> archives;

        boolean isAdminOrIcpdp = "Admin".equals(me.getRoleName()) || "ICPDP".equals(me.getRoleName());
        boolean isLeaderOrViceLeader = "Leader".equals(me.getClubRole()) || "ViceLeader".equals(me.getClubRole());

        if (isAdminOrIcpdp) {
            archives = knowledgeArchiveRepository.findAll();
        } else if (isLeaderOrViceLeader && me.getClubId() != null) {
            List<KnowledgeArchive> publicArchives = knowledgeArchiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public");
            List<KnowledgeArchive> clubArchives = knowledgeArchiveRepository.findByClubIDAndIsDeletedFalse(me.getClubId());
            Set<KnowledgeArchive> unique = new HashSet<>(publicArchives);
            unique.addAll(clubArchives);
            archives = new ArrayList<>(unique);
        } else {
            archives = knowledgeArchiveRepository.findByVisibilityScopeAndIsDeletedFalse("Public");
        }

        return archives.stream()
                .map(a -> String.valueOf(a.getArchiveID()))
                .collect(Collectors.toList());
    }

    private AIChatResponse saveAuditLogAndReturnFallback(Integer userId, String userPrompt, String fallbackMessage) {
        AIChatAuditLog auditLog = new AIChatAuditLog();
        auditLog.setUserID(userId);
        auditLog.setUserPrompt(userPrompt);
        auditLog.setAiResponse(fallbackMessage);
        auditLog.setStatus("Fallback");
        auditLog.setCitationsJson("[]");
        auditLog.setCreatedAt(LocalDateTime.now());
        aiChatAuditLogRepository.save(auditLog);

        return AIChatResponse.builder()
                .answer(fallbackMessage)
                .citations(Collections.emptyList())
                .status("Fallback")
                .build();
    }

    private String buildContextText(List<Content> matches) {
        StringBuilder sb = new StringBuilder();
        for (Content match : matches) {
            if (match.textSegment() != null) {
                sb.append(match.textSegment().text()).append("\n\n");
            }
        }
        return sb.toString().trim();
    }

    private String serializeCitations(List<CitationDto> citations) {
        try {
            return objectMapper.writeValueAsString(citations);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize citations to JSON string: {}", e.getMessage());
            return "[]";
        }
    }
}
