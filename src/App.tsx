import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

function App() {
  const [message, setMessage] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean | null>(null); // null = haven't checked yet

  const checkBackend = async () => {
    try {
      // Replace with your actual backend URL (usually http://localhost:3000)
      const response = await fetch("http://localhost:3000/");

      if (!response.ok) throw new Error("Server responded with an error");

      const data = await response.text(); // or .json() if your backend sends JSON
      setMessage(data);
      setIsLive(true);
    } catch (error) {
      console.error("Backend fetch failed:", error);
      setMessage("Backend is not live or unreachable.");
      setIsLive(false);
    }
  };

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>FYP Connect</h1>
          <p>
            {isLive === null
              ? "Click the button to verify the connection."
              : isLive
                ? "✅ Connection Successful!"
                : "❌ Connection Failed!"}
          </p>
        </div>

        <button className="counter" onClick={checkBackend}>
          Check Backend Status
        </button>

        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: isLive
                ? "rgba(0, 255, 0, 0.1)"
                : "rgba(255, 0, 0, 0.1)",
              border: `1px solid ${isLive ? "#4caf50" : "#f44336"}`,
            }}
          >
            <code>{message}</code>
          </div>
        )}
      </section>

      <div className="ticks"></div>

      {/* Rest of your static sections (Documentation, Social) remain the same */}
      <section id="next-steps">
        {/* ... (keep your existing documentation and social code here) */}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;
