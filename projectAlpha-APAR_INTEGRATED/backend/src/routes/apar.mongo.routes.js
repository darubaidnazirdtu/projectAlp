import { Router } from "express";
import {
    getForm,
    saveForm,
    submitForm,
    getPendingReporting,
    submitReportingAssessment,
    getPendingReviewing,
    submitReviewingRemarks,
    listAllForms,
    getFacultyInfo,
    getFacultyHistory,
    saveToMonthlyData
} from "../controllers/apar.mongo.controller.js";
import checkDuplicate from "../controllers/duplicate-check.controller.js";

const router = Router();

router.route("/form").get(getForm);
router.route("/save").post(saveForm);
router.route("/save-to-monthly").post(saveToMonthlyData);
router.route("/submit").post(submitForm);
router.route("/list").get(listAllForms);
router.route("/info").get(getFacultyInfo);
router.route("/history").get(getFacultyHistory);

// Duplicate detection
router.route("/check-duplicate").post(checkDuplicate);

router.route("/reporting/pending").get(getPendingReporting);
router.route("/reporting/submit").post(submitReportingAssessment);

router.route("/reviewing/pending").get(getPendingReviewing);
router.route("/reviewing/submit").post(submitReviewingRemarks);

export default router;
