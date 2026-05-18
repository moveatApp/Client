import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

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

// TODO: Reemplazar este ID con el Google Client ID real de tu consola de Google Cloud
const GOOGLE_CLIENT_ID = "TU_GOOGLE_CLIENT_ID"

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
         <App />
      </GoogleOAuthProvider>
   </StrictMode>,
)
