import axios from "axios";

// Nhận diện request bị hủy (dedup-abort trong axiosClient, unmount, v.v.).
// Gộp mọi biến thể mà axios có thể trả về — trước đây mỗi file tự kiểm tra
// một kiểu (có file thiếu nhánh err.message === "canceled") nên dễ lệch nhau.
export function isCanceledRequest(err) {
  return (
    axios.isCancel(err) ||
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.message === "canceled"
  );
}
