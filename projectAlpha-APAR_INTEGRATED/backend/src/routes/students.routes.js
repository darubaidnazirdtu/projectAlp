import { Router } from "express"
import { enterData, getData, updateData, deleteData, getById } from "../controllers/students.controller.js"

const router = Router()

router.route("/set").post(enterData)

router.route("/get").get(getData)


router.route("/update/:id").put(updateData)

router.route("/delete/:id").delete(deleteData)

router.route("/get/:id").get(getById)

export default router