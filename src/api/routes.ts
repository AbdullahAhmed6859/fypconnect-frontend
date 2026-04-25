export const API_BASE_URL = "http://localhost:5000/api/v1";

export const authRoutes = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  resendVerification: `${API_BASE_URL}/auth/resend-verification`,
  logout: `${API_BASE_URL}/auth/logout`,
  protected: `${API_BASE_URL}/auth/test-protected`,
};

export const dashboardRoutes = {
  discoveryProfiles: `${API_BASE_URL}/discovery`,
  likeProfile: `${API_BASE_URL}/browse/like`,
  passProfile: `${API_BASE_URL}/browse/pass`,
  matches: `${API_BASE_URL}/matches/matches`,
  logout: `${API_BASE_URL}/auth/logout`,
};

export const profileRoutes = {
  me: `${API_BASE_URL}/profile/me`,
  update: `${API_BASE_URL}/profile/update`,
  setup: `${API_BASE_URL}/profile/setup`,
  preferences: `${API_BASE_URL}/profile/preferences`,
  setupOptions: `${API_BASE_URL}/profile/skills-interests`,
  dismissAnnualYearReview: `${API_BASE_URL}/profile/annual-year-review/dismiss`,
};
