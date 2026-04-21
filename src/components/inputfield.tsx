import React, { forwardRef } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Simple labelled input — forwards ref so parent can autofocus
const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, style, ...props }, ref) => {
    return (
      <div style={styles.wrapper}>
        <label style={styles.label}>{label}</label>
        <input ref={ref} style={{ ...styles.input, ...style }} {...props} />
      </div>
    );
  }
);

InputField.displayName = "InputField";
export default InputField;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "18px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1a1a2e",
    letterSpacing: "0.1px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #E8E2E2",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a2e",
    background: "#fafafa",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
};

// // Inject focus style via a <style> tag — inline styles can't handle :focus
// const focusStyle = document.createElement("style");
// focusStyle.textContent = `
//   input:focus {
//     border-color: #5D3891 !important;
//     box-shadow: 0 0 0 3px rgba(93, 56, 145, 0.12) !important;
//     background: #fff !important;
//   }
// `;
// document.head.appendChild(focusStyle);
