import { Api } from '../api/Api.js';

class FacultyProfileService {
  constructor() {
    this.api = new Api(import.meta.env.VITE_BASEURL);
  }

  async getSelf() {
    const res = await this.api.get('/apar/profile/self');
    return res.profile || res;
  }

  async upsertSelf(profile) {
    const res = await this.api.put('/apar/profile/self', profile);
    return res.profile || res;
  }
}

export const facultyProfileService = new FacultyProfileService();
