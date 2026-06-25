import { apiCreateWeightLog } from "@/api/weight"
import { todayLocalISO } from "@/api/client"
import { useStore } from "@/store/useStore"
import { toast } from "@/components/ui/toast"

/**
 * Logs a weight measurement.
 *
 * - Clamps future dates to today (you can't weigh yourself in the future).
 * - Updates the local weight history optimistically so the chart reacts now.
 * - Persists to the backend; a non-today date is timestamped at local noon.
 * - Refreshes the calorie target when the server recalculates it.
 *
 * Shared by the Dashboard and Progress weight forms so the date/timezone rules
 * live in one place.
 */
export async function logWeight(weight: number, dateISO: string): Promise<void> {
   const today = todayLocalISO()
   const date = dateISO > today ? today : dateISO

   // Snapshot for rollback, then update optimistically so the chart reacts now.
   const prevHistory = useStore.getState().weightHistory
   const prevUser = useStore.getState().user
   useStore.getState().addWeightEntry(weight, date)

   const loggedAt =
      date === today ? undefined : new Date(`${date}T12:00:00`).toISOString()
   const res = await apiCreateWeightLog({ weight, loggedAt })
   if (!res.ok) {
      // Roll back the optimistic update so we don't show an unsaved weight.
      useStore.setState({ weightHistory: prevHistory, user: prevUser })
      toast.error(res.message)
      return
   }
   if (res.data.nutrition) {
      useStore.setState({ targetCalories: res.data.nutrition.dailyCalorieTarget })
   }
}
