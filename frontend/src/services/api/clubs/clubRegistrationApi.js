import axiosClient from "../axiosClient";

const clubRegistrationApi = {
  submit: (data) => axiosClient.post("/clubs/registrations", data),
  getRegistrations: (status) =>
    axiosClient.get("/clubs/registrations", {
      params: status ? { status } : {},
    }),
  getMyRegistrations: () => axiosClient.get("/clubs/registrations/my"),
  getById: (id) => axiosClient.get(`/clubs/registrations/${id}`),
  uploadCardImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/uploads/card-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default clubRegistrationApi;
