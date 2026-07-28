import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// The app's code was originally written for Claude's artifact "window.storage" API.
// Outside that environment there's no such API, so we polyfill it with plain
// localStorage. This keeps App.jsx completely unchanged. Data lives only in this
// browser on this device — that's the accepted trade-off for a simple personal app.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
