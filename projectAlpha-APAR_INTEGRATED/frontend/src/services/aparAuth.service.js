import { Api } from '../api/Api.js';

class AparAuthService {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL);
  }

  async login(email, password, role, academic_year) {
    const response = await this.api.post('/apar/auth/login', { email, password, role, academic_year }, { 'X-Bypass-Auth-Redirect': '1' });
    return response;
  }

  async logout() {
    return this.api.post('/apar/auth/logout', {});
  }

  async forgotPassword(teacherId, newPassword) {
    return this.api.post('/apar/auth/forgot-password', { teacherId, newPassword }, { 'X-Bypass-Auth-Redirect': '1' });
  }

  async getProfile() {
    return this.api.get('/apar/auth/profile');
  }

  async verifyRole(role) {
    return this.api.post('/apar/auth/verify-role', { role });
  }

  async changePassword(oldPassword, newPassword) {
    return this.api.post('/apar/auth/change-password', { oldPassword, newPassword });
  }
}

export const aparAuthService = new AparAuthService();
