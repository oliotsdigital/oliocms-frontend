"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useOlio } from "@/state/OlioProvider";
import { checkDomainAvailabilityApi } from "@/api/project.api";

interface HeaderProps {
  title: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isDarkMode,
  onToggleTheme,
}) => {
  const { projectState } = useOlio();
  const selectedProject = projectState.selectedProject;
  const [projectDropdownOpen, setProjectDropdownOpen] = useState<boolean>(false);

  // New Website Multi-step Modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [newProjName, setNewProjName] = useState<string>("");
  const [newProjSubdomain, setNewProjSubdomain] = useState<string>("");
  const [showCustomDomain, setShowCustomDomain] = useState<boolean>(false);
  const [newProjCustomDomain, setNewProjCustomDomain] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Domain real-time validation states
  const [defaultDomainError, setDefaultDomainError] = useState<string | null>(null);
  const [customDomainError, setCustomDomainError] = useState<string | null>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState<boolean>(false);

  // Dynamic host determination
  const currentHost = typeof window !== "undefined" ? window.location.host : "localhost:3000";

  const resetModalState = () => {
    setModalStep(1);
    setNewProjName("");
    setNewProjSubdomain("");
    setShowCustomDomain(false);
    setNewProjCustomDomain("");
    setDefaultDomainError(null);
    setCustomDomainError(null);
    setShowNewProjectModal(false);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjName.trim()) {
      const defaultSlug = newProjName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
      setNewProjSubdomain(defaultSlug);
      setModalStep(2);
    }
  };

  // Real-time domain uniqueness validation effect
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
      resetModalState();
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
    <>
      <div className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your headless content ecosystem seamlessly.
          </p>
        </div>

        {/* Merged Active Website Card with Integrated Theme Toggle & Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl glass-card border border-slate-200/70 dark:border-slate-800/70 shadow-sm">
            {/* Active Website Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs shrink-0 group-hover:bg-brand-500 group-hover:text-white transition">
                <i className="fa-solid fa-globe"></i>
              </div>
              <div className="min-w-0 max-w-[200px] pr-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none mb-0.5">
                  Active Website
                </span>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {selectedProject?.name || "Select Website"}
                  </p>
                  <i
                    className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform duration-200 shrink-0 ${
                      projectDropdownOpen ? "rotate-180 text-brand-500" : ""
                    }`}
                  ></i>
                </div>
              </div>
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-200/80 dark:bg-slate-800/80 shrink-0"></div>

            {/* Integrated Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-7 h-7 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-300 transition shrink-0"
              title="Toggle Light/Dark Theme"
            >
              <i
                className={`fa-solid text-xs ${
                  isDarkMode ? "fa-sun text-amber-400" : "fa-moon text-slate-600"
                }`}
              ></i>
            </button>
          </div>

          {/* Website Dropdown Menu Popover */}
          {projectDropdownOpen && (
            <div className="absolute top-full right-0 w-64 mt-2 glass-panel rounded-xl shadow-2xl p-1.5 z-50 border border-slate-200/60 dark:border-slate-800/60 flex flex-col">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                Active Websites ({projectState.projects.length})
              </div>

              {/* List websites (Max 5 visible height ~210px) */}
              {projectState.projects.length > 0 ? (
                <div className="space-y-1 max-h-[210px] overflow-y-auto pr-0.5">
                  {projectState.projects.map((proj) => {
                    const isSelected = proj.id === selectedProject?.id;
                    const displayDomain = proj.defaultDomain || proj.domain;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          projectState.selectProject(proj);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                          isSelected
                            ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="truncate min-w-0 pr-2">
                          <p className="text-xs font-semibold truncate leading-tight">{proj.name}</p>
                          {displayDomain && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                              {displayDomain}
                            </p>
                          )}
                        </div>
                        {isSelected && <i className="fa-solid fa-check text-xs text-brand-500 shrink-0"></i>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-2 py-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">No websites found</p>
                </div>
              )}

              {/* Actions Section */}
              <div className="pt-1 mt-1 border-t border-slate-200/40 dark:border-slate-800/40 shrink-0 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    setModalStep(1);
                    setShowNewProjectModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition text-left"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>Create New Website</span>
                </button>

                <Link
                  href="/websites"
                  onClick={() => setProjectDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <i className="fa-solid fa-sliders text-xs text-slate-400"></i>
                  <span>Manage Websites</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Website Multi-step Popup Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-globe text-brand-500 text-lg"></i>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {modalStep === 1 ? "Create New Website" : "Domain Configuration"}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Step {modalStep} of 2
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && resetModalState()}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* STEP 1: Enter Website Name */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Enter the display name for your new website.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetModalState}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjName.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Editable Subdomain + Fixed Host Suffix */}
            {modalStep === 2 && (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Default Domain
                    </label>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                      Editable Subdomain
                    </span>
                  </div>

                  {/* Split Input: Editable Subdomain + Uneditable Suffix */}
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

                  {/* Real-time error or helper text */}
                  {defaultDomainError ? (
                    <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                      <span>{defaultDomainError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Change your subdomain prefix above. The domain suffix (<span className="font-mono text-slate-600 dark:text-slate-300">.{currentHost}</span>) is fixed.
                    </p>
                  )}
                </div>

                {/* Custom Domain Option */}
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

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setModalStep(1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-arrow-left text-[10px]"></i>
                    <span>Back</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={resetModalState}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreateDisabled}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i>
                          <span>Creating...</span>
                        </>
                      ) : isCheckingDomain ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i>
                          <span>Checking...</span>
                        </>
                      ) : (
                        <span>Create Website</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
