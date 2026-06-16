import axiosClient from "../axiosClient";

const withdrawLogApi = {
  getCount: (studentId, semesterId) =>
    axiosClient.get("/withdraw-logs/count", { params: { studentId, semesterId } }),

  getLatest: (studentId, clubId) =>
    axiosClient.get("/withdraw-logs/latest", { params: { studentId, clubId } }),

  exists: (applicationId) =>
    axiosClient.get("/withdraw-logs/exists", { params: { applicationId } }),
};

export default withdrawLogApi;
