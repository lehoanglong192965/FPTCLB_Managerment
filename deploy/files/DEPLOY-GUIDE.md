# Hướng dẫn deploy FCMS lên Azure App Service

> Cập nhật ngày 29/07/2026.
>
> Kiến trúc chốt: **Vercel** (React/Vite) → **Azure App Service**
> (Spring Boot JAR, Java SE 21) → **Azure SQL Database**. Cloudinary lưu file,
> Gmail SMTP cổng 587 gửi OTP và Gemini phục vụ chatbot.

## 0. Ai làm phần nào?

- **[Codex]**: sửa code/config, vá migration, thêm GitHub Actions, chạy test,
  chuẩn bị commit và kiểm tra log kỹ thuật.
- **[Bạn]**: đăng nhập/MFA, chọn Azure subscription, xác nhận tài nguyên,
  nhập secret trực tiếp vào dashboard và xác nhận thao tác có thể phát sinh phí.
- **[Cùng làm]**: đi từng bước trên portal và xác minh checkpoint.

Không gửi password, API secret, Gmail App Password, publish profile hoặc connection
string đầy đủ vào chat. Nhập chúng trực tiếp vào Azure/GitHub/Vercel.

## 1. Điều cần biết trước khi bắt đầu

### 1.1 Azure for Students và App Service F1

Azure for Students hiện cấp **100 USD credit trong 12 tháng** và không yêu cầu thẻ.
App Service Linux F1 có giá 0 USD nhưng chỉ dành cho học tập/thử nghiệm, không SLA,
giới hạn 1 GB RAM và 60 CPU phút/ngày. Ta bắt đầu bằng F1; nếu Spring Boot không đủ
tài nguyên hoặc hết CPU quota khi demo, đổi sang B1 và dùng student credit.
F1 cũng có thể unload ứng dụng khi không có traffic; request đầu tiên sau thời gian idle
có thể chậm vì cold start. Đây là hành vi dự kiến của môi trường demo miễn phí.

- Azure for Students: <https://learn.microsoft.com/azure/education-hub/find-ids>
- App Service pricing: <https://azure.microsoft.com/pricing/details/app-service/linux/>
- Java 21 support: <https://learn.microsoft.com/azure/app-service/language-support-policy>

### 1.2 Cloudinary credential đang hardcode

Xóa giá trị thật khỏi application.yml và chỉ đọc biến môi trường:

~~~yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
  max-image-size-bytes: ${CLOUDINARY_MAX_IMAGE_SIZE_BYTES:5242880}
~~~

Xóa khỏi phiên bản hiện tại **không xóa giá trị khỏi lịch sử Git**. Batch deploy không
rewrite lịch sử Git; credential được nhập riêng vào Azure. Nếu repository từng public,
rotate/revoke key cũ vẫn là biện pháp an toàn đúng.

### 1.3 Database bootstrap bằng Flyway baseline

Repository đã có `B2026072901__fcms_full_schema.sql`, tạo toàn bộ 54 bảng lõi.
Không còn bootstrap hai pha bằng Hibernate. Cấu hình cố định cho local và Azure:

~~~text
SPRING_FLYWAY_ENABLED=true
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
~~~

- Database rỗng: Flyway chạy baseline rồi các migration mới hơn baseline.
- Database hiện hữu: Flyway bỏ qua baseline và chỉ chạy migration `V` còn thiếu.
- Không sửa migration đã apply, không `repair` để che lỗi và không dùng
  `ddl-auto=update` trên schema do Flyway quản lý.
- Baseline chỉ tạo schema; `V2026072904` seed reference data bắt buộc, không tạo
  user/club/event hoặc dữ liệu demo.
### 1.4 Giới hạn ClamAV trên App Service

Java SE runtime của Azure App Service không kèm ClamAV daemon. Code hiện tại bỏ qua
`ConnectException`, nên ứng dụng vẫn boot và upload vẫn chạy nhưng file không được quét
virus khi `CLAMAV_HOST=localhost`. Đây là giới hạn chấp nhận cho bản demo; không được
tuyên bố smoke test upload đã chứng minh antivirus hoạt động. Muốn bật quét thật cần một
ClamAV service có thể truy cập qua mạng và cấu hình lại `CLAMAV_HOST`/`CLAMAV_PORT`.

## 2. Batch 1 — chuẩn bị repository [Codex]

Chưa tạo tài nguyên cloud trước khi batch này hoàn tất.

1. Fast-forward nhánh deploy tới origin/main, giữ nguyên file untracked.
2. Externalize JWT_SECRET và ba cấu hình CLOUDINARY_*.
3. Thêm fcms.frontend-url lấy từ FRONTEND_URL và dùng tại:
   - OAuth2SuccessHandler;
   - OAuth2FailureHandler;
   - link đăng nhập trong EmailServiceImpl.
4. Bổ sung FRONTEND_URL, GUEST_STATUS_BASE_URL, GUEST_LOOKUP_URL vào
   backend/.env.example.
5. Guard riêng từng cột trong hai migration ở mục 1.3.
6. Đặt Dockerfile/compose đúng vị trí để test local; `.dockerignore` phải loại
   `application-local.yml` khỏi build context. Dockerfile không dùng cho
   production App Service.
7. Thêm GitHub Actions build backend bằng Java 21 và deploy JAR qua
   Azure/webapps-deploy@v3.
8. Chạy backend test suite và frontend build; chỉ commit khi cả hai đạt.

## 3. Batch 2 — test local một pha bằng Docker [Codex]

Sau Batch 1:

~~~text
FCMS/
├── docker-compose.yml
└── backend/
    ├── Dockerfile
    └── .dockerignore
~~~

Compose cố định Flyway và Hibernate:

~~~text
SPRING_FLYWAY_ENABLED=true
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
~~~

Chạy trên volume/database mới:

~~~powershell
docker compose up --build
~~~

Chờ `Started FcmsApplication`, mở <http://localhost:8080/swagger-ui.html> và kiểm tra:

~~~sql
SELECT installed_rank, version, description, type, checksum, success
FROM dbo.flyway_schema_history
ORDER BY installed_rank;
~~~

Database rỗng phải có baseline `2026072901`, không có `success = 0`, và latest là
`2026072904`. Dùng `docker compose down`; chỉ thêm `-v` khi chắc chắn muốn xóa DB thử.
## 4. Batch 3 — Azure và giới hạn chi phí [Bạn + Codex]

1. Kích hoạt **Azure for Students** bằng tài khoản sinh viên.
2. Vào Cost Management + Billing → Budgets → Add.
3. Đặt budget nhỏ, ví dụ 5 USD/tháng; cảnh báo 50%, 80%, 100%.
4. Xác nhận subscription là Azure for Students, không phải Pay-As-You-Go khác.
5. Tạo Resource Group, ví dụ rg-fcms-demo, ở region có App Service và Azure SQL.

Bạn phải đăng nhập/MFA và xác nhận subscription. Codex không tự chọn gói có phí.

## 5. Batch 4 — tạo Azure App Service rỗng [Bạn + Codex]

Tạo Web App:

| Mục | Giá trị |
|---|---|
| Publish | Code |
| Runtime stack | Java 21 |
| Java web server stack | Java SE (Embedded Web Server) |
| Operating System | Linux |
| Region | cùng region với Azure SQL |
| App Service Plan | F1 Free; B1 chỉ khi F1 không đủ |
| App name | tên duy nhất, ví dụ fcms-ten-ban |

Backend URL:

~~~text
https://<app-name>.azurewebsites.net
~~~

Vào App Service → Properties, lưu toàn bộ **Additional Outbound IP Addresses**.
Azure có thể chọn bất kỳ IP nào trong tập này khi kết nối SQL, nên allowlist tất cả.

Tài liệu: <https://learn.microsoft.com/azure/app-service/overview-inbound-outbound-ips>.

## 6. Batch 5 — tạo Azure SQL Database [Bạn + Codex]

1. Tạo SQL Database, chọn Free offer nếu subscription hiển thị.
2. Tạo logical SQL server, giữ riêng FQDN, database name, admin username/password.
3. Chọn cùng region với App Service.
4. Trong Networking / Firewalls:
   - bật public access cho Selected networks;
   - thêm IP hiện tại của máy để dùng Query editor;
   - thêm từng Additional Outbound IP Address của App Service;
   - không mở dải 0.0.0.0–255.255.255.255;
   - không cần Allow Azure services nếu đã allowlist đủ IP.
5. JDBC URL:

~~~text
jdbc:sqlserver://<server>.database.windows.net:1433;databaseName=<database>;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30
~~~

- Free offer: <https://learn.microsoft.com/azure/azure-sql/database/free-offer-faq>
- SQL firewall: <https://learn.microsoft.com/azure/azure-sql/database/firewall-configure>

## 7. Batch 6 — chuẩn bị tích hợp [Bạn]

### Gmail SMTP

Bật 2FA, tạo App Password tại <https://myaccount.google.com/apppasswords>, giữ riêng
MAIL_USERNAME và App Password. Azure không chặn authenticated SMTP cổng 587:

<https://learn.microsoft.com/troubleshoot/azure/virtual-network/troubleshoot-outbound-smtp-connectivity>.

### Google OAuth

Tạo OAuth Client loại Web application và thêm:

~~~text
https://<app-name>.azurewebsites.net/login/oauth2/code/google
~~~

Nếu consent screen ở Testing, thêm email demo vào Test users.

### Cloudinary và Gemini

- Lấy ba giá trị CLOUDINARY_* trong Cloudinary Console; không dán secret vào chat.
- Lấy GEMINI_API_KEY nếu kiểm thử chatbot. Để trống thì AI không hoạt động.

## 8. Batch 7 — cấu hình Azure App Service [Bạn + Codex]

Vào App Service → Settings → Environment variables → App settings:

| Biến | Giá trị |
|---|---|
| SPRING_PROFILES_ACTIVE | prod |
| DB_URL | JDBC URL |
| DB_USERNAME / DB_PASSWORD | SQL admin |
| JWT_SECRET | random tối thiểu 64 ký tự |
| JWT_EXPIRATION | 86400000 |
| JWT_REFRESH_EXPIRATION | 604800000 |
| MAIL_USERNAME / MAIL_PASSWORD | Gmail + App Password |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | OAuth credential |
| CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | Cloudinary |
| GEMINI_API_KEY | Gemini, nếu dùng |
| SPRING_CACHE_TYPE | simple |
| REPORTS_STORAGE_DIR | /home/data/reports |
| FRONTEND_URL | URL Vercel; cập nhật sau nếu chưa có |
| FEEDBACK_PUBLIC_BASE_URL | frontend-url/feedback/guest |
| GUEST_STATUS_BASE_URL | frontend-url/guest/status |
| GUEST_LOOKUP_URL | frontend-url/guest/lookup |
| SEPAY_ACCOUNT_NUMBER / SEPAY_WEBHOOK_API_KEY | cấu hình payment |
| PAYMENT_BANK_NAME / PAYMENT_ACCOUNT_NAME / PAYMENT_BANK_BRANCH | thông tin hiển thị |
| SPRING_FLYWAY_ENABLED | true |
| SPRING_JPA_HIBERNATE_DDL_AUTO | validate |
| SPRING_JPA_SHOW_SQL | false |
| SERVER_FORWARD_HEADERS_STRATEGY | framework |
| JAVA_OPTS | -Dfile.encoding=UTF-8 |
| WEBSITE_JAVA_MAX_HEAP_MB | 700 cho F1 1 GB; B1 có thể tăng phù hợp |
| WEBSITE_WEBDEPLOY_USE_SCM | true |

Không tự đặt `SERVER_PORT`; App Service Java runtime cấp port cho Spring Boot.
App settings được mã hóa khi lưu và thay đổi setting sẽ restart app.

Tài liệu: <https://learn.microsoft.com/azure/app-service/configure-common>.
## 9. Batch 8 — GitHub Actions và backend [Bạn + Codex]

1. Trong App Service, bật **SCM Basic Auth Publishing Credentials**; giữ **FTP Basic
   Auth Publishing Credentials** ở trạng thái tắt. Với Linux, kiểm tra App setting
   `WEBSITE_WEBDEPLOY_USE_SCM=true`, sau đó tải Publish profile.
2. GitHub repo → Settings → Secrets and variables → Actions:
   - tab **Variables**: tạo `AZURE_WEBAPP_NAME` với đúng tên App Service;
   - tab **Secrets**: tạo `AZURE_WEBAPP_PUBLISH_PROFILE` và dán toàn bộ nội dung XML.

Dán publish profile trực tiếp tại GitHub, không gửi qua chat.

3. Workflow chạy nhánh deploy, Java 21, build trong backend và deploy JAR bằng
   `azure/webapps-deploy@v3`. Khi chưa có `AZURE_WEBAPP_NAME`, job build vẫn chạy còn
   job deploy tự bỏ qua, vì vậy lần push chuẩn bị repository không thất bại.
4. Sau khi tạo variable/secret, chạy lại workflow và chờ cả build lẫn deploy xanh.
5. Mở App Service → Log stream, chờ Started FcmsApplication.
6. Mở https://<app-name>.azurewebsites.net/swagger-ui.html.

Publish profile là credential triển khai. Chỉ lưu trong GitHub secret; reset khi không dùng.

Tài liệu: <https://learn.microsoft.com/azure/app-service/deploy-github-actions>.

## 10. Batch 9 — kiểm tra migration sau deploy [Bạn + Codex]

Giữ cố định:

~~~text
SPRING_FLYWAY_ENABLED=true
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
~~~

Sau khi workflow deploy xanh, theo dõi Log stream tới `Started FcmsApplication`, rồi chạy:

~~~sql
SELECT installed_rank, version, description, type, checksum, success
FROM dbo.flyway_schema_history
ORDER BY installed_rank;

SELECT COUNT(*) AS failed_rows
FROM dbo.flyway_schema_history
WHERE success = 0;
~~~

Với Azure DB hiện hữu đã ở `2026072516`, lần cập nhật này dự kiến có 60 history rows,
latest `2026072904`, `failed_rows = 0`; baseline `B2026072901` phải được bỏ qua.
Không tiếp tục nếu migration fail. Không repair hoặc xóa history để che lỗi.
## 11. Batch 10 — reference data và Admin đầu tiên [Bạn + Codex]

`V2026072904__required_reference_data.sql` tự seed các `SystemRole`, `ClubRole`,
`EventRole` và `SystemConfig` bắt buộc. Không chạy lại block INSERT role thủ công.

Kiểm tra role ID 1–5 tồn tại, sau đó đăng ký tài khoản thật, xác thực OTP và chỉ nâng
Admin nếu hệ thống chưa có Admin:

~~~sql
UPDATE dbo.UserAccount
SET roleID = 1
WHERE email = N'<email-fpt-cua-ban>';
~~~

Xác nhận đúng một dòng được cập nhật và đăng nhập lại để JWT nhận role mới.
## 12. Batch 11 — frontend Vercel [Bạn + Codex]

1. Import repo vào Vercel, Root Directory frontend.
2. Vite; build npm run build; output dist.
3. Thêm Production Environment Variables:

~~~text
VITE_API_URL=https://<app-name>.azurewebsites.net/api
VITE_PAYMENT_BANK_ID=<giá trị đang dùng>
VITE_PAYMENT_BANK_NAME=<giá trị đang dùng>
VITE_PAYMENT_ACCOUNT_NUMBER=<giá trị đang dùng>
VITE_PAYMENT_ACCOUNT_NAME=<giá trị đang dùng>
VITE_PAYMENT_BANK_BRANCH=<giá trị đang dùng>
~~~

4. Deploy và lấy https://<project>.vercel.app.
5. Cập nhật App Service:

~~~text
FRONTEND_URL=https://<project>.vercel.app
FEEDBACK_PUBLIC_BASE_URL=https://<project>.vercel.app/feedback/guest
GUEST_STATUS_BASE_URL=https://<project>.vercel.app/guest/status
GUEST_LOOKUP_URL=https://<project>.vercel.app/guest/lookup
~~~

frontend/vercel.json giữ rewrite SPA để refresh route con không 404.

## 13. Batch 12 — smoke test end-to-end [Cùng làm]

1. Backend Swagger qua HTTPS.
2. Frontend gọi API public, không lỗi CORS/network.
3. Đăng ký FPT → OTP → xác thực → đăng nhập.
4. Quên mật khẩu và OTP resend.
5. Google OAuth success/failure đều về Vercel.
6. Upload và đọc lại file Cloudinary.
7. Tạo CLB/sự kiện theo role.
8. Luồng khách/payment và URL trong email.
9. Automatic event report: preview, submit, PDF/CSV, Unicode tiếng Việt.
10. Chatbot Gemini nếu có key.
11. Restart App Service rồi kiểm tra SQL và file tại /home.

## 14. Troubleshooting

| Hiện tượng | Kiểm tra |
|---|---|
| Action không thấy pom.xml | Workflow phải build trong backend |
| App Service không boot | Log stream, env bắt buộc, Java SE 21, RAM F1 |
| Không kết nối SQL | JDBC, credential, toàn bộ Additional Outbound IPs |
| Migration không chạy | Xem Log stream và `flyway_schema_history`; không repair/xóa history để che lỗi |
| Không nhận OTP | Gmail 2FA/App Password, MAIL_*, log SMTP |
| OAuth về localhost | Ba chỗ dùng FRONTEND_URL và App setting |
| Vercel refresh 404 | frontend/vercel.json |
| Cloudinary lỗi | Ba biến CLOUDINARY_*; không in secret vào log |
| App chậm/dừng | Quota 60 CPU phút/ngày; cân nhắc B1 |
| Query editor không vào | Thêm IP máy vào SQL firewall |

## 15. Bắt đầu/tiếp tục release

1. Merge `main` mới nhất vào `deploy`, resolve có chủ đích và giữ hạ tầng deploy.
2. Chạy backend tests, frontend build và fresh/existing DB migration gate.
3. Push `deploy`; chờ GitHub Actions build + deploy xanh.
4. Hoàn tất Batch 9 → 12; chỉ chuyển batch khi checkpoint đạt.

Không quay lại bootstrap hai pha và không dùng Hibernate `update`.