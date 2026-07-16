package com.fptu.fcms.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitFilterTest {

    private RateLimitFilter filter;
    private AtomicInteger passedRequests;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter();
        passedRequests = new AtomicInteger();
        filterChain = (request, response) -> passedRequests.incrementAndGet();
    }

    @Test
    void guestWriteAllowsFifteenRequestsThenReturnsUtf8RateLimitResponse() throws Exception {
        for (int i = 0; i < 15; i++) {
            MockHttpServletResponse response = execute("POST", "/api/events/1/guest-registrations");
            assertEquals(HttpStatus.OK.value(), response.getStatus());
        }

        MockHttpServletResponse blocked = execute("POST", "/api/events/1/guest-registrations");

        assertEquals(15, passedRequests.get());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blocked.getStatus());
        assertEquals("UTF-8", blocked.getCharacterEncoding());
        assertEquals("application/json;charset=UTF-8", blocked.getContentType());
        assertTrue(blocked.getContentAsString(StandardCharsets.UTF_8).contains("Quá nhiều yêu cầu"));
    }

    @Test
    void guestGetRequestsDoNotConsumeWriteQuota() throws Exception {
        for (int i = 0; i < 30; i++) {
            assertEquals(HttpStatus.OK.value(), execute("GET", "/api/guest-registrations/status").getStatus());
        }
        for (int i = 0; i < 15; i++) {
            assertEquals(HttpStatus.OK.value(), execute("POST", "/api/guest-registrations/verify-otp").getStatus());
        }

        MockHttpServletResponse blocked = execute("POST", "/api/guest-registrations/verify-otp");

        assertEquals(45, passedRequests.get());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blocked.getStatus());
    }

    private MockHttpServletResponse execute(String method, String uri) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, filterChain);
        return response;
    }
}