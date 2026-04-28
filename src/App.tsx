import { useEffect, useState, type ReactNode } from "react";
import "./styles/global.css";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import {
  ProfileSetupAcademicPage,
  ProfileSetupMatchingPage,
  ProfileSetupPreferencesPage,
  ProfileSetupPersonalPage,
} from "./pages/profile-setup/ProfileSetupPages";
import { EditProfilePage } from "./pages/profile/EditProfilePage";
import { MatchSettingsPage } from "./pages/profile/MatchSettingsPage";
import { MyProfileOverviewPage } from "./pages/profile/MyProfileOverviewPage";
import { getProfileStatus } from "./api/profileApi";

type GuardMode = "dashboard" | "setup";

const SETUP_START_PATH = "/profile/setup/academic";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "'DM Sans', sans-serif",
        color: "#5D3891",
        background: "#F5F5F5",
        fontWeight: 600,
      }}
    >
      Loading...
    </div>
  );
}

function AuthenticatedRoute({
  mode,
  children,
}: {
  mode: GuardMode;
  children: ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const { profileCompleted } = await getProfileStatus();

        if (!active) return;

        if (mode === "dashboard" && !profileCompleted) {
          window.location.replace(SETUP_START_PATH);
          return;
        }

        if (mode === "setup" && profileCompleted) {
          window.location.replace("/dashboard");
          return;
        }

        setAllowed(true);
      } catch {
        if (active) {
          window.location.replace("/login");
        }
      }
    }

    void checkAccess();

    return () => {
      active = false;
    };
  }, [mode]);

  if (!allowed) return <LoadingScreen />;

  return <>{children}</>;
}

// Simple client-side router — replace with React Router once backend routing is set up
function getPage() {
  const path = window.location.pathname;
  if (path === "/verify-email")               return <VerifyEmailPage />;
  if (path === "/login")                      return <LoginPage />;
  if (path === "/dashboard")                  return <AuthenticatedRoute mode="dashboard"><DashboardPage /></AuthenticatedRoute>;
  if (path === "/profile/me")                 return <AuthenticatedRoute mode="dashboard"><MyProfileOverviewPage /></AuthenticatedRoute>;
  if (path === "/profile/me/edit")            return <AuthenticatedRoute mode="dashboard"><EditProfilePage /></AuthenticatedRoute>;
  if (path === "/profile/me/match-settings")  return <AuthenticatedRoute mode="dashboard"><MatchSettingsPage /></AuthenticatedRoute>;
  if (path === "/profile/setup/academic")     return <AuthenticatedRoute mode="setup"><ProfileSetupAcademicPage /></AuthenticatedRoute>;
  if (path === "/profile/setup/matching")     return <AuthenticatedRoute mode="setup"><ProfileSetupMatchingPage /></AuthenticatedRoute>;
  if (path === "/profile/setup/preferences")  return <AuthenticatedRoute mode="setup"><ProfileSetupPreferencesPage /></AuthenticatedRoute>;
  if (path === "/profile/setup/personal")     return <AuthenticatedRoute mode="setup"><ProfileSetupPersonalPage /></AuthenticatedRoute>;
  return <RegisterPage />; // default
}

export default function App() {
  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        button[type="submit"]:hover:not(:disabled) {
          background: #45276e !important;
        }
        button[type="submit"]:active:not(:disabled) {
          transform: scale(0.98);
        }
        input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus {
          border-color: #5D3891 !important;
          box-shadow: 0 0 0 3px rgba(93, 56, 145, 0.12) !important;
          background: #fff !important;
        }
      `}</style>
      {getPage()}
    </>
  );
}
