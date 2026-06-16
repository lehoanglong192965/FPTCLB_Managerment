import axiosClient from "../axiosClient";

const systemConfigApi = {
  getAll: () =>
    axiosClient.get("/admin/system-configs"),

  update: (configKey, configValue) =>
    axiosClient.put(`/admin/system-configs/${configKey}`, { configValue }),
};

export default systemConfigApi;
