// src/services/api.js
import axios from 'axios';

// ======= Tạo instance Axios =======
const API_BASE_URL = 'http://localhost:5000'; // backend URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ======= JWT interceptor =======
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======= Public Clubs =======
export const getPublicClubs = async () => {
  try {
    const res = await api.get('/clubs/public'); // endpoint backend
    return res.data;
  } catch (err) {
    console.error('Error fetching public clubs:', err);
    return [];
  }
};

// ======= Profile / User Info =======
export const getProfile = async () => {
  try {
    const res = await api.get('/users/me'); // backend trả info từ JWT
    return res.data;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
};

// ======= Club Member Management =======
// Lấy danh sách thành viên CLB
export const getClubMembers = async (clubId) => {
  try {
    const res = await api.get(`/clubs/${clubId}/members`);
    return res.data;
  } catch (err) {
    console.error('Error fetching club members:', err);
    return [];
  }
};

// Cập nhật thông tin thành viên CLB
export const updateClubMember = async (clubId, memberId, data) => {
  try {
    const res = await api.put(`/clubs/${clubId}/members/${memberId}`, data);
    return res.data;
  } catch (err) {
    console.error('Error updating club member:', err);
    return null;
  }
};

// Bàn giao chức vụ (Club Leader transfer)
export const transferClubLeader = async (clubId, newLeaderId) => {
  try {
    const res = await api.post(`/clubs/${clubId}/transfer-leader`, {
      newLeaderId,
    });
    return res.data;
  } catch (err) {
    console.error('Error transferring club leader:', err);
    return null;
  }
};

export default api;