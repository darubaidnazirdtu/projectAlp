/**
 * User Seed Script
 * 
 * Creates dummy users, departments, and students based on user requirements.
 * 
 * Users:
 * 1. Dr. Shilpa Pal (IQAC Head) - User table only
 * 2. Dr. Manoj Kumar (HOD CSE) - User table only, APAR Reporting Officer
 * 3. Dr. Prateek Sharma (Reviewing Officer) - User table only, APAR Reviewing Officer
 * 4. Pawan Singh Mehra (Faculty) - User & Faculty table, APAR Officer (Graded)
 * 5. Dr. Anurag Goel (Faculty) - User & Faculty table, APAR Officer (Graded)
 * 6. Dr. Gunjan Chugh (Faculty) - User & Faculty table, APAR Officer (Graded)
 * 
 * Departments:
 * 1. CSE
 * 2. ECE
 * 
 * Students:
 * 1. Student 1 (CSE)
 * 2. Student 2 (ECE)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.model.js';
import { Faculty } from '../models/faculty.model.js';
import { Department } from '../models/department.model.js';
import { Student } from '../models/student.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PASSWORD_HASH = '$2b$12$IL1Url5C.RAG8tgyNGWwR.aM2wI/ZvOd46NCs8P99eqLFz9bdYXZ2';

const DEPARTMENTS = [
    {
        department_id: 'CSE',
        department_name: 'Computer Science and Engineering',
        head_of_department: 'Dr. Manoj Kumar',
        contact_email: 'hod.cse@dtu.ac.in',
        contact_phone: '011-27871018'
    },
    {
        department_id: 'ECE',
        department_name: 'Electronics and Communication Engineering',
        head_of_department: 'Dr. HOD ECE',
        contact_email: 'hod.ece@dtu.ac.in',
        contact_phone: '011-27871020'
    }
];

const STUDENTS = [
    {
        student_id: '2K20/CSE/01',
        name: 'Rahul Sharma',
        email: 'rahul.cse@dtu.ac.in',
        department_id: 'CSE',
        programme_id: 'B.Tech',
        enrollment_no: '2K20/CSE/01',
        year_of_admission: 2020,
        current_semester: 8
    },
    {
        student_id: '2K20/ECE/02',
        name: 'Priya Verma',
        email: 'priya.ece@dtu.ac.in',
        department_id: 'ECE',
        programme_id: 'B.Tech',
        enrollment_no: '2K20/ECE/02',
        year_of_admission: 2020,
        current_semester: 8
    }
];

const USERS = [
    // 1. IQAC Head (User table only)
    {
        user_id: 'IQAC001',
        email: 'iqachead@dtu.ac.in',
        name: 'Dr. Shilpa Pal',
        role: 'IQAC Head',
        department_id: 'ADMIN',
        designation: 'IQAC Head',
        apar_role: '',
        password_hash: PASSWORD_HASH,
        in_faculty: false
    },
    // 2. HOD CSE (User table only, APAR Reporting Officer)
    {
        user_id: 'HOD_CSE',
        email: 'hod.cse@dtu.ac.in',
        name: 'Dr. Manoj Kumar',
        role: 'Department HOD',
        department_id: 'CSE',
        designation: 'Professor & HOD',
        apar_role: 'Reporting Officer',
        password_hash: PASSWORD_HASH,
        in_faculty: false
    },
    // 3. Reviewing Officer (User table only, APAR Reviewing Officer)
    {
        user_id: 'REV_OFFICER',
        email: 'prateek.sharma@dtu.ac.in',
        name: 'Dr. Prateek Sharma',
        role: '',
        department_id: 'ADMIN',
        designation: 'Professor',
        apar_role: 'Reviewing Officer',
        password_hash: PASSWORD_HASH,
        in_faculty: false
    },
    // 4. Faculty (Both Tables)
    {
        user_id: 'FAC_PAWAN',
        email: 'pawansingh@dtu.ac.in',
        name: 'Pawan Singh Mehra',
        role: 'Faculty Member',
        department_id: 'CSE',
        designation: 'Assistant Professor',
        apar_role: 'Officer (Graded)',
        reporting_officer_id: 'HOD_CSE',
        reviewing_officer_id: 'REV_OFFICER',
        password_hash: PASSWORD_HASH,
        in_faculty: true,
        // Faculty Details
        gender: 'Male',
        date_of_birth: new Date('1985-07-15'),
        joining_date: new Date('2015-08-01'),
        phone: '9876543210',
        qualification: 'Ph.D.',
        specialization: 'Computer Networks'
    },
    // 5. Faculty 2
    {
        user_id: 'FAC_ANURAG',
        email: 'anurag@dtu.ac.in',
        name: 'Dr. Anurag Goel',
        role: 'Faculty Member',
        department_id: 'CSE',
        designation: 'Assistant Professor',
        apar_role: 'Officer (Graded)',
        reporting_officer_id: 'HOD_CSE',
        reviewing_officer_id: 'REV_OFFICER',
        password_hash: PASSWORD_HASH,
        in_faculty: true,
        // Faculty Details
        gender: 'Male',
        date_of_birth: new Date('1982-05-20'),
        joining_date: new Date('2012-09-10'),
        phone: '9876543211',
        qualification: 'Ph.D.',
        specialization: 'Software Engineering'
    },
    // 6. Faculty 3
    {
        user_id: 'FAC_GUNJAN',
        email: 'gunjanchugh@dtu.ac.in',
        name: 'Dr. Gunjan Chugh',
        role: 'Faculty Member',
        department_id: 'CSE',
        designation: 'Assistant Professor',
        apar_role: 'Officer (Graded)',
        reporting_officer_id: 'HOD_CSE',
        reviewing_officer_id: 'REV_OFFICER',
        password_hash: PASSWORD_HASH,
        in_faculty: true,
        // Faculty Details
        gender: 'Female',
        date_of_birth: new Date('1988-12-10'),
        joining_date: new Date('2018-01-15'),
        phone: '9876543212',
        qualification: 'Ph.D.',
        specialization: 'Data Science'
    },
    // 7. Additional Officer (Graded) users requested by user
    {
        user_id: 'FAC_ADITI_ZEAR',
        email: 'aditi.zear@dtu.ac.in',
        name: 'Aditi Zear',
        role: 'Faculty Member',
        department_id: 'CSE',
        designation: 'Assistant Professor',
        apar_role: 'Officer (Graded)',
        reporting_officer_id: 'HOD_CSE',
        reviewing_officer_id: 'REV_OFFICER',
        password_hash: PASSWORD_HASH,
        in_faculty: true,
        gender: 'Female',
        date_of_birth: new Date('1990-01-01'),
        joining_date: new Date('2020-07-01'),
        phone: '9000000001',
        qualification: 'Ph.D.',
        specialization: 'Computer Science'
    },
    {
        user_id: 'FAC_PRAMA_BISHNOI',
        email: 'prama.bishnoi@dtu.ac.in',
        name: 'Prama Bishnoi',
        role: 'Faculty Member',
        department_id: 'CSE',
        designation: 'Assistant Professor',
        apar_role: 'Officer (Graded)',
        reporting_officer_id: 'HOD_CSE',
        reviewing_officer_id: 'REV_OFFICER',
        password_hash: PASSWORD_HASH,
        in_faculty: true,
        gender: 'Female',
        date_of_birth: new Date('1991-01-01'),
        joining_date: new Date('2020-07-01'),
        phone: '9000000002',
        qualification: 'Ph.D.',
        specialization: 'Information Technology'
    },
    {
        user_id: 'FAC_BINDU_VERMA',
        email: 'bindu.verma@dtu.ac.in',
        name: 'Bindu Verma',
        role: 'Faculty Member',
        department_id: 'CSE',
        designation: 'Assistant Professor',
        apar_role: 'Officer (Graded)',
        reporting_officer_id: 'HOD_CSE',
        reviewing_officer_id: 'REV_OFFICER',
        password_hash: PASSWORD_HASH,
        in_faculty: true,
        gender: 'Female',
        date_of_birth: new Date('1992-01-01'),
        joining_date: new Date('2020-07-01'),
        phone: '9000000003',
        qualification: 'Ph.D.',
        specialization: 'Data Analytics'
    }
];

async function seed() {
    try {
        const baseUri = process.env.MONGODB_URI.replace(/\/$/, '');
        const mongoUri = `${baseUri}/apar`;
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected');

        // Seed Departments
        console.log('\nSeeding Departments...');
        for (const dept of DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { department_id: dept.department_id },
                dept,
                { upsert: true, new: true }
            );
            console.log(`   Processed ${dept.department_id}`);
        }

        // Seed Students
        console.log('\nSeeding Students...');
        for (const stu of STUDENTS) {
            await Student.findOneAndUpdate(
                { student_id: stu.student_id },
                stu,
                { upsert: true, new: true }
            );
            console.log(`   Processed ${stu.name}`);
        }

        // Seed Users
        console.log('\nSeeding Users & Faculty...');
        for (const u of USERS) {
            // User Table Update
            const userPayload = {
                user_id: u.user_id,
                email: u.email,
                password_hash: u.password_hash,
                role: u.role,
                name: u.name,
                department_id: u.department_id,
                designation: u.designation
            };
            if (u.apar_role) userPayload.apar_role = u.apar_role;
            if (u.reporting_officer_id) userPayload.reporting_officer_id = u.reporting_officer_id;
            if (u.reviewing_officer_id) userPayload.reviewing_officer_id = u.reviewing_officer_id;

            await User.findOneAndUpdate(
                { user_id: u.user_id },
                userPayload,
                { upsert: true, new: true }
            );
            console.log(`   User: ${u.name} (${u.role})`);

            // Faculty Table Update (Condition)
            if (u.in_faculty) {
                await Faculty.findOneAndUpdate(
                    { faculty_id: u.user_id },
                    {
                        faculty_id: u.user_id,
                        email: u.email,
                        name: u.name,
                        designation: u.designation,
                        department_id: u.department_id,
                        // Faculty specific fields
                        gender: u.gender,
                        date_of_birth: u.date_of_birth,
                        joining_date: u.joining_date,
                        phone: u.phone,
                        qualification: u.qualification,
                        specialization: u.specialization,
                        employment_type: 'Regular'
                    },
                    { upsert: true, new: true }
                );
                console.log(`   --> Faculty Record Created`);
            } else {
                await Faculty.findOneAndDelete({ faculty_id: u.user_id });
                console.log(`   --> Faculty Record Skipped/Removed`);
            }
        }

        console.log('\n✅ Seed Complete!');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
