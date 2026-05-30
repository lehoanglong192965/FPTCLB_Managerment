import api from './api';

export const authService = {
  // Fetch user profile based on JWT token
  getUserProfile: async () => {
    // In a real app, the token is automatically sent via the api interceptor
    // and the backend returns the profile data.
    // We provide a mock implementation here in case the backend isn't ready.
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.warn("API call failed, returning mock data for Profile:", error);
      // Mock data fallback
      return {
        id: "usr_123",
        name: "Nguyen Van A",
        email: "nguyenvana@fpt.edu.vn",
        role: "CLUB_LEADER",
        joinedDate: "2024-01-15T00:00:00.000Z",
      };
    }
  },
};
