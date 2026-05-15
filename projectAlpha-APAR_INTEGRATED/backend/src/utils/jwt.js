import jwt from 'jsonwebtoken';
import { ApiError } from './api-error.js';

const { JWT_SECRET, JWT_EXPIRES_IN = '24h', AUTH_COOKIE_NAME = 'access_token' } = process.env;

if (!JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set. Set it in your env file before going to production.');
}

export const signAccessToken = (payload, options = {}) => {
  if (!JWT_SECRET) {
    throw new ApiError(500, 'JWT secret misconfigured');
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options
  });
};

export const verifyAccessToken = (token) => {
  if (!JWT_SECRET) {
    throw new ApiError(500, 'JWT secret misconfigured');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired session');
  }
};

export const authCookieName = AUTH_COOKIE_NAME;
