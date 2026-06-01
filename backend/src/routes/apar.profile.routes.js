import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getSelfProfile, upsertSelfProfile, getProfileByFaculty, updateProfileByFaculty, getAllProfiles, createProfile, deleteProfile } from '../controllers/apar.profile.controller.js';
import { upsertProfileSchema } from '../validators/apar-profile.validator.js';

const router = Router();

router.get('/self', authenticate, getSelfProfile);
router.put('/self', authenticate, validate(upsertProfileSchema), upsertSelfProfile);

router.get('/all', authenticate, getAllProfiles);
router.post('/', authenticate, validate(upsertProfileSchema), createProfile);

router.get('/:faculty_id', authenticate, getProfileByFaculty);
router.put('/:faculty_id', authenticate, validate(upsertProfileSchema), updateProfileByFaculty);
router.delete('/:faculty_id', authenticate, deleteProfile);

export default router;
