import { useEffect, useState } from "react"
import { useStore } from "@/store/useStore"
import { apiGetContext } from "@/api/me"
import { apiListMealEntries } from "@/api/meals"
import { apiListWeightLogs } from "@/api/weight"
import { apiListRoutines } from "@/api/routines"

/**
 * Bootstraps the app session against the platform on load.
 *
 * Backend is the source of truth: we verify the session cookie via
 * `GET /me/context`, hydrate the store, and load weight/meal history. When
 * there is no valid session we gate the app back to onboarding.
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

      void (async () => {
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

         setReady(true)
      })()

      return () => {
         cancelled = true
      }
   }, [hydrateFromContext, setMealsFromEntries, setWeightHistoryFromLogs, setRoutines])

   return ready
}
