# Phân tích backend: Login, Event và Upload Cloudinary

Tài liệu này chỉ phân tích code backend trong `backend/src/main/java/com/fptu/fcms`. Ba luồng được trình bày theo cùng một quy ước:

```text
HTTP request
→ Spring Security filter chain
→ Controller
→ Request DTO / validation
→ Service interface
→ Service implementation
→ Domain service / policy / state machine
→ Repository
→ Entity / SQL Server hoặc dịch vụ ngoài
→ Response DTO
→ HTTP response
```

## 1. Vì sao backend được chia thành nhiều class?

| Tầng | Nhiệm vụ | Lý do cần tách |
|---|---|---|
| Controller | Nhận HTTP request, đọc path/body/principal và trả HTTP response | Không để giao thức HTTP lẫn với nghiệp vụ |
| Request DTO | Nhận dữ liệu đầu vào và chạy Bean Validation | Không cho dữ liệu không hợp lệ đi sâu vào service |
| Service interface | Khai báo contract nghiệp vụ | Controller không phụ thuộc trực tiếp vào cách triển khai |
| ServiceImpl | Điều phối transaction và nghiệp vụ | Một nơi duy nhất chứa luật hệ thống |
| Domain service | Quyền, state machine, policy, allocation | Tách các luật có thể tái sử dụng và kiểm thử độc lập |
| Repository | Đọc/ghi database | Service không phải viết SQL/JPA chi tiết |
| Entity | Ánh xạ object Java với bảng database | Hibernate quản lý persistence và quan hệ dữ liệu |
| Response DTO | Giới hạn dữ liệu trả ra | Tránh lộ trực tiếp toàn bộ entity |
| Filter | Xác thực request trước controller | Bảo vệ đồng nhất mọi endpoint |
| Scheduler | Nghiệp vụ chạy theo thời gian | Không phụ thuộc việc người dùng bấm nút |
| GlobalExceptionHandler | Chuẩn hóa exception thành JSON | Frontend nhận lỗi có cấu trúc thống nhất |

---

# 2. Luồng Login và JWT

## 2.1. Các class tham gia

| Class | Vai trò |
|---|---|
| `SecurityConfig` | Cấu hình endpoint public/protected, CORS, stateless session và thứ tự filter |
| `AuthController` | Cung cấp `/api/auth/login`, `/refresh`, `/register`, OTP và reset password |
| `LoginRequest` | Chứa email/password gửi lên |
| `AuthService` | Contract xác thực |
| `AuthServiceImpl` | Kiểm tra email, trạng thái, mật khẩu, vai trò và cấp token |
| `UserRepository` | Tìm `UserAccount` theo email |
| `AllowedEmailRepository` | Cho phép email ngoài domain FPT nếu đã được cấp phép |
| `SystemRoleRepository` | Lấy system role để đưa vào JWT |
| `UserService` | Xác định club role và club ID hiện tại |
| `PasswordEncoder` | So sánh mật khẩu BCrypt |
| `JwtTokenProvider` | Ký, đọc và kiểm tra JWT |
| `AuthResponse` | Trả access token và refresh token |
| `JwtAuthenticationFilter` | Xác thực Bearer token ở các request tiếp theo |
| `UserPrincipal` | Đại diện user đã xác thực trong `SecurityContext` |
| `AccountStatusFilter` | Chặn ngay tài khoản đã bị Suspended |

## 2.2. Login đi qua class nào?

```text
POST /api/auth/login
→ SecurityConfig: permitAll
→ AuthController.login(LoginRequest)
→ AuthService.login(request)
→ AuthServiceImpl.login(request)
   ├─ AllowedEmailRepository
   ├─ UserRepository
   ├─ PasswordEncoder.matches()
   ├─ SystemRoleRepository
   ├─ UserService.getClubRole()
   └─ JwtTokenProvider.generateToken()/generateRefreshToken()
→ AuthResponse
→ HTTP 200
```

### Controller

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

Controller chỉ chuyển request cho service. Nó không tự kiểm tra password hoặc tự tạo JWT.

### Nghiệp vụ login trong `AuthServiceImpl`

```java
public AuthResponse login(LoginRequest request) {
    String email = request.getEmail();

    if (!email.endsWith("@fpt.edu.vn") && !email.endsWith("@fe.edu.vn")) {
        if (!allowedEmailRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Tài khoản email này chưa được cấp phép trong hệ thống.");
        }
    }

    UserAccount user = userRepository.findByEmailAndIsDeletedFalse(email)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Không tìm thấy tài khoản với email này!"));

    if ("PENDING".equalsIgnoreCase(user.getAccountStatus())) {
        throw new IllegalArgumentException("Tài khoản chưa xác thực OTP.");
    }
    if (!"Active".equalsIgnoreCase(user.getAccountStatus())) {
        throw new IllegalArgumentException("Tài khoản đã bị khóa.");
    }
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new IllegalArgumentException("Sai mật khẩu!");
    }

    String roleName = systemRoleRepository.findById(user.getRoleID())
            .map(SystemRole::getRoleName)
            .orElse(null);

    ClubRoleResponse clubRole = userService.getClubRole(user.getUserID());
    String accessToken = jwtTokenProvider.generateToken(
            user.getEmail(), user.getUserID(), user.getRoleID(),
            roleName, clubRole.getRoleName(), clubRole.getClubID());
    String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

    return new AuthResponse(accessToken, refreshToken);
}
```

## 2.3. JWT chứa gì?

`JwtTokenProvider` tạo access token với các claim:

```java
JwtBuilder builder = Jwts.builder()
        .setSubject(email)
        .claim("userID", userId)
        .claim("roleID", roleId)
        .claim("roleName", roleName);

if (clubRole != null) builder.claim("clubRole", clubRole);
if (clubId != null) builder.claim("clubId", clubId);

return builder
        .setIssuedAt(currentDate)
        .setExpiration(expireDate)
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
```

Các claim này giúp những request sau biết user ID, system role, club role và club ID mà không cần query database ở `JwtAuthenticationFilter`.

## 2.4. Request có JWT đi như thế nào?

```text
Authorization: Bearer <access-token>
→ JwtAuthenticationFilter
   ├─ lấy token từ header
   ├─ JwtTokenProvider.validateToken()
   ├─ đọc userID/roleID/roleName/clubRole/clubId
   ├─ tạo GrantedAuthority
   ├─ tạo UserPrincipal
   └─ đặt Authentication vào SecurityContext
→ AccountStatusFilter
   └─ query UserRepository để chặn tài khoản Suspended
→ @PreAuthorize tại Controller
→ Controller nhận @AuthenticationPrincipal UserPrincipal
```

Code đặt principal:

```java
UserPrincipal principal = new UserPrincipal(
        userId, email, roleId, roleName, clubRole, clubId, authorities);

UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());

SecurityContextHolder.getContext().setAuthentication(authentication);
```

## 2.5. Refresh token

```text
POST /api/auth/refresh
→ AuthController.refresh()
→ AuthServiceImpl.refreshToken()
→ JwtTokenProvider.validateToken(refreshToken)
→ lấy email từ subject
→ UserRepository tải user mới nhất
→ tải lại role/club role
→ cấp access token mới
→ trả AuthResponse
```

Logout hiện tại chỉ trả HTTP thành công. Backend chưa lưu blacklist/revocation list, nên việc vô hiệu hóa access token chủ yếu do client xóa token hoặc token hết hạn.

---

# 3. Luồng Event

## 3.1. Các class lõi

| Class | Vai trò |
|---|---|
| `EventController` | API public và API quản lý event |
| `ICPDPEventController` | API duyệt/từ chối dành riêng cho ICPDP |
| `EventRegistrationApiController` | Đăng ký, mua vé, thanh toán, hủy vé |
| `EventService` / `EventServiceImpl` | Vòng đời và nghiệp vụ chính của Event |
| `EventRegistrationService` / `EventRegistrationServiceImpl` | Nghiệp vụ đăng ký và vé |
| `EventPermissionService` | Luật quyền theo system role |
| `EventAssignmentAccessService` | Kiểm tra user có quyền quản lý event cụ thể không |
| `EventStateMachineService` | Chặn chuyển trạng thái không hợp lệ |
| `EventProposalValidator` | Kiểm tra proposal trước khi submit |
| `EventRegistrationPolicyService` | Quản lý loại người tham gia, quota và yêu cầu duyệt |
| `RegistrationAllocationService` | Xếp confirmed/waitlist và promote waitlist |
| `EventRepository` | Persistence của Event |
| `EventRegistrationRepository` | Persistence của vé/tài khoản FPTU |
| `GuestEventRegistrationRepository` | Persistence của khách |
| `Event`, `EventRegistration`, `GuestEventRegistration` | Entity database |

## 3.2. Xem Event công khai

```text
GET /api/v1/events/{eventId}
→ SecurityConfig: public GET
→ EventController.getEventById()
→ EventService.getPublicEventDetail()
→ EventServiceImpl.getPublicEventDetail()
→ EventRepository
→ Event entity
→ EventDetailResponse
→ HTTP 200
```

```java
@GetMapping("/{eventId}")
public ResponseEntity<EventDetailResponse> getEventById(
        @PathVariable Integer eventId) {
    return ResponseEntity.ok(eventService.getPublicEventDetail(eventId));
}
```

Public response phải qua `EventDetailResponse` để tránh lộ dữ liệu quản trị không cần thiết.

## 3.3. Tạo Event

```text
POST /api/v1/events
→ JwtAuthenticationFilter
→ AccountStatusFilter
→ @PreAuthorize Leader/ViceLeader
→ EventController.createEventProposal()
→ @Valid CreateEventProposalRequest
→ EventServiceImpl.createEventProposal()
   ├─ validateCreateRequest()
   ├─ kiểm tra leader của CLB
   ├─ tạo Event trạng thái DRAFT
   ├─ EventRepository.save()
   ├─ EventRegistrationPolicyService tạo/sync policies
   └─ EventAssignmentRepository lưu ban tổ chức
→ HTTP 201
```

Phần tạo entity rút gọn:

```java
Event event = new Event();
event.setClubID(request.getClubID());
event.setEventName(request.getEventName().trim());
event.setStartDate(request.getStartDate());
event.setEndDate(request.getEndDate());
event.setMaxParticipants(request.getMaxParticipants());
event.setIsPaidEvent(Boolean.TRUE.equals(request.getIsPaidEvent()));
event.setTicketPrice(request.getTicketPrice());
event.setBannerUrl(request.getBannerUrl());
event.setBannerPublicId(request.getBannerPublicId());
event.setEventStatus(EventStatus.DRAFT);
event.setCreatedBy(currentUser.getUserId());
event.setIsDeleted(false);

Event saved = eventRepository.save(event);
```

## 3.4. Submit và ICPDP duyệt

```text
PATCH /api/v1/events/{id}/submit
→ EventController
→ EventServiceImpl.submitEventProposal()
   ├─ EventAssignmentAccessService.ensureCanManageEvent()
   ├─ EventProposalValidator
   ├─ EventRegistrationPolicyService.validateBeforeSubmit()
   └─ DRAFT → PENDING_APPROVAL

PATCH /api/icpdp/events/{id}/approve
→ ICPDPEventController
→ @PreAuthorize("hasRole('ICPDP')")
→ EventServiceImpl.approveEvent()
   ├─ EventStateMachineService.ensureCanApprove()
   └─ PENDING_APPROVAL → APPROVED
```

`EventStateMachineService` chứa luật trạng thái:

```java
public void ensureCanStart(Event event) {
    if (event == null
            || event.getEventStatus() != EventStatus.REGISTRATION_CLOSED) {
        throw invalidState(
                "Event must be RegistrationClosed before starting.");
    }
}

public void ensureRegistrationWindowOpen(Event event) {
    if (event == null
            || event.getEventStatus() != EventStatus.REGISTRATION_OPEN) {
        throw invalidState("Sự kiện hiện không mở đăng ký.");
    }
}
```

Vòng đời chính:

```text
DRAFT
→ PENDING_APPROVAL
→ APPROVED
→ REGISTRATION_OPEN
→ REGISTRATION_CLOSED
→ ONGOING
→ COMPLETED
→ REPORT_UPLOADED
→ REPORT_APPROVED / REPORT_REJECTED
→ CONTRIBUTION_DRAFT
→ CONTRIBUTION_FINALIZED
→ CLOSED
```

Nhánh lỗi:

```text
PENDING_APPROVAL → REJECTED
APPROVED/...     → CANCELLED
```

## 3.5. Đăng ký miễn phí

```text
POST /api/events/{eventId}/registrations/me
→ EventRegistrationApiController.registerMe()
→ EventRegistrationServiceImpl.registerEvent()
   ├─ EventRepository khóa/tải Event
   ├─ EventStateMachineService kiểm tra cửa sổ đăng ký
   ├─ UserRepository tải tài khoản Active
   ├─ blacklist/discipline/membership checks
   ├─ EventRegistrationPolicyRepository
   ├─ RegistrationAllocationService.allocateInitial()
   ├─ tạo EventRegistration
   ├─ tạo ticketCode nếu đủ điều kiện
   └─ EventRegistrationRepository.save()
→ EventRegistrationResultResponse
```

## 3.6. Mua vé nhóm và thanh toán

```text
POST /api/events/{eventId}/ticket-orders
→ GroupTicketPurchaseRequest validation
→ EventRegistrationServiceImpl.registerGroupTickets()
   ├─ kiểm tra event bán vé
   ├─ tối đa 4 vé/tài khoản
   ├─ public event cho phép email khách hợp lệ
   ├─ kiểm tra email/số điện thoại/vé trùng
   ├─ kiểm tra sức chứa
   ├─ tạo ticketOrderCode
   ├─ tạo paymentReference
   ├─ paymentStatus = PENDING
   ├─ paymentExpiresAt = now + 30 phút
   └─ saveAll(EventRegistration)
→ EventRegistrationResultResponse

POST /api/registrations/{registrationId}/payment/confirm
→ EventRegistrationApiController.confirmPayment()
→ EventRegistrationServiceImpl.confirmPayment()
   ├─ kiểm tra người mua sở hữu đơn
   ├─ kiểm tra PENDING và chưa hết hạn
   ├─ PENDING → PAID
   ├─ amountPaid = amountDue
   ├─ tạo ticketCode
   ├─ ticketIssuedAt = now
   ├─ EventRegistrationRepository.saveAll()
   └─ gửi email sau khi transaction commit
→ MyRegistrationResponse
```

Entity `EventRegistration` phải giữ cả `userID` và `purchaserUserID` vì người trả tiền có thể mua vé cho người khác.

## 3.7. Scheduler liên quan Event

| Scheduler | Tác dụng |
|---|---|
| `EventLifecycleScheduler` | Tự mở đăng ký và hoàn thành event theo thời gian |
| `RegistrationCloseScheduler` | Đóng đăng ký khi quá `registrationCloseAt` |
| `TicketPaymentExpiryScheduler` | Hủy đơn PENDING quá hạn, trả lại chỗ và promote waitlist |
| `EventReminderScheduler` | Gửi nhắc lịch cho người tham gia |
| `EventAbsenceScheduler` | Ghi nhận vắng mặt sau sự kiện |
| `EventReportReminderScheduler` | Nhắc CLB nộp báo cáo |
| `EventSlaScheduler` | Cảnh báo proposal chờ duyệt quá SLA |

Ví dụ giải phóng vé hết hạn:

```java
List<EventRegistration> expired = registrationRepository
        .findByPaymentStatusAndPaymentExpiresAtBeforeAndIsDeletedFalse(
                PaymentStatus.PENDING, LocalDateTime.now());

for (EventRegistration registration : expired) {
    registration.setPaymentStatus(PaymentStatus.EXPIRED);
    registration.setRegistrationStatus(RegistrationStatus.CANCELLED);
    registration.setCancelledAt(LocalDateTime.now());
}
registrationRepository.saveAll(expired);
```

---

# 4. Luồng Upload Cloudinary

## 4.1. Các class tham gia

| Class | Vai trò |
|---|---|
| `UploadController` | Nhận multipart file và purpose |
| `UploadService` | Contract upload cấp ứng dụng |
| `UploadServiceImpl` | Chuyển purpose thành folder và chuyển response |
| `ImageUploadPurpose` | Whitelist mục đích upload và folder tương ứng |
| `ImageStorageService` | Contract độc lập với nhà cung cấp lưu trữ |
| `CloudinaryImageStorageService` | Validate ảnh và gọi Cloudinary SDK |
| `CloudinaryConfig` | Tạo bean `Cloudinary` |
| `CloudinaryProperties` | Đọc cấu hình `cloudinary.*` |
| `CloudinaryFolders` | Khai báo cấu trúc folder thống nhất |
| `CloudinaryUploadResult` | Kết quả nội bộ từ Cloudinary |
| `ImageUploadResponse` | JSON trả về API |
| `ImageCleanupService` | Xóa ảnh cũ an toàn sau DB commit |
| `GlobalExceptionHandler` | Chuyển lỗi ảnh thành JSON lỗi chuẩn |

## 4.2. Upload ảnh đi qua class nào?

```text
POST /api/uploads/card-image
Content-Type: multipart/form-data
file=<binary>
purpose=event-banner

→ SecurityConfig: request phải authenticated
→ JwtAuthenticationFilter
→ AccountStatusFilter
→ UploadController.uploadCardImage()
→ ImageUploadPurpose.fromApiValue("event-banner")
→ UploadService.uploadImage()
→ UploadServiceImpl.uploadImage()
→ ImageStorageService.uploadImage()
→ CloudinaryImageStorageService.uploadImage()
   ├─ kiểm tra Cloudinary config
   ├─ kiểm tra file rỗng
   ├─ kiểm tra giới hạn dung lượng
   ├─ kiểm tra MIME type
   ├─ kiểm tra extension
   └─ cloudinary.uploader().upload()
→ CloudinaryUploadResult
→ ImageUploadResponse
→ HTTP 200 chứa secureUrl + publicId
```

### Controller

```java
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {
    private final UploadService uploadService;

    @PostMapping("/card-image")
    public ResponseEntity<ImageUploadResponse> uploadCardImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "purpose", required = false) String purpose) {

        ImageUploadResponse response = uploadService.uploadImage(
                file, ImageUploadPurpose.fromApiValue(purpose));
        return ResponseEntity.ok(response);
    }
}
```

### Purpose và folder

```java
public enum ImageUploadPurpose {
    CLUB_LOGO("club-logo", CloudinaryFolders.CLUB_LOGOS),
    CLUB_REGISTRATION("club-registration",
            CloudinaryFolders.CLUB_REGISTRATION_IMAGES),
    MEMBER_CARD("member-card", CloudinaryFolders.MEMBER_CARD_EVIDENCE),
    EVENT_BANNER("event-banner", CloudinaryFolders.EVENT_BANNERS);
}
```

```java
public final class CloudinaryFolders {
    public static final String ROOT = "fptclb-management";
    public static final String EVENT_BANNERS = ROOT + "/events/banners";
    public static final String CLUB_LOGOS = ROOT + "/clubs/logos";
    public static final String CLUB_REGISTRATION_IMAGES =
            ROOT + "/clubs/registrations";
    public static final String MEMBER_CARD_EVIDENCE =
            ROOT + "/clubs/member-cards";
}
```

Enum này ngăn client tự truyền folder tùy ý vào Cloudinary.

### Validation và upload

```java
private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/webp");

private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "jpg", "jpeg", "png", "webp");

public CloudinaryUploadResult uploadImage(MultipartFile file, String folder) {
    validateCloudinaryConfiguration();
    validateImage(file);

    Map<?, ?> uploaded = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "unique_filename", true,
                    "overwrite", false));

    return toUploadResult(uploaded);
}
```

Kết quả Cloudinary được chuẩn hóa:

```java
return CloudinaryUploadResult.builder()
        .secureUrl(asString(uploaded.get("secure_url")))
        .publicId(asString(uploaded.get("public_id")))
        .resourceType(asString(uploaded.get("resource_type")))
        .format(asString(uploaded.get("format")))
        .width(asInteger(uploaded.get("width")))
        .height(asInteger(uploaded.get("height")))
        .bytes(asLong(uploaded.get("bytes")))
        .build();
```

## 4.3. Vì sao cần cả URL và publicId?

- `secureUrl`: dùng để trình duyệt hiển thị ảnh.
- `publicId`: định danh tài nguyên trong Cloudinary để xóa hoặc thay thế.

Chỉ lưu URL sẽ hiển thị được ảnh nhưng không thể quản lý vòng đời ảnh cũ một cách đáng tin cậy.

## 4.4. Upload banner Event là quy trình hai bước

Upload ảnh chưa tự cập nhật bảng `Event`:

```text
Bước 1: POST /api/uploads/card-image?purpose=event-banner
→ nhận secureUrl + publicId

Bước 2: POST /api/v1/events hoặc PUT /api/v1/events/{eventId}
→ request chứa bannerUrl + bannerPublicId
→ EventServiceImpl lưu vào Event
```

Entity lưu:

```java
event.setBannerUrl(request.getBannerUrl());
event.setBannerPublicId(normalizePublicId(request.getBannerPublicId()));
eventRepository.save(event);
```

Tách hai bước giúp upload service dùng chung cho logo CLB, ảnh đăng ký, thẻ thành viên và banner Event.

## 4.5. Thay hoặc xóa banner

Khi cập nhật Event, `EventServiceImpl` giữ `oldBannerPublicId`, lưu thay đổi database trước rồi mới yêu cầu xóa ảnh cũ:

```java
Event saved = eventRepository.save(event);

if (oldBannerPublicId != null
        && !oldBannerPublicId.equals(saved.getBannerPublicId())) {
    imageCleanupService.deleteAfterCommit(oldBannerPublicId);
}
```

`ImageCleanupService`:

```java
public void deleteAfterCommit(String publicId) {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        deleteQuietly(publicId);
                    }
                });
    } else {
        deleteQuietly(publicId);
    }
}
```

Lý do phải xóa sau commit:

1. Upload ảnh mới thành công.
2. Nếu update database thất bại, transaction rollback.
3. Ảnh cũ vẫn phải còn để dữ liệu cũ không trỏ đến file đã bị xóa.
4. Chỉ khi database commit thành công mới xóa ảnh cũ.

## 4.6. Upload nhiều ảnh và rollback

`CloudinaryImageStorageService.uploadImages()` rollback các ảnh đã upload nếu một file ở giữa bị lỗi:

```java
List<CloudinaryUploadResult> uploaded = new ArrayList<>();
try {
    for (MultipartFile file : files) {
        uploaded.add(uploadImage(file, folder));
    }
    return uploaded;
} catch (RuntimeException ex) {
    rollbackUploadedImages(uploaded);
    throw ex;
}
```

Điều này tránh để lại ảnh rác khi batch upload chỉ thành công một phần.

## 4.7. Cấu hình Cloudinary

```java
@Configuration
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary(CloudinaryProperties properties) {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", properties.getCloudName(),
                "api_key", properties.getApiKey(),
                "api_secret", properties.getApiSecret(),
                "secure", true));
    }
}
```

Nên cấu hình bằng environment variables:

```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
  max-image-size-bytes: ${CLOUDINARY_MAX_IMAGE_SIZE_BYTES:5242880}
```

Không commit `api-secret` thật vào Git. Nếu secret từng xuất hiện trong repository, cần rotate secret trên Cloudinary và chuyển toàn bộ giá trị sang `.env` hoặc secret manager.

---

# 5. Ba luồng liên kết với nhau như thế nào?

Ví dụ Leader đăng nhập, upload banner rồi tạo Event:

```text
1. POST /api/auth/login
   → AuthServiceImpl
   → trả JWT có userID + role + clubRole + clubId

2. POST /api/uploads/card-image
   Authorization: Bearer JWT
   purpose=event-banner
   → JwtAuthenticationFilter tạo UserPrincipal
   → UploadController
   → CloudinaryImageStorageService
   → trả secureUrl + publicId

3. POST /api/v1/events
   Authorization: Bearer JWT
   body chứa bannerUrl + bannerPublicId
   → @PreAuthorize Leader/ViceLeader
   → EventController
   → EventServiceImpl
   → EventRepository.save(Event)

4. PATCH /api/v1/events/{id}/submit
   → EventProposalValidator
   → EventRegistrationPolicyService
   → DRAFT → PENDING_APPROVAL

5. ICPDP đăng nhập và PATCH /api/icpdp/events/{id}/approve
   → JwtAuthenticationFilter đọc role ICPDP
   → ICPDPEventController
   → EventStateMachineService
   → APPROVED
```

Nếu không có Login/JWT, request upload và tạo Event không qua được Spring Security. Nếu không có Cloudinary upload, Event vẫn có thể được tạo nhưng không có `bannerUrl/publicId`. Nếu không lưu `publicId`, backend không thể dọn banner cũ khi update/xóa Event.

---

# 6. Xử lý lỗi chung

```text
InvalidImageException
ImageUploadException
ImageDeleteException
IllegalArgumentException
BusinessRuleException
MethodArgumentNotValidException
→ GlobalExceptionHandler
→ ApiErrorResponse
→ HTTP status + code + message
```

Ví dụ response:

```json
{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "error": "Bad Request",
  "message": "Email không đúng định dạng",
  "timestamp": "2026-07-22T13:30:00"
}
```

Controller và service chỉ cần throw exception đúng loại; `GlobalExceptionHandler` chịu trách nhiệm chuẩn hóa response.

---

# 7. Danh sách file backend để đối chiếu

## Login/Security

```text
controller/AuthController.java
service/AuthService.java
service/impl/AuthServiceImpl.java
security/jwt/JwtTokenProvider.java
security/jwt/JwtAuthenticationFilter.java
security/jwt/AccountStatusFilter.java
security/UserPrincipal.java
config/SecurityConfig.java
dto/request/LoginRequest.java
dto/response/AuthResponse.java
repository/UserRepository.java
repository/AllowedEmailRepository.java
repository/SystemRoleRepository.java
```

## Event

```text
controller/EventController.java
controller/ICPDPEventController.java
controller/EventRegistrationApiController.java
service/EventService.java
service/impl/EventServiceImpl.java
service/EventRegistrationService.java
service/impl/EventRegistrationServiceImpl.java
service/event/EventStateMachineService.java
service/impl/EventStateMachineServiceImpl.java
service/event/EventPermissionService.java
service/impl/EventPermissionServiceImpl.java
service/EventAssignmentAccessService.java
service/impl/EventAssignmentAccessServiceImpl.java
service/EventRegistrationPolicyService.java
service/impl/EventRegistrationPolicyServiceImpl.java
service/event/RegistrationAllocationService.java
service/impl/RegistrationAllocationServiceImpl.java
entity/Event.java
entity/EventRegistration.java
entity/GuestEventRegistration.java
entity/EventRegistrationPolicy.java
entity/EventAssignment.java
repository/EventRepository.java
repository/EventRegistrationRepository.java
repository/GuestEventRegistrationRepository.java
repository/EventRegistrationPolicyRepository.java
repository/EventAssignmentRepository.java
scheduler/EventLifecycleScheduler.java
scheduler/RegistrationCloseScheduler.java
scheduler/TicketPaymentExpiryScheduler.java
```

## Upload Cloudinary

```text
controller/UploadController.java
service/UploadService.java
service/impl/UploadServiceImpl.java
service/ImageStorageService.java
service/impl/CloudinaryImageStorageService.java
service/ImageCleanupService.java
config/CloudinaryConfig.java
config/CloudinaryProperties.java
config/CloudinaryFolders.java
enums/ImageUploadPurpose.java
dto/response/CloudinaryUploadResult.java
dto/response/ImageUploadResponse.java
exception/InvalidImageException.java
exception/ImageUploadException.java
exception/ImageDeleteException.java
```
