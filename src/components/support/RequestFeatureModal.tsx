"use client";

import React, { useState } from "react";
import { useOlio } from "@/state/OlioProvider";

interface RequestFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestFeatureModal: React.FC<RequestFeatureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useOlio();
  const [featureTitle, setFeatureTitle] = useState("");
  const [category, setCategory] = useState("collections");
  const [importance, setImportance] = useState("medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim()) {
      toast.showToast("Please enter a title for the feature", "error");
      return;
    }
    if (!description.trim()) {
      toast.showToast("Please describe the feature and your use case", "error");
      return;
    }

    setIsSubmitting(true);
    // Simulate feature request dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);

    toast.showToast("Thank you! Your feature request has been submitted to the OlioCMS product team.", "success");
    setFeatureTitle("");
    setDescription("");
    setCategory("collections");
    setImportance("medium");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel max-w-lg w-full p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Request a Feature
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Have an idea to make OlioCMS better? We&apos;d love to hear it.
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
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Feature Name / Summary *
            </label>
            <input
              type="text"
              required
              value={featureTitle}
              onChange={(e) => setFeatureTitle(e.target.value)}
              placeholder="e.g. Webhook notifications when records are updated"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Area / Module
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="collections">Collections & Schema</option>
                <option value="menus">Menus & Navigation</option>
                <option value="media">Media Library & Storage</option>
                <option value="api">Headless APIs & Webhooks</option>
                <option value="auth">Team & Roles / Access Control</option>
                <option value="ui">UI, Dark Mode & UX</option>
                <option value="other">Other Capability</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority for you
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="nice">Nice to have</option>
                <option value="medium">Important for my workflow</option>
                <option value="critical">Critical blocker for project</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Use Case *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What problem would this solve? Describe how you envision this working..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Info pill */}
          <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 flex items-center gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
            <i className="fa-solid fa-sparkles text-amber-500 text-xs shrink-0"></i>
            <span>All community requests are reviewed directly by the core OlioCMS product team.</span>
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
