import { Router } from 'express';
import {
	loginUser,
	logoutUser,
	getProfile,
	verifyRole,
	registerUser,
	forgotPassword,
	listUserIds
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.post('/logout', authenticate, logoutUser);
router.get('/profile', authenticate, getProfile);
router.post('/verify-role', authenticate, verifyRole);
router.get('/user-ids', listUserIds);

export default router;
