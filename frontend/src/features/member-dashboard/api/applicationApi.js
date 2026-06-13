import axiosClient from "../../../services/api/axiosClient";

const applicationApi = {
  apply: ({ clubID, cvUrl, introduction, answersJson }, semesterID = 1) =>
    axiosClient.post(
      "/applications/apply",
      { clubID, cvUrl, introduction, answersJson },
      { headers: { "X-Semester-ID": semesterID } }
    ),

  withdraw: (applicationId) =>
    axiosClient.post(`/applications/${applicationId}/withdraw`),
};

export default applicationApi;
