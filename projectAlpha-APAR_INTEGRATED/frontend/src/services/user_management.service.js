import { Api } from '../api/Api.js';

class UserManagementService {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL);
  }

  async listUsers() {
    return this.api.get('/auth/admin/users');
  }

  async createUser(payload) {
    return this.api.post('/auth/admin/users', payload);
  }

  async updateUser(id, payload) {
    return this.api.patch(`/auth/admin/users/${id}`, payload);
  }
}

export const userManagementService = new UserManagementService();