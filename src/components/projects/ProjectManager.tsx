"use client";

import React, { useState, useEffect } from "react";
import { useOlio } from "@/state/OlioProvider";
import { Project } from "@/models/project.model";
import { checkDomainAvailabilityApi } from "@/api/project.api";

export const ProjectManager: React.FC = () => {
  const { projectState } = useOlio();
  const { projects, selectedProject, selectProject, addProject, updateProject, deleteProject } = projectState;

  const [search, setSearch] = useState<string>("");

  // Add Website Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [addName, setAddName] = useState<string>("");
  const [addSubdomain, setAddSubdomain] = useState<string>("");
  const [showAddCustomDomain, setShowAddCustomDomain] = useState<boolean>(false);
  const [addCustomDomain, setAddCustomDomain] = useState<string>("");
  const [isAddSubmitting, setIsAddSubmitting] = useState<boolean>(false);
  const [addDefaultDomainError, setAddDefaultDomainError] = useState<string | null>(null);
  const [addCustomDomainError, setAddCustomDomainError] = useState<string | null>(null);
  const [isCheckingAddDomain, setIsCheckingAddDomain] = useState<boolean>(false);

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editSubdomain, setEditSubdomain] = useState<string>("");
  const [editCustomDomain, setEditCustomDomain] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editDefaultDomainError, setEditDefaultDomainError] = useState<string | null>(null);
  const [editCustomDomainError, setEditCustomDomainError] = useState<string | null>(null);
  const [isCheckingEditDomain, setIsCheckingEditDomain] = useState<boolean>(false);

  // Delete Modal State
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const currentHost = typeof window !== "undefined" ? window.location.host : "localhost:3000";

  // Filter projects by search string
  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.defaultDomain && p.defaultDomain.toLowerCase().includes(q)) ||
      (p.domain && p.domain.toLowerCase().includes(q))
    );
  });

  const resetAddModal = () => {
    setAddStep(1);
    setAddName("");
    setAddSubdomain("");
    setShowAddCustomDomain(false);
    setAddCustomDomain("");
    setAddDefaultDomainError(null);
    setAddCustomDomainError(null);
    setShowAddModal(false);
  };

  const handleAddNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (addName.trim()) {
      const defaultSlug = addName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
      setAddSubdomain(defaultSlug);
      setAddStep(2);
    }
  };

  // Real-time domain uniqueness validation for Add Form
  useEffect(() => {
    if (!showAddModal || addStep !== 2) return;

    const sub = addSubdomain.trim() || addName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    const currentDefaultDomain = `${sub}.${currentHost}`;
    const currentCustomDomain = showAddCustomDomain && addCustomDomain.trim() ? addCustomDomain.trim() : undefined;

    let isMounted = true;
    setIsCheckingAddDomain(true);

    const timer = setTimeout(async () => {
      const res = await checkDomainAvailabilityApi(currentDefaultDomain, currentCustomDomain);
      if (!isMounted) return;

      if (!res.defaultDomainAvailable) {
        setAddDefaultDomainError("This subdomain already exists. Please use another subdomain.");
      } else {
        setAddDefaultDomainError(null);
      }

      if (showAddCustomDomain && currentCustomDomain && !res.domainAvailable) {
        setAddCustomDomainError("This custom domain already exists. Please use another custom domain.");
      } else {
        setAddCustomDomainError(null);
      }

      setIsCheckingAddDomain(false);
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [addSubdomain, addCustomDomain, showAddCustomDomain, addStep, addName, showAddModal, currentHost]);

  const handleCreateWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !addName.trim() ||
      isAddSubmitting ||
      isCheckingAddDomain ||
      addDefaultDomainError ||
      (showAddCustomDomain && addCustomDomainError)
    ) {
      return;
    }
    setIsAddSubmitting(true);

    const sub = addSubdomain.trim() || addName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    const computedDefaultDomain = `${sub}.${currentHost}`;

    try {
      await addProject({
        name: addName.trim(),
        defaultDomain: computedDefaultDomain,
        domain: showAddCustomDomain && addCustomDomain.trim() ? addCustomDomain.trim() : undefined,
      });
      resetAddModal();
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);

    let initialSub = proj.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    if (proj.defaultDomain && proj.defaultDomain.includes(".")) {
      initialSub = proj.defaultDomain.split(".")[0];
    }
    setEditSubdomain(initialSub);
    setEditCustomDomain(proj.domain || "");
    setEditDefaultDomainError(null);
    setEditCustomDomainError(null);
  };

  // Real-time domain uniqueness validation for Edit Form
  useEffect(() => {
    if (!editingProject) return;

    const sub = editSubdomain.trim() || editName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    const currentDefaultDomain = `${sub}.${currentHost}`;
    const currentCustomDomain = editCustomDomain.trim() ? editCustomDomain.trim() : undefined;

    const defaultChanged = currentDefaultDomain !== editingProject.defaultDomain;
    const customChanged = currentCustomDomain !== (editingProject.domain || undefined);

    if (!defaultChanged && !customChanged) {
      setEditDefaultDomainError(null);
      setEditCustomDomainError(null);
      setIsCheckingEditDomain(false);
      return;
    }

    let isMounted = true;
    setIsCheckingEditDomain(true);

    const timer = setTimeout(async () => {
      const res = await checkDomainAvailabilityApi(
        defaultChanged ? currentDefaultDomain : undefined,
        customChanged ? currentCustomDomain : undefined
      );
      if (!isMounted) return;

      if (defaultChanged && !res.defaultDomainAvailable) {
        setEditDefaultDomainError("This subdomain already exists. Please use another subdomain.");
      } else {
        setEditDefaultDomainError(null);
      }

      if (customChanged && currentCustomDomain && !res.domainAvailable) {
        setEditCustomDomainError("This custom domain already exists. Please use another custom domain.");
      } else {
        setEditCustomDomainError(null);
      }

      setIsCheckingEditDomain(false);
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [editSubdomain, editCustomDomain, editName, editingProject, currentHost]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || isUpdating || isCheckingEditDomain || editDefaultDomainError || editCustomDomainError) {
      return;
    }
    setIsUpdating(true);

    const sub = editSubdomain.trim() || editName.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "website";
    const computedDefaultDomain = `${sub}.${currentHost}`;

    try {
      await updateProject(editingProject.id, {
        name: editName.trim(),
        defaultDomain: computedDefaultDomain,
        domain: editCustomDomain.trim() || undefined,
      });
      setEditingProject(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAddDisabled =
    isAddSubmitting ||
    isCheckingAddDomain ||
    !addSubdomain.trim() ||
    Boolean(addDefaultDomainError) ||
    (showAddCustomDomain && Boolean(addCustomDomainError));

  const isSaveEditDisabled =
    isUpdating ||
    isCheckingEditDomain ||
    !editName.trim() ||
    !editSubdomain.trim() ||
    Boolean(editDefaultDomainError) ||
    Boolean(editCustomDomainError);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Websites</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {projects.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your website ecosystem, update domain settings, or remove inactive websites.
          </p>
        </div>

        {/* Right side controls: Add Website Button + Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Add Website Button on the left side of the search bar */}
          <button
            type="button"
            onClick={() => {
              setAddStep(1);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 shrink-0"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add Website</span>
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search websites or domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Website Name</th>
                <th className="py-3.5 px-4">Default Domain</th>
                <th className="py-3.5 px-4">Custom Domain</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-xs">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((proj) => {
                  const isActive = selectedProject?.id === proj.id;
                  return (
                    <tr
                      key={proj.id}
                      className={`hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition ${
                        isActive ? "bg-brand-500/5" : ""
                      }`}
                    >
                      {/* Project Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs shrink-0 font-bold">
                            <i className="fa-solid fa-globe"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {proj.name}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-brand-500 text-white">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {proj.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Default Domain Column */}
                      <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {proj.defaultDomain ? (
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 text-[11px]">
                            {proj.defaultDomain}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not assigned</span>
                        )}
                      </td>

                      {/* Custom Domain Column */}
                      <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {proj.domain ? (
                          <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                            {proj.domain}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Selected
                          </span>
                        ) : (
                          <button
                            onClick={() => selectProject(proj)}
                            className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                          >
                            Switch to this
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(proj)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-500 hover:text-white transition font-medium text-xs flex items-center gap-1.5"
                          >
                            <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingProject(proj)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition font-medium text-xs flex items-center gap-1.5"
                          >
                            <i className="fa-solid fa-trash-can text-[11px]"></i>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <i className="fa-solid fa-globe text-2xl mb-2 text-slate-300 dark:text-slate-600 block"></i>
                    <p className="font-semibold text-sm">No websites found</p>
                    <p className="text-xs mt-0.5">Try searching with a different term or add a website.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD WEBSITE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-globe text-brand-500 text-lg"></i>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {addStep === 1 ? "Create New Website" : "Domain Configuration"}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Step {addStep} of 2
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isAddSubmitting && resetAddModal()}
                disabled={isAddSubmitting}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* STEP 1 */}
            {addStep === 1 && (
              <form onSubmit={handleAddNextStep} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Website Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. My E-Commerce Store"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Enter the display name for your new website.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetAddModal}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!addName.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {addStep === 2 && (
              <form onSubmit={handleCreateWebsiteSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Default Domain
                    </label>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                      Editable Subdomain
                    </span>
                  </div>

                  <div
                    className={`flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border overflow-hidden shadow-sm transition ${
                      addDefaultDomainError
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-500"
                    }`}
                  >
                    <input
                      type="text"
                      required
                      disabled={isAddSubmitting}
                      value={addSubdomain}
                      onChange={(e) =>
                        setAddSubdomain(
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

                  {addDefaultDomainError ? (
                    <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                      <span>{addDefaultDomainError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Change your subdomain prefix above. The domain suffix (<span className="font-mono text-slate-600 dark:text-slate-300">.{currentHost}</span>) is fixed.
                    </p>
                  )}
                </div>

                {!showAddCustomDomain ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomDomain(true)}
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
                          setShowAddCustomDomain(false);
                          setAddCustomDomain("");
                          setAddCustomDomainError(null);
                        }}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      disabled={isAddSubmitting}
                      placeholder="e.g. www.mystore.com"
                      value={addCustomDomain}
                      onChange={(e) => setAddCustomDomain(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border focus:outline-none transition disabled:opacity-50 ${
                        addCustomDomainError
                          ? "border-rose-500 ring-1 ring-rose-500"
                          : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"
                      }`}
                    />
                    {addCustomDomainError && (
                      <p className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                        <span>{addCustomDomainError}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                  <button
                    type="button"
                    disabled={isAddSubmitting}
                    onClick={() => setAddStep(1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-arrow-left text-[10px]"></i>
                    <span>Back</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isAddSubmitting}
                      onClick={resetAddModal}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddDisabled}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAddSubmitting ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i>
                          <span>Creating...</span>
                        </>
                      ) : isCheckingAddDomain ? (
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

      {/* EDIT WEBSITE MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-brand-500 text-lg"></i>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edit Website Settings
                </h3>
              </div>
              <button
                onClick={() => !isUpdating && setEditingProject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Website Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Default Domain Subdomain */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Default Domain Subdomain
                  </label>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                    Editable Subdomain
                  </span>
                </div>
                <div
                  className={`flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border overflow-hidden shadow-sm transition ${
                    editDefaultDomainError
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : "border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-500"
                  }`}
                >
                  <input
                    type="text"
                    required
                    disabled={isUpdating}
                    value={editSubdomain}
                    onChange={(e) =>
                      setEditSubdomain(
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
                {editDefaultDomainError ? (
                  <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                    <span>{editDefaultDomainError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    The suffix (<span className="font-mono text-slate-600 dark:text-slate-300">.{currentHost}</span>) is fixed.
                  </p>
                )}
              </div>

              {/* Custom Domain */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Domain (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. www.mystore.com"
                  value={editCustomDomain}
                  onChange={(e) => setEditCustomDomain(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border focus:outline-none transition ${
                    editCustomDomainError
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"
                  }`}
                />
                {editCustomDomainError && (
                  <p className="text-xs font-semibold text-rose-500 mt-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
                    <span>{editCustomDomainError}</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaveEditDisabled}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Saving...</span>
                    </>
                  ) : isCheckingEditDomain ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Checking...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-2xl shadow-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl mx-auto">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Website</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete website <span className="font-bold text-slate-800 dark:text-slate-200">"{deletingProject.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Website</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
