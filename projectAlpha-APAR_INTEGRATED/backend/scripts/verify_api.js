
import mongoose from 'mongoose';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import dotenv from 'dotenv';
import { Faculty } from '../src/models/faculty.model.js';
import { User } from '../src/models/user.model.js';
import { hashPassword } from '../src/utils/password.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 8000}`;
const TEST_TEACHER_ID = 'FAC_CSE_001';
const TEST_EMAIL = 'iqac@university.edu';
const TEST_PASSWORD = '12345';

const jar = new CookieJar();
const client = wrapper(axios.create({
    baseURL: BASE_URL,
    jar,
    withCredentials: true // though jar handles it mostly
}));

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is not set in environment variables.');
        process.exit(1);
    }
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/apar`);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

async function ensureTestUser() {
    console.log('Ensuring test user exists...');

    // 1. Ensure Faculty
    try {
        let faculty = await Faculty.findOne({ faculty_id: TEST_TEACHER_ID });
        if (!faculty) {
            console.log('   Creating test Faculty record...');
            faculty = await Faculty.create({
                faculty_id: TEST_TEACHER_ID,
                email: TEST_EMAIL,
                name: 'API Test User',
                role: 'Faculty Member',
                department_id: 'DEP_CSE', // Assuming this exists or is valid string
                designation: 'Assistant Professor'
            });
        } else {
            console.log('   Test Faculty record exists.');
        }
    } catch (e) {
        if (e.code === 11000) {
            console.log('   Test Faculty record already exists (collision handled).');
        } else {
            console.error('   Error ensuring Faculty:', e.message);
        }
    }

    // 2. Ensure User
    try {
        let user = await User.findOne({ teacher_id: TEST_TEACHER_ID });
        if (!user) {
            console.log('   Creating test User account...');
            const hashedPassword = await hashPassword(TEST_PASSWORD);
            user = await User.create({
                teacher_id: TEST_TEACHER_ID,
                email: TEST_EMAIL,
                password_hash: hashedPassword,
                role: 'Faculty Member',
                department_id: 'DEP_CSE'
            });
        } else {
            // Reset password just in case
            const hashedPassword = await hashPassword(TEST_PASSWORD);
            user.password_hash = hashedPassword;
            await user.save();
            console.log('   Test User account exists (password reset).');
        }
    } catch (e) {
        if (e.code === 11000) {
            console.log('   Test User account already exists (collision handled).');
        } else {
            console.error('   Error ensuring User:', e.message);
        }
    }

    console.log('Test user ready.');
}

async function testLogin() {
    console.log('Testing Login...');
    try {
        const response = await client.post('/api/v1/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'Faculty Member'
        });

        if (response.status === 200) {
            console.log('Login successful:', response.data.message);
            return true;
        }
    } catch (error) {
        console.error('Login failed:', error.response?.data?.message || error.message);
        return false;
    }
    return false;
}

async function testProtectedRoute() {
    console.log('Testing Protected Route (/api/v1/auth/profile)...');
    try {
        // Using /api/v1/auth/profile as a safe protected route test
        const response = await client.get('/api/v1/auth/profile');

        if (response.status === 200) {
            console.log('Profile fetch successful. User ID:', response.data.data.user.id);
        }
    } catch (error) {
        console.error('Protected route failed:', error.response?.data?.message || error.message);
    }
}

async function testDepartmentRoute() {
    console.log('Testing Department Route (/api/v1/departments/get)...');
    try {
        const response = await client.get('/api/v1/departments/get');
        console.log(`Department fetch status: ${response.status}`);
    } catch (error) {
        // It might 404 if no data, but 401/403 is what we want to avoid
        if (error.response?.status === 404) {
            console.log('Department route returned 404 (Data might be empty, but auth worked)');
        } else {
            console.error('Department route failed:', error.response?.data?.message || error.message);
        }
    }
}


async function testAllGetRoutes() {
    // List of all protected routes (based on app.js)
    const routes = [
        "/api/v1/departments",
        "/api/v1/programmes",
        "/api/v1/faculty",
        "/api/v1/students",
        "/api/v1/courses",
        "/api/v1/programmes_with_field_research",
        "/api/v1/books_chapters_published",
        "/api/v1/financial_support_events",
        "/api/v1/it_infrastructure_stock",
        "/api/v1/teachers_using_ict",
        "/api/v1/faculty_development_programs",
        "/api/v1/faculty_visits",
        "/api/v1/professional_affiliations",
        "/api/v1/student_centric_method",
        "/api/v1/mentors_stress_support",
        "/api/v1/research_innovation_awards",
        "/api/v1/dept_professional_schemes",
        "/api/v1/research_funding",
        "/api/v1/revenue_from_consultancy",
        "/api/v1/revenue_from_corporate_training",
        "/api/v1/collaborative_activities",
        "/api/v1/collaborative_research_exchange",
        "/api/v1/functional_mous",
        "/api/v1/e_content_developed",
        "/api/v1/capability_enhancement_schemes",
        "/api/v1/students_higher_education",
        "/api/v1/students_competitive_exams",
        "/api/v1/student_performance_activities",
        "/api/v1/student_financial_support_events",
        "/api/v1/professional_training_staff",
        "/api/v1/staff_training",
        "/api/v1/extension_outreach_activities",
        "/api/v1/dept_library_books",
        "/api/v1/phd_defence",
        "/api/v1/patents",
        "/api/v1/journal_research_papers",
        "/api/v1/conference_research_papers"
    ];

    console.log(`\nTesting ${routes.length} GET endpoints...`);

    let successCount = 0;
    let failCount = 0;

    for (const route of routes) {
        const url = `${route}/get`;
        try {
            const response = await client.get(url);
            console.log(`[${response.status}] ${url}`);
            successCount++;
        } catch (error) {
            // 404 is acceptable if it just means "no data found" but the endpoint exists/is authorized
            // However, typically our controllers might return 200 with empty array, or 404.
            const status = error.response?.status;
            if (status === 404) {
                console.log(`[404] ${url} (Likely no data)`);
                // depending on strictness, we count this as success (auth worked) or separate
                successCount++;
            } else {
                console.error(`[${status || 'ERR'}] ${url} - ${error.response?.data?.message || error.message}`);
                failCount++;
            }
        }
    }

    console.log(`\nSummary: ${successCount} passed, ${failCount} failed.`);
}

async function testAllSetRoutesReachability() {
    // List of all protected routes (based on app.js) - same as GET routes
    const routes = [
        "/api/v1/departments",
        "/api/v1/programmes",
        "/api/v1/faculty",
        "/api/v1/students",
        "/api/v1/courses",
        "/api/v1/programmes_with_field_research",
        "/api/v1/books_chapters_published",
        "/api/v1/financial_support_events",
        "/api/v1/it_infrastructure_stock",
        "/api/v1/teachers_using_ict",
        "/api/v1/faculty_development_programs",
        "/api/v1/faculty_visits",
        "/api/v1/professional_affiliations",
        "/api/v1/student_centric_method",
        "/api/v1/mentors_stress_support",
        "/api/v1/research_innovation_awards",
        "/api/v1/dept_professional_schemes",
        "/api/v1/research_funding",
        "/api/v1/revenue_from_consultancy",
        "/api/v1/revenue_from_corporate_training",
        "/api/v1/collaborative_activities",
        "/api/v1/collaborative_research_exchange",
        "/api/v1/functional_mous",
        "/api/v1/e_content_developed",
        "/api/v1/capability_enhancement_schemes",
        "/api/v1/students_higher_education",
        "/api/v1/students_competitive_exams",
        "/api/v1/student_performance_activities",
        "/api/v1/student_financial_support_events",
        "/api/v1/professional_training_staff",
        "/api/v1/staff_training",
        "/api/v1/extension_outreach_activities",
        "/api/v1/dept_library_books",
        "/api/v1/phd_defence",
        "/api/v1/patents",
        "/api/v1/journal_research_papers",
        "/api/v1/conference_research_papers"
    ];

    console.log(`\nTesting ${routes.length} POST (set) endpoints for reachability...`);

    let reachableCount = 0;
    let failCount = 0;

    for (const route of routes) {
        const url = `${route}/set`;
        try {
            // Sending empty body to provoke validation error (400) or DB error, 
            // but confirming route exists (not 404).
            await client.post(url, {});
            console.log(`[200] ${url} (Unexpected success with empty body)`);
            reachableCount++;
        } catch (error) {
            const status = error.response?.status;
            // 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error
            // All imply the route WAS reached. 404 means it wasn't.
            if (status && status !== 404) {
                console.log(`[${status}] ${url} (Reachable)`);
                reachableCount++;
            } else {
                console.error(`[${status || 'ERR'}] ${url} - ${error.response?.data?.message || error.message}`);
                failCount++;
            }
        }
    }

    console.log(`\nSet Route Summary: ${reachableCount} reachable, ${failCount} failed (404/Network Error).`);
}

async function testCourseCRUD() {
    console.log('\nTesting Course CRUD (All Endpoints)...');
    const testCourse = {
        course_name: "Test Course via Script",
        course_code: "TEST_CS_999",
        programme_id: "PROG_CSE", // Assuming valid
        department_id: "DEP_CSE", // Assuming valid
        credits: 4,
        semester_offered: 1,
        type: "Core"
    };

    let courseId = null;

    // 1. CREATE (POST /set)
    try {
        console.log('1. CREATE - POST /api/v1/courses/set');
        const res = await client.post('/api/v1/courses/set', testCourse);
        if (res.status === 200) {
            console.log('   Create successful.');
        }
    } catch (e) {
        console.error('   Create failed:', e.response?.data?.message || e.message);
        return; // Abort CRUD if create fails
    }

    // 2. READ ALL (GET /get)
    try {
        console.log('2. READ ALL - GET /api/v1/courses/get');
        const res = await client.get('/api/v1/courses/get');
        const courses = res.data.data; // Assuming structure based on controller
        const found = courses.find(c => c.course_code === testCourse.course_code);
        if (found) {
            courseId = found.course_id; // Custom UUID expected by controller
            console.log(`   Found created course. ID: ${courseId}`);
        } else {
            console.error('   Created course not found in list!');
            return;
        }
    } catch (e) {
        console.error('   Read All failed:', e.response?.data?.message || e.message);
        return;
    }

    // 3. READ BY ID (GET /get/:id)
    try {
        console.log(`3. READ BY ID - GET /api/v1/courses/get/${courseId}`);
        const res = await client.get(`/api/v1/courses/get/${courseId}`);
        if (res.status === 200) {
            console.log('   Get by ID successful. Course name:', res.data.data?.course_name || res.data?.course_name);
        }
    } catch (e) {
        console.error('   Get by ID failed:', e.response?.data?.message || e.message);
    }

    // 4. READ BY DEPARTMENT (GET /department/:department_id)
    try {
        console.log(`4. READ BY DEPARTMENT - GET /api/v1/courses/department/${testCourse.department_id}`);
        const res = await client.get(`/api/v1/courses/department/${testCourse.department_id}`);
        if (res.status === 200) {
            const count = Array.isArray(res.data.data) ? res.data.data.length : 'N/A';
            console.log(`   Get by Department successful. Found ${count} course(s) in ${testCourse.department_id}.`);
        }
    } catch (e) {
        console.error('   Get by Department failed:', e.response?.data?.message || e.message);
    }

    // 5. UPDATE (PUT /update/:id)
    try {
        console.log(`5. UPDATE - PUT /api/v1/courses/update/${courseId}`);
        const updatePayload = { ...testCourse, course_name: "Updated Test Course Name" };
        const res = await client.put(`/api/v1/courses/update/${courseId}`, updatePayload);
        if (res.status === 200) {
            console.log('   Update successful.');
        }
    } catch (e) {
        console.error('   Update failed:', e.response?.data?.message || e.message);
    }

    // 6. VERIFY UPDATE (GET /get/:id)
    try {
        console.log(`6. VERIFY UPDATE - GET /api/v1/courses/get/${courseId}`);
        const res = await client.get(`/api/v1/courses/get/${courseId}`);
        if (res.status === 200) {
            const name = res.data.data?.course_name || res.data?.course_name;
            if (name === "Updated Test Course Name") {
                console.log('   Update verified. New name:', name);
            } else {
                console.log('   Update verification unclear. Name:', name);
            }
        }
    } catch (e) {
        console.error('   Verify Update failed:', e.response?.data?.message || e.message);
    }

    // 7. DELETE (DELETE /delete/:id)
    try {
        console.log(`7. DELETE - DELETE /api/v1/courses/delete/${courseId}`);
        const res = await client.delete(`/api/v1/courses/delete/${courseId}`);
        if (res.status === 200) {
            console.log('   Delete successful.');
        }
    } catch (e) {
        console.error('   Delete failed:', e.response?.data?.message || e.message);
    }

    // 8. VERIFY DELETE (GET /get/:id - should fail)
    try {
        console.log(`8. VERIFY DELETE - GET /api/v1/courses/get/${courseId} (should fail)`);
        const res = await client.get(`/api/v1/courses/get/${courseId}`);
        console.log('   Unexpected: Course still exists after delete!');
    } catch (e) {
        const status = e.response?.status;
        if (status === 404) {
            console.log('   Delete verified. Course not found (404).');
        } else {
            console.error('   Verify Delete error:', e.response?.data?.message || e.message);
        }
    }

    console.log('\nCourse CRUD Test Complete.');
}

async function main() {
    await connectDB();
    await ensureTestUser();

    // We disconnect mongoose so the script doesn't hang on the connection
    // However, if the app is checking DB internally during login, we might strictly 
    // speaking be testing the *running server*, not this script's connection.
    // But we need the DB connection here to seed the user.
    await mongoose.disconnect();

    const loggedIn = await testLogin();
    if (loggedIn) {
        await testProtectedRoute();
        // await testDepartmentRoute(); // Covered in loop
        await testAllGetRoutes();
        await testAllSetRoutesReachability();
        await testCourseCRUD();
    }
}

main().catch(console.error);
