import bcrypt from 'bcrypt';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const verifyPassword = async (plainPassword, passwordHash) => {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(plainPassword, passwordHash);
};
