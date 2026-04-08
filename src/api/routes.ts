export const API_BASE_URL = "http://localhost:3000/api/v1";

export const authRoutes = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  logout: `${API_BASE_URL}/auth/logout`,
  protected: `${API_BASE_URL}/auth/test-protected`,
};

export const dashboardRoutes = {
  nextBrowseProfile: `${API_BASE_URL}/browse/next`,
  likeProfile: `${API_BASE_URL}/browse/like`,
  passProfile: `${API_BASE_URL}/browse/pass`,
  matches: `${API_BASE_URL}/matches`,
  logout: `${API_BASE_URL}/auth/logout`,
};