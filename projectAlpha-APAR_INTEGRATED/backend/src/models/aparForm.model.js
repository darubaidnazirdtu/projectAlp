import mongoose from "mongoose";

const AparFormSchema = new mongoose.Schema({
    faculty_id: {
        type: String,
        required: true,
        index: true
    },
    ay: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String, // 'Draft', 'Submitted', 'Query Raised', 'Verified', 'Reviewed'
        default: 'Draft'
    },
    current_step: {
        type: Number,
        default: 1
    },
    reporting_officer_id: String,
    reporting_date: Date,
    reviewing_officer_id: String,
    reviewing_date: Date,
    query_comment: String, // Global query comment for latest rejection
    reporting_query: String, // Query raised by Reporting Officer
    reviewing_query: String, // Query raised by Reviewing Officer

    // Step 1: Personal Data
    personal: {
        name: String,
        designation: String,
        date_of_birth: Date,
        email: String,
        phone: String,
        department_id: String,
        qualification: String,
        joining_date: Date,
        report_start_date: Date,
        report_end_date: Date,
        section_officer: String,
        sc_st_status: String,
        absence_period: String,
        title: String,
        academics: String,
        caste: String,
        grade: String
    },

    // Step 2: Self Appraisal & Teaching
    teaching: {
        immovable_property_return: String,
        health_checkup_file: String, // URL or data
        description_of_duties: String,
        courses_taught: [{
            name_of_course: String,
            total_lectures_scheduled: String,
            total_lectures_engaged: String,
            tutorials_scheduled: String,
            tutorials_engaged: String,
            labs_scheduled: String,
            labs_engaged: String,
            reasons_not_engaged: String,
            degree_type: String
        }],
        time_table: {
            provided: { odd_semester: String, even_semester: String },
            actual: { odd_semester: String, even_semester: String }
        },
        workload_week: {
            odd_semester: { lectures: String, tutorials: String, practicals: String, seminars: String },
            even_semester: { lectures: String, tutorials: String, practicals: String, seminars: String }
        },
        teaching_methods: String,
        ict_tools: String,
        student_centric_methods: String,
        tutorials_tests: {
            ug_odd: { number_of_tests: String, assignment_checked: String },
            ug_even: { number_of_tests: String, assignment_checked: String },
            pg_odd: { number_of_tests: String, assignment_checked: String },
            pg_even: { number_of_tests: String, assignment_checked: String }
        },
        academic_planning: String
    },

    // Step 3: Research
    research: {
        // 1. Research Papers in Journals -> Publication (type: 'journal')
        journals: [{
            paper_id: String, // Alternate key
            title: String,
            name_of_journal: String,
            author_names: String,
            issn: String,
            volume: String,
            issue: String,
            page_numbers: String,
            year_of_publication: String, // IQAC uses Number, but String is safer for draft
            doi: String,
            indexing: String,
            impact_factor: String,
            citation_count: String, // IQAC: Number
            is_ugc_care_listed: String, // IQAC: Boolean
            link: String,
            link_to_paper: String,
            department_id: String, // IQAC required
            faculty_members: [], // [{ faculty_id, role }]
            students: [], // [{ student_id, role }]
            external_authors: [] // [{ name, email, affiliation, role }]
        }],

        // 2. Research Papers in Conferences -> Publication (type: 'conference')
        conferences: [{
            paper_id: String, // Alternate key
            title: String,
            name_of_conference: String,
            conference_level: String,
            organizer: String,
            venue: String,
            publisher: String,
            isbn: String,
            year_of_publication: String, // IQAC: Number
            doi: String,
            indexing: String,
            award_received: String,
            paper_status: String,
            link: String,
            link_to_paper: String,
            department_id: String,
            faculty_members: [],
            students: [],
            external_contributors: []
        }],

        // 3. Books & Chapters -> Publication (type: 'book')
        books: [{
            publication_id: String, // Alternate key
            title_of_book: String,
            title_of_chapter: String,
            publication_type: String, // Book/Chapter
            role: String, // Author/Editor
            year: String, // IQAC: Number
            isbn_number: String,
            name_of_publisher: String,
            publisher_type: String,
            same_institute_affiliation: String, // IQAC: Boolean
            link_to_publication: String,
            link: String,
            doi: String,
            department_id: String,
            faculty_ids: [],
            student_ids: [],
            external_contributors: []
        }],

        // 4. Research Funding -> ResearchProject (type: 'funding')
        projects: [{
            project_id: String, // Alternate key
            title_research: String,
            title: String, // Generic title
            type_of_project: String,
            funding_agency_name: String,
            funding_type: String,
            sanction_number: String,
            year_of_sanction: String, // IQAC: Number
            amount: String, // IQAC: Number
            start_date: Date,
            end_date: Date,
            status: String,
            outcome: String,
            remarks: String,
            academic_year: String,
            department_id: String,
            faculty_involved: [],
            students_involved: [],
            external_collaborators: []
        }],

        // 5. Professional Consultancy -> ResearchProject (type: 'consultancy')
        consultancy: [{
            consultancy_id: String, // Alternate key
            name_of_project: String,
            title: String, // Generic title
            agency_name: String,
            type_of_agency: String,
            consultancy_type: String,
            grant_amount: String, // IQAC: Number
            revenue_generated: String, // IQAC: Number
            start_date: Date, // duration_start_date
            end_date: Date,
            year_of_consultancy: String, // IQAC: Number
            remarks: String,
            link: String,
            department_id: String,
            faculty_involved: [],
            students_involved: [],
            external_collaborators: []
        }],

        // 6. Patents -> Patent
        patents: [{
            patent_id: String, // Alternate key
            patent_title: String,
            author_names: String,
            application_number: String,
            patent_number: String,
            status: String,
            country: String,
            date_of_filing: Date,
            date_of_award: Date,
            patent_awarding_agency: String,
            link_to_patent: String,
            link: String,
            department_id: String,
            faculty_members: [],
            students: [],
            external_inventors: []
        }],

        // 7. Awards and Recognition -> FacultyActivity (type: 'award')
        awards: [{
            award_id: String, // Alternate key
            name_of_award: String,
            type_of_award: String,
            category_of_award: String,
            name_of_organisation: String,
            awarding_agency: String,
            date_of_award: Date,
            monetary_value: String, // IQAC: Number
            year: String, // IQAC: Number
            link: String,
            evidence_link: String,
            academic_year: String,
            department_id: String,
            faculty_recipients: [],
            student_recipients: [],
            external_recipients: []
        }],

        // 8. E-Content -> FacultyActivity (type: 'econtent')
        e_content: [{
            econtent_id: String, // Alternate key
            name_of_module: String,
            type_of_content: String,
            platform: String,
            platform_type: String,
            date_of_launching: Date,
            target_audience: String,
            duration_hours: String, // IQAC: Number
            learning_outcome: String,
            link: String,
            course_id: String,
            academic_year: String,
            department_id: String,
            faculty_id: String, // Main faculty
            // E-content usually specific to one faculty but consistent schema helps
        }],

        // 9. Faculty Visits -> FacultyActivity (type: 'visit')
        faculty_visits: [{
            visit_id: String, // Alternate key
            organisation_name: String,
            title: String,
            visit_type: String,
            purpose: String,
            location: String,
            start_date: Date,
            end_date: Date,
            link: String,
            academic_year: String,
            department_id: String,
            faculty_id: String
        }],

        // 10. Collaboration / Participation -> Collaboration (type: 'activity')
        collaborations: [{
            activity_id: String, // Alternate key
            title_of_activity: String,
            title: String, // Generic
            name_of_collaborative_agency: String,
            type_of_activity: String,
            nature_of_activity: String,
            number_of_participants: String, // IQAC: Number
            source_of_financial_support: String,
            funding_amount: String, // IQAC: Number
            year: String, // IQAC: Number
            duration: String,
            level: String,
            start_date: Date,
            end_date: Date,
            link: String,
            academic_year: String,
            department_id: String,
            faculty_associations: [],
            student_associations: [],
            external_contributors: []
        }],

        // 11. PhD Supervision -> PhdDefence
        phd_supervision: [{
            defence_id: String, // Alternate key
            student_id: String,
            student_name: String,
            enrollment_no: String,
            thesis_title: String,
            thesis_type: String,
            supervisor_name: String, // Often auto-filled but good to have
            date_of_defence: Date,
            date_of_result_notification: Date,
            result_outcome: String,
            academic_year: String,
            remarks: String,
            link: String,
            department_id: String,
            co_supervisors: [],
            committee_members: [],
            external_examiners: []
        }],

        // 12. MoUs -> Collaboration (type: 'mou')
        mous: [{
            mou_id: String, // Alternate key
            organisation_name: String,
            title: String, // Generic
            type_of_mou: String,
            year_of_signing: String, // IQAC: Number
            purpose: String,
            activities_under_mou: String,
            start_date: Date,
            end_date: Date,
            level: String,
            link: String,
            academic_year: String,
            department_id: String,
            faculty_associations: [],
            student_associations: [],
            external_contributors: []
        }],

        // 13. Workshops Attended / FDPs -> FacultyActivity (type: 'fdp')
        workshops: [{
            program_id: String, // Alternate key
            program_title: String,
            type_of_program: String,
            level: String,
            mode: String,
            duration_days: String, // IQAC: Number
            organising_body: String,
            funding_agency: String,
            venue: String,
            certificate_link: String,
            start_date: Date,
            end_date: Date,
            outcome: String,
            remarks: String,
            link: String,
            academic_year: String,
            department_id: String,
            faculty_participants: [],
            external_participants: []
        }],

        // Legacy/Extra fields (kept for safety or if needed)
        phd_guidance: [],
        fdps: [], // Deprecated in favor of 'workshops' or mapped to it? Leaving empty or can reuse 'workshops' key logic
        memberships: [],

        // Text fields
        summer_institutes: String,
        ug_pg_guidance: String,
        phd_guidance_text: String,
        research_guidance: String,
        industry_interaction: String,
        memberships_text: String,
        other_activities: String
    },

    // Step 4: Corporate Life
    corporate: {
        // Mapped fields
        curriculum_development: String,
        course_development_details: String,
        lab_development: String,
        cultural_activities: String,
        sports_community: String,
        admin_assignment: String,
        any_other: String,
        certify: String, // Boolean/Checkbox often sends "true"/"on"/undefined, but making String is safer for draft

        // Legacy mappings support if needed (optional)
        curriculum_dev: String,
        lab_dev: String,
        extension: [],
        admin_assignments: String
    },

    // Step 5: Numerical Assessment (Reporting Officer)
    assessment: {
        section_a: { q1: String, q2: String, q3: String, q4: String, overall_grading: String },
        section_b: {
            q1: String, q2: String, q3: String, q4: String, q5: String,
            q6: String, q7a: String, q7b: String, q8: String, q9: String,
            q10: String, q11: String, overall_grading: String
        },
        section_c: {
            q1: String, q2: String, q3: String, q4: String, q5: String,
            q6: String, overall_grading: String
        },
        general: { q1: String, q2: String, q3: String, q4: String, q5: String, q6: String }
    },

    // Step 6/7: Remarks (Reviewing Officer)
    remarks: {
        length_of_service: String,
        satisfied_with_reporting: String,
        agree_with_assessment: String,
        disagreement_reason: String,
        general_remarks: String,
        specific_characteristics: String,
        query_comment: String // Stores the latest query comment
    },

    // Timeline for tracking status changes with timestamps
    timeline: {
        submitted_at: Date,
        reporting_reviewed_at: Date,
        reviewing_reviewed_at: Date
    },

    // Audit logs for history tracking if needed
    history: [{
        action: String,
        by: String,
        date: { type: Date, default: Date.now },
        comment: String
    }]

}, { timestamps: true });

// Ensure unique combination of faculty_id and ay
AparFormSchema.index({ faculty_id: 1, ay: 1 }, { unique: true });

export const AparForm = mongoose.model("AparForm", AparFormSchema);