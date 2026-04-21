import React from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// Centered card shell shared across Register, VerifyEmail, and Login
export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / brand mark */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>⬡</span>
          <span style={styles.brandName}>FYPConnect</span>
        </div>

        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}

        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(28px, 7vh, 72px) clamp(24px, 8vw, 96px)",
    position: "relative",
    zIndex: 1,
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "clamp(42px, 4vw, 58px) clamp(40px, 4vw, 56px)",
    width: "clamp(440px, 38vw, 560px)",
    maxWidth: "calc(100vw - 64px)",
    boxShadow: "0 8px 40px rgba(93, 56, 145, 0.12)",
    border: "1px solid #E8E2E2",
    animation: "fadeSlideUp 0.35s ease both",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "28px",
  },
  brandIcon: {
    fontSize: "22px",
    color: "#5D3891",
  },
  brandName: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "18px",
    color: "#5D3891",
    letterSpacing: "-0.3px",
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: "26px",
    color: "#1a1a2e",
    marginBottom: "6px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b6b7b",
    marginBottom: "28px",
    lineHeight: "1.5",
  },
};
