# Tài liệu này mô tả chi tiết Vòng đời (Lifecycle) và Ngăn xếp cuộc gọi (Call Stack) của hệ thống **FCMS (FPT Club Management System)** cho luồng nghiệp vụ:
**Quản lý Kho tri thức (Knowledge Archive) và Trợ lý ảo AI (AI Chatbot RAG).**

*(Lưu ý quan trọng: Luồng nghiệp vụ này tích hợp chặt chẽ với cơ chế bảo mật (JWT Claims) của hệ thống và ứng dụng kiến trúc **LangChain4j** nhằm chuẩn hóa quá trình Vector hóa (Embedding) cũng như Sinh văn bản dựa trên ngữ cảnh (Retrieval-Augmented Generation).)*

---

### PHẦN 1: QUẢN LÝ KHO TRI THỨC (INGESTION & INDEXING)

#### 1. Sơ đồ Call Stack (Ngăn xếp cuộc gọi) - Quá trình Upload & Indexing

```mermaid
graph TD
    subgraph Frontend [React - FCMS UI]
        UI[KnowledgeArchiveMgmt.jsx] -->|Axios Request| AC[axiosClient.js]
        AC -->|Bearer JWT| API[Knowledge Archive API]
    end

    subgraph SecurityFilters [Spring Security - Filters]
        JWT[JwtAuthenticationFilter.java] -->|1. Xac thuc va Doc ClubID| SEC[Authorization Filter]
    end

    subgraph ControllerLayer [Controller Layer]
        SEC -->|2. Route Endpoint| CTR[KnowledgeArchiveController.java]
    end

    subgraph ServiceLayer [Service Layer - Core Logic]
        CTR -->|3. Validate va Execute| SVC[KnowledgeArchiveServiceImpl.java]
        SVC -->|4. Quet Virus| CLAM[ClamAvScanService.java]
        SVC -->|5. Parse va Sanitize| SANI[MarkdownSanitizer.java]
    end

    subgraph Database [Database - SQL Server]
        SVC -->|6. Luu Metadata Pending| DB[(KnowledgeArchive Table)]
    end

    subgraph AsyncBackground [Background Event - Ingestion]
        SVC -.->|7. Publish Event| EVT[KnowledgeArchiveEventListener.java]
        EVT -->|8. Kich hoat Ingestion| ING[KnowledgeIngestionServiceImpl.java]
        ING -->|9. Chunking va Embedding| LC[LangChain4j Core]
    end
    
    subgraph VectorDB [Vector Storage]
        LC -->|10. Luu Vector| MEM[(InMemoryStore)]
        LC -->|11. Luu Persistent| DB2[(KnowledgeChunk Table)]
    end

    Frontend -->|HTTP POST| SecurityFilters
```

---

#### 2. Luồng Xử lý Upload và Vector hóa dữ liệu

```mermaid
sequenceDiagram
    autonumber
    actor User as Admin/ICPDP/Leader
    participant UI as KnowledgeArchiveMgmt.jsx
    participant Security as Spring Security
    participant Svc as KnowledgeArchiveServiceImpl
    participant AV as ClamAvScanService
    participant PDF as OpenDataLoader PDF
    participant DB as SQL Server DB
    participant Event as EventListener
    participant Ingest as KnowledgeIngestionService
    participant Gemini as Google Gemini API

    User->>UI: Upload file (.md, .txt, .pdf)
    UI->>Security: POST /api/v1/knowledge-archive
    Note over Security: Giai ma Token, tu dong ep ClubID/VisibilityScope
    Security->>Svc: create file va metadata
    activate Svc
    
    Svc->>Svc: Validate Kich thuoc va Dinh dang
    Svc->>AV: scan file
    
    alt Neu la file PDF
        Svc->>PDF: processFile pdf
        PDF-->>Svc: Tra ve noi dung Markdown
    end
    
    Svc->>Svc: Luu file vao disk UUID
    Svc->>DB: INSERT INTO KnowledgeArchive Status Pending
    Svc-->>UI: HTTP 201 Created
    
    Svc-)Event: Publish KnowledgeArchiveIndexedEvent
    deactivate Svc
    
    Event->>Ingest: ingest archiveID
    activate Ingest
    Note over Ingest: Phan manh Chunking: recursive 500,100 <br/> Gan Contextual Header
    
    loop Moi TextSegment
        Ingest->>Gemini: embed segment
        Gemini-->>Ingest: Vector Embedding
        Ingest->>Ingest: embeddingStore.add Vector, Segment
        Ingest->>DB: INSERT INTO KnowledgeChunk Luu Vector JSON
    end
    
    Ingest->>DB: UPDATE KnowledgeArchive Status Success
    deactivate Ingest
```

#### 3. Chi tiết các thành phần xử lý

| Tầng | Tên File / Lớp | Phương thức | Vai trò chi tiết trong luồng xử lý |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `KnowledgeArchiveMgmt.jsx` | `handleUpload()` | Giao diện quản lý file dùng chung cho cả 4 role. Thu thập metadata (ClubID, Visibility). File được nén vào FormData để gửi. |
| **Security Gate** | `KnowledgeArchiveController.java` | `@PreAuthorize` | **Phân quyền logic:** Admin/ICPDP tự chọn `Public/Internal`. Club Leader/Vice Leader tự động bị ép vào `ClubInternal` và `ClubID` cá nhân. |
| **Service (Sync)** | `KnowledgeArchiveServiceImpl.java` | `create(...)` | - **Kiểm duyệt (Validation):** Ép giới hạn 5MB, kiểm tra định dạng.<br/>- **Anti-virus:** Bắt buộc quét bằng ClamAV.<br/>- **PDF Parsing:** Dùng `opendataloader` chuyển PDF sang Markdown.<br/>- **XSS Protection:** Gọi `MarkdownSanitizer`.<br/>- **Database & Event:** Lưu DB trạng thái `Pending` và bắn Event `AFTER_COMMIT`. |
| **Event (Async)** | `KnowledgeArchiveEventListener.java` | `onIndexedEvent()` | Lắng nghe Event sau khi transaction thành công để gọi `KnowledgeIngestionService` không làm block request của user. |
| **Service (Async)** | `KnowledgeIngestionServiceImpl.java` | `ingest(...)` | - Cắt nhỏ văn bản: `recursive(500, 100)`.<br/>- Gắn Tiêu đề vào mỗi chunk để chống mất ngữ cảnh.<br/>- Gọi Gemini nhúng Vector.<br/>- Lưu vào RAM Store và DB để Persistent. |
| **Repository** | `KnowledgeArchiveRepository` | `save(...)` | Lưu trữ file gốc và metadata. |
| **Repository** | `KnowledgeChunkRepository` | `save(...)` | Lưu các Vector (Embedding) và `embeddingStoreId` nhằm phục hồi dữ liệu khi App restart. |

---

### PHẦN 2: LUỒNG TRỢ LÝ ẢO AI (AI CHATBOT RAG)

#### 1. Sơ đồ Call Stack (Ngăn xếp cuộc gọi) - Luồng AI Chat

```mermaid
graph TD
    subgraph Frontend [React - AiChat UI]
        UI[AiChat.jsx] -->|Post message va history| AC[axiosClient.js]
    end

    subgraph RateLimiter [Rate Limiting]
        AC -->|Kiem tra Quota 429| CTR[AIChatController.java]
    end

    subgraph ServiceLayer [Service Layer - AI Logic]
        CTR -->|Giao tiep AI| SVC[AIChatServiceImpl.java]
        SVC -->|Tinh toan Quyen| REP[KnowledgeArchiveRepository]
    end

    subgraph LangChain4j [LangChain4j RAG Core]
        SVC -->|1. Nhung Cau Hoi| GEM_EMB[Google Gemini Embedding]
        SVC -->|2. Tim Kiem Vector| RET[EmbeddingStoreContentRetriever]
        RET -.->|Filter by visibleArchiveIds| MEM[(InMemoryEmbeddingStore)]
        
        SVC -->|3. Build Prompt va History| MEMORY[MessageWindowChatMemory]
        MEMORY -->|4. Sinh Cau Tra Loi| GEM_CHAT[Google Gemini Chat Model]
    end

    subgraph AuditDB [Database]
        SVC -->|5. Luu Lich su Chat| LOG[(AIChatAuditLog Table)]
    end

    Frontend -->|HTTP POST chat| RateLimiter
```

---

#### 2. Luồng Sinh viên chat với AI Chatbot

```mermaid
sequenceDiagram
    autonumber
    actor Student as Nguoi dung
    participant UI as AiChat.jsx
    participant Ctrl as AIChatController
    participant Svc as AIChatServiceImpl
    participant GeminiEmb as Gemini Embedding
    participant Store as InMemoryStore
    participant GeminiChat as Gemini Chat API
    participant DB as SQL Server Audit Log

    Student->>UI: Go cau hoi
    UI->>Ctrl: POST /v1/ai/chat message, history
    
    Note over Ctrl: Rate Limiting Bucket4j Gioi han theo UserID
    
    Ctrl->>Svc: chat request, principal
    activate Svc
    
    Svc->>Svc: Tinh toan visibleArchiveIds
    
    Svc->>GeminiEmb: embed query
    GeminiEmb-->>Svc: Vector cau hoi
    
    Svc->>Store: retrieve Vector, filter, minScore
    Store-->>Svc: Top 3 TextSegments khop nhat
    
    alt Neu KHONG co ket qua dat nguong
        Note over Svc: RAG FALLBACK Bao ve chi phi API
        Svc->>DB: Ghi AuditLog Status Fallback
        Svc-->>Ctrl: Tra ve RAG_FALLBACK_MESSAGE
    else CO ket qua phu hop
        Note over Svc: Build Prompt gom System Prompt + Ngu canh + History
        Svc->>GeminiChat: chat messages
        GeminiChat-->>Svc: Tra ve cau tra loi tu nhien
        
        Svc->>Svc: Anh xa Citations Trich dan
        Svc->>DB: Ghi AuditLog Status Success
        Svc-->>Ctrl: Tra ve Answer va Citations
    end
    
    deactivate Svc
    Ctrl-->>UI: Hien thi len man hinh
```

#### 3. Chi tiết các thành phần xử lý AI

| Tầng | Tên File / Lớp | Phương thức | Vai trò chi tiết trong luồng xử lý |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `AiChat.jsx` | `handleSendMessage()` | Thu thập `message` và tự động gom tối đa 5 lượt hỏi/đáp vào mảng `history`. Gửi request lên API. Xử lý UI báo lỗi 429 nếu bị rate limit. |
| **Rate Limit** | `AIChatController.java` | `chat(...)` | **Khóa tài nguyên:** Sử dụng thư viện Bucket4j map với UserID để cấu hình Rate Limit. Trả về `429 Too Many Requests` nếu sinh viên spam liên tục. |
| **Service Logic** | `AIChatServiceImpl.java` | `chat(...)` | - **Bảo mật Data:** Tự động tính toán các tài liệu user được xem để tạo `Filter`.<br/>- **Truy xuất RAG:** Dùng Retriever của LangChain4j tìm kiếm top 3 đoạn văn phù hợp nhất với câu hỏi.<br/>- **Cơ chế Fallback (Tiết kiệm cost):** Nếu không tìm thấy ngữ cảnh trên mức tự tin (`minScore`), lập tức trả lời mẫu Fallback mà **không** gọi tới Gemini Chat.<br/>- **Prompt Engineering:** Ráp các TextSegments vào System Prompt để dẫn dắt Gemini trả lời. |
| **RAG LLM Engine** | `LangChain4jConfig.java` | Cấu hình Beans | Khai báo các mô hình riêng biệt: `documentEmbeddingModel` (lúc nạp data), `queryEmbeddingModel` (lúc sinh viên hỏi) và `geminiChatModel` (lúc tạo câu trả lời). |
| **Repository** | `AIChatAuditLogRepository` | `save(...)` | **Ghi Log (Audit):** Toàn bộ câu hỏi, câu trả lời AI, số lượng Tokens đã dùng, trạng thái (Success/Fallback) và danh sách nguồn trích dẫn được lưu cứng để Admin kiểm soát chất lượng AI. |

---

### Tác động Dữ liệu (Database Consistency)

Trong toàn bộ chuỗi tính năng này, sự toàn vẹn hệ thống dựa trên 3 bảng dữ liệu chính:

1. **`KnowledgeArchive`**: 
   - Quản lý metadata, đường dẫn vật lý và tính phân quyền (`ClubInternal` / `Public`). Cột `indexingStatus` (Pending/Processing/Success/Failed) cho biết trạng thái Vector hóa.
2. **`KnowledgeChunk`**: 
   - Lưu trữ các mảnh vỡ văn bản (Chunks) và Vector toán học (`embeddingVector`) đã được parse. Bảng này hỗ trợ ứng dụng tự **rehydrate (phục hồi)** lại dữ liệu RAM (`InMemoryEmbeddingStore`) ngay cả khi Server sập/restart.
3. **`AIChatAuditLog`**:
   - Ghi vết mọi lượt trò chuyện. Hỗ trợ trường `citationsJson` để sau này có thể truy vết AI sinh câu trả lời dựa vào mảnh văn bản cụ thể nào, giúp chống lại hiện tượng Ảo giác (Hallucination) của AI.

---
Mọi tác động sửa đổi hệ thống, nếu thay đổi 1 trong 3 cơ chế trên đều sẽ tự động Rollback (đối với Upload) hoặc trả về Fallback an toàn (đối với Chat).
