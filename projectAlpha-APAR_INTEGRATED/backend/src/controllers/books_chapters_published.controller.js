import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { set, get, getByPublicationId, getByDepartmentId, getByPublisher, getByRole, addFacultyToBook, addStudentToBook, removeFacultyFromBook, removeStudentFromBook, deleteBook, update } from "../data-access/books_chapters_published.data-access.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

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


    // Extract logged-in user information for role-based saving
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

        // Patched logic to handle pre-parsed arrays
    if (data.faculty_ids) {
        let parsed = data.faculty_ids;
        if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
        }
        if (Array.isArray(parsed)) {
            data.faculty_ids = parsed.map(item => item.faculty_id || item);
        }
    }

    if (data.student_ids) {
        let parsed = data.student_ids;
        if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
        }
        if (Array.isArray(parsed)) {
            data.student_ids = parsed.map(item => item.student_id || item);
        }
    }
    if (!data.department_id) {
        throw new ApiError(400, "department_id is required")
    }
    if (!data.publication_type) {
        throw new ApiError(400, "publication_type is required")
    }
    if (!data.title_of_book) {
        throw new ApiError(400, "title_of_book is required")
    }
    if (!data.year_of_publication && !data.year) {
        throw new ApiError(400, "year is required")
    }
    if (!data.role) {
        throw new ApiError(400, "role is required")
    }
    if (!data.name_of_publisher) {
        throw new ApiError(400, "name_of_publisher is required")
    }
    if (data.same_institute_affiliation === undefined) {
        throw new ApiError(400, "same_institute_affiliation is required")
    }

    // Handle PDF upload for link_to_publication
    // Handle PDF upload for link_to_publication
    const docLocalPath = req.file?.path
    if (docLocalPath) {
        const doc = await uploadOnCloudinary(docLocalPath)
        data.link_to_publication = doc.url
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


    // Extract logged-in user information for audit logging
    const loggedInUser = {
        id: req.user?.id,
        userId: req.user?.userId || req.user?.id,
        role: req.user?.role
    }

    if (!id) {
        throw new ApiError(400, "id is required")
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
    await deleteBook(id)
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
    const response = await getByPublicationId(id)
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