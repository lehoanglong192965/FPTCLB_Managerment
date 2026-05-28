package com.fptu.fcms.config;

import com.fptu.fcms.security.CustomSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Allows fine-grained method security using @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomSuccessHandler customSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for REST API testing
            .authorizeHttpRequests(auth -> auth
                // Allow public access to home, club, and event pages plus static assets
                .requestMatchers("/", "/clubs/**", "/events/**", "/css/**", "/js/**", "/ws/**").permitAll()
                // Require specific roles for administrative endpoints
                .requestMatchers("/api/v1/admin/**").hasRole("Admin")
                .requestMatchers("/api/v1/icpdp/**").hasRole("ICPDP")
                // All other API/page paths require authentication
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService()))
                .successHandler(customSuccessHandler)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            );

        return http.build();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService() {
        return new com.fptu.fcms.security.CustomOAuth2UserService();
    }
}
