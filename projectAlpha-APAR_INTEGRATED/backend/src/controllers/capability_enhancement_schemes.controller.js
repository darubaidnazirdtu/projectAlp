import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getBySchemeId, getByDepartmentId, update, deleteScheme } from "../data-access/capability_enhancement_schemes.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Auto-injected JSON parsing for object lists
    ;["faculty_ids","student_ids","external_contributors"].forEach(field => {
        if (typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                // console.error(`Failed to parse ${field}: `, error);
                data[field] = [];
            }
        }
    });

    console.log(data)
    // Parse JSON strings for lists
    // Parse JSON strings for lists
    // Parse JSON strings for lists
    if (typeof data.faculty_ids === 'string') {
        try {
            data.faculty_ids = JSON.parse(data.faculty_ids);
        } catch (error) {
            data.faculty_ids = [];
        }
    }
    if (typeof data.student_ids === 'string') {
        try {
            data.student_ids = JSON.parse(data.student_ids);
        } catch (error) {
            data.student_ids = [];
        }
    }
    if (typeof data.external_contributors === 'string') {
        try {
            data.external_contributors = JSON.parse(data.external_contributors);
        } catch (error) {
            data.external_contributors = [];
        }
    }
    if (typeof data.external_agencies === 'string') {
        try {
            data.external_agencies = JSON.parse(data.external_agencies);
        } catch (error) {
            data.external_agencies = [];
        }
    }
    console.log("dd")
    const requiredFields = [
        'department_id', 'name_of_scheme', 'type_of_scheme',
        'academic_year', 'semester', 'start_date', 'end_date',
        'no_of_students_enrolled', 'name_of_agencies_involved',
        'mode', 'outcome', 'remarks'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle PDF file upload
    const docLocalPath = req.file?.path
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        if (doc) {
            data.link = doc.url
        }
    }

    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    const result = await set(data, loggedInUser)

    res.status(200)
        .json(
            new ApiResponse(200, result, "Capability Enhancement Scheme added successfully!")
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
            new ApiResponse(200, response, "Data retrieved successfully!")
        )
})

const updateData = asyncHandler(async (req, res) => {
    const { id } = req.params
    const data = req.body

    // Auto-injected JSON parsing for object lists
    ;["faculty_ids","student_ids","external_contributors"].forEach(field => {
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
    await deleteScheme(id)
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
    const response = await getBySchemeId(id)
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