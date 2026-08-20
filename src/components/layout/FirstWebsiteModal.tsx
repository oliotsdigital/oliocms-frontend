"use client";

import React, { useState, useEffect } from "react";
import { useOlio } from "@/state/OlioProvider";
import { checkDomainAvailabilityApi } from "@/api/project.api";

interface FirstWebsiteModalProps {
  onLogout?: () => void;
}

export const FirstWebsiteModal: React.FC<FirstWebsiteModalProps> = ({ onLogout }) => {
  const { projectState } = useOlio();
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [newProjName, setNewProjName] = useState<string>("");
  const [newProjSubdomain, setNewProjSubdomain] = useState<string>("");
  const [showCustomDomain, setShowCustomDomain] = useState<boolean>(false);
  const [newProjCustomDomain, setNewProjCustomDomain] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time domain availability
  const [defaultDomainError, setDefaultDomainError] = useState<string | null>(null);
  const [customDomainError, setCustomDomainError] = useState<string | null>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState<boolean>(false);

  const currentHost = typeof window !== "undefined" ? window.location.host : "localhost:3000";

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjName.trim()) {
      const defaultSlug = newProjName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
      setNewProjSubdomain(defaultSlug);
      setModalStep(2);
    }
  };

  // Real-time domain validation effect
  useEffect(() => {
    if (modalStep !== 2) return;

    const sub = newProjSubdomain.trim() || newProjName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    const currentDefaultDomain = `${sub}.${currentHost}`;
    const currentCustomDomain = showCustomDomain && newProjCustomDomain.trim() ? newProjCustomDomain.trim() : undefined;

    let isMounted = true;
    setIsCheckingDomain(true);

    const timer = setTimeout(async () => {
      const res = await checkDomainAvailabilityApi(currentDefaultDomain, currentCustomDomain);
      if (!isMounted) return;

      if (!res.defaultDomainAvailable) {
        setDefaultDomainError("This subdomain already exists. Please use another subdomain.");
      } else {
        setDefaultDomainError(null);
      }

      if (showCustomDomain && currentCustomDomain && !res.domainAvailable) {
        setCustomDomainError("This custom domain already exists. Please use another custom domain.");
      } else {
        setCustomDomainError(null);
      }

      setIsCheckingDomain(false);
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [newProjSubdomain, newProjCustomDomain, showCustomDomain, modalStep, newProjName, currentHost]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newProjName.trim() ||
      isSubmitting ||
      isCheckingDomain ||
      defaultDomainError ||
      (showCustomDomain && customDomainError)
    ) {
      return;
    }
    setIsSubmitting(true);

    const sub = newProjSubdomain.trim() || newProjName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    const computedDefaultDomain = `${sub}.${currentHost}`;

    try {
      await projectState.addProject({
        name: newProjName.trim(),
        defaultDomain: computedDefaultDomain,
        domain: showCustomDomain && newProjCustomDomain.trim() ? newProjCustomDomain.trim() : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreateDisabled =
    isSubmitting ||
    isCheckingDomain ||
    !newProjSubdomain.trim() ||
    Boolean(defaultDomainError) ||
    (showCustomDomain && Boolean(customDomainError));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800/60 space-y-5">
        {/* Header Banner */}
        <div className="text-center space-y-2 border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-500 flex items-center justify-center text-2xl mx-auto shadow-inner">
            <i className="fa-solid fa-globe animate-pulse"></i>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
            Add Your First Website!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please add your first website to unlock your content dashboard.
          </p>
        </div>

        {/* STEP 1: Website Name */}
        {modalStep === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Website Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. My E-Commerce Store"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                Give your website a recognizable title.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={!newProjName.trim()}
                className="w-full py-3 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Continue to Domain Setup</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Domain Setup */}
        {modalStep === 2 && (
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Domain Subdomain
                </label>
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                  Editable Subdomain
                </span>
              </div>

              {/* Split Input: Subdomain + Host Suffix */}
              <div
                className={`flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border overflow-hidden shadow-sm transition ${
                  defaultDomainError
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-500"
                }`}
              >
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={newProjSubdomain}
                  onChange={(e) =>
                    setNewProjSubdomain(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  placeholder="subdomain"
                  className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="px-3 py-2.5 bg-slate-200/80 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-mono text-xs border-l border-slate-200 dark:border-slate-700/80 select-none shrink-0 font-medium">
                  .{currentHost}
                </span>
              </div>

              {defaultDomainError ? (
                <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                  <span>{defaultDomainError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Prefix is editable. Host suffix (<span className="font-mono text-slate-600 dark:text-slate-300">.{currentHost}</span>) is fixed.
                </p>
              )}
            </div>

            {/* Custom Domain Toggle */}
            {!showCustomDomain ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomDomain(true)}
                  className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline group"
                >
                  <i className="fa-solid fa-plus-circle text-xs transition-transform group-hover:scale-110"></i>
                  <span>Add Custom Domain</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custom Domain
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomDomain(false);
                      setNewProjCustomDomain("");
                      setCustomDomainError(null);
                    }}
                    className="text-[10px] text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  disabled={isSubmitting}
                  placeholder="e.g. www.mystore.com"
                  value={newProjCustomDomain}
                  onChange={(e) => setNewProjCustomDomain(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border focus:outline-none transition disabled:opacity-50 ${
                    customDomainError
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"
                  }`}
                />
                {customDomainError && (
                  <p className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                    <span>{customDomainError}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/40 dark:border-slate-800/40 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <i className="fa-solid fa-arrow-left text-[10px]"></i>
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isCreateDisabled}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Creating Website...</span>
                  </>
                ) : isCheckingDomain ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Checking Domain...</span>
                  </>
                ) : (
                  <>
                    <span>Create & Go to Dashboard</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
