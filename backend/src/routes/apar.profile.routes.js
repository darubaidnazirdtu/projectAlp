import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getSelfProfile, upsertSelfProfile, getProfileByFaculty, updateProfileByFaculty } from '../controllers/apar.profile.controller.js';
import { upsertProfileSchema } from '../validators/apar-profile.validator.js';

const router = Router();

router.get('/self', authenticate, getSelfProfile);
router.put('/self', authenticate, validate(upsertProfileSchema), upsertSelfProfile);

router.get('/:faculty_id', authenticate, getProfileByFaculty);
router.put('/:faculty_id', authenticate, validate(upsertProfileSchema), updateProfileByFaculty);

export default router;
