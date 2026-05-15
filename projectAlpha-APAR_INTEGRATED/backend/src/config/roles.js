export const ROLES = {
  IQAC_HEAD: 'IQAC Head',
  DEPARTMENT_HOD: 'Department HOD',
  FACULTY: 'Faculty Member'
};

export const ROLE_VALUES = Object.values(ROLES);

const ROLE_ALIASES = {
  iqac_head: ROLES.IQAC_HEAD,
  'iqac head': ROLES.IQAC_HEAD,
  department_hod: ROLES.DEPARTMENT_HOD,
  'department hod': ROLES.DEPARTMENT_HOD,
  faculty: ROLES.FACULTY,
  'faculty member': ROLES.FACULTY
};

export const normalizeRoleValue = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const target = value.trim().toLowerCase();
  if (!target) {
    return null;
  }

  const canonicalMatch = ROLE_VALUES.find((role) => role.toLowerCase() === target);
  if (canonicalMatch) {
    return canonicalMatch;
  }

  return ROLE_ALIASES[target] ?? null;
};
