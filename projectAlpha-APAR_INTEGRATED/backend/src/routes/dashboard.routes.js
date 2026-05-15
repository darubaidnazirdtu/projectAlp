import { Router } from 'express';
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Dashboard routes should be protected
router.use(authenticate);

router.get('/stats', getDashboardStats);

export default router;
