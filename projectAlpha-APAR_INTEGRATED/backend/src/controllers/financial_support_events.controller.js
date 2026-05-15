import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getBySupportId, getByDepartmentId, getByFacultyId, update, deleteSupport } from "../data-access/financial_support_events.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Auto-injected JSON parsing for object lists
    ;["faculty_participants","external_contributors"].forEach(field => {
        if (typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                // console.error(`Failed to parse ${field}: `, error);
                data[field] = [];
            }
        }
    });


    // Extract logged-in user information for role-based saving
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    if (typeof data.faculty_participants === 'string') {
        try {
            data.faculty_participants = JSON.parse(data.faculty_participants);
        } catch (e) {
            data.faculty_participants = [];
        }
    }

    // Validation based on tableConfig required fields
    const requiredFields = ['department_id', 'title_of_event', 'event_type', 'level', 'funding_agency', 'host_institution', 'location', 'purpose', 'amount', 'date_start', 'date_end', 'academic_year'];
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle PDF file upload
    const docLocalPath = req.file?.path
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        data.link = doc.url
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

    // Auto-injected JSON parsing for object lists
    ;["faculty_participants","external_contributors"].forEach(field => {
        if (typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                // console.error(`Failed to parse ${field}: `, error);
                data[field] = [];
            }
        }
    });

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
    await deleteSupport(id)
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
    const response = await getBySupportId(id)
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