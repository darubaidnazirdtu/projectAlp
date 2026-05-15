import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getByTrainingId, getByDepartmentId, update, deleteTraining } from "../data-access/staff_training.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Validation based on tableConfig required fields
    const requiredFields = ['department_id', 'name_of_official', 'program_name', 'organising_agency', 'type_of_training', 'mode', 'start_date', 'end_date', 'academic_year', 'outcome'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle PDF file upload
    const docLocalPath = req.file?.path
    let link = "";
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        link = doc.url
    }

    // MAPPING: Map frontend fields strictly to what the DAO/Schema expects
    // We do NOT merge name_of_official and program_name here.
    const mappedData = {
        department_id: data.department_id,
        name_of_official: data.name_of_official, // Keep distinct
        program_name: data.program_name,         // Keep distinct
        organising_agency: data.organising_agency || data.sponsoring_agencies,
        type_of_training: data.type_of_training,
        mode: data.mode,
        start_date: data.start_date,
        end_date: data.end_date,
        academic_year: data.academic_year,
        funding_details: data.funding_details || '',
        outcome: data.outcome || '',
        link: link, // Cloudinary URL
        remarks: data.remarks || '',
        // Handle participants: Frontend sends 'participants', Schema expects 'participants'
        participants: data.participants || data.faculty_participants || [],
    };

    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    await set(mappedData, loggedInUser)

    res.status(200)
        .json(
            new ApiResponse(200, {}, "Staff training record added successfully!")
        )
})

const getData = asyncHandler(async (req, res) => {
    const { role, departmentId } = req.user || {};
    let response;
    if (role === 'Department HOD' && departmentId) {
        response = await getByDepartmentId(departmentId);
    } else {
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
    await deleteTraining(id)
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
    const response = await getByTrainingId(id)
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