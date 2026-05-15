import dotenv from 'dotenv';
import { hashPassword } from '../utils/password.js';
import { createUser, findUserByEmail, findUserByTeacherId } from '../data-access/users.data-access.js';
import { normalizeRoleValue, ROLES } from '../config/roles.js';

dotenv.config({ path: './env' });

const [, , teacherIdArg, emailArg, passwordArg, roleArg, departmentArg] = process.argv;

const teacherId = process.env.SEED_USER_TEACHER_ID || teacherIdArg;
const email = process.env.SEED_USER_EMAIL || emailArg;
const password = process.env.SEED_USER_PASSWORD || passwordArg;
const roleInput = process.env.SEED_USER_ROLE || roleArg || '';
const departmentId = process.env.SEED_USER_DEPARTMENT_ID || departmentArg || null;

const usage = `Usage: node -r dotenv/config ./src/scripts/seed-user.js <teacherId> <email> <password> <role> [departmentId]
Environment variables: SEED_USER_TEACHER_ID, SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_ROLE, SEED_USER_DEPARTMENT_ID`;

const exitWith = async (code, message) => {
  if (message) {
    console.log(message);
  }
  process.exit(code);
};

const run = async () => {
  try {
    if (!teacherId || !password || !roleInput) {
      console.error('Missing required arguments.');
      console.error(usage);
      return exitWith(1);
    }

    const normalizedRole = normalizeRoleValue(roleInput);
    if (!normalizedRole) {
      console.error(`Role must be one of: ${Object.values(ROLES).join(', ')}`);
      return exitWith(1);
    }

    const existingByTeacher = await findUserByTeacherId(teacherId);
    if (existingByTeacher) {
      console.log('User already exists, skipping.');
      return exitWith(0);
    }

    if (email) {
      const existingByEmail = await findUserByEmail(email);
      if (existingByEmail) {
        console.log('Email already registered, skipping.');
        return exitWith(0);
      }
    }

    const passwordHash = await hashPassword(password);
    await createUser({ teacherId, email, passwordHash, role: normalizedRole, departmentId });

    console.log(`User ${teacherId} created with role ${normalizedRole}.`);
    return exitWith(0);
  } catch (error) {
    console.error('Failed to seed user:', error.message);
    return exitWith(1);
  }
};

run();
