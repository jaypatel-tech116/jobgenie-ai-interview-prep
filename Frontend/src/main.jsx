import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.jsx";
import { ToastProvider } from "./components/Toast/ToastContext";
import "./style.scss";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <SpeedInsights />
    </ToastProvider>
  </StrictMode>,
);
