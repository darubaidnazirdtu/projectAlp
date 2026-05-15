export const ROLES = {
  OFFICER: 'Officer (Graded)',
  REVIEWING_OFFICER: 'Reviewing Officer',
  REPORTING_OFFICER: 'Reporting Officer'
};

export const ROLE_LABELS = {
  [ROLES.OFFICER]: 'Officer (Graded)',
  [ROLES.REVIEWING_OFFICER]: 'Reviewing Officer',
  [ROLES.REPORTING_OFFICER]: 'Reporting Officer'
};

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case ROLES.REPORTING_OFFICER:
      return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case ROLES.REVIEWING_OFFICER:
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case ROLES.OFFICER:
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    default:
      return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
};
