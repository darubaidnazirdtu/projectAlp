import { Router } from "express"
import { enterData, getData, updateData, deleteData, getById, getByDepartment } from "../controllers/courses.controller.js"

const router = Router()

router.route("/set").post(enterData)
router.route("/get").get(getData)
router.route("/update/:id").put(updateData)
router.route("/delete/:id").delete(deleteData)
router.route("/get/:id").get(getById)
router.route("/department/:department_id").get(getByDepartment)

export default router