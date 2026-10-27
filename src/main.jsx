import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" was not found. Check index.html.');
}

createRoot(rootElement).render(<App />);
