import axiosClient from "../axiosClient";

const clubRegistrationApi = {
  submit: (data) => axiosClient.post("/clubs/registrations", data),
  getRegistrations: (status) =>
    axiosClient.get("/clubs/registrations", {
      params: status ? { status } : {},
    }),
  getMyRegistrations: () => axiosClient.get("/clubs/registrations/my"),
  getById: (id) => axiosClient.get(`/clubs/registrations/${id}`),
  uploadCardImage: (file, purpose = "club-registration") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);
    return axiosClient.post("/uploads/card-image", formData);
  },
};

export default clubRegistrationApi;
