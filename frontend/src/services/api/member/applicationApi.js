import axiosClient from "../axiosClient";

const applicationApi = {
  // Member: upload file CV (PDF, tối đa 10MB) trước khi nộp đơn — trả về { url }
  uploadCv: (file) => {
    const form = new FormData();
    form.append("file", file);
    return axiosClient.post("/applications/cv", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Member: nộp đơn
  apply: ({ clubID, cvUrl, introduction, answersJson }, semesterID = 1) =>
    axiosClient.post(
      "/applications/apply",
      { clubID, cvUrl, introduction, answersJson },
      { headers: { "X-Semester-ID": semesterID } }
    ),

  // Member: rút đơn
  withdraw: (applicationId) =>
    axiosClient.post(`/applications/${applicationId}/withdraw`),

  // Member: xem tất cả đơn của mình
  // skipAuthLogout: request nền, lỗi đã được ApplicationsContext tự bắt cục bộ,
  // không nên coi 401 ở đây là mất phiên đăng nhập toàn cục
  getMyApplications: () =>
    axiosClient.get("/applications/my", { skipAuthLogout: true }),

  // Leader: lấy danh sách đơn ứng tuyển của CLB
  getClubApplications: (clubId) =>
    axiosClient.get(`/v1/recruitment/applications/club/${clubId}`),

  // Leader: duyệt CV (isAccepted=true kèm interviewTime+interviewLocation, hoặc false kèm reason)
  reviewCV: (payload) =>
    axiosClient.post("/v1/recruitment/applications/review", payload),

  // Leader: kết luận phỏng vấn (isPassed: true/false)
  gradeInterview: (payload) =>
    axiosClient.post("/v1/recruitment/interviews/grade", payload),
};

export default applicationApi;
