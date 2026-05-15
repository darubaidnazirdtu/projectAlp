import { Router } from "express";
import { uploadFile } from "../controllers/upload.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(authenticate, upload.single("file"), uploadFile);

export default router;
