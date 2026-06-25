import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { apiGetContext } from "@/api/me"
import { apiListMealEntries } from "@/api/meals"
import { apiListWeightLogs } from "@/api/weight"
import { apiListRoutines } from "@/api/routines"

// Cache window: skip a refresh if we synced within this many ms (dedupes rapid
// focus toggles). The interval poll is longer than this so it always refreshes.
const STALE_MS = 15_000
// Background poll cadence while the app is visible.
const POLL_MS = 60_000

/**
 * Bootstraps the app session against the platform on load and keeps it in sync.
 *
 * Backend is the source of truth: we verify the session cookie via
 * `GET /me/context`, hydrate the store, and load weight/meal history.
 *
 * To reflect changes the agent persists from WhatsApp without a manual reload,
 * it re-syncs on focus/visibility and via a light interval poll — both gated by
 * a freshness window and de-duped, and paused while the tab is hidden.
 *
 * Returns `true` once the bootstrap attempt has finished (success or not).
 */
export function useBootstrap(): boolean {
   const [ready, setReady] = useState(false)
   const hydrateFromContext = useStore((s) => s.hydrateFromContext)
   const setMealsFromEntries = useStore((s) => s.setMealsFromEntries)
   const setWeightHistoryFromLogs = useStore((s) => s.setWeightHistoryFromLogs)
   const setRoutines = useStore((s) => s.setRoutines)

   useEffect(() => {
      let cancelled = false
      let lastSync = 0
      let refreshing = false

      const loadData = async (): Promise<void> => {
         const ctx = await apiGetContext()
         if (cancelled) return

         if (ctx.ok) {
            hydrateFromContext(ctx.data)

            if (ctx.data.onboardingCompleted) {
               const [weights, meals, routines] = await Promise.all([
                  apiListWeightLogs({ limit: 500 }),
                  apiListMealEntries({ limit: 100 }),
                  apiListRoutines(),
               ])
               if (cancelled) return
               if (weights.ok) setWeightHistoryFromLogs(weights.data.weightLogs)
               if (meals.ok) setMealsFromEntries(meals.data.mealEntries)
               if (routines.ok) setRoutines(routines.data.routines)
            }
         } else {
            // No valid session — route the user to onboarding/login.
            useStore.setState({ isOnboarded: false, hydrated: true })
         }
      }

      // sync re-fetches only when worth it: tab visible, not already in flight,
      // and stale enough (unless forced). Keeps the cache warm without hammering.
      const sync = async (force = false): Promise<void> => {
         if (cancelled || refreshing) return
         if (document.visibilityState !== "visible") return
         if (!force && Date.now() - lastSync < STALE_MS) return
         refreshing = true
         try {
            await loadData()
            lastSync = Date.now()
         } finally {
            refreshing = false
         }
      }

      void (async () => {
         await loadData()
         lastSync = Date.now()
         if (!cancelled) setReady(true)
      })()

      const onFocus = (): void => {
         void sync()
      }
      window.addEventListener("focus", onFocus)
      document.addEventListener("visibilitychange", onFocus)
      const interval = window.setInterval(() => {
         void sync()
      }, POLL_MS)

      return () => {
         cancelled = true
         window.removeEventListener("focus", onFocus)
         document.removeEventListener("visibilitychange", onFocus)
         clearInterval(interval)
      }
   }, [hydrateFromContext, setMealsFromEntries, setWeightHistoryFromLogs, setRoutines])

   return ready
}
