import axiosClient from "./axiosClient";

const clubRegistrationApi = {
  submit: (data) => axiosClient.post("/clubs/registrations", data),
  getMyRegistrations: () => axiosClient.get("/clubs/registrations/my"),
  getPending: () => axiosClient.get("/clubs/registrations/pending"),
  getById: (id) => axiosClient.get(`/clubs/registrations/${id}`),
  review: (id, status, icpdpComment) =>
    axiosClient.put(`/clubs/registrations/${id}/review`, { status, icpdpComment }),
  uploadCardImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/uploads/card-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default clubRegistrationApi;
