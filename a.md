Tài liệu này mô tả chi tiết Vòng đời (Lifecycle) và Ngăn xếp cuộc gọi (Call Stack) của hệ thống **FCMS (FPT Club Management System)** cho luồng nghiệp vụ:
**Cán bộ ICPDP trực tiếp khởi tạo Câu lạc bộ mới trên hệ thống.**

*(Lưu ý quan trọng: Dựa theo bản cập nhật mới nhất, **sinh viên không còn quyền nộp đơn đăng ký CLB**. Chức năng này đã được chuyển hoàn toàn sang cho cán bộ ICPDP tự khởi tạo. Dù API Backend vẫn giữ tên là `ClubRegistration` để lưu vết dữ liệu (audit log), nhưng tính chất nghiệp vụ đã thay đổi thành Khởi tạo trực tiếp (Auto-Approve).)*

---

### 1. Sơ đồ Call Stack (Ngăn xếp cuộc gọi)

```mermaid
graph TD
    subgraph Frontend [React - ICPDP Portal]
        UI[ClubRegistrationForm.jsx<br/>mode='icpdp'] -->|Axios Request| AC[axiosClient.js]
        AC -->|Bearer JWT Header| API[clubRegistrationApi.js]
    end

    subgraph SecurityFilters [Spring Security - Filters]
        JWT[JwtAuthenticationFilter.java] -->|1. Validate JWT / Set Principal| AST[AccountStatusFilter.java]
        AST -->|2. Check Account Status| SEC[PreAuthorize: hasAnyRole Admin, ICPDP]
    end

    subgraph ControllerLayer [Controller Layer]
        SEC -->|3. Route to Endpoint| CTR[ClubRegistrationController.java]
        CTR -->|4. Validates DTO| EXC[GlobalExceptionHandler.java]
    end

    subgraph ServiceLayer [Service Layer]
        CTR -->|5. Execute Business Logic| SVC[ClubRegistrationServiceImpl.java]
    end

    subgraph Repositories [Repository Layer - Spring Data JPA]
        SVC -->|6. Query Entities| REPS[JPA Repositories]
    end

    subgraph Database [Database - SQL Server]
        REPS -->|7. SQL Queries| DB[(SQL Server Tables)]
    end

    Frontend -->|HTTP POST| SecurityFilters
    SVC -.->|Throws BusinessRuleException| EXC
```

---

### 2. Luồng ICPDP tạo CLB mới và Hệ thống tự động khởi tạo

```mermaid
sequenceDiagram
    autonumber
    actor ICPDP as Cán bộ ICPDP
    participant UI as ClubRegistrationForm.jsx
    participant Api as clubRegistrationApi.js
    participant AC as axiosClient.js
    participant Security as Spring Security Filters
    participant Ctrl as ClubRegistrationController.java
    participant Svc as ClubRegistrationServiceImpl.java
    participant Repos as JPA Repositories
    participant DB as SQL Server (DB)

    ICPDP->>UI: Truy cập "/icpdp/clubs/create"
    ICPDP->>UI: Điền thông tin CLB & Đội ngũ sáng lập (>= 5 TV)
    UI->>Api: submit(payload)
    Api->>AC: post("/clubs/registrations", data)
    
    AC->>Security: HTTP POST /api/clubs/registrations
    Note over Security: Xác thực Token, Account Status<br/>Kiểm tra Role (chỉ cho phép Admin hoặc ICPDP)
    
    Security->>Ctrl: submitRegistration(request, currentUser)
    Ctrl->>Svc: submitRegistration(request, userId)
    activate Svc
    Note over Svc: Thực hiện kiểm tra nghiệp vụ (@Transactional):<br/>- Lấy học kỳ hiện tại (Active Semester)<br/>- Kiểm tra trùng lặp Mã & Tên CLB<br/>- Kiểm tra cơ cấu (tối thiểu 5 TV): đúng 1 Leader, 1 ViceLeader, >= 3 Members<br/>- Kiểm tra giới hạn 4 CLB của các sinh viên
    
    Note over Svc: 1. LƯU VẾT KHỞI TẠO (TRẠNG THÁI APPROVED)
    Svc->>Repos: ClubRegistrationRepository.save(status = APPROVED)
    Repos->>DB: INSERT INTO ClubRegistration (Lưu lịch sử tạo CLB)
    
    Note over Svc: 2. CHÍNH THỨC KHỞI TẠO CÂU LẠC BỘ
    Svc->>Repos: ClubRepository.save(newClub)
    Repos->>DB: INSERT INTO Club (Status: Active)
    
    Note over Svc: 3. CẤP QUYỀN CHO THÀNH VIÊN SÁNG LẬP
    loop Duyệt từng thành viên sáng lập
        Svc->>Repos: ClubMembershipRepository.save(newMembership)
        Repos->>DB: INSERT INTO ClubMembership (clubID, userID, semesterID, clubRoleID)
    end
    
    Svc-->>Ctrl: ClubRegistrationResponseDTO
    deactivate Svc
    
    Ctrl-->>ICPDP: HTTP 201 Created (Tạo CLB thành công)
```

| Tầng | Tên File / Lớp (Class) | Phương thức / Thành phần | Vai trò chi tiết trong luồng xử lý |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `sidebarConfigs.js` | Menu Route | Chức năng đăng ký bị xóa khỏi menu của Sinh viên (`MEMBER`). Menu `Tạo CLB` chỉ còn nằm trong cấu hình của `ICPDP`. |
| **Frontend UI** | `ClubRegistrationForm.jsx` | `handleSubmit()` | Form được tái sử dụng để ICPDP nhập liệu. Kiểm tra trước tại frontend (MSSV, số lượng >= 5). Khi submit, dữ liệu được gửi đi như một lệnh "Tạo CLB trực tiếp". |
| **Frontend API** | `clubRegistrationApi.js` | `submit(data)` | Gọi phương thức HTTP POST `/api/clubs/registrations`. |
| **Security Gate** | `ClubRegistrationController.java` | `@PreAuthorize` | **Chặn toàn bộ sinh viên:** Có đánh dấu `@PreAuthorize("hasAnyRole('Admin', 'ICPDP')")`. Sinh viên truy cập sẽ bị `403 Forbidden`. |
| **Service** | `ClubRegistrationServiceImpl.java` | `submitRegistration(...)` | - **Kiểm tra nghiệp vụ (Validations)**:<br/>&nbsp;&nbsp;1. Kiểm tra tồn tại Học kỳ đang hoạt động.<br/>&nbsp;&nbsp;2. Kiểm tra tính duy nhất của Mã CLB và Tên CLB.<br/>&nbsp;&nbsp;3. **Đội ngũ sáng lập phải có >= 5 thành viên (1 Leader, 1 ViceLeader, >= 3 Members)**.<br/>&nbsp;&nbsp;4. Giới hạn sinh viên không tham gia quá 4 CLB trong kỳ.<br/><br/>- **Thực thi Tạo mới**:<br/>&nbsp;&nbsp;1. Tạo một bản ghi `ClubRegistration` với trạng thái `APPROVED` để lưu dấu vết lịch sử ai là người tạo.<br/>&nbsp;&nbsp;2. Trực tiếp tạo `Club` với trạng thái `Active`.<br/>&nbsp;&nbsp;3. Tạo ngay `ClubMembership` cho 5+ thành viên. |
| **Repository** | `ClubRegistrationRepository` | `save(...)` | Lưu trữ bản ghi tạo CLB. |
| **Repository** | `ClubRepository` | `save(...)` | Tạo dòng dữ liệu mới trong bảng `Club`. |
| **Repository** | `ClubMembershipRepository` | `save(...)` | Lưu các bản ghi chức vụ (Leader, ViceLeader, Member) vào CLB mới. |

---

### Dữ liệu bị tác động trong quá trình xử lý:

Quá trình "Tạo CLB" sẽ đồng thời sinh ra dữ liệu trên 4 bảng sau trong cùng 1 Transaction:

1. **`ClubRegistration`**:
   - Được dùng như một bảng Audit/History (Lưu vết). Trạng thái mặc định ngay khi lưu là `APPROVED`.
2. **`ClubRegistrationMember`**:
   - Lưu trữ danh sách thông tin sinh viên mà ICPDP đã khai báo trong form khởi tạo (ít nhất 5 người).
3. **`Club`**:
   - Khởi tạo ngay lập tức với `clubStatus` là `Active`, sử dụng tên và mã CLB từ form ICPDP nhập.
4. **`ClubMembership`**:
   - Bảng quyền lực nhất: Cấp phát chức vụ chính thức (`Leader`, `ViceLeader`, `Member`) cho 5+ thành viên tương ứng vào CLB mới.

### Cơ chế bảo vệ toàn vẹn:
Nếu cán bộ ICPDP nhập sai MSSV, hoặc trong 5 người có người đã tham gia đủ 4 CLB, tiến trình `@Transactional` sẽ rollback toàn bộ. `GlobalExceptionHandler` trả về HTTP 422 / 400 kèm câu thông báo lỗi chi tiết hiển thị cho ICPDP biết để sửa đổi.
