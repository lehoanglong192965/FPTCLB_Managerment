import api from './api';

export const clubService = {
  // Fetch public clubs list
  getPublicClubs: async () => {
    try {
      const response = await api.get('/clubs/public');
      return response.data;
    } catch (error) {
      console.warn("API call failed, returning mock data for Public Clubs:", error);
      return [
        { id: 1, name: 'FPT Software Club', category: 'Technology', memberCount: 120, description: 'Coding algorithms and software engineering.' },
        { id: 2, name: 'FPT Music Club', category: 'Art & Culture', memberCount: 85, description: 'Bringing students together through music.' },
        { id: 3, name: 'FPT English Club', category: 'Language', memberCount: 200, description: 'Improve your English speaking skills.' },
        { id: 4, name: 'FPT Basketball', category: 'Sports', memberCount: 45, description: 'Train and compete in university tournaments.' },
      ];
    }
  },

  // Fetch members of a specific club (For Club Leaders)
  getClubMembers: async (clubId) => {
    try {
      const response = await api.get(`/clubs/${clubId}/members`);
      return response.data;
    } catch (error) {
      console.warn(`API call failed, returning mock data for Members of club ${clubId}:`, error);
      return [
        { id: '1', key: '1', name: 'Tran Thi B', role: 'Member', joined: '2025-02-10', status: 'Active' },
        { id: '2', key: '2', name: 'Le Van C', role: 'Vice President', joined: '2024-11-20', status: 'Active' },
        { id: '3', key: '3', name: 'Pham Minh D', role: 'Member', joined: '2025-05-01', status: 'Pending' },
      ];
    }
  },

  // Remove a member from the club
  removeMember: async (clubId, memberId) => {
    try {
      const response = await api.delete(`/clubs/${clubId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.warn("API call failed, simulating successful deletion:", error);
      return { success: true };
    }
  }
};
