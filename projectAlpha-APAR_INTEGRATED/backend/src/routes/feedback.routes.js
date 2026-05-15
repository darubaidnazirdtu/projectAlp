import { Router } from 'express';
import multer from 'multer';
import {
    analyzeFacultyFeedback,
    analyzeCourseFeedback,
    analyzeProgramFeedback
} from '../controllers/feedback.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze/faculty', upload.single('file'), analyzeFacultyFeedback);
router.post('/analyze/course', upload.single('file'), analyzeCourseFeedback);
router.post('/analyze/program', upload.single('file'), analyzeProgramFeedback);

export default router;
