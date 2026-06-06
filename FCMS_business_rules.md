# FPTU CLUB MANAGEMENT SYSTEM (FCMS)
## TÀI LIỆU BUSINESS RULES (QUY TẮC NGHIỆP VỤ HỆ THỐNG)
* **Mã dự án:** SU26SWP11 · FPTU TP.HCM
* **Phiên bản:** 2.0 (Đã tối giản & Tích hợp SRS bổ sung)
* **Tổng số quy tắc:** 50 Business Rules | 7 Nhóm nghiệp vụ

---

## 1. PHÂN LOẠI QUY TẮC
Các quy tắc nghiệp vụ (BR) được ký hiệu theo tính chất ràng buộc:
- **[L] (Law/Mandatory):** Luật bắt buộc từ nhà trường (FPTU) hoặc phòng IC-PDP. Không thể sửa đổi.
- **[G] (Group Policy/Design):** Quy tắc nghiệp vụ tự đề xuất để đảm bảo tính nhất quán của hệ thống và trải nghiệm người dùng.

---

## 2. CHI TIẾT CÁC BUSINESS RULES THEO NHÓM

### 2.1 Nhóm A – Xác thực & Phân quyền (Authentication & Authorization)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-A01** | Domain Restriction | **[L]** | Chỉ tài khoản email đuôi `@fpt.edu.vn` mới được phép đăng nhập vào hệ thống. | Chặn ở Spring Security OAuth2 Filter, kiểm tra claim email. |
| **BR-A02** | Leadership Exclusivity | **[L]** | Một sinh viên chỉ được đảm nhiệm vai trò Leader (Chủ nhiệm) tối đa cho 1 CLB trong cùng một học kỳ. | Partial Unique Index trên `ClubMembership` cho (userID, semesterID) WHERE isLeader = true (PostgreSQL).Nếu dùng MySQL: thêm cột computed `leaderFlag TINYINT GENERATED ALWAYS AS (IF(clubRoleID = <LEADER_ROLE_ID>, 1, NULL)) VIRTUAL`và đặt UNIQUE KEY trên (userID, semesterID, leaderFlag).
Không dùng subquery trong DDL — hard-code roleID từ seed data.
| **BR-A03** | Multi-club Membership | **[G]** | Sinh viên được phép tham gia làm thành viên của nhiều CLB trong cùng kỳ (nhưng bị giới hạn bởi tổng số CLB tại BR-R01). | Không đặt unique constraint cứng ngoại trừ vai trò Leader. |
| **BR-A04** | Role Hierarchy | **[L]** | Phân cấp quyền hạn trong CLB: Member < Vice-Leader < Leader < IC-PDP Manager < System Admin. Quyền cấp dưới là tập con của cấp trên. | Cấu hình Spring Security `hasRole()` kế thừa phân quyền. |
| **BR-A05** | Conflict of Interest | **[L]** | Cán bộ phòng IC-PDP có quyền đọc toàn bộ dữ liệu nhưng không được phép có vai trò Member/Leader trong bất kỳ CLB nào. | Validation ở Service layer khi thêm thành viên: kiểm tra `UserAccount.roleID` FK → `SystemRole` nếu roleName = 'ICPDP' thì reject. |
| **BR-A06** | Dynamic Authorization | **[G]** | Quyền hạn truy cập các chức năng quản trị được xác định động theo học kỳ hiện tại của phiên đăng nhập `(UserAccount × Semester × ClubRole)`. | semesterID được lưu trong token session/JWT claim để lọc quyền. |
| **BR-A07** | Guest Rate Limiting | **[G]** | Giới hạn Guest (chưa đăng nhập) chỉ được truy vấn AI Chatbot tối đa 5 lần/ngày dựa trên IP để chống spam và lạm dụng API. | Sử dụng Redis/Rate Limiter Filter giới hạn số request từ mỗi IP. |
| **BR-A08** | Account Suspension | **[G]** | Admin có quyền tạm khóa tài khoản vi phạm (`accountStatus = 'Suspended'`). Tài khoản này sẽ bị chặn truy cập hoàn toàn vào hệ thống. | Spring Security Filter chặn login nếu accountStatus != 'Active'. |

### 2.2 Nhóm B – Quản lý Thành viên & Học kỳ (Membership & Semester)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-B01** | Semester Transition History | **[G]** | Khi học kỳ kết thúc, toàn bộ dữ liệu thành viên (`ClubMembership`) của kỳ đó tự động đóng băng thành dữ liệu lịch sử Read-Only. BĐH phải đăng ký thành viên mới thủ công. | endpoint cập nhật thành viên chặn nếu SemesterID đã kết thúc. |
| **BR-B02** | Alumni Profile Restriction | **[L]** | Cựu thành viên (`Alumnus`) chỉ được tự cập nhật thông tin liên hệ hiện tại trên trang cá nhân. Hồ sơ cống hiến lịch sử của họ là Read-Only. | API PUT/PATCH profile kiểm tra và chặn sửa các trường thành tích lịch sử. |
| **BR-B03** | Membership Uniqueness | **[L]** | Mỗi sinh viên chỉ có duy nhất 1 bản ghi `ClubMembership` hoạt động cho mỗi cặp `(clubID, semesterID)`. | Unique constraint DB trên `(userID, clubID, semesterID)`. |
| **BR-B04** | Active Semester Limit | **[L]** | Hệ thống chỉ cho phép tối đa 1 học kỳ có trạng thái `Active` tại một thời điểm hoạt động. | Unique Index trên bảng `Semester` lọc những bản ghi có semesterStatus = 'Active'. |
| **BR-B05** | Semester Date Validation | **[G]** | Không được phép tạo các học kỳ có khoảng thời gian chồng lấn lên nhau. Tránh chỉnh sửa ngày của học kỳ đã kết thúc. | Kiểm tra overlap ngày trước khi INSERT. Chặn UPDATE ngày học kỳ cũ ở Service layer. |
| **BR-B06** | Manual Succession | **[G]** | Khi Leader/Vice-Leader thôi học hoặc bị kỷ luật giữa kỳ, việc cập nhật nhân sự thay thế được thực hiện thủ công bởi IC-PDP/Admin trên UI. | Cập nhật trực tiếp vai trò trong `ClubMembership`, ghi nhận log kỷ luật. |Sinh viên bị ghi nhận log kỷ luật có hiệu lực trong kỳ hiện tại (disciplineLog.status = 'Active') không được phép nhận vai trò Leader tại bất kỳ CLB nào trong cùng kỳ đó. API kế vị phải thực hiện atomic: (1) revoke Leader cũ → Member, (2) assign Leader mới — trong cùng một transaction.
Không cho phép gán Leader mới khi Leader cũ chưa bị revoke.
| **BR-B07** | Minimum Club Size | **[G]** | Cuối đợt tuyển dụng đầu kỳ, nếu CLB có dưới 5 thành viên Active (bao gồm Leader), trạng thái CLB tự động chuyển sang `Inactive`. | Scheduled Job quét đếm số lượng bản ghi Active trong ClubMembership. |

### 2.3 Nhóm C – Phân hệ Tuyển dụng (Recruitment Management)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-R01** | Max Active Applications | **[L]** | Tại mọi thời điểm, tổng số đơn đang tuyển (`Submitted`/`Under Review`) cộng với số CLB đang hoạt động chính thức của 1 sinh viên **không được vượt quá 4**. | Frontend ẩn/khóa nút "Ứng tuyển". Backend chạy validate đếm tổng bản ghi trước khi lưu đơn. |Đơn ở trạng thái Withdrawn, Rejected, hoặc Draft không tính vào slot giới hạn. Chỉ đơn có trạng thái Submitted hoặc Under Review mới được đếm.
| **BR-R02** | Dynamic Form & Portfolio | **[G]** | Đơn ứng tuyển hỗ trợ các câu hỏi động tùy biến theo CLB. BĐH có quyền yêu cầu nộp "Minh chứng năng lực/kinh nghiệm" dạng file PDF/ảnh hoặc đường link portfolio. | Lưu cấu hình form động dưới dạng JSON. Validate bắt buộc trường minh chứng nếu được bật. |
| **BR-R03** | 15-Day Campaign Cycle | **[G]** | Đợt tuyển dụng mặc định diễn ra trong 15 ngày. Hết 15 ngày, hệ thống gửi thông báo nhắc nhở BĐH thực hiện Đóng đơn nhận tuyển hoặc Gia hạn đợt tuyển. | Scheduler job đếm số ngày từ ngày mở đợt tuyển và gửi email cảnh báo/notification. |
| **BR-R04** | Interview Invitation Lock | **[G]** | Nút "Gửi lời mời phỏng vấn" trên giao diện BĐH chỉ được kích hoạt sau khi đợt nhận đơn ứng tuyển chính thức kết thúc (đã qua 15 ngày hoặc đóng thủ công). | UI chặn và API từ chối chuyển trạng thái đơn sang phỏng vấn nếu chiến dịch chưa đóng. |
| **BR-R05** | Screening Notifications | **[G]** | Hệ thống tự động gửi email mời phỏng vấn (Accept) kèm lịch chi tiết (giờ, địa điểm/link online) hoặc gửi thư cảm ơn tự động (Reject) khi BĐH duyệt đơn. | Event-driven email sending dựa trên trạng thái `RecruitmentApplication`. |
| **BR-R06** | Interview Result Approval | **[G]** | BĐH chấm điểm phỏng vấn và đánh giá Đạt/Không đạt. Chỉ khi đánh giá là 'Đạt', hệ thống mới tự tạo `ClubMembership` cho kỳ hiện tại. | Transaction cập nhật trạng thái đơn ứng tuyển và chèn bản ghi thành viên mới. |
| **BR-R07** | Draft Auto-Cleanup | **[G]** | Đơn ứng tuyển ở trạng thái `Draft` quá 7 ngày mà chưa Submit sẽ bị hệ thống tự động dọn dẹp (soft delete) để giải phóng rác dữ liệu. | Scheduled Job quét các đơn `Draft` có `createdAt` quá hạn 7 ngày. |
| **BR-R08** | Re-apply Cooldown | **[G]** | Sinh viên đã tự rút đơn (`Withdrawn`) sẽ không được phép nộp lại đơn vào chính CLB đó trong cùng một học kỳ. | Backend Validate chặn insert nếu đã tồn tại đơn trạng thái `Withdrawn`. |Trong một học kỳ, mỗi sinh viên tối đa được thực hiện hành động Withdraw 5 lần (tổng cộng, trên tất cả CLB). Vượt ngưỡng, hệ thống khóa tính năng Withdraw của sinh viên đó và ghi log cảnh báo để Admin xem xét.

### 2.4 Nhóm D – Quản lý Sự kiện & Đánh giá (Event & Assessment)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-E01** | Unified Event Entity | **[G]** | Mọi sự kiện và đề xuất được quản lý trên thực thể `Event` duy nhất (Draft, Pending, Approved, Rejected, Reported, Closed, Cancelled). | Không dùng bảng đề xuất riêng, Event status điều hướng luồng phê duyệt. |
| **BR-E02** | Proposal Timeline | **[L]** | Đề xuất sự kiện phải gửi duyệt trước ngày diễn ra sự kiện tối thiểu 14 ngày. Hệ thống khóa tính năng Submit nếu vi phạm. | Kiểm tra `event.startDate - today >= 14` trước khi gửi duyệt. |Ngoại lệ Resubmit: nếu IC-PDP từ chối và yêu cầu sửa đổi (status → Rejected),
thời hạn 14 ngày được tính lại từ thời điểm BĐH nộp lại (Resubmit).
Điều kiện để Resubmit được chấp nhận: event.startDate - resubmitDate >= 7 ngày.
Nếu không còn đủ 7 ngày, hệ thống thông báo "Không đủ thời gian tổ chức"
và BĐH phải đổi ngày sự kiện trước khi nộp lại.
| **BR-E03** | Event Role Assignment | **[G]** | Khi lập kế hoạch sự kiện, BĐH bắt buộc phân vai trò công việc cụ thể cho từng thành viên tham gia ban tổ chức (PR, Hậu cần, Diễn giả...). | Bản ghi `EventRole` ánh xạ (EventID, UserID, RoleName). Kiểm tra khi gửi báo cáo sự kiện. |
| **BR-E04** | Performance Assessment | **[G]** | Sau sự kiện, Leader tiến hành chấm điểm hiệu suất nhân sự (thái độ, hoàn thành vai trò, đóng góp) và được phép xuất file Excel chứa điểm số này. | Form chấm điểm trên UI, thư viện Apache POI/Jxls để xuất file `.xlsx` định dạng chuyên nghiệp. |
| **BR-E05** | Post-Event Report Deadline | **[G]** | BĐH phải upload báo cáo tổng kết sự kiện lên hệ thống trong vòng 7 ngày kể từ khi sự kiện kết thúc. | Scheduler job kiểm tra hàng ngày, gửi thông báo cảnh báo trễ hạn. |
| **BR-E06** | Approved Event Deletion | **[G]** | Sự kiện đã Approved không được phép xóa khỏi DB, chỉ được hủy (Cancelled) kèm lý do dài tối thiểu 20 ký tự và gửi thông báo tới người đăng ký. | Vô hiệu hóa tính năng xóa cứng, hỗ trợ API PATCH status sang 'Cancelled' kèm lý do. |
| **BR-E07** | Budget Threshold | **[G]** | Đề xuất sự kiện có ngân sách dự kiến > 5.000.000 VNĐ bắt buộc phải có ghi chú phê duyệt bổ sung hoặc phê duyệt cấp 2 từ IC-PDP trong trường `pdpFeedback`. | Frontend hiện warning, Backend validate yêu cầu `pdpFeedback` không được rỗng. |
| **BR-E08** | Location Overlap Warning | **[G]** | Hệ thống từ chối (HTTP 409) hành động Approve nếu phát hiện sự kiện đang chờ duyệt
trùng địa điểm VÀ khoảng thời gian với một sự kiện đã có trạng thái Approved.
IC-PDP bắt buộc phải: (A) yêu cầu BĐH thay đổi địa điểm/thời gian và nộp lại,
hoặc (B) Cancelled sự kiện Approved trước đó trước khi duyệt sự kiện mới. | API duyệt sự kiện kiểm tra: SELECT COUNT(*) FROM Event WHERE location = :location
AND status = 'Approved' AND startDate < :endDate AND endDate > :startDate AND id != :id.
Nếu COUNT > 0 → trả về HTTP 409 với body { "error": "LOCATION_TIME_CONFLICT",
"conflictingEventId": <id> }. Không có cơ chế bỏ qua (override) cho trường hợp này. |

### 2.5 Nhóm E – Quyền lợi & Điểm phong trào (Benefits & Points)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-D01** | Points Lock Until Closed | **[G]** | Điểm phong trào của thành viên sau sự kiện ở trạng thái tạm khóa (`Locked`). Chỉ được cộng chính thức (`Unlocked`) khi sự kiện được IC-PDP duyệt `Closed`. | Điểm lưu ở bảng `AttendanceBenefit` có `pointStatus = 'Locked'`. Chuyển 'Unlocked' khi Event -> Closed. |
| **BR-D02** | Double-Counting Prevention | **[L]** | Một sinh viên không được cộng điểm phong trào hai lần cho cùng một sự kiện. | Unique Constraint trên `AttendanceBenefit` cho cặp (userID, eventID). |
| **BR-D03** | Role-Based Multiplier | **[G]** | Điểm phong trào nhân theo hệ số vai trò sự kiện: Ban tổ chức (2.0x), Tình nguyện viên (1.5x), Người tham dự (1.0x). Hệ số lưu trong `SystemConfig`. | Cấu hình lưu dưới dạng key-value. Điểm cộng = Điểm gốc sự kiện × Hệ số vai trò. |
| **BR-D04** | Attendance Evidence | **[G]** | Ghi nhận điểm danh bắt buộc phải đính kèm minh chứng chứng minh tham gia thực tế (ảnh chụp hoạt động, file scan danh sách ký tên). | Trường `evidenceUrl` trong bảng `AttendanceBenefit` kiểm tra NOT NULL khi điểm danh. |
| **BR-D05** | Member Eligibility | **[L]** | Chỉ những sinh viên có trạng thái thành viên `Active` trong học kỳ đó mới được phép cộng điểm phong trào từ hoạt động của CLB. | SQL Query join `ClubMembership` kiểm tra status trước khi commit điểm. |
| **BR-D06** | Penalty Points | **[G]** | Ban Điều Hành có quyền chấm điểm cống hiến âm (Negative contribution score) cho nhân sự vi phạm nghiêm trọng kỷ luật khi tổ chức sự kiện. | Validation cho phép `contributionScore` có thể âm (DB constraint bị vô hiệu hóa check dương). |
| **BR-D07** | Max Event Points | **[L]** | Điểm phong trào gốc (Base Points) tối đa cho một sự kiện thông thường không được vượt quá 100 điểm. Giá trị này lưu tại `SystemConfig`. | Backend validate so sánh số điểm sự kiện với cấu hình MAX_EVENT_BASE_POINTS. |

### 2.6 Nhóm F – Kho Tri thức & AI Chatbot (Knowledge & AI)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-AI01** | Knowledge Isolation | **[L]** | Tài liệu của CLB mặc định là nội bộ (`visibilityScope = 'ClubInternal'`), CLB khác không thể xem trừ khi tài liệu có `visibilityScope = 'Public'`. | SQL filter mặc định: `WHERE clubID = :userClubID OR visibilityScope = 'Public'`. |
| **BR-AI02** | AI Query Boundaries | **[L]** | AI Chatbot chỉ được truy xuất thông tin từ tài liệu có `visibilityScope = 'Public'` (quy chế trường) và tài liệu nội bộ của CLB người dùng đang tham gia. | RAG retrieval context áp dụng bộ lọc SQL filter tương tự BR-AI01 dựa trên JWT claims. |
| **BR-AI03** | Confidence Fallback | **[G]** | Nếu câu trả lời sinh ra từ Gemini API có độ tin cậy < 70%, AI không được tự trả lời mà phải hiển thị câu fallback mặc định và ghi log lỗi. | Độ tin cậy được tính tại tầng RAG pipeline, không lấy từ Gemini API response.
Cụ thể: tính max(cosineSimilarity(queryVector, chunkVector)) trên tập retrieved chunks.
Nếu max similarity < ngưỡng cấu hình RAG_CONFIDENCE_THRESHOLD (mặc định 0.70),
không gọi Gemini, trả về câu fallback mặc định và ghi AIChatAuditLog với status = 'Fallback'.
Nếu gọi Gemini nhưng retrieved chunks rỗng, cũng áp dụng fallback tương tự.
| **BR-AI04** | Chat Audit Logging | **[L]** | Mọi câu hỏi, phản hồi của AI, độ tin cậy và nguồn trích dẫn bắt buộc phải được ghi nhật ký đầy đủ để phục vụ kiểm soát lạm dụng. | Tự động ghi nhận thông tin vào bảng `AIChatAuditLog` sau mỗi lượt chat. |
| **BR-AI05** | Markdown Document Format | **[G]** | Nội dung tài liệu lưu trữ bàn giao bắt buộc phải sử dụng định dạng Markdown sạch (được khử mã độc và HTML thô). | Bộ lọc sanitize nội dung đầu vào, validate cấu trúc Markdown hợp lệ. |
| **BR-AI06** | Leaderboard Query Caching | **[G]** | Mọi hoạt động truy xuất bảng xếp hạng thi đua phải đi qua cache để bảo vệ hiệu năng DB. | Lưu trữ dữ liệu tính toán điểm tích lũy vào bảng `LeaderboardCache` và cập nhật định kỳ. |
| **BR-AI07** | RAG Sync Delay | **[G]** | Khi tài liệu `KnowledgeArchive` được chỉnh sửa, hệ thống RAG không phản hồi bản mới lập tức mà sử dụng cơ chế Indexing bất đồng bộ (Asynchronous rebuild) để tối ưu hiệu năng. | Message Queue/Kafka đẩy event sang Vector DB sau khi insert/update thành công. |

### 2.7 Nhóm G – Quản trị Hệ thống & Ngoại lệ (System & Exceptions)
| ID | Tên quy tắc | Loại | Mô tả chi tiết | Cách kiểm soát kỹ thuật |
| :--- | :--- | :---: | :--- | :--- |
| **BR-G01** | Direct Event Override | **[G]** | Trong trường hợp sai sót nghiêm trọng, Admin hoặc IC-PDP có quyền sửa trực tiếp thông tin sự kiện hoặc điểm phong trào đã Closed, ghi nhận chi tiết vào `AuditLog`. | API riêng tại /admin/override/events/{id} và /admin/override/points/{id}, phân quyền @PreAuthorize("hasAnyRole('ADMIN','ICPDP')").Endpoint này được miễn kiểm tra semesterStatus (bypass filter BR-B01). Bắt buộc trường overrideReason (String, tối thiểu 30 ký tự) trong request body. Mọi thay đổi ghi đầy đủ vào AuditLog kèm overrideReason, userId, timestamp. |
| **BR-G02** | SLA Pending Requests | **[G]** | Thời gian xử lý phê duyệt đề xuất tối đa là 7 ngày thường (calendar days). Quá hạn hệ thống tự động gửi cảnh báo khẩn cấp (escalate) lên Admin. | Scheduler job chạy kiểm tra hàng ngày các sự kiện ở trạng thái `Pending` quá 7 ngày. |
| **BR-G03** | Semester Close Consistency | **[G]** | Hệ thống chặn hành động đóng học kỳ của Admin nếu còn sự kiện chưa xử lý xong (Pending/Reported) hoặc còn yêu cầu sửa điểm chưa giải quyết.Ngoài ra, hệ thống chặn đóng học kỳ nếu còn bản ghi trong AttendanceBenefit có pointStatus = 'Locked' thuộc kỳ đang đóng. |Validation chặn ở API đóng học kỳ, trả về lỗi 409 kèm danh sách vi phạm chi tiết gồm:
- Danh sách eventID còn Pending/Reported.
- Danh sách yêu cầu sửa điểm chưa giải quyết.
- Số lượng bản ghi AttendanceBenefit còn pointStatus = 'Locked'. |
| **BR-G04** | Soft Delete & Non-Impersonation | **[L]** | Không xóa cứng dữ liệu thực thể cốt lõi (sử dụng cờ `isDeleted = true` thay vì DELETE). Admin tuyệt đối không được phép giả mạo tài khoản người dùng khác. | Chặn cứng lệnh SQL DELETE trực tiếp ở Repository. Mọi query mặc định lọc `WHERE isDeleted = false`. Không phát triển endpoint impersonate. |Lưu ý Unique Constraint: mọi bảng áp dụng soft delete có Unique Constraint phải chuyển sang Partial Unique Index dạng WHERE isDeleted = false.
Cụ thể: ClubMembership (userID, clubID, semesterID) và AttendanceBenefit (userID, eventID)
phải dùng Partial Index, không dùng standard UNIQUE constraint của DB.
Không tuân thủ điều này sẽ gây lỗi duplicate key khi re-insert sau soft delete.
| **BR-G05** | Maintenance Mode | **[G]** | Admin có thể bật chế độ bảo trì (`MAINTENANCE_MODE`) trong `SystemConfig`. Khi bật, mọi API thay đổi dữ liệu từ User/Leader đều bị chặn (mã 503), chuyển hệ thống sang Read-Only. | Interceptor/Filter kiểm tra cờ bảo trì trước khi xử lý các request POST/PUT/DELETE. |

---

## 3. RACI MATRIX (PHÂN QUYỀN TRÁCH NHIỆM)

Dưới đây là RACI Matrix cho các tính năng chính sau khi rút gọn:
- **R (Responsible):** Người thực hiện công việc.
- **A (Accountable):** Người chịu trách nhiệm phê duyệt cuối cùng.
- **C (Consulted):** Người đóng góp ý kiến tư vấn.
- **I (Informed):** Người nhận thông báo sau khi hoàn thành.

| Tính năng / Quy trình | Guest | Member | Leader / BĐH | IC-PDP Manager | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Đăng ký tuyển dụng | **R** | - | **C** | - | **I** |
| Duyệt hồ sơ & Phỏng vấn | - | - | **R / A** | - | **I** |
| Lập sự kiện & Phân vai | - | - | **R / A** | **C** | - |
| Phê duyệt sự kiện | - | - | **I** | **R / A** | - |
| Chấm điểm hiệu suất sự kiện | - | **I** | **R / A** | - | - |
| Đóng sự kiện & Giải ngân điểm | - | **I** | **I** | **R / A** | - |
|| Sửa đổi sự kiện đã Closed | - | I | I | R | A |
| Đóng/Mở học kỳ mới | - | - | **I** | **C** | **R / A** |
| Tra cứu lịch sử hoạt động | - | - | **R** | **C** | **I** |


(*) IC-PDP thực hiện sửa đổi thông thường (Responsible). Admin là người phê duyệt
và chịu trách nhiệm cuối cùng (Accountable) với mọi thay đổi dữ liệu đã Closed.
Admin có quyền override không giới hạn; IC-PDP bị giới hạn bởi phạm vi nghiệp vụ
được định nghĩa trong BR-G01.
