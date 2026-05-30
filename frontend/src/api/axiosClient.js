//import thư viện axios để gọi API
import axios from "axios";

//Cấu hình axios client với baseURL và headers mặc định
const axiosClient = axios.create({
    //URL gốc
  baseURL: "https://your-api-url.com/api",
  headers: {
    //Báo cho server biết dữ liệu gửi lên là JSON
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

//Export để file khác dùng
export default axiosClient;