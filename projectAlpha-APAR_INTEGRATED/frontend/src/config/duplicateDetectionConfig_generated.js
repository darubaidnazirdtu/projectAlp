/**
 * Entity Type to Duplicate Detection Configuration
 * Generated for ALL tables.
 */

export const duplicateDetectionConfig = {
    'books_chapters_published': {
        entityType: 'book',
        fields: ["isbn_number","title_of_book","name_of_publisher","year"],
        facultyField: 'faculty_ids',
        enabled: true
    },
    'capability_enhancement_schemes': {
        entityType: 'general_activity',
        fields: ["name_of_scheme","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'collaborative_activities': {
        entityType: 'general_activity',
        fields: ["title_of_activity","name_of_collaborative_agency","start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'collaborative_research_exchanges': {
        entityType: 'collaboration',
        fields: ["name_of_institution","funding_agency","start_date"],
        facultyField: 'faculty_associations',
        enabled: true
    },
    'conference_research_papers': {
        entityType: 'conference',
        fields: ["issn","title","publisher","year_of_publication"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'courses': {
        entityType: 'course',
        fields: ["course_name","year_of_introduction"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'departments': {
        entityType: 'department',
        fields: ["department_name","year_of_award"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'dept_library_books': {
        entityType: 'book',
        fields: ["isbn_number","title_of_book","publisher","year_of_publication"],
        facultyField: 'faculty_ids',
        enabled: true
    },
    'dept_professional_schemes': {
        entityType: 'general_activity',
        fields: ["name_of_scheme","name_of_organisation","year_of_sanction"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'developed_e_contents': {
        entityType: 'general_activity',
        fields: ["name_of_module","date_of_launching"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'extension_outreach_activities': {
        entityType: 'general_activity',
        fields: ["title_of_activity","sponsoring_agency","start_date"],
        facultyField: 'faculty_associations',
        enabled: true
    },
    'faculty': {
        entityType: 'faculty',
        fields: ["name","date_of_birth"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'faculty_development_programs': {
        entityType: 'faculty',
        fields: ["program_title","funding_agency","start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'faculty_visits': {
        entityType: 'faculty',
        fields: ["organisation_name","start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'financial_support_events': {
        entityType: 'general_activity',
        fields: ["title_of_event","funding_agency","date_start"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'functional_mous': {
        entityType: 'collaboration',
        fields: ["organisation_name","start_date"],
        facultyField: 'faculty_associations',
        enabled: true
    },
    'it_infrastructure_stock_items': {
        entityType: 'general_activity',
        fields: ["lab_name","year_of_installation"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'journal_research_papers': {
        entityType: 'journal',
        fields: ["issn","title","year_of_publication"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'mentor_stress_support_sessions': {
        entityType: 'general_activity',
        fields: ["organizer_name","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'patents': {
        entityType: 'patent',
        fields: ["application_number","patent_title","patent_awarding_agency","date_of_filing"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'phd_defences': {
        entityType: 'phd',
        fields: ["student_name","date_of_defence"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'professional_affiliations': {
        entityType: 'general_activity',
        fields: ["professional_body_name","start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'professional_staff_trainings': {
        entityType: 'general_activity',
        fields: ["title_of_event","year_of_training"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'programmes': {
        entityType: 'general_activity',
        fields: ["programme_name","duration_years"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'programmes_with_field_research': {
        entityType: 'general_activity',
        fields: ["programme_name","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'research_funding_grants': {
        entityType: 'funding',
        fields: ["title_research","funding_agency_name","year_of_sanction"],
        facultyField: 'faculty_involved',
        enabled: true
    },
    'research_innovation_awards': {
        entityType: 'general_activity',
        fields: ["name_of_award","name_of_organisation","year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'revenue_from_consultancies': {
        entityType: 'general_activity',
        fields: ["name_of_project","agency_name","duration_start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'revenue_from_corporate_trainings': {
        entityType: 'consultancy',
        fields: ["name_of_program","agency_name","duration_start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'staff_trainings': {
        entityType: 'general_activity',
        fields: ["name_of_official","organising_agency","start_date"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'student_centric_methods': {
        entityType: 'student_activity',
        fields: ["course_name","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'student_financial_support_events': {
        entityType: 'student_activity',
        fields: ["name_of_event","funding_agency","date_of_event"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'student_performance_activities': {
        entityType: 'student_activity',
        fields: ["name_of_award","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'students': {
        entityType: 'student_activity',
        fields: ["name","date_of_birth"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'students_competitive_exams': {
        entityType: 'student_activity',
        fields: ["student_name","year_of_qualifying"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'students_higher_education_placements': {
        entityType: 'student_activity',
        fields: ["student_name","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
    'teachers_using_ict': {
        entityType: 'general_activity',
        fields: ["course_name","academic_year"],
        facultyField: 'faculty_id',
        enabled: true
    },
};

// Helpers (Keep existing)
export const calculateAcademicYear = (year) => {
    if (!year) return null;
    const y = parseInt(year);
    if (isNaN(y)) return null;
    return `${y}-${y + 1}`;
};

export const extractFacultyId = (formData, config) => {
    if (!config?.facultyField) return null;
    const field = formData[config.facultyField];
    if (Array.isArray(field)) {
        if (field.length > 0 && field[0]?.faculty_id) return field[0].faculty_id;
        if (field.length > 0 && typeof field[0] === 'string') return field[0];
    }
    if (typeof field === 'string') return field;
    return null;
};

export const isDuplicateDetectionEnabled = (tableId) => {
    const config = duplicateDetectionConfig[tableId];
    return config && config.enabled === true;
};

export default duplicateDetectionConfig;
