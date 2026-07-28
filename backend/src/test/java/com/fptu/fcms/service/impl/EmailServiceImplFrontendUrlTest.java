package com.fptu.fcms.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class EmailServiceImplFrontendUrlTest {

    @Test
    void accountActivationTemplate_usesConfiguredFrontendLoginUrl() {
        EmailServiceImpl service = new EmailServiceImpl(mock(JavaMailSender.class));
        ReflectionTestUtils.setField(service, "frontendUrl", "https://frontend.example/");

        String html = ReflectionTestUtils.invokeMethod(
                service,
                "buildAccountActivationEmailHtml",
                "Student"
        );

        assertThat(html)
                .contains("href=\"https://frontend.example/login\"")
                .doesNotContain("http://localhost:5173/login");
    }
}
