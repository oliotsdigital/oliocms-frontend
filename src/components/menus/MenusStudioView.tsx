"use client";

import React, { useState, useMemo } from "react";
import { useMenuState } from "@/state/useMenuState";
import { useOlio } from "@/state/OlioProvider";
import { MenuItem, MenuItemType, CreateMenuItemPayload } from "@/models/menu.model";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import { fetchCollectionRecordsApi } from "@/api/collection.api";

function getRecordTitle(record: CollectionRecord, col?: CollectionSchema): string {
  if (!record || !record.data) return record?.id ? `Record #${record.id.slice(0, 8)}` : "Untitled";
  const d = record.data;

  if (typeof d.title === "string" && d.title.trim()) return d.title.trim();
  if (typeof d.name === "string" && d.name.trim()) return d.name.trim();
  if (typeof d.heading === "string" && d.heading.trim()) return d.heading.trim();
  if (typeof d.label === "string" && d.label.trim()) return d.label.trim();

  if (col?.schema_definition && Array.isArray(col.schema_definition)) {
    for (const field of col.schema_definition) {
      if (
        (field.type === "string" || field.type === "uid") &&
        typeof d[field.name] === "string" &&
        d[field.name].trim()
      ) {
        return d[field.name].trim();
      }
    }
  }

  for (const [key, val] of Object.entries(d)) {
    if (
      typeof val === "string" &&
      val.trim() &&
      !key.startsWith("_") &&
      key !== "id" &&
      val.length < 100
    ) {
      return val.trim();
    }
  }

  return d.slug ? String(d.slug) : `Record #${record.id.slice(0, 8)}`;
}


export const MenusStudioView: React.FC = () => {
  const { projectState, collectionsState, toast } = useOlio();
  const selectedProjectId = projectState.selectedProject?.id;

  const {
    menus,
    activeMenu,
    activeMenuId,
    isDirty,
    isLoaded,
    selectMenu,
    updateActiveMenuName,
    updateActiveMenuLocations,
    updateActiveMenuAutoAddPages,
    addItemsToActiveMenu,
    updateMenuItem,
    removeMenuItem,
    moveMenuItem,
    indentMenuItem,
    outdentMenuItem,
    saveMenu,
    createMenu,
    deleteMenu,
  } = useMenuState(selectedProjectId);

  // Left Accordion open state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    collections: false,
    custom: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Per-collection records state
  const [collectionRecordsMap, setCollectionRecordsMap] = useState<Record<string, CollectionRecord[]>>({});
  const [loadingCollectionIds, setLoadingCollectionIds] = useState<Record<string, boolean>>({});
  const [selectedRecordsMap, setSelectedRecordsMap] = useState<Record<string, string[]>>({});
  const [collectionSearchMap, setCollectionSearchMap] = useState<Record<string, string>>({});

  const loadCollectionRecords = async (colId: string, force = false) => {
    if (!force && collectionRecordsMap[colId]) return;
    setLoadingCollectionIds((prev) => ({ ...prev, [colId]: true }));
    try {
      const res = await fetchCollectionRecordsApi(colId, { limit: "100" });
      setCollectionRecordsMap((prev) => ({ ...prev, [colId]: res.data || [] }));
    } catch (err) {
      console.error(`Failed to load records for collection ${colId}`, err);
    } finally {
      setLoadingCollectionIds((prev) => ({ ...prev, [colId]: false }));
    }
  };

  const toggleCollectionAccordion = (colId: string) => {
    const key = `col_records_${colId}`;
    const nextState = !openAccordions[key];
    setOpenAccordions((prev) => ({ ...prev, [key]: nextState }));
    if (nextState) {
      loadCollectionRecords(colId);
    }
  };

  const handleAddCollectionRecords = (col: CollectionSchema) => {
    const selectedIds = selectedRecordsMap[col.id] || [];
    if (selectedIds.length === 0) return;

    const records = collectionRecordsMap[col.id] || [];
    const itemsToAdd: CreateMenuItemPayload[] = selectedIds
      .map((id) => records.find((r) => r.id === id))
      .filter((r): r is CollectionRecord => !!r)
      .map((r) => {
        const title = getRecordTitle(r, col);
        const colSlug = col.slug || col.name.toLowerCase().trim().replace(/\s+/g, "-");
        const recSlug = r.data?.slug ? String(r.data.slug).trim() : r.id;
        return {
          label: title,
          url: `/${colSlug}/${recSlug}`,
          type: "collection",
          originalTitle: title,
          icon: col.icon || "fa-file-lines",
        };
      });

    addItemsToActiveMenu(itemsToAdd);
    setSelectedRecordsMap((prev) => ({ ...prev, [col.id]: [] }));
    toast.showToast(`Added ${itemsToAdd.length} record(s) from "${col.name}" to menu`, "success");
  };

  // Collections Section State
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // Custom Links Section State
  const [customLinkUrl, setCustomLinkUrl] = useState("https://");
  const [customLinkText, setCustomLinkText] = useState("");

  // Right Side: Expanded items for settings
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle adding checked collections
  const handleAddCollections = () => {
    if (selectedCollections.length === 0) return;
    const itemsToAdd: CreateMenuItemPayload[] = selectedCollections
      .map((id) => collectionsState.collections.find((c) => c.id === id))
      .filter((c): c is typeof collectionsState.collections[0] => !!c)
      .map((c) => ({
        label: c.name,
        url: `/collections/${c.slug || c.id}`,
        type: "collection",
        originalTitle: c.name,
        icon: c.icon,
      }));

    addItemsToActiveMenu(itemsToAdd);
    setSelectedCollections([]);
    toast.showToast(`Added ${itemsToAdd.length} collection(s) to menu`, "success");
  };

  // Handle adding custom link
  const handleAddCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLinkText.trim() || !customLinkUrl.trim()) {
      toast.showToast("Please enter both URL and Link Text", "error");
      return;
    }

    addItemsToActiveMenu([
      {
        label: customLinkText.trim(),
        url: customLinkUrl.trim(),
        type: "custom",
      },
    ]);

    setCustomLinkText("");
    setCustomLinkUrl("https://");
    toast.showToast("Custom link added to menu", "success");
  };

  // Toggle item expansion
  const toggleItemExpanded = (id: string) => {
    setExpandedItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save handler with UI feedback
  const handleSaveMenu = async () => {
    if (!activeMenu) return;
    if (!activeMenu.name.trim()) {
      toast.showToast("Please provide a name for this menu", "error");
      return;
    }

    setIsSaving(true);
    try {
      const ok = await saveMenu();
      if (ok) {
        toast.showToast(`Menu "${activeMenu.name}" saved successfully!`, "success");
      } else {
        toast.showToast("Failed to save menu", "error");
      }
    } catch (e: any) {
      toast.showToast(e?.message || "Failed to save menu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Build tree for JSON preview
  const menuTreeJson = useMemo(() => {
    if (!activeMenu) return null;

    // Convert flat level items into hierarchical tree
    interface TreeItem extends MenuItem {
      children?: TreeItem[];
    }

    const tree: TreeItem[] = [];
    const stack: { item: TreeItem; level: number }[] = [];

    activeMenu.items.forEach((it) => {
      const node: TreeItem = { ...it, children: [] };
      while (stack.length > 0 && stack[stack.length - 1].level >= it.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(node);
      } else {
        const parent = stack[stack.length - 1].item;
        parent.children = parent.children || [];
        parent.children.push(node);
      }
      stack.push({ item: node, level: it.level });
    });

    return {
      id: activeMenu.id,
      name: activeMenu.name,
      slug: activeMenu.slug,
      locations: activeMenu.locations,
      autoAddPages: activeMenu.autoAddPages,
      updatedAt: activeMenu.updatedAt,
      items: tree,
    };
  }, [activeMenu]);

  if (!isLoaded) {
    return (
      <div className="h-96 rounded-2xl glass-panel animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-brand-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Controls: Menu Selection Bar */}
      <div className="glass-panel p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Select a menu to edit:
          </label>
          <select
            value={activeMenuId}
            onChange={(e) => selectMenu(e.target.value)}
            disabled={menus.length === 0}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-w-[200px]"
          >
            {menus.length === 0 ? (
              <option value="">No menus created</option>
            ) : (
              menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.locations.primary ? "(Demo Menu)" : ""}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={() => {
              setNewMenuName("");
              setIsCreateModalOpen(true);
            }}
            className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-4 ml-1 transition"
          >
            or create a new menu
          </button>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {projectState.selectedProject && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <i className="fa-solid fa-globe text-brand-500"></i>
              <span>{projectState.selectedProject.name}</span>
            </span>
          )}

          {activeMenu && (
            <button
              type="button"
              onClick={() => setIsJsonModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition"
              title="Preview Headless JSON output"
            >
              <i className="fa-solid fa-code text-brand-500"></i>
              <span>View JSON / API</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      {activeMenu ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Add Menu Items Accordions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-brand-500"></i>
                Add menu items
              </h3>
            </div>

            {/* Accordion 1: Dynamic CMS Collections */}
            <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleAccordion("collections")}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <i className="fa-solid fa-database text-brand-500"></i>
                  CMS Collections
                  {collectionsState.collections.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-brand-500/15 text-brand-500 text-[10px] font-semibold">
                      {collectionsState.collections.length}
                    </span>
                  )}
                </span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                    openAccordions.collections ? "rotate-180 text-brand-500" : ""
                  }`}
                ></i>
              </button>

              {openAccordions.collections && (
                <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add dynamic content schemas from your OlioCMS database directly into the navigation:
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {collectionsState.collections.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        <p>No collections found in this project.</p>
                      </div>
                    ) : (
                      collectionsState.collections.map((col) => {
                        const isChecked = selectedCollections.includes(col.id);
                        return (
                          <label
                            key={col.id}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCollections((prev) => [...prev, col.id]);
                                } else {
                                  setSelectedCollections((prev) =>
                                    prev.filter((id) => id !== col.id)
                                  );
                                }
                              }}
                              className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                            />
                            <i
                              className={`fa-solid ${
                                col.icon || "fa-cube"
                              } text-brand-500 text-xs w-4 text-center`}
                            ></i>
                            <span className="text-slate-700 dark:text-slate-200 font-medium truncate flex-1">
                              {col.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              /{col.slug || col.id}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {collectionsState.collections.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            selectedCollections.length === collectionsState.collections.length
                          ) {
                            setSelectedCollections([]);
                          } else {
                            setSelectedCollections(collectionsState.collections.map((c) => c.id));
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                      >
                        {selectedCollections.length === collectionsState.collections.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCollections}
                        disabled={selectedCollections.length === 0}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-600 dark:hover:bg-brand-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition shadow-sm"
                      >
                        Add to Menu
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 3: Custom Links */}
            <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleAccordion("custom")}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <i className="fa-solid fa-link text-brand-500"></i>
                  Custom Links
                </span>
                <i
                  className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                    openAccordions.custom ? "rotate-180 text-brand-500" : ""
                  }`}
                ></i>
              </button>

              {openAccordions.custom && (
                <form
                  onSubmit={handleAddCustomLink}
                  className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      value={customLinkUrl}
                      onChange={(e) => setCustomLinkUrl(e.target.value)}
                      placeholder="https://example.com or /custom"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Link Text
                    </label>
                    <input
                      type="text"
                      value={customLinkText}
                      onChange={(e) => setCustomLinkText(e.target.value)}
                      placeholder="Menu item label"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-600 dark:hover:bg-brand-400 dark:hover:text-white text-xs font-bold transition shadow-sm"
                    >
                      Add to Menu
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Per-Collection Records Expanders */}
            {collectionsState.collections.length > 0 && (
              <div className="pt-2">
                <div className="px-1 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Collection Items
                  </span>
                </div>
                <div className="space-y-3">
                  {collectionsState.collections.map((col) => {
                    const key = `col_records_${col.id}`;
                    const isOpen = !!openAccordions[key];
                    const isLoading = !!loadingCollectionIds[col.id];
                    const records = collectionRecordsMap[col.id] || [];
                    const hasLoaded = collectionRecordsMap[col.id] !== undefined;
                    const searchQuery = (collectionSearchMap[col.id] || "").toLowerCase().trim();
                    const filteredRecords = searchQuery
                      ? records.filter((rec) => {
                          const title = getRecordTitle(rec, col).toLowerCase();
                          const slug = (rec.data?.slug ? String(rec.data.slug) : "").toLowerCase();
                          return title.includes(searchQuery) || slug.includes(searchQuery);
                        })
                      : records;
                    const selectedForThisCol = selectedRecordsMap[col.id] || [];
                    const isAllSelected =
                      filteredRecords.length > 0 &&
                      filteredRecords.every((r) => selectedForThisCol.includes(r.id));

                    return (
                      <div
                        key={col.id}
                        className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCollectionAccordion(col.id)}
                          className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition"
                        >
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate pr-2">
                            <i
                              className={`fa-solid ${
                                col.icon || "fa-file-lines"
                              } text-brand-500 text-xs w-4 text-center shrink-0`}
                            ></i>
                            <span className="truncate">{col.name}</span>
                            {hasLoaded && (
                              <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                {records.length}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isLoading && (
                              <i className="fa-solid fa-circle-notch fa-spin text-xs text-brand-500 mr-1"></i>
                            )}
                            <i
                              className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                                isOpen ? "rotate-180 text-brand-500" : ""
                              }`}
                            ></i>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                            {isLoading ? (
                              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <i className="fa-solid fa-circle-notch fa-spin text-brand-500"></i>
                                <span>Loading {col.name} records...</span>
                              </div>
                            ) : records.length === 0 ? (
                              <div className="text-center py-5 text-xs text-slate-400 space-y-1">
                                <i className="fa-regular fa-folder-open block text-base text-slate-300 dark:text-slate-600"></i>
                                <p>No records found in this collection.</p>
                                <button
                                  type="button"
                                  onClick={() => loadCollectionRecords(col.id, true)}
                                  className="text-[10px] text-brand-500 hover:underline"
                                >
                                  Refresh
                                </button>
                              </div>
                            ) : (
                              <>
                                {records.length > 5 && (
                                  <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
                                    <input
                                      type="text"
                                      value={collectionSearchMap[col.id] || ""}
                                      onChange={(e) =>
                                        setCollectionSearchMap((prev) => ({
                                          ...prev,
                                          [col.id]: e.target.value,
                                        }))
                                      }
                                      placeholder={`Search ${col.name}...`}
                                      className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    />
                                  </div>
                                )}

                                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                                  {filteredRecords.length === 0 ? (
                                    <div className="text-center py-3 text-xs text-slate-400">
                                      No matches found.
                                    </div>
                                  ) : (
                                    filteredRecords.map((record) => {
                                      const title = getRecordTitle(record, col);
                                      const isChecked = selectedForThisCol.includes(record.id);
                                      const slug = record.data?.slug ? String(record.data.slug) : null;

                                      return (
                                        <label
                                          key={record.id}
                                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer text-xs transition"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedRecordsMap((prev) => ({
                                                  ...prev,
                                                  [col.id]: [...(prev[col.id] || []), record.id],
                                                }));
                                              } else {
                                                setSelectedRecordsMap((prev) => ({
                                                  ...prev,
                                                  [col.id]: (prev[col.id] || []).filter(
                                                    (id) => id !== record.id
                                                  ),
                                                }));
                                              }
                                            }}
                                            className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                                          />
                                          <span
                                            className="text-slate-700 dark:text-slate-200 font-medium truncate flex-1"
                                            title={title}
                                          >
                                            {title}
                                          </span>
                                          {slug && (
                                            <span
                                              className="text-[10px] text-slate-400 font-mono truncate max-w-[90px]"
                                              title={`/${col.slug || col.id}/${slug}`}
                                            >
                                              /{slug}
                                            </span>
                                          )}
                                        </label>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isAllSelected) {
                                        const filteredIds = new Set(filteredRecords.map((r) => r.id));
                                        setSelectedRecordsMap((prev) => ({
                                          ...prev,
                                          [col.id]: (prev[col.id] || []).filter((id) => !filteredIds.has(id)),
                                        }));
                                      } else {
                                        const set = new Set([
                                          ...(selectedRecordsMap[col.id] || []),
                                          ...filteredRecords.map((r) => r.id),
                                        ]);
                                        setSelectedRecordsMap((prev) => ({
                                          ...prev,
                                          [col.id]: Array.from(set),
                                        }));
                                      }
                                    }}
                                    disabled={filteredRecords.length === 0}
                                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 transition"
                                  >
                                    {isAllSelected ? "Deselect All" : "Select All"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddCollectionRecords(col)}
                                    disabled={selectedForThisCol.length === 0}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-600 dark:hover:bg-brand-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition shadow-sm"
                                  >
                                    Add to Menu{selectedForThisCol.length > 0 ? ` (${selectedForThisCol.length})` : ""}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Menu Structure & Settings (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
              {/* Top Bar of Menu Structure */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3 flex-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Menu Name
                  </label>
                  <input
                    type="text"
                    value={activeMenu.name}
                    onChange={(e) => updateActiveMenuName(e.target.value)}
                    placeholder="e.g. Main Navigation"
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 max-w-sm w-full shadow-inner"
                  />
                  {isDirty && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Unsaved changes
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveMenu}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Save Menu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions Prompt */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Menu Structure
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Drag or use the controls to position items in your desired order. Click the arrow
                  on the right to reveal item settings. Indent items to create sub-menus (drop-down
                  navigation).
                </p>
              </div>

              {/* Hierarchical Menu Items List */}
              <div className="space-y-2.5 min-h-[140px]">
                {activeMenu.items.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-lg">
                      <i className="fa-solid fa-bars-staggered"></i>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      This menu is currently empty
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Choose items from the column on the left (CMS Collections, Custom Links, or specific collection items) and click &ldquo;Add to Menu&rdquo;.
                    </p>
                  </div>
                ) : (
                  activeMenu.items.map((item, index) => {
                    const isExpanded = !!expandedItemIds[item.id];
                    const isSubItem = item.level === 1;
                    const isSubSubItem = item.level === 2;
                    const isFirst = index === 0;
                    const isLast = index === activeMenu.items.length - 1;
                    const prevItem = index > 0 ? activeMenu.items[index - 1] : null;
                    const canIndent = prevItem ? item.level < Math.min(2, prevItem.level + 1) : false;
                    const canOutdent = item.level > 0;

                    // Compute badge style by type
                    const typeBadge = {
                      page: { label: "Page", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                      collection: { label: "Collection", bg: "bg-brand-500/10 text-brand-600 dark:text-brand-400" },
                      custom: { label: "Custom Link", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                      category: { label: "Category", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                    }[item.type] || { label: "Item", bg: "bg-slate-500/10 text-slate-600" };

                    return (
                      <div
                        key={item.id}
                        className={`transition-all duration-200 relative ${
                          isSubSubItem
                            ? "ml-8 sm:ml-16"
                            : isSubItem
                            ? "ml-4 sm:ml-8"
                            : "ml-0"
                        }`}
                      >
                        {/* Visual bracket/guide for sub-items */}
                        {(isSubItem || isSubSubItem) && (
                          <div className="absolute -left-4 sm:-left-6 top-4 w-3 sm:w-4 h-5 border-l-2 border-b-2 border-brand-500/40 rounded-bl-md pointer-events-none"></div>
                        )}

                        <div className="rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/90 shadow-sm overflow-hidden hover:border-brand-500/40 transition">
                          {/* Item Header Row */}
                          <div
                            onClick={() => toggleItemExpanded(item.id)}
                            className="px-3.5 py-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-700/50 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <i
                                className="fa-solid fa-grip-vertical text-slate-300 dark:text-slate-600 cursor-grab text-xs shrink-0"
                                title="Drag item"
                              ></i>

                              {item.icon && (
                                <i
                                  className={`fa-solid ${item.icon} text-brand-500 text-xs shrink-0`}
                                ></i>
                              )}

                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.label}
                              </span>

                              {/* WordPress style sub item badge */}
                              {isSubItem && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                  sub item
                                </span>
                              )}
                              {isSubSubItem && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                  sub-sub item
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${typeBadge.bg}`}
                              >
                                {typeBadge.label}
                              </span>

                              <i
                                className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                                  isExpanded ? "rotate-180 text-brand-500" : ""
                                }`}
                              ></i>
                            </div>
                          </div>

                          {/* Expanded Settings Drawer */}
                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/95 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Navigation Label
                                  </label>
                                  <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) =>
                                      updateMenuItem(item.id, { label: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    URL / Target Link
                                  </label>
                                  <input
                                    type="text"
                                    value={item.url}
                                    onChange={(e) =>
                                      updateMenuItem(item.id, { url: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Title Attribute (Tooltip)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.titleAttr || ""}
                                    onChange={(e) =>
                                      updateMenuItem(item.id, { titleAttr: e.target.value })
                                    }
                                    placeholder="Optional hover tooltip"
                                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    CSS Classes (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.classes || ""}
                                    onChange={(e) =>
                                      updateMenuItem(item.id, { classes: e.target.value })
                                    }
                                    placeholder="e.g. highlight-btn external-link"
                                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                                  />
                                </div>
                              </div>

                              {/* Checkbox: Open link in a new tab */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="checkbox"
                                  id={`target-blank-${item.id}`}
                                  checked={!!item.targetBlank}
                                  onChange={(e) =>
                                    updateMenuItem(item.id, { targetBlank: e.target.checked })
                                  }
                                  className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                                />
                                <label
                                  htmlFor={`target-blank-${item.id}`}
                                  className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer"
                                >
                                  Open link in a new tab (<code>target=&quot;_blank&quot;</code>)
                                </label>
                              </div>

                              {/* Hierarchy Controls & Actions */}
                              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] text-slate-400 font-semibold mr-1">
                                    Position:
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isFirst}
                                    onClick={() => moveMenuItem(item.id, "up")}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-[11px]"
                                    title="Move item up"
                                  >
                                    <i className="fa-solid fa-arrow-up"></i>
                                    <span>Up</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isLast}
                                    onClick={() => moveMenuItem(item.id, "down")}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-[11px]"
                                    title="Move item down"
                                  >
                                    <i className="fa-solid fa-arrow-down"></i>
                                    <span>Down</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canIndent}
                                    onClick={() => indentMenuItem(item.id)}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-[11px]"
                                    title="Indent as sub-item of previous item"
                                  >
                                    <i className="fa-solid fa-indent"></i>
                                    <span>Make sub-item</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canOutdent}
                                    onClick={() => outdentMenuItem(item.id)}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-[11px]"
                                    title="Outdent to parent level"
                                  >
                                    <i className="fa-solid fa-outdent"></i>
                                    <span>Outdent</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-3">
                                  {item.originalTitle && (
                                    <span className="text-[11px] text-slate-400 italic">
                                      Original: {item.originalTitle}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeMenuItem(item.id)}
                                    className="text-rose-500 hover:text-rose-600 font-semibold underline underline-offset-2 transition"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleItemExpanded(item.id)}
                                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Menu Settings Section (WordPress Style) */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Menu Settings
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-3 font-semibold text-slate-700 dark:text-slate-300">
                    Auto add pages
                  </div>
                  <div className="md:col-span-9 space-y-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeMenu.autoAddPages}
                        onChange={(e) => updateActiveMenuAutoAddPages(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Automatically add new top-level pages to this menu
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs pt-2">
                  <div className="md:col-span-3 font-semibold text-slate-700 dark:text-slate-300">
                    Display location
                  </div>
                  <div className="md:col-span-9 space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeMenu.locations.primary}
                        onChange={(e) =>
                          updateActiveMenuLocations({ primary: e.target.checked })
                        }
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        Primary Navigation
                      </span>
                      <span className="text-slate-400 text-[11px]">(Main website header)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeMenu.locations.footer}
                        onChange={(e) =>
                          updateActiveMenuLocations({ footer: e.target.checked })
                        }
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        Footer Menu
                      </span>
                      <span className="text-slate-400 text-[11px]">(Bottom website footer links)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeMenu.locations.mobile}
                        onChange={(e) =>
                          updateActiveMenuLocations({ mobile: e.target.checked })
                        }
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        Mobile Navigation
                      </span>
                      <span className="text-slate-400 text-[11px]">(Drawer menu for small devices)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeMenu.locations.topbar}
                        onChange={(e) =>
                          updateActiveMenuLocations({ topbar: e.target.checked })
                        }
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        Top Bar / Announcement Bar
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Delete Menu</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveMenu}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>Save Menu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State when no menu is selected or existing */
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-bars"></i>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Menus Created Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create your first navigation menu to structure your website header, footer, and mobile
            menus with pages, dynamic CMS collections, and custom URLs.
          </p>
          <button
            type="button"
            onClick={() => {
              setNewMenuName("Primary Navigation");
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-lg shadow-brand-500/25"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Create New Menu</span>
          </button>
        </div>
      )}

      {/* Modal: Create New Menu */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-brand-500"></i>
                Create New Menu
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newMenuName.trim()) return;
                try {
                  const created = await createMenu(newMenuName.trim());
                  setIsCreateModalOpen(false);
                  if (created) {
                    toast.showToast(`Menu "${created.name}" created!`, "success");
                  }
                } catch (err: any) {
                  toast.showToast(err?.message || "Failed to create menu", "error");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Menu Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Header Main Menu, Footer Links"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newMenuName.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Create Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Menu Confirmation */}
      {isDeleteConfirmOpen && activeMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-rose-500/20">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-lg">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Delete &ldquo;{activeMenu.name}&rdquo;?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this menu? This will remove all items and location
              assignments. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const name = activeMenu.name;
                  setIsDeleteConfirmOpen(false);
                  try {
                    await deleteMenu(activeMenu.id);
                    toast.showToast(`Deleted menu "${name}"`, "info");
                  } catch (err: any) {
                    toast.showToast(err?.message || "Failed to delete menu", "error");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-md shadow-rose-500/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Headless JSON / API Output */}
      {isJsonModalOpen && menuTreeJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-sm">
                  <i className="fa-solid fa-code"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Headless Navigation Tree JSON
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ready to consume in your Next.js, Astro, or Nuxt frontend app
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="flex-1 overflow-hidden rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto border border-slate-800 select-all">
              <pre>{JSON.stringify(menuTreeJson, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between shrink-0 pt-2 text-xs">
              <span className="text-[11px] text-slate-400">
                Slug: <code>{menuTreeJson.slug}</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(menuTreeJson, null, 2));
                  toast.showToast("JSON copied to clipboard!", "success");
                }}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition flex items-center gap-2"
              >
                <i className="fa-regular fa-copy"></i>
                <span>Copy JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
