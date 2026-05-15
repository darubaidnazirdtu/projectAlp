import { Api } from '../api/Api.js';

class AuthService {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL);
  }

  async login(email, password, role) {
    const response = await this.api.post('/auth/login', { email, password, role });
    return response;
  }

  async logout() {
    return this.api.post('/auth/logout', {});
  }

  async getProfile() {
    return this.api.get('/auth/profile');
  }

  async verifyRole(role) {
    return this.api.post('/auth/verify-role', { role });
  }

  async forgotPassword(teacherId, newPassword) {
    return this.api.post('/auth/forgot-password', { teacherId, newPassword });
  }

  async getTeacherIds() {
    return this.api.get('/auth/teacher-ids');
  }
}

export const authService = new AuthService();
