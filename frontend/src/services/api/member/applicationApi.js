import axiosClient from "../axiosClient";

const applicationApi = {
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
  getMyApplications: () =>
    axiosClient.get("/applications/my"),

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
