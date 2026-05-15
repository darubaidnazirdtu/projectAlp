import { ROLES } from './roles.js';

const ADMIN_ONLY_PATHS = new Set([
  '/api/v1/departments',
  '/api/v1/programmes',
  '/api/v1/auth/admin/users'
]);

const FACULTY_POST_PATHS = new Set([
  '/api/v1/books_chapters_published',
  '/api/v1/capability_enhancement_schemes',
  '/api/v1/collaborative_activities',
  '/api/v1/collaborative_research_exchange',
  '/api/v1/conference_research_papers',
  '/api/v1/e_content_developed',
  '/api/v1/extension_outreach_activities',
  '/api/v1/faculty_development_programs',
  '/api/v1/faculty_visits',
  '/api/v1/financial_support_events',
  '/api/v1/functional_mous',
  '/api/v1/journal_research_papers',
  '/api/v1/mentors_stress_support',
  '/api/v1/patents',
  '/api/v1/professional_affiliations',
  '/api/v1/professional_training_staff',
  '/api/v1/research_innovation_awards',
  '/api/v1/staff_training',
  '/api/v1/student_centric_method',
  '/api/v1/student_financial_support_events',
  '/api/v1/student_performance_activities',
  '/api/v1/students_competitive_exams',
  '/api/v1/students_higher_education',
  '/api/v1/teachers_using_ict'
]);

const ALL_PROTECTED_PATHS = [
  '/api/v1/departments',
  '/api/v1/programmes',
  '/api/v1/auth/admin/users',
  '/api/v1/faculty',
  '/api/v1/students',
  '/api/v1/courses',
  '/api/v1/programmes_with_field_research',
  '/api/v1/books_chapters_published',
  '/api/v1/financial_support_events',
  '/api/v1/it_infrastructure_stock',
  '/api/v1/teachers_using_ict',
  '/api/v1/faculty_development_programs',
  '/api/v1/faculty_visits',
  '/api/v1/professional_affiliations',
  '/api/v1/student_centric_method',
  '/api/v1/mentors_stress_support',
  '/api/v1/research_innovation_awards',
  '/api/v1/dept_professional_schemes',
  '/api/v1/research_funding',
  '/api/v1/revenue_from_consultancy',
  '/api/v1/revenue_from_corporate_training',
  '/api/v1/collaborative_activities',
  '/api/v1/collaborative_research_exchange',
  '/api/v1/functional_mous',
  '/api/v1/e_content_developed',
  '/api/v1/capability_enhancement_schemes',
  '/api/v1/students_higher_education',
  '/api/v1/students_competitive_exams',
  '/api/v1/student_performance_activities',
  '/api/v1/student_financial_support_events',
  '/api/v1/professional_training_staff',
  '/api/v1/staff_training',
  '/api/v1/extension_outreach_activities',
  '/api/v1/dept_library_books',
  '/api/v1/phd_defence',
  '/api/v1/patents',
  '/api/v1/journal_research_papers',
  '/api/v1/conference_research_papers'
];

const DEFAULT_GET_ROLES = [ROLES.IQAC_HEAD, ROLES.DEPARTMENT_HOD];
const DEFAULT_POST_ROLES = [ROLES.IQAC_HEAD, ROLES.DEPARTMENT_HOD];

const FACULTY_GET_PATHS = new Set([
  '/api/v1/faculty',
  '/api/v1/students',
  '/api/v1/courses',
  '/api/v1/departments' // often needed for dropdowns
]);

export const routePermissions = ALL_PROTECTED_PATHS.reduce((accumulator, path) => {
  let getRoles = ADMIN_ONLY_PATHS.has(path) ? [ROLES.IQAC_HEAD] : DEFAULT_GET_ROLES;
  let postRoles = ADMIN_ONLY_PATHS.has(path) ? [ROLES.IQAC_HEAD] : DEFAULT_POST_ROLES;

  if (FACULTY_POST_PATHS.has(path)) {
    postRoles = [...new Set([...postRoles, ROLES.FACULTY])];
  }

  if (FACULTY_GET_PATHS.has(path)) {
    getRoles = [...new Set([...getRoles, ROLES.FACULTY])];
  }

  accumulator[path] = {
    GET: getRoles,
    POST: postRoles,
    PUT: postRoles,
    PATCH: postRoles,
    DELETE: [ROLES.IQAC_HEAD]
  };

  return accumulator;
}, {});

export const getAllowedRolesFor = (basePath, method) => {
  const entry = routePermissions[basePath];
  if (!entry) {
    return null;
  }

  return entry[method] || entry['*'] || null;
};
