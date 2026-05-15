export const ROLES = {
  OFFICER: 'Officer (Graded)',
  REVIEWING_OFFICER: 'Reviewing Officer',
  REPORTING_OFFICER: 'Reporting Officer'
};

export const ROLE_VALUES = Object.values(ROLES);

const ROLE_ALIASES = {
  officer: ROLES.OFFICER,
  'officer (graded)': ROLES.OFFICER,
  reviewing_officer: ROLES.REVIEWING_OFFICER,
  'reviewing officer': ROLES.REVIEWING_OFFICER,
  reporting_officer: ROLES.REPORTING_OFFICER,
  'reporting officer': ROLES.REPORTING_OFFICER
};

export const normalizeRoleValue = (value) => {
  if (!value || typeof value !== 'string') return null;
  const target = value.trim().toLowerCase();
  if (!target) return null;
  const canonical = ROLE_VALUES.find((r) => r.toLowerCase() === target);
  if (canonical) return canonical;
  return ROLE_ALIASES[target] ?? null;
};
