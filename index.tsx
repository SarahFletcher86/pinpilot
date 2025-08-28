import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// IMPORTANT: make sure this path is correct for your CSS file
import "./index.css";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);