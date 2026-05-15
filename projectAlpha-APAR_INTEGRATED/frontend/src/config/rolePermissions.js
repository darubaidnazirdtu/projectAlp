export const ROLES = {
  IQAC_HEAD: 'IQAC Head',
  DEPARTMENT_HOD: 'Department HOD',
  FACULTY: 'Faculty Member'
};

const ADMIN_ONLY_RESOURCES = new Set(['departments', 'programmes', 'students', 'courses']);

const FACULTY_FORM_RESOURCES = new Set([
  'books_chapters_published',
  'capability_enhancement_schemes',
  'collaborative_activities',
  'collaborative_research_exchanges',
  'conference_research_papers',
  'developed_e_contents',
  'extension_outreach_activities',
  'faculty_development_programs',
  'faculty_visits',
  'financial_support_events',
  'functional_mous',
  'journal_research_papers',
  'mentors_stress_support',
  'patents',
  'professional_affiliations',
  'professional_training_staff',
  'research_innovation_awards',
  'staff_trainings',
  'student_centric_methods',
  'student_financial_support_events',
  'student_performance_activities',
  'students_competitive_exams',
  'students_higher_education',
  'teachers_using_ict'
]);

const FACULTY_TABLE_RESOURCES = new Set();

export const canAccessForm = (role, resourceId) => {
  if (!role || !resourceId) {
    return false;
  }

  if (role === ROLES.IQAC_HEAD) {
    return true;
  }

  if (role === ROLES.DEPARTMENT_HOD) {
    return !ADMIN_ONLY_RESOURCES.has(resourceId);
  }

  if (role === ROLES.FACULTY) {
    return FACULTY_FORM_RESOURCES.has(resourceId);
  }

  return false;
};

export const canAccessTable = (role, resourceId) => {
  if (!role || !resourceId) {
    return false;
  }

  if (role === ROLES.IQAC_HEAD) {
    return true;
  }

  if (role === ROLES.DEPARTMENT_HOD) {
    return !ADMIN_ONLY_RESOURCES.has(resourceId);
  }

  if (role === ROLES.FACULTY) {
    return FACULTY_TABLE_RESOURCES.has(resourceId);
  }

  return false;
};

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case ROLES.IQAC_HEAD:
      return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case ROLES.DEPARTMENT_HOD:
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case ROLES.FACULTY:
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    default:
      return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
};


export const ROLE_LABELS = {
  [ROLES.IQAC_HEAD]: 'IQAC Head',
  [ROLES.DEPARTMENT_HOD]: 'Department HOD',
  [ROLES.FACULTY]: 'Faculty Member'
};

