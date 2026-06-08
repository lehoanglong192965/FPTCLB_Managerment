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

    // --- Các hàm Getter tùy chỉnh ---


    private Integer userId;
    private String email;
    private Integer roleId;
    private Collection<? extends GrantedAuthority> authorities;

    // BỔ SUNG: Biến này dùng để chứa toàn bộ dữ liệu Google trả về
    private Map<String, Object> attributes;

    // Constructor 1: Dùng cho đăng nhập JWT thông thường (giữ nguyên của bạn)
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
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}