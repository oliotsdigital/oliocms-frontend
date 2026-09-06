"use client";

import React, { useState } from "react";
import { useOlio } from "@/state/OlioProvider";

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  userEmail = "",
  userName = "",
}) => {
  const { toast } = useOlio();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.showToast("Please enter a subject", "error");
      return;
    }
    if (!message.trim()) {
      toast.showToast("Please describe your issue or question", "error");
      return;
    }

    setIsSubmitting(true);
    // Simulate support ticket dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);

    toast.showToast("Your support ticket has been submitted! Our team will get back to you shortly.", "success");
    setSubject("");
    setMessage("");
    setCategory("technical");
    onClose();
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText("support@olioverse.com");
    toast.showToast("Support email copied to clipboard", "success");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel max-w-lg w-full p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Contact Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Have a question or running into an issue? We&apos;re here to help.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="technical">Technical Issue / Bug</option>
                <option value="api">API & Headless Integration</option>
                <option value="collections">Collections & Dynamic Data</option>
                <option value="account">Account & Permissions</option>
                <option value="billing">Billing & Plans</option>
                <option value="other">General Question</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reply-To Email
              </label>
              <input
                type="email"
                disabled
                value={userEmail || "Your account email"}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Issue with collection API response"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Message / Description *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide details about what happened or how we can assist..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Quick Direct Email Pill */}
          <div className="p-3 rounded-2xl bg-brand-500/5 dark:bg-brand-950/20 border border-brand-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <i className="fa-solid fa-envelope text-brand-500"></i>
              <span>Direct support email: <strong className="font-semibold text-brand-600 dark:text-brand-400">support@olioverse.com</strong></span>
            </div>
            <button
              type="button"
              onClick={copySupportEmail}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shrink-0"
            >
              Copy
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
