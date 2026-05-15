import { Router } from 'express';
import { aparLogin, aparLogout, aparProfile, aparVerifyRole, aparForgotPassword, aparChangePassword } from "../controllers/aparAuth.controller.js";
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', aparLogin);
router.post('/forgot-password', aparForgotPassword);
router.post('/logout', authenticate, aparLogout);
router.get('/profile', authenticate, aparProfile);
router.post('/verify-role', authenticate, aparVerifyRole);
router.post('/change-password', authenticate, aparChangePassword);

export default router;
