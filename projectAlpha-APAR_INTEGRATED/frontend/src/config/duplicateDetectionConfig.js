/**
 * Entity Type to Duplicate Detection Configuration
 * Maps table IDs from tableConfig.js to duplicate detection entity types
 * AUTO-GENERATED for Global Coverage
 */

export const duplicateDetectionConfig = {
    "books_chapters_published": {
        "entityType": "books_chapters_published",
        "fields": [
            "title_of_book",
            "title_of_chapter",
            "year"
        ],
        "facultyField": "faculty_ids",
        "enabled": true
    },
    "capability_enhancement_schemes": {
        "entityType": "capability_enhancement_schemes",
        "fields": [
            "name_of_scheme",
            "name_of_agencies_involved",
            "academic_year"
        ],
        "facultyField": "faculty_ids",
        "enabled": true
    },
    "collaborative_activities": {
        "entityType": "collaborative_activities",
        "fields": [
            "title_of_activity",
            "year"
        ],
        "facultyField": "faculty_associations",
        "enabled": true
    },
    "collaborative_research_exchanges": {
        "entityType": "collaborative_research_exchanges",
        "fields": [
            "name_of_institution",
            "name",
            "academic_year"
        ],
        "facultyField": "faculty_associations",
        "enabled": true
    },
    "conference_research_papers": {
        "entityType": "conference_research_papers",
        "fields": [
            "title",
            "name_of_conference",
            "year_of_publication"
        ],
        "facultyField": "faculty_members",
        "enabled": true
    },
    "courses": {
        "entityType": "courses",
        "fields": [
            "course_name",
            "course_code"
        ],
        "facultyField": null,
        "enabled": true
    },
    "departments": {
        "entityType": "departments",
        "fields": [
            "department_name"
        ],
        "facultyField": null,
        "enabled": true
    },
    "dept_library_books": {
        "entityType": "dept_library_books",
        "fields": [
            "title_of_book",
            "isbn_number",
            "year_of_publication"
        ],
        "facultyField": null,
        "enabled": true
    },
    "dept_professional_schemes": {
        "entityType": "dept_professional_schemes",
        "fields": [
            "name_of_scheme",
            "name_of_organisation",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "developed_e_contents": {
        "entityType": "developed_e_contents",
        "fields": [
            "name_of_module",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "extension_outreach_activities": {
        "entityType": "extension_outreach_activities",
        "fields": [
            "title_of_activity",
            "name",
            "academic_year"
        ],
        "facultyField": "faculty_associations",
        "enabled": true
    },
    "faculty": {
        "entityType": "faculty",
        "fields": [
            "name",
            "email"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "faculty_development_programs": {
        "entityType": "faculty_development_programs",
        "fields": [
            "program_title",
            "name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "faculty_visits": {
        "entityType": "faculty_visits",
        "fields": [
            "title",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "financial_support_events": {
        "entityType": "financial_support_events",
        "fields": [
            "title_of_event",
            "name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "functional_mous": {
        "entityType": "functional_mous",
        "fields": [
            "organisation_name",
            "name",
            "academic_year"
        ],
        "facultyField": "faculty_associations",
        "enabled": true
    },
    "it_infrastructure_stock_items": {
        "entityType": "it_infrastructure_stock_items",
        "fields": [
            "lab_name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "journal_research_papers": {
        "entityType": "journal_research_papers",
        "fields": [
            "title",
            "author_names",
            "year_of_publication"
        ],
        "facultyField": "faculty_members",
        "enabled": true
    },
    "mentor_stress_support_sessions": {
        "entityType": "mentor_stress_support_sessions",
        "fields": [
            "organizer_name",
            "mentor_name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "patents": {
        "entityType": "patents",
        "fields": [
            "patent_title",
            "author_names",
            "academic_year"
        ],
        "facultyField": "faculty_members",
        "enabled": true
    },
    "phd_defences": {
        "entityType": "phd_defences",
        "fields": [
            "thesis_title",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "professional_affiliations": {
        "entityType": "professional_affiliations",
        "fields": [
            "professional_body_name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "professional_staff_trainings": {
        "entityType": "professional_staff_trainings",
        "fields": [
            "title_of_event",
            "name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "programmes": {
        "entityType": "programmes",
        "fields": [
            "programme_name"
        ],
        "facultyField": null,
        "enabled": true
    },
    "programmes_with_field_research": {
        "entityType": "programmes_with_field_research",
        "fields": [
            "programme_name",
            "programme_code",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "research_funding_grants": {
        "entityType": "research_funding_grants",
        "fields": [
            "title_research",
            "academic_year"
        ],
        "facultyField": "faculty_involved",
        "enabled": true
    },
    "research_innovation_awards": {
        "entityType": "research_innovation_awards",
        "fields": [
            "name_of_award",
            "name_of_organisation",
            "year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "revenue_from_consultancies": {
        "entityType": "revenue_from_consultancies",
        "fields": [
            "name_of_project",
            "academic_year"
        ],
        "facultyField": "faculty_involved",
        "enabled": true
    },
    "revenue_from_corporate_trainings": {
        "entityType": "revenue_from_corporate_trainings",
        "fields": [
            "name_of_program",
            "academic_year"
        ],
        "facultyField": "faculty_involved",
        "enabled": true
    },
    "staff_trainings": {
        "entityType": "staff_trainings",
        "fields": [
            "name_of_official",
            "program_name",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "student_centric_methods": {
        "entityType": "student_centric_methods",
        "fields": [
            "course_name",
            "course_code",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    },
    "student_financial_support_events": {
        "entityType": "student_financial_support_events",
        "fields": [
            "name_of_event",
            "student_name",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "student_performance_activities": {
        "entityType": "student_performance_activities",
        "fields": [
            "name_of_award",
            "name",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "students": {
        "entityType": "students",
        "fields": [
            "name",
            "email"
        ],
        "facultyField": null,
        "enabled": true
    },
    "students_competitive_exams": {
        "entityType": "students_competitive_exams",
        "fields": [
            "student_name",
            "name_of_exam",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "students_higher_education_placements": {
        "entityType": "students_higher_education_placements",
        "fields": [
            "student_name",
            "mentor_name",
            "academic_year"
        ],
        "facultyField": null,
        "enabled": true
    },
    "teachers_using_ict": {
        "entityType": "teachers_using_ict",
        "fields": [
            "course_name",
            "faculty_name",
            "ict_classroom_rooms",
            "academic_year"
        ],
        "facultyField": "faculty_id",
        "enabled": true
    }
};

/**
 * Calculate academic year from year of publication/activity
 */
export const calculateAcademicYear = (year) => {
    if (!year) return null;
    const y = parseInt(year);
    if (isNaN(y)) return null;
    return `${y}-${y + 1}`;
};

/**
 * Extract faculty ID from form data based on config
 */
export const extractFacultyId = (formData, config) => {
    if (!config?.facultyField) return null;

    const field = formData[config.facultyField];

    // Handle different field types
    if (Array.isArray(field)) {
        // Array of objects: [{faculty_id: "...", ...}, ...]
        if (field.length > 0 && field[0]?.faculty_id) {
            return field[0].faculty_id;
        }
        // Array of strings: ["FACULTY-001", ...]
        if (field.length > 0 && typeof field[0] === 'string') {
            return field[0];
        }
    }

    // Single faculty_id string
    if (typeof field === 'string') {
        return field;
    }

    return null;
};

/**
 * Check if duplicate detection is enabled for this table
 */
export const isDuplicateDetectionEnabled = (tableId) => {
    const config = duplicateDetectionConfig[tableId];
    return config && config.enabled === true;
};

export default duplicateDetectionConfig;
