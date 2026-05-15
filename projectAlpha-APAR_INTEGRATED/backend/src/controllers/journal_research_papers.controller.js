import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { set, get, getByPaperId, getByDepartmentId, getByJournal, getUgcCareListed, addFacultyToPaper, addStudentToPaper, removeFacultyFromPaper, removeStudentFromPaper, deletePaper, update } from "../data-access/journal_research_papers.data-access.js"

const enterData = asyncHandler(async (req, res) => {
    const data = req.body

    // Auto-injected JSON parsing for object lists
    ;["faculty_members","students","external_authors"].forEach(field => {
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

    // Validation based on tableConfig required fields
    const requiredFields = ['title', 'department_id', 'name_of_journal', 'year_of_publication'];
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Handle PDF file upload (multer puts file on req.file)
    const docLocalPath = req.file?.path
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        data.link_to_paper = doc.url
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
    ;["faculty_members","students","external_authors"].forEach(field => {
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
    await deletePaper(id)
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
    const response = await getByPaperId(id)
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