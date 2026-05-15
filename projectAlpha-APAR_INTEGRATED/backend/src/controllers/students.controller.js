import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { set, get, getByStudentId, getByDepartmentId, getByProgrammeId, update, deleteStudent } from "../data-access/students.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    if (!data.student_id || !data.enrollment_no || !data.name || !data.gender || !data.date_of_birth || !data.email || !data.phone || !data.department_id || !data.programme_id || !data.year_of_admission || !data.current_semester) {
        throw new ApiError(400, "all fields are required")
    }

    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    await set(data, loggedInUser)

    res.status(200)
        .json(
            new ApiResponse(200, {}, "data entry done successfully !")
        )
})

const getData = asyncHandler(async (req, res) => {
    const { role, departmentId } = req.user || {};
    let response;

    // Always fetch all students unless specifically restricted by role
    if (role === 'Department HOD' && departmentId) {
        response = await getByDepartmentId(departmentId);
    } else {
        // Fallback for Admin, Faculty, or unauthenticated (if route allows) to see all students
        // This fixes the issue where dropdowns were empty if req.user wasn't fully set
        response = await get();
    }

    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )
})

const updateData = asyncHandler(async (req, res) => {
    const { id } = req.params
    const data = req.body
    if (!id) {
        throw new ApiError(400, "id is required")
    }
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }
    const result = await update(id, data, loggedInUser)
    res.status(200)
        .json(
            new ApiResponse(200, result, "data updated successfully !")
        )
})

const deleteData = asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
        throw new ApiError(400, "id is required")
    }
    await deleteStudent(id)
    res.status(200)
        .json(
            new ApiResponse(200, {}, "data deleted successfully !")
        )
})

const getById = asyncHandler(async (req, res) => {
    const { id } = req.params
    if (!id) {
        throw new ApiError(400, "id is required")
    }
    const response = await getByStudentId(id)
    if (!response) {
        throw new ApiError(404, "record not found")
    }
    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )
})

const getByDepartment = asyncHandler(async (req, res) => {
    const { department_id } = req.params
    if (!department_id) {
        throw new ApiError(400, "department_id is required")
    }
    const response = await getByDepartmentId(department_id)
    res.status(200)
        .json(
            new ApiResponse(200, response, "data sent successfully !")
        )
})

export {
    enterData,
    getData,
    updateData,
    deleteData,
    getById,
    getByDepartment
}