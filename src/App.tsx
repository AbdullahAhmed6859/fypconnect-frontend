import "./styles/global.css";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import LoginPage from "./pages/LoginPage";

// Simple client-side router — no library needed for three screens
// Once the backend team sets up the full router, replace this with React Router
function getPage() {
  const path = window.location.pathname;
  if (path === "/verify-email") return <VerifyEmailPage />;
  if (path === "/login") return <LoginPage />;
  return <RegisterPage />; // default: register
}

export default function App() {
  return (
    <>
      {/* Keyframe animations shared across all screens */}
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
