import "./styles/global.css";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import {
  ProfileSetupAcademicPage,
  ProfileSetupMatchingPage,
  ProfileSetupPreferencesPage,
  ProfileSetupPersonalPage,
} from "./pages/ProfileSetupPages";

// Simple client-side router — replace with React Router once backend routing is set up
function getPage() {
  const path = window.location.pathname;
  if (path === "/verify-email")               return <VerifyEmailPage />;
  if (path === "/login")                      return <LoginPage />;
  if (path === "/dashboard")                  return <DashboardPage />;
  if (path === "/profile/setup/academic")     return <ProfileSetupAcademicPage />;
  if (path === "/profile/setup/matching")     return <ProfileSetupMatchingPage />;
  if (path === "/profile/setup/preferences")  return <ProfileSetupPreferencesPage />;
  if (path === "/profile/setup/personal")     return <ProfileSetupPersonalPage />;
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