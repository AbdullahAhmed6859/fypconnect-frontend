import React from "react";

interface ErrorBannerProps {
  message: string | null;
}

// Shown only when there's an error — blank space otherwise (matches wireframe)
export default function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div style={styles.banner} role="alert">
      {message}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: "#e74c3c",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "18px",
    lineHeight: "1.4",
    animation: "fadeIn 0.2s ease",
  },
};
