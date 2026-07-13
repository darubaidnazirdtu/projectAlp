import { Router } from "express";
import {
    getForm,
    saveForm,
    submitForm,
    deleteForm,
    saveToMonthly,
    getPendingReporting,
    submitReportingAssessment,
    getPendingReviewing,
    submitReviewingRemarks,
    listAllForms,
    getDeanAparStatus,
    getFacultyInfo,
    getFacultyHistory,
    getFacultyHistoryByDean
} from "../controllers/apar.mongo.controller.js";
import checkDuplicate from "../controllers/duplicate-check.controller.js";
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { aparDraftSchema, aparFormSchema, aparAssessmentSchema, aparReviewingSchema } from '../validators/apar-form.validator.js';
import { uploadAparTemporaryDocument } from '../middlewares/apar-document-upload.middleware.js';
import { deleteTemporaryDocument, streamDocument, uploadTemporaryDocument } from '../controllers/apar-document.controller.js';

const router = Router();

router.route("/form").get(authenticate, getForm);
router.route("/form").delete(authenticate, deleteForm);
router.route('/documents/temp').post(authenticate, uploadAparTemporaryDocument.single('file'), uploadTemporaryDocument);
router.route('/documents/temp').delete(authenticate, deleteTemporaryDocument);
router.route('/document').get(authenticate, streamDocument);
router.route("/save").post(authenticate, validate(aparDraftSchema), saveForm);
router.route("/save-to-monthly").post(authenticate, saveToMonthly);
router.route("/submit").post(authenticate, validate(aparFormSchema), submitForm);
router.route("/list").get(authenticate, listAllForms);
router.route("/dean/status").get(authenticate, getDeanAparStatus);
router.route("/info").get(authenticate, getFacultyInfo);
router.route("/history").get(authenticate, getFacultyHistory);
router.route("/dean/history").get(authenticate, getFacultyHistoryByDean);

// Duplicate detection
router.route("/check-duplicate").post(authenticate, checkDuplicate);

router.route("/reporting/pending").get(authenticate, getPendingReporting);
router.route("/reporting/submit").post(authenticate, validate(aparAssessmentSchema), submitReportingAssessment);

router.route("/reviewing/pending").get(authenticate, getPendingReviewing);
router.route("/reviewing/submit").post(authenticate, validate(aparReviewingSchema), submitReviewingRemarks);

export default router;
