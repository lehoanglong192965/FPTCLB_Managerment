package com.fptu.fcms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fptu.fcms.dto.DisciplineLogDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Integration test cho DisciplineLogController.
 *
 * Kiểm tra:
 *   1. Full CRUD flow (POST → GET → PUT → GET all → DELETE) với role Admin.
 *   2. Phân quyền: User thường (không có role Admin/ICPDP) bị từ chối (HTTP 403).
 *   3. Validation: Request body thiếu trường bắt buộc trả về HTTP 400.
 *   4. Not found: GET/PUT/DELETE ID không tồn tại trả về HTTP 400.
 *
 * Lưu ý:
 *   - Test này phụ thuộc vào dữ liệu seed trong DB (cần có ít nhất 1 UserAccount
 *     và 1 Semester tồn tại để tạo DisciplineLog thành công).
 *   - @Transactional đảm bảo rollback sau mỗi test method.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class DisciplineLogControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    // =========================================================================
    // TEST 1: Full CRUD flow với quyền Admin
    // =========================================================================

    @Test
    @WithMockUser(roles = {"Admin"})
    void testFullCrudFlowAsAdmin() throws Exception {
        // ----- 1. POST /api/discipline-logs (Create) -----
        DisciplineLogDTO newLog = new DisciplineLogDTO();
        newLog.setUserID(1);      // Giả sử userID=1 tồn tại trong DB seed
        newLog.setSemesterID(1);  // Giả sử semesterID=1 tồn tại trong DB seed
        newLog.setReason("Vi phạm nội quy CLB - Test");
        newLog.setDisciplineStatus("Active");

        MvcResult postResult = mockMvc.perform(post("/api/discipline-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLog)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reason", is("Vi phạm nội quy CLB - Test")))
                .andExpect(jsonPath("$.disciplineStatus", is("Active")))
                .andExpect(jsonPath("$.disciplineID").isNotEmpty())
                .andReturn();

        DisciplineLogDTO created = objectMapper.readValue(
                postResult.getResponse().getContentAsString(), DisciplineLogDTO.class);
        Integer id = created.getDisciplineID();

        // ----- 2. GET /api/discipline-logs/{id} -----
        mockMvc.perform(get("/api/discipline-logs/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reason", is("Vi phạm nội quy CLB - Test")))
                .andExpect(jsonPath("$.disciplineStatus", is("Active")));

        // ----- 3. PUT /api/discipline-logs/{id} (Update reason only) -----
        // Lưu ý: DB có CHECK constraint CK_Discipline_Status — chỉ chấp nhận
        // một số giá trị cụ thể. Giữ nguyên status "Active" để tránh vi phạm constraint.
        // Trong môi trường thực tế, cần xác nhận danh sách giá trị hợp lệ từ DBA.
        created.setReason("Vi phạm nội quy CLB - Đã bổ sung chi tiết");
        // Giữ disciplineStatus = "Active" (không đổi)

        mockMvc.perform(put("/api/discipline-logs/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reason", is("Vi phạm nội quy CLB - Đã bổ sung chi tiết")))
                .andExpect(jsonPath("$.disciplineStatus", is("Active")));

        // ----- 4. GET /api/discipline-logs (List all) -----
        mockMvc.perform(get("/api/discipline-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        // ----- 5. DELETE /api/discipline-logs/{id} (Soft delete) -----
        mockMvc.perform(delete("/api/discipline-logs/" + id))
                .andExpect(status().isNoContent());
    }

    // =========================================================================
    // TEST 2: Phân quyền — User thường bị từ chối truy cập (HTTP 403)
    // =========================================================================

    @Test
    @WithMockUser(roles = {"Student"})
    void testAccessDeniedForNonAdminRole() throws Exception {
        mockMvc.perform(get("/api/discipline-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"Student"})
    void testCreateDeniedForNonAdminRole() throws Exception {
        DisciplineLogDTO dto = new DisciplineLogDTO();
        dto.setUserID(1);
        dto.setSemesterID(1);
        dto.setReason("Test");
        dto.setDisciplineStatus("Active");

        mockMvc.perform(post("/api/discipline-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // TEST 3: Validation — Request body thiếu trường bắt buộc (HTTP 400)
    // =========================================================================

    @Test
    @WithMockUser(roles = {"Admin"})
    void testCreateWithMissingFieldsReturns400() throws Exception {
        // DTO không có reason (bắt buộc @NotBlank)
        DisciplineLogDTO dto = new DisciplineLogDTO();
        dto.setUserID(1);
        dto.setSemesterID(1);
        // reason = null → vi phạm @NotBlank
        dto.setDisciplineStatus("Active");

        mockMvc.perform(post("/api/discipline-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // TEST 4: GET/DELETE ID không tồn tại → 400 Bad Request
    // =========================================================================

    @Test
    @WithMockUser(roles = {"Admin"})
    void testGetNonExistentIdReturns400() throws Exception {
        mockMvc.perform(get("/api/discipline-logs/999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    @Test
    @WithMockUser(roles = {"Admin"})
    void testDeleteNonExistentIdReturns400() throws Exception {
        mockMvc.perform(delete("/api/discipline-logs/999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not found")));
    }

    // =========================================================================
    // TEST 5: ICPDP role cũng được phép truy cập
    // =========================================================================

    @Test
    @WithMockUser(roles = {"ICPDP"})
    void testAccessAllowedForICPDPRole() throws Exception {
        mockMvc.perform(get("/api/discipline-logs"))
                .andExpect(status().isOk());
    }
}
