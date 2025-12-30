import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialize process.env.API_KEY with the provided key if not already set
// This ensures the Gemini API client works immediately in this environment.
(window as any).process = (window as any).process || {};
(window as any).process.env = (window as any).process.env || {};
if (!(window as any).process.env.API_KEY) {
    (window as any).process.env.API_KEY = "AIzaSyAl8CzAFURxuyYH16loK-7Yn-lufDUgPPc";
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);