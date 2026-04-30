import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress YouTube/clipboard errors globally
window.addEventListener('error', (event) => {
  const errorMsg = event.message || '';
  const errorSrc = event.filename || '';

  // Suppress the specific clipboard/model error
  if (
    errorMsg.includes('clipboard') ||
    errorMsg.includes('model does not support image') ||
    errorSrc.includes('youtube.com')
  ) {
    event.preventDefault();
    event.stopPropagation();
    console.warn('Suppressed error:', errorMsg);
    return false;
  }
});

// Suppress unhandled promise rejections related to YouTube
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonStr = reason?.message || reason?.toString() || '';

  if (
    reasonStr.includes('clipboard') ||
    reasonStr.includes('model does not support image') ||
    reasonStr.includes('youtube')
  ) {
    event.preventDefault();
    console.warn('Suppressed promise rejection:', reasonStr);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
