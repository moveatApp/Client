import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
// Initialize i18next before the app renders.
import "./i18n"

// Global haptics for all buttons
if (typeof window !== "undefined") {
   window.addEventListener("pointerdown", (e) => {
      const target = e.target as HTMLElement
      if (target.closest("button") || target.closest('[role="button"]')) {
         if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(15)
         }
      }
   })
}

import { GoogleOAuthProvider } from "@react-oauth/google"

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

// Register the PWA service worker in production only (avoids interfering with dev HMR).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
   window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js")
   })
}

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
         <App />
      </GoogleOAuthProvider>
   </StrictMode>,
)
