import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { enterData, getData, updateData, deleteData, getById } from "../controllers/journal_research_papers.controller.js";

const router = Router();

router.route("/set").post(upload.single("doc"), enterData);
router.route("/get").get(getData);


router.route("/update/:id").put(upload.single("doc"), updateData)

router.route("/delete/:id").delete(deleteData)

router.route("/get/:id").get(getById)

export default router;