    package com.fptu.fcms.config;

    import com.fptu.fcms.security.jwt.JwtAuthenticationFilter;
    import com.fptu.fcms.security.oauth2.CustomOAuth2UserService;
    import com.fptu.fcms.security.oauth2.OAuth2FailureHandler;
    import com.fptu.fcms.security.oauth2.OAuth2SuccessHandler;

    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;

    import org.springframework.security.config.annotation.web.builders.HttpSecurity;
    import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

    import org.springframework.security.config.http.SessionCreationPolicy;

    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.security.web.SecurityFilterChain;
    import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

    import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
    import org.springframework.web.cors.CorsConfiguration;
    import org.springframework.web.cors.CorsConfigurationSource;
    import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

    import java.util.List;

    @Configuration
    @EnableWebSecurity
    @EnableMethodSecurity
    public class SecurityConfig {

        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2SuccessHandler oAuth2SuccessHandler;
        private final OAuth2FailureHandler oAuth2FailureHandler;
        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        // Inject các component qua constructor
        public SecurityConfig(
                CustomOAuth2UserService customOAuth2UserService,
                OAuth2SuccessHandler oAuth2SuccessHandler,
                OAuth2FailureHandler oAuth2FailureHandler,
                JwtAuthenticationFilter jwtAuthenticationFilter
        ) {
            this.customOAuth2UserService = customOAuth2UserService;
            this.oAuth2SuccessHandler = oAuth2SuccessHandler;
            this.oAuth2FailureHandler = oAuth2FailureHandler;
            this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        }


        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

            http
                    .csrf(csrf -> csrf.disable())

                    // 1. Kích hoạt CORS (Rất quan trọng để Frontend gọi được API)
                    .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                    // 2. Tắt Session vì dùng JWT (Stateless)
                    .sessionManagement(session ->
                            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                    )

                    // 3. Phân quyền các API
                    .authorizeHttpRequests(auth -> auth
                            // Cho phép truy cập tự do vào các API Auth, đăng nhập OAuth2
                            .requestMatchers(
                                    "/api/auth/**",
                                    "/oauth2/**",
                                    "/login/**"
                            ).permitAll()
                            // Cho phép truy cập Swagger UI
                            .requestMatchers(
                                    "/v3/api-docs/**",
                                    "/swagger-ui/**",
                                    "/swagger-ui.html"
                            ).permitAll()
                            // Tất cả các request khác đều bắt buộc phải có Token hợp lệ
                            .anyRequest().authenticated()
                    )

                    // 4. Cấu hình luồng Google OAuth2
                    .oauth2Login(oauth2 -> oauth2
                            .userInfoEndpoint(userInfo ->
                                    userInfo.userService(customOAuth2UserService) // Lấy & chặn user
                            )
                            .successHandler(oAuth2SuccessHandler) // Thành công -> Phát JWT Token
                            .failureHandler(oAuth2FailureHandler) // Thất bại (sai email, lỗi...) -> Bắn về trang lỗi
                    );

            // 5. Chèn bộ lọc JWT vào trước bộ lọc UsernamePassword tiêu chuẩn
            http.addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

            return http.build();
        }

        // Cấu hình CORS (Cho phép mọi nguồn truy cập - Thích hợp khi đang Dev)
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
            CorsConfiguration configuration = new CorsConfiguration();
            configuration.setAllowedOriginPatterns(List.of("*"));
            configuration.setAllowedMethods(List.of("*"));
            configuration.setAllowedHeaders(List.of("*"));
            configuration.setAllowCredentials(false);

            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/**", configuration);
            return source;
        }

        // Bean mã hóa mật khẩu BCrypt
        @Bean
        public PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }
    }