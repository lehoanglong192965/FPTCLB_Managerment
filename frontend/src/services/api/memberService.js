import axiosClient from "./axiosClient";

const memberService = {
  // Lấy danh sách thành viên của CLB
  // params: { page, limit, role: "CORE_TEAM" | "VICE_LEADER" | ... }
  getAll: (clubId, params) =>
    axiosClient.get(`/clubs/${clubId}/members`, { params }),

  // Lấy thông tin 1 thành viên
  getById: (clubId, memberId) =>
    axiosClient.get(`/clubs/${clubId}/members/${memberId}`),

  // Duyệt đơn xin tham gia CLB (VICE_LEADER trở lên)
  approve: (clubId, memberId) =>
    axiosClient.patch(`/clubs/${clubId}/members/${memberId}/approve`),

  // Từ chối đơn xin tham gia
  reject: (clubId, memberId, reason) =>
    axiosClient.patch(`/clubs/${clubId}/members/${memberId}/reject`, { reason }),

  // Thay đổi vai trò thành viên trong CLB
  // newRole: "CORE_TEAM" | "VICE_LEADER" → nâng cấp (chỉ CLUB_LEADER được đổi)
  // newRole: "MEMBER" → hạ cấp về thành viên thường
  setRole: (clubId, memberId, newRole) =>
    axiosClient.patch(`/clubs/${clubId}/members/${memberId}/role`, { role: newRole }),

  // Mời thành viên mới bằng email (gửi link mời)
  invite: (clubId, email) =>
    axiosClient.post(`/clubs/${clubId}/members/invite`, { email }),

  // Xóa thành viên khỏi CLB (kick)
  remove: (clubId, memberId) =>
    axiosClient.delete(`/clubs/${clubId}/members/${memberId}`),

  // Lấy danh sách đơn xin tham gia đang chờ duyệt
  getPendingRequests: (clubId) =>
    axiosClient.get(`/clubs/${clubId}/members/pending`),
};

export default memberService;