import { Router } from "express"
import { enterData, getData, updateData, deleteData, getById } from "../controllers/departments.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/set").post(enterData)

router.route("/get").get(getData)

router.route("/update/:id").put(updateData)

router.route("/delete/:id").delete(deleteData)

router.route("/get/:id").get(getById)

//if any multer file there then, do it like this
//router.route("/set").post(upload.single("doc"),enterData)

export default router