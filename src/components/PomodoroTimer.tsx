// Focus timer (Pomodoro) for the habits/gamification section. Self-contained and
// front-only: it tracks the running interval, the per-mode durations (editable),
// and the count of focus sessions completed today. Durations and the daily count
// persist in localStorage (the count resets each day). No backend yet.
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pause, Play, RotateCcw, Coffee, Brain, SlidersHorizontal } from "lucide-react"

import { ProgressRing } from "@/components/ui"
import { localDateStr } from "@/lib/date"

type Mode = "focus" | "short" | "long"

type Durations = Record<Mode, number> // minutes per mode

const DEFAULT_DURATIONS: Durations = { focus: 25, short: 5, long: 15 }
const MIN_MINUTES = 1
const MAX_MINUTES = 120

// A long break replaces the short one every Nth completed focus session.
const SESSIONS_BEFORE_LONG = 4

const COUNT_KEY = "moveat:pomodoro"
const DURATIONS_KEY = "moveat:pomodoro:durations"

function loadTodayCount(): number {
   try {
      const raw = localStorage.getItem(COUNT_KEY)
      if (!raw) return 0
      const parsed = JSON.parse(raw) as { date: string; count: number }
      return parsed.date === localDateStr() ? parsed.count : 0
   } catch {
      return 0
   }
}

function saveTodayCount(count: number): void {
   try {
      localStorage.setItem(COUNT_KEY, JSON.stringify({ date: localDateStr(), count }))
   } catch {
      // localStorage unavailable (private mode); the count just won't persist.
   }
}

function clampMinutes(value: number): number {
   if (!Number.isFinite(value)) return MIN_MINUTES
   return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)))
}

function loadDurations(): Durations {
   try {
      const raw = localStorage.getItem(DURATIONS_KEY)
      if (!raw) return DEFAULT_DURATIONS
      const parsed = JSON.parse(raw) as Partial<Durations>
      return {
         focus: clampMinutes(parsed.focus ?? DEFAULT_DURATIONS.focus),
         short: clampMinutes(parsed.short ?? DEFAULT_DURATIONS.short),
         long: clampMinutes(parsed.long ?? DEFAULT_DURATIONS.long),
      }
   } catch {
      return DEFAULT_DURATIONS
   }
}

function formatClock(totalSeconds: number): string {
   const m = Math.floor(totalSeconds / 60)
   const s = totalSeconds % 60
   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// Short, soft beep on completion via the Web Audio API (no asset needed).
function playChime(): void {
   try {
      const Ctx =
         window.AudioContext ??
         (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
      osc.onended = () => ctx.close()
   } catch {
      // Audio blocked/unsupported — silent is fine.
   }
}

export default function PomodoroTimer() {
   const { t } = useTranslation("common")
   const [durations, setDurations] = useState<Durations>(loadDurations)
   const [mode, setMode] = useState<Mode>("focus")
   const [secondsLeft, setSecondsLeft] = useState(() => loadDurations().focus * 60)
   const [running, setRunning] = useState(false)
   const [count, setCount] = useState(0)
   const [showSettings, setShowSettings] = useState(false)

   // Anchor the countdown to a wall-clock end time so background-tab throttling
   // can't make it drift; we recompute remaining from it on every tick.
   const endsAtRef = useRef<number>(0)
   const intervalRef = useRef<number | null>(null)

   useEffect(() => {
      setCount(loadTodayCount())
   }, [])

   const clearTick = useCallback(() => {
      if (intervalRef.current !== null) {
         window.clearInterval(intervalRef.current)
         intervalRef.current = null
      }
   }, [])

   const switchMode = useCallback(
      (next: Mode) => {
         clearTick()
         setRunning(false)
         setMode(next)
         setSecondsLeft(durations[next] * 60)
      },
      [clearTick, durations],
   )

   const reset = useCallback(() => {
      clearTick()
      setRunning(false)
      setSecondsLeft(durations[mode] * 60)
   }, [clearTick, durations, mode])

   const handleComplete = useCallback(() => {
      clearTick()
      setRunning(false)
      playChime()
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(200)

      if (mode === "focus") {
         const nextCount = count + 1
         setCount(nextCount)
         saveTodayCount(nextCount)
         const next: Mode = nextCount % SESSIONS_BEFORE_LONG === 0 ? "long" : "short"
         setMode(next)
         setSecondsLeft(durations[next] * 60)
      } else {
         setMode("focus")
         setSecondsLeft(durations.focus * 60)
      }
   }, [clearTick, mode, count, durations])

   const start = useCallback(() => {
      if (running || secondsLeft <= 0) return
      setRunning(true)
      endsAtRef.current = Date.now() + secondsLeft * 1000
      intervalRef.current = window.setInterval(() => {
         const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000))
         setSecondsLeft(left)
         if (left <= 0) handleComplete()
      }, 250)
   }, [running, secondsLeft, handleComplete])

   const pause = useCallback(() => {
      clearTick()
      setRunning(false)
   }, [clearTick])

   // Edit a mode's duration (minutes). Persists, and — when idle on that mode —
   // updates the clock so the change is visible right away.
   const setMinutes = useCallback(
      (target: Mode, minutes: number) => {
         setDurations((prev) => {
            const next = { ...prev, [target]: clampMinutes(minutes) }
            try {
               localStorage.setItem(DURATIONS_KEY, JSON.stringify(next))
            } catch {
               // ignore persistence failures
            }
            if (!running && target === mode) setSecondsLeft(next[target] * 60)
            return next
         })
      },
      [running, mode],
   )

   // Clean up the interval if the component unmounts mid-session.
   useEffect(() => clearTick, [clearTick])

   const total = durations[mode] * 60
   const elapsed = total - secondsLeft
   const ringColor = mode === "focus" ? "var(--primary)" : "var(--water)"

   const TABS: { key: Mode; label: string }[] = [
      { key: "focus", label: t("pomodoro.focus") },
      { key: "short", label: t("pomodoro.short_break") },
      { key: "long", label: t("pomodoro.long_break") },
   ]

   return (
      <div className="flex flex-col items-center gap-5 max-w-md mx-auto w-full">
         {/* Mode tabs + settings toggle */}
         <div className="flex items-center gap-2 w-full justify-center">
            <div className="flex gap-2 bg-muted/60 p-1 rounded-2xl soft-inset">
               {TABS.map((tab) => (
                  <button
                     key={tab.key}
                     onClick={() => switchMode(tab.key)}
                     className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        mode === tab.key ? "bg-card-bg text-foreground shadow-sm" : "text-subtle hover:text-foreground"
                     }`}>
                     {tab.label}
                  </button>
               ))}
            </div>
            <button
               onClick={() => setShowSettings((s) => !s)}
               aria-label={t("pomodoro.settings")}
               aria-pressed={showSettings}
               className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  showSettings
                     ? "bg-primary/10 text-primary border-primary/20"
                     : "bg-muted/60 text-subtle border-card-border hover:text-foreground"
               }`}>
               <SlidersHorizontal size={16} />
            </button>
         </div>

         {/* Duration settings */}
         {showSettings && (
            <div className="w-full max-w-xs grid grid-cols-3 gap-2">
               {TABS.map((tab) => (
                  <label key={tab.key} className="flex flex-col items-center gap-1">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-subtle text-center">
                        {tab.label}
                     </span>
                     <div className="flex items-center gap-1 bg-muted/60 border border-card-border rounded-xl px-2 py-1.5 w-full justify-center">
                        <input
                           type="number"
                           inputMode="numeric"
                           min={MIN_MINUTES}
                           max={MAX_MINUTES}
                           value={durations[tab.key]}
                           onChange={(e) => setMinutes(tab.key, Number(e.target.value))}
                           className="w-10 bg-transparent text-center font-bold text-sm text-foreground outline-none"
                        />
                        <span className="text-[10px] text-subtle font-bold">min</span>
                     </div>
                  </label>
               ))}
            </div>
         )}

         {/* Ring with the clock + current mode */}
         <ProgressRing value={elapsed} max={total} size={200} stroke={12} color={ringColor}>
            <div className="flex flex-col items-center">
               <span className="text-5xl font-display font-extrabold text-foreground tabular-nums">
                  {formatClock(secondsLeft)}
               </span>
               <span className="mt-1 flex items-center gap-1 text-caption text-subtle">
                  {mode === "focus" ? <Brain size={13} /> : <Coffee size={13} />}
                  {mode === "focus" ? t("pomodoro.focus") : t("pomodoro.break")}
               </span>
            </div>
         </ProgressRing>

         {/* Controls */}
         <div className="flex items-center gap-3">
            <button
               onClick={running ? pause : start}
               className="flex items-center justify-center gap-2 min-w-36 py-3 rounded-2xl bg-primary text-white font-bold shadow-md shadow-primary/25 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
               {running ? <Pause size={18} /> : <Play size={18} />}
               {running ? t("pomodoro.pause") : t("pomodoro.start")}
            </button>
            <button
               onClick={reset}
               aria-label={t("pomodoro.reset")}
               className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/70 border border-card-border text-subtle hover:text-foreground active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
               <RotateCcw size={18} />
            </button>
         </div>

         {/* Today's completed focus sessions */}
         <p className="text-caption text-subtle font-medium">{t("pomodoro.today", { count })}</p>
      </div>
   )
}
