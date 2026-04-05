
const BASE_URL = 'http://localhost:3000/api/v1';

export const authRoutes = {
    login: `${BASE_URL}/auth/login`,
    register: `${BASE_URL}/auth/register`,
    verifyEmail: `${BASE_URL}/auth/verify-email`,
    resendVerification: `${BASE_URL}/auth/resend-verification`,
    logout: `${BASE_URL}/auth/logout`,
};