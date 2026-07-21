import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function insertApar() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const form = {
        "faculty_id": "pawansingh",
        "ay": "2023-24",
        "status": "Submitted",
        "current_step": 1,
        "reporting_officer_id": "",
        "reviewing_officer_id": "",
        "personal": {
            "name": "Dr. Pawan Singh Mehra",
            "designation": "Assistant Professor",
            "date_of_birth": "1987-11-26T00:00:00.000Z",
            "email": "",
            "phone": "",
            "department_id": "CSE",
            "joining_date": "2020-12-24T00:00:00.000Z",
            "sc_st_status": "General",
            "absence_taken": "No",
            "absence_period": "Nil",
            "grade": "Level 10"
        },
        "teaching": {
            "time_table": {
                "provided": {
                    "odd_semester": "17",
                    "even_semester": "17"
                },
                "actual": {
                    "odd_semester": "17",
                    "even_semester": "17"
                }
            },
            "workload_week": {
                "odd_semester": {
                    "lectures": "11",
                    "tutorials": "0",
                    "practicals": "6",
                    "seminars": "0"
                },
                "even_semester": {
                    "lectures": "7",
                    "tutorials": "0",
                    "practicals": "10",
                    "seminars": "0"
                }
            },
            "description_of_duties_department": [
                {
                    "description": "Teaching of B.Tech 3rd semester Modelling & Simulation (CO-207), 4th semester Computer Organization and Architecture (CO-206), Database Management System (CO-202). Teaching of M.Tech 3rd semester Blockchain and its Application (AI-6307)."
                },
                {
                    "description": "Course Coordinator, Blockchain and Application (AI-6307) and Modelling & Simulation (CO-207)."
                }
            ],
            "description_of_duties_admin": [
                {
                    "description": "Deputy Coordinator IQAC, Nodal Officer for AISHE, Departmental ISO/IQAC/NAAC/NBA Coordinator, Ph.D. admission Co-Coordinator for CSE."
                }
            ],
            "courses_taught": [
                {
                    "name_of_course": "Modelling & Simulation(CO-207) (A1)",
                    "course_code": "CO-207",
                    "total_lectures_scheduled": "4 hours per week",
                    "total_lectures_engaged": "4 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Odd",
                    "course_type": "Theory"
                },
                {
                    "name_of_course": "Modelling & Simulation(CO-207) (A4)",
                    "course_code": "CO-207",
                    "total_lectures_scheduled": "4 hours per week",
                    "total_lectures_engaged": "4 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Odd",
                    "course_type": "Theory"
                },
                {
                    "name_of_course": "Blockchain and Application (AI-6307)",
                    "course_code": "AI-6307",
                    "total_lectures_scheduled": "3 hours per week",
                    "total_lectures_engaged": "3 hours per week (Except Holidays)",
                    "degree_type": "PG",
                    "semester": "Odd",
                    "course_type": "Theory"
                },
                {
                    "name_of_course": "Data Structures Lab (CO-425)(A4-G3)",
                    "course_code": "CO-425",
                    "total_lectures_scheduled": "2 hours per week",
                    "total_lectures_engaged": "2 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Odd",
                    "course_type": "Practical"
                },
                {
                    "name_of_course": "Data Structures Lab (CO-425)(A6-G3)",
                    "course_code": "CO-425",
                    "total_lectures_scheduled": "2 hours per week",
                    "total_lectures_engaged": "2 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Odd",
                    "course_type": "Practical"
                },
                {
                    "name_of_course": "Wireless & Mobile Computing Lab (CO-415)",
                    "course_code": "CO-415",
                    "total_lectures_scheduled": "2 hours per week",
                    "total_lectures_engaged": "2 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Odd",
                    "course_type": "Practical"
                },
                {
                    "name_of_course": "Computer Organization and Architecture (CO-206)",
                    "course_code": "CO-206",
                    "total_lectures_scheduled": "4 hours per week",
                    "total_lectures_engaged": "4 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Even",
                    "course_type": "Theory"
                },
                {
                    "name_of_course": "Database Management Systems (CO-202) (A4)",
                    "course_code": "CO-202",
                    "total_lectures_scheduled": "3 hours per week",
                    "total_lectures_engaged": "3 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Even",
                    "course_type": "Theory"
                },
                {
                    "name_of_course": "Compiler Design Lab (CO-306) (A3-G2)",
                    "course_code": "CO-306",
                    "total_lectures_scheduled": "2 hours per week",
                    "total_lectures_engaged": "2 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Even",
                    "course_type": "Practical"
                },
                {
                    "name_of_course": "Database Management Systems Lab (CO-202) (A4)",
                    "course_code": "CO-202",
                    "total_lectures_scheduled": "6 hours per week",
                    "total_lectures_engaged": "6 hours per week (Except Holidays)",
                    "degree_type": "UG",
                    "semester": "Even",
                    "course_type": "Practical"
                },
                {
                    "name_of_course": "Advanced Computer Network Lab (CO-404)",
                    "course_code": "CO-404",
                    "total_lectures_scheduled": "2 hours per week",
                    "total_lectures_engaged": "2 hours per week (Except Holidays)",
                    "degree_type": "PG",
                    "semester": "Even",
                    "course_type": "Practical"
                }
            ],
            "teaching_methods": [
                {
                    "description": "Google Classroom for Smooth Communication, Sharing of PPTs, e-books, NPTEL video lectures, Discussion on topics, Project-based learning."
                }
            ],
            "tutorials_tests": [
                {
                    "course_name": "Modelling and Simulation (CO-207) for A1 batch",
                    "number_of_tests": "One class test and One surprise test",
                    "assignment_checked": "Two tutorial sheets and One Assignment given"
                },
                {
                    "course_name": "Modelling and Simulation (CO-207) for A4 batch",
                    "number_of_tests": "One class test and One surprise test",
                    "assignment_checked": "Two tutorial sheets and One Assignment given"
                },
                {
                    "course_name": "Computer Organization and Architecture (CO-206) for A5 batch",
                    "number_of_tests": "One class test and One surprise test",
                    "assignment_checked": "Two tutorial sheets and One Assignment given"
                },
                {
                    "course_name": "Database Management System(CO-202) for A4 batch",
                    "number_of_tests": "One class test and One surprise test",
                    "assignment_checked": "Two tutorial sheets and One Assignment given"
                }
            ],
            "academic_planning": [
                {
                    "description": "Google Classroom was created, Lecture Notes/PPTs were uploaded regularly. Google Meet links provided. Lecture plan prepared and followed. Doubt clearance classes for poor-performing students. Class/Surprise tests using Google Quiz."
                }
            ]
        },
        "research": {
            "journals": [
                { "title": "A Survey on Artificial Intelligence-Based Cyber Security in IoT Networks" },
                { "title": "A Survey on Blockchain for Rental Lease Management" },
                { "title": "A Survey on Blockchain in Financial Institutions" },
                { "title": "QAKA: A novel quantum authentication and key agreement protocol using quantum entanglement for secure communication among IoT devices" },
                { "title": "Internet-of-Things-Enabled Sensor Networks: Vision Challenges and Smart Applications" },
                { "title": "Deep Learning Bi-LSTM Model for Intrusion Detection in IoT" },
                { "title": "QSMAH: A novel quantum-based secure cryptosystem using mutual authentication for healthcare in the internet of things" },
                { "title": "A Survey of Security Challenges and Existing Prevention Methods in FANET" },
                { "title": "Chat GPT & Google Bard AI: A Review" },
                { "title": "A roadmap from classical cryptography to post-quantum resistant cryptography for 5G-enabled IoT" }
            ],
            "summer_institutes_attended": [
                { "description": "Five days’ Faculty Development Program on Advanced Teaching Pedagogy and Outcome based eduction in Context of NEP-2020 (May 27-31, 2023, DTU & NITTTR)" },
                { "description": "Five days’ Faculty Development Program on High Performance Computing and its Application in AI (Aug 7-11, 2023, DTU)" }
            ],
            "summer_institutes_organized": [
                { "description": "Organized online Webinar on World Quantum Day (15-05-2024)" }
            ],
            "ug_pg_guidance": [
                { "description": "UG: 06, PG: 05" }
            ],
            "phd_guidance_text": [
                { "description": "Completed: 01, Undergoing: 06" }
            ],
            "memberships_text": [
                { "description": "Senior Member, IEEE; ACM; Fellow, IETE; CSI; ISTE; Peer Reviewer of SCIE Journals" }
            ],
            "other_activities": [
                { "description": "Delivered an International Expert Talk on The New Era of Quantum Computing (Uzbekistan, Nov 3, 2023)" },
                { "description": "Delivered an Expert Talk on Cyber Security and Disaster Risk Reduction (DTU, Dec 12, 2023)" },
                { "description": "Delivered an International Webinar on Quantum Computing Demystified (Algeria, Feb 29, 2024)" },
                { "description": "Delivered an Webinar on Quantum Computing Unveiled: Decrypting the Language of Qubits (ABES, Mar 9, 2024)" },
                { "description": "Delivered an Expert Talk on Cyber Security Governance and Risk Assessment & Management (CERT-In, Mar 21, 2024)" },
                { "description": "Delivered an International Webinar on Beyond Binary: Quantum Computing's Revolutionary Potential (Keele, June 12, 2024)" },
                { "description": "Delivered an Expert Talk on Software Testing with a Security Perspective (JIIT, July 12, 2024)" }
            ]
        },
        "corporate": {
            "course_development_details": [
                { "description": "M.Tech (CSE) and M.Tech(AI)" }
            ],
            "lab_development": [
                { "description": "Quantum Information and Computing Research Lab." }
            ],
            "sports_community": [
                { "description": "Blood Donation" }
            ],
            "admin_assignment_university": [
                { "description": "Election Duty, Research Excellence Award 2024 Committee Member, PhD admission Co-Coordinator for CSE, USIP Committee Member, IQAC Deputy Coordinator, Nodal Officer AISHE, NAAC Criteria 1 Member, NBA Criteria 8 Member, IIC Innovation Ambassador, Convocation 2022 Committee Member." }
            ],
            "admin_assignment_department": [
                { "description": "IQAC Departmental Coordinator, IIC Departmental Coordinator, Member of DRC (CSE), Member of DRC (Center for Multidisciplinary of Geoinformatics), Seating & Discipline Committee member for Orientation Program, Committee member for AI based Feedback Analysis, Member of Governance structure for COEDRR." }
            ]
        },
        "history": [
            {
                "action": "Submitted",
                "by": "Faculty",
                "date": new Date().toISOString(),
                "comment": "Form submitted by faculty"
            }
        ],
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    };

    const res = await AparForm.create(form);
    console.log("Successfully inserted form for pawansingh with ID:", res._id);

    mongoose.disconnect();
}
insertApar().catch(console.error);
