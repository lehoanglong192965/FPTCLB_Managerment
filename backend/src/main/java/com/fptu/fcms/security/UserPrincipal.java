package com.fptu.fcms.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User; // <--- Import mới

import java.util.Collection;
import java.util.Map; // <--- Import mới

@Getter
@Setter
// LƯU Ý QUAN TRỌNG: Thêm implements OAuth2User vào đây
public class UserPrincipal implements OAuth2User, UserDetails {

    private Integer userId;
    private String email;
    private Integer roleId;
    private Collection<? extends GrantedAuthority> authorities;

    // [MỚI - Batch 2] Các field claim mới từ JWT
    private String roleName;
    private String clubRole;
    private Integer clubId;

    // BỔ SUNG: Biến này dùng để chứa toàn bộ dữ liệu Google trả về
    private Map<String, Object> attributes;

    // Constructor 1: Dùng cho đăng nhập JWT thông thường (giữ nguyên backward-compatible)
    public UserPrincipal(Integer userId, String email, Integer roleId, Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.email = email;
        this.roleId = roleId;
        this.authorities = authorities;
    }

    // Constructor 2: BỔ SUNG ĐỂ DÙNG CHO GOOGLE OAUTH2
    public UserPrincipal(Integer userId, String email, Integer roleId, Collection<? extends GrantedAuthority> authorities, Map<String, Object> attributes) {
        this.userId = userId;
        this.email = email;
        this.roleId = roleId;
        this.authorities = authorities;
        this.attributes = attributes;
    }

    // Constructor 3: [MỚI - Batch 2] Dùng cho JwtAuthenticationFilter — tạo principal từ JWT claims, không query DB
    public UserPrincipal(Integer userId, String email, Integer roleId,
                         String roleName, String clubRole, Integer clubId,
                         Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.email = email;
        this.roleId = roleId;
        this.roleName = roleName;
        this.clubRole = clubRole;
        this.clubId = clubId;
        this.authorities = authorities;
    }

    // --- Các hàm Getter tùy chỉnh ---
    // (Vì bạn đã dùng @Getter của Lombok nên thực ra không cần viết lại mấy hàm này,
    // nhưng mình cứ giữ nguyên theo ý bạn cho chắc ăn)
    public Integer getUserId() { return userId; }
    public Integer getRoleId() { return roleId; }
    public String getEmail() { return email; }

    // [MỚI - Batch 2] Getter cho 3 claim mới
    public String getRoleName() { return roleName; }
    public String getClubRole() { return clubRole; }
    public Integer getClubId() { return clubId; }

    /* ==============================================================
       CÁC HÀM BẮT BUỘC PHẢI CÓ KHI IMPLEMENTS OAuth2User
       ============================================================== */
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        // Trả về email làm định danh chính khi dùng Google Login
        return email;
    }

    /* ==============================================================
       CÁC HÀM CỦA UserDetails (Giữ nguyên y hệt code cũ của bạn)
       ============================================================== */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return null; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}