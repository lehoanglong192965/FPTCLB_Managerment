import axiosClient from "../../../services/api/axiosClient";

/**
 * semesterApi — thuần HTTP call, không chứa business logic.
 *
 * Base URL: http://localhost:8080/api  (cấu hình trong .env → VITE_API_URL)
 *
 * ─────────────────────────────────────────────────────────────
 *  ENDPOINT              METHOD  REQUEST BODY              RESPONSE
 * ─────────────────────────────────────────────────────────────
 *  /semesters            GET     —                         SemesterDTO[]
 *  /semesters/:id        GET     —                         SemesterDTO
 *  /semesters            POST    { semesterCode,           SemesterDTO
 *                                  startDate, endDate,
 *                                  isActive }
 *  /semesters/:id        PUT     { semesterCode,           SemesterDTO
 *                                  startDate, endDate,
 *                                  isActive }
 *  /semesters/:id        DELETE  —                         204 No Content
 * ─────────────────────────────────────────────────────────────
 * Yêu cầu quyền Admin hoặc ICPDP cho POST / PUT / DELETE.
 */
const semesterApi = {
  getAll: () =>
    axiosClient.get("/semesters"),

  getById: (id) =>
    axiosClient.get(`/semesters/${id}`),

  create: ({ semesterCode, startDate, endDate, isActive }) =>
    axiosClient.post("/semesters", { semesterCode, startDate, endDate, isActive }),

  update: (id, { semesterCode, startDate, endDate, isActive }) =>
    axiosClient.put(`/semesters/${id}`, { semesterCode, startDate, endDate, isActive }),

  delete: (id) =>
    axiosClient.delete(`/semesters/${id}`),
};

export default semesterApi;