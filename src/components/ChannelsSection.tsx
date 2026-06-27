import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, Check, ShieldCheck, ShieldAlert, Crown } from "lucide-react"
import { useTranslation } from "react-i18next"

import { apiListChannels, apiUpsertChannel, type LinkedChannel } from "@/api/channels"
import { Button } from "@/components/ui"
import { toast } from "@/components/ui/toast"
import { useStore } from "@/store/useStore"

export default function ChannelsSection() {
   const { t } = useTranslation("common")
   const whatsappEnabled = useStore((s) => s.whatsappEnabled)
   const [whatsapp, setWhatsapp] = useState<LinkedChannel | null>(null)
   const [editing, setEditing] = useState(false)
   const [value, setValue] = useState("")
   const [saving, setSaving] = useState(false)

   useEffect(() => {
      let active = true
      apiListChannels().then((res) => {
         if (!active || !res.ok) return
         const wa = res.data.channels.find((c) => c.channel === "WHATSAPP") ?? null
         setWhatsapp(wa)
      })
      return () => {
         active = false
      }
   }, [])

   const startEditing = () => {
      setValue(whatsapp?.identifier ?? "")
      setEditing(true)
   }

   const save = async () => {
      const identifier = value.trim()
      if (identifier.length < 3) return
      setSaving(true)
      const res = await apiUpsertChannel("whatsapp", identifier)
      setSaving(false)
      if (res.ok) {
         setWhatsapp(res.data)
         setEditing(false)
         toast.success(t("profile.channels.saved"))
      } else {
         toast.error(res.message || t("profile.channels.save_error"))
      }
   }

   return (
      <motion.div
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.15 }}
         className="mb-8">
         <h3 className="font-bold text-lg mb-1 text-foreground">
            {t("profile.sections.connections")}
         </h3>
         <p className="text-sm text-subtle mb-4">{t("profile.channels.subtitle")}</p>

         {!whatsappEnabled ? (
            <div className="mb-4 w-full flex items-center justify-center gap-2 bg-muted/60 text-subtle font-bold py-3.5 rounded-2xl border border-card-border cursor-not-allowed select-none">
               <Crown size={16} className="text-primary" /> {t("profile.channels.connect_preferred")}
            </div>
         ) : whatsapp ? (
            // Premium + linked: the chat shortcut only works once a number is linked,
            // since the bot maps the conversation to the account by that number.
            <a
               href="https://wa.chatfuel.com/mov-eat"
               target="_blank"
               rel="noopener noreferrer"
               className="mb-4 w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-2xl shadow-md shadow-[#25D366]/25 hover:brightness-95 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
               <MessageCircle size={18} /> {t("profile.channels.open_whatsapp")}
            </a>
         ) : null}

         <div className="bg-card-bg/40 rounded-3xl overflow-hidden shadow-sm border border-card-border flex flex-col">
            {/* WhatsApp — interactive for premium, premium teaser otherwise */}
            <div
               className={`border-b border-card-border ${
                  whatsappEnabled ? "" : "opacity-60 cursor-not-allowed select-none"
               }`}>
               <div className="w-full p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                     <div className="w-10 h-10 bg-[#25D366]/15 text-[#1ebe5d] rounded-xl flex items-center justify-center shrink-0">
                        <MessageCircle size={20} />
                     </div>
                     <div className="min-w-0">
                        <span className="font-bold text-foreground block">
                           {t("profile.channels.whatsapp")}
                        </span>
                        <span className="text-sm text-subtle font-medium truncate block">
                           {whatsappEnabled
                              ? whatsapp
                                 ? whatsapp.identifier
                                 : t("profile.channels.not_linked")
                              : t("profile.channels.premium_only")}
                        </span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     {whatsappEnabled ? (
                        <>
                           {whatsapp &&
                              (whatsapp.verified ? (
                                 <span className="hidden sm:flex items-center gap-1 text-caption text-[#1ebe5d] border border-[#25D366]/30 bg-[#25D366]/10 px-2 py-1 rounded-lg">
                                    <ShieldCheck size={12} /> {t("profile.channels.verified")}
                                 </span>
                              ) : (
                                 <span className="hidden sm:flex items-center gap-1 text-caption text-subtle border border-card-border bg-muted/60 px-2 py-1 rounded-lg">
                                    <ShieldAlert size={12} /> {t("profile.channels.unverified")}
                                 </span>
                              ))}
                           <button
                              onClick={() => (editing ? setEditing(false) : startEditing())}
                              className="text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded px-1">
                              {whatsapp ? t("profile.channels.edit") : t("profile.channels.link")}
                           </button>
                        </>
                     ) : (
                        <span className="flex items-center gap-1 text-caption text-primary border border-primary/30 bg-primary/10 px-2 py-1 rounded-lg">
                           <Crown size={12} /> {t("profile.channels.premium")}
                        </span>
                     )}
                  </div>
               </div>

               <AnimatePresence>
                  {editing && whatsappEnabled && (
                     <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="px-5 pb-5 pt-1 flex flex-col gap-3">
                           <input
                              type="tel"
                              inputMode="tel"
                              autoFocus
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              placeholder={t("profile.channels.placeholder")}
                              className="w-full bg-muted/60 border border-card-border rounded-2xl px-4 py-3 text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                           />
                           <p className="text-caption text-subtle">
                              {t("profile.channels.hint")}
                           </p>
                           <div className="flex gap-2">
                              <Button
                                 variant="outline"
                                 onClick={() => setEditing(false)}
                                 className="flex-1">
                                 {t("profile.channels.cancel")}
                              </Button>
                              <Button
                                 onClick={save}
                                 disabled={saving || value.trim().length < 3}
                                 className="flex-1 flex items-center justify-center gap-2">
                                 <Check size={16} />
                                 {saving ? t("profile.channels.saving") : t("profile.channels.save")}
                              </Button>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Telegram — coming soon, disabled */}
            <div className="w-full p-5 flex items-center justify-between gap-3 opacity-60 cursor-not-allowed select-none">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#229ED9]/15 text-[#229ED9] rounded-xl flex items-center justify-center shrink-0">
                     <Send size={20} />
                  </div>
                  <span className="font-bold text-foreground">
                     {t("profile.channels.telegram")}
                  </span>
               </div>
               <span className="text-caption text-subtle border border-card-border bg-muted/60 px-2 py-1 rounded-lg">
                  {t("profile.channels.soon")}
               </span>
            </div>
         </div>
      </motion.div>
   )
}
