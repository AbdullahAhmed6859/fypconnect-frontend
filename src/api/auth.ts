// Auth API — POST /auth/register, /auth/verify-email, /auth/resend-verification, /auth/login
// Currently using dummy data. Swap BASE_URL and remove dummy logic once backend is ready.

const BASE_URL = "http://localhost:5000/api/v1";

// --- Dummy data for testing without backend ---
const DUMMY_REGISTERED_EMAIL = "sn08776@st.habib.edu.pk";
const DUMMY_VERIFICATION_CODE = "123456";
const DUMMY_PASSWORD = "password";

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  data: {
    userId: number;
    email: string;
    verificationStatus: "pending";
    codeExpiresInHours: number;
  };
}

export interface VerifyEmailPayload {
  email: string;
  verificationCode: string;
}

export interface VerifyEmailResponse {
  message: string;
  data: {
    email: string;
    verificationStatus: "verified";
  };
}

export interface ResendVerificationPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    token: string;
    expiresIn: string;
    user: {
      id: number;
      email: string;
      isVerified: boolean;
      profileCompleted: boolean;
    };
    nextStep: "complete_profile" | null;
  };
}

// Simulates network delay so the UI feels realistic
const fakeDelay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  await fakeDelay();

  // Dummy validation — mirrors what the backend would reject
  if (!payload.email.endsWith("@st.habib.edu.pk")) {
    throw { code: 400, message: "Email must end with @st.habib.edu.pk" };
  }

  // Strip whitespace and check if length is less than 8
  if (payload.password.trim().length < 8) {
    throw { code: 400, message: "Password must be at least 8 characters long!" };
  }
  
  if (payload.email === DUMMY_REGISTERED_EMAIL) {
    throw { code: 409, message: "An account with this email already exists" };
  }

  return {
    message: "Registration successful. Verification code sent to email.",
    data: {
      userId: 12,
      email: payload.email,
      verificationStatus: "pending",
      codeExpiresInHours: 24,
    },
  };
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  await fakeDelay();

  if (payload.verificationCode !== DUMMY_VERIFICATION_CODE) {
    throw { code: 400, message: "Incorrect verification code. Please try again." };
  }

  return {
    message: "Email verified successfully",
    data: {
      email: payload.email,
      verificationStatus: "verified",
    },
  };
}

export async function resendVerification(payload: ResendVerificationPayload): Promise<{ message: string }> {
  await fakeDelay();
  return { message: "Verification code resent successfully" };
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  await fakeDelay();

  if (
    payload.email !== DUMMY_REGISTERED_EMAIL ||
    payload.password !== DUMMY_PASSWORD
  ) {
    throw { code: 401, message: "Invalid email or password." };
  }

  return {
    message: "Login successful",
    data: {
      token: "dummy-jwt-token-abc123",
      expiresIn: "24h",
      user: {
        id: 12,
        email: payload.email,
        isVerified: true,
        profileCompleted: false,
      },
      nextStep: "complete_profile",
    },
  };
}
