package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fptu.fcms.dto.SemesterDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SemesterControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @WithMockUser(roles = {"Admin"})
    void testAllSemesterEndpoints() throws Exception {
        // 1. POST /api/semesters (Create a new semester)
        SemesterDTO newSemester = new SemesterDTO();
        newSemester.setSemesterCode("TEST00");
        newSemester.setStartDate(LocalDate.of(2100, 1, 1));
        newSemester.setEndDate(LocalDate.of(2100, 4, 30));
        newSemester.setIsActive(false);

        MvcResult postResult = mockMvc.perform(post("/api/semesters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newSemester)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.semesterCode", is("TEST00")))
                .andReturn();

        String responseString = postResult.getResponse().getContentAsString();
        SemesterDTO createdSemester = objectMapper.readValue(responseString, SemesterDTO.class);
        Integer id = createdSemester.getSemesterID();

        // 2. GET /api/semesters/{id}
        mockMvc.perform(get("/api/semesters/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.semesterCode", is("TEST00")));

        // 3. PUT /api/semesters/{id}
        createdSemester.setSemesterCode("TEST00_U");
        mockMvc.perform(put("/api/semesters/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createdSemester)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.semesterCode", is("TEST00_U")));

        // 4. GET /api/semesters
        mockMvc.perform(get("/api/semesters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        // 5. DELETE /api/semesters/{id}
        mockMvc.perform(delete("/api/semesters/" + id))
                .andExpect(status().isNoContent());

        // Verify it was soft-deleted (Active should be false, isDeleted should be true, but GET might still return it if not filtered)
        // We just ensure delete returns 204 No Content.
    }
}
