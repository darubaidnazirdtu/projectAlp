import { asyncHandler } from '../utils/async-handler.js';
import { ApiResponse } from '../utils/api-response.js';
import { Student } from '../models/student.model.js';
import { Faculty } from '../models/faculty.model.js';
import { Department } from '../models/department.model.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalDepartments = await Department.countDocuments();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                students: totalStudents,
                faculty: totalFaculty,
                departments: totalDepartments
            },
            "Dashboard stats fetched successfully"
        )
    );
});
