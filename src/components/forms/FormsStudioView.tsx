"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useOlio } from "@/state/OlioProvider";
import { useFormState } from "@/state/useFormState";
import { FormField, FormFieldType, FormSchema, FormRecord } from "@/models/form.model";
import {
  fetchFormRecordsApi,
  createFormRecordApi,
  deleteFormRecordApi,
  buildFormSubmissionData,
  FORM_RECORDS_DEFAULT_LIMIT,
  FORM_RECORDS_MAX_LIMIT,
} from "@/api/form.api";
import { APP_CONFIG } from "@/config/app.config";
import { Pagination } from "@/components/collections/Pagination";

const FORM_RECORD_PAGE_SIZES = [25, 50, 100, FORM_RECORDS_MAX_LIMIT];

const AVAILABLE_FIELD_TYPES: {
  type: FormFieldType;
  label: string;
  icon: string;
  defaultPlaceholder: string;
  description: string;
}[] = [
  {
    type: "text",
    label: "Single-line Text",
    icon: "fa-font",
    defaultPlaceholder: "e.g. John Doe",
    description: "Short text for names, titles, or brief input",
  },
  {
    type: "email",
    label: "Email Address",
    icon: "fa-envelope",
    defaultPlaceholder: "user@example.com",
    description: "Standard email address input with validation",
  },
  {
    type: "textarea",
    label: "Multi-line Textarea",
    icon: "fa-paragraph",
    defaultPlaceholder: "Enter your detailed thoughts or message...",
    description: "Long-form text for messages, notes, and inquiries",
  },
  {
    type: "number",
    label: "Number",
    icon: "fa-hashtag",
    defaultPlaceholder: "e.g. 42",
    description: "Numeric quantity or value",
  },
  {
    type: "select",
    label: "Dropdown Select",
    icon: "fa-caret-down",
    defaultPlaceholder: "Select an option",
    description: "Single choice from a predefined dropdown menu",
  },
  {
    type: "radio",
    label: "Radio Choices",
    icon: "fa-circle-dot",
    defaultPlaceholder: "",
    description: "Select one option among multiple displayed choices",
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: "fa-square-check",
    defaultPlaceholder: "",
    description: "Boolean confirmation, agreement, or consent",
  },
  {
    type: "date",
    label: "Date Picker",
    icon: "fa-calendar-days",
    defaultPlaceholder: "",
    description: "Select a date on calendar",
  },
  {
    type: "phone",
    label: "Phone Number",
    icon: "fa-phone",
    defaultPlaceholder: "+1 (555) 000-0000",
    description: "Telephone and mobile number",
  },
  {
    type: "url",
    label: "Website URL",
    icon: "fa-globe",
    defaultPlaceholder: "https://example.com",
    description: "Web address or link",
  },
];

const FIELD_TYPE_BY_TYPE = Object.fromEntries(
  AVAILABLE_FIELD_TYPES.map((meta) => [meta.type, meta])
) as Record<FormFieldType, (typeof AVAILABLE_FIELD_TYPES)[number]>;

const SEARCH_DEBOUNCE_MS = 350;

function renderCellValue(record: FormRecord, field: FormField) {
  const rawVal = record.data?.[field.name] ?? record.data?.[field.id];
  if (rawVal === undefined || rawVal === null || rawVal === "") {
    return <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">—</span>;
  }

  if (typeof rawVal === "boolean") {
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          rawVal
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
        }`}
      >
        {rawVal ? "True" : "False"}
      </span>
    );
  }

  if (field.type === "date") {
    try {
      return new Date(rawVal).toLocaleDateString();
    } catch {
      return String(rawVal);
    }
  }

  if (field.type === "url") {
    return (
      <a
        href={String(rawVal)}
        target="_blank"
        rel="noreferrer"
        className="text-brand-500 hover:underline flex items-center gap-1 truncate max-w-[140px]"
      >
        <span>{String(rawVal)}</span>
        <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
      </a>
    );
  }

  if (field.type === "email") {
    return (
      <a href={`mailto:${rawVal}`} className="text-brand-500 hover:underline truncate max-w-[150px] block">
        {String(rawVal)}
      </a>
    );
  }

  return (
    <span className="truncate max-w-[160px] block text-slate-800 dark:text-slate-200" title={String(rawVal)}>
      {String(rawVal)}
    </span>
  );
}

const FormSidebarItem = React.memo(function FormSidebarItem({
  form,
  isSelected,
  onSelect,
}: {
  form: FormSchema;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(form.id)}
      className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-3 group ${
        isSelected
          ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <i className={`fa-solid fa-rectangle-list text-xs ${isSelected ? "text-white" : "text-brand-500"}`}></i>
          <span className="font-bold text-xs truncate">{form.name}</span>
        </div>
        <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>
          /{form.slug}
        </p>
      </div>
      <span
        className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
          isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
        }`}
      >
        {form.fields.length} {form.fields.length === 1 ? "field" : "fields"}
      </span>
    </button>
  );
});

const FormRecordRow = React.memo(function FormRecordRow({
  record,
  fields,
  onView,
  onDelete,
}: {
  record: FormRecord;
  fields: FormField[];
  onView: (record: FormRecord) => void;
  onDelete: (recordId: string) => void;
}) {
  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
      {fields.map((field) => (
        <td key={field.id} className="py-2.5 px-3 text-xs">
          {renderCellValue(record, field)}
        </td>
      ))}
      <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">
        {new Date(record.created_at).toLocaleString()}
      </td>
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onView(record)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition flex items-center justify-center"
            title="View JSON details"
          >
            <i className="fa-solid fa-code text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition flex items-center justify-center"
            title="Delete Submission"
          >
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  );
});

const FieldEditorCard = React.memo(function FieldEditorCard({
  field,
  index,
  isLast,
  onUpdate,
  onMove,
  onRemove,
}: {
  field: FormField;
  index: number;
  isLast: boolean;
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (fieldId: string) => void;
}) {
  const meta = FIELD_TYPE_BY_TYPE[field.type];

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-3 hover:border-brand-500/40 transition">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-xs shrink-0">
            <i className={`fa-solid ${meta?.icon || "fa-font"}`}></i>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
            #{index + 1}. {field.label}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            {field.type}
          </span>
          {field.required && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
              Required
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 transition flex items-center justify-center"
            title="Move Up"
          >
            <i className="fa-solid fa-arrow-up text-xs"></i>
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(index, index + 1)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 transition flex items-center justify-center"
            title="Move Down"
          >
            <i className="fa-solid fa-arrow-down text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => onRemove(field.id)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition flex items-center justify-center"
            title="Delete Field"
          >
            <i className="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Field Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, { label: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Field Key (Payload ID)
          </label>
          <input
            type="text"
            value={field.name}
            onChange={(e) =>
              onUpdate(field.id, {
                name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              })
            }
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Placeholder Text
          </label>
          <input
            type="text"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
            placeholder="Input placeholder"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="sm:col-span-2 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer py-1.5 select-none">
            <input
              type="checkbox"
              checked={Boolean(field.required)}
              onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Required</span>
          </label>
        </div>
      </div>

      {(field.type === "select" || field.type === "radio") && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Configured Choices:</span>
            <button
              type="button"
              onClick={() => {
                const current = field.options || [];
                onUpdate(field.id, { options: [...current, `Option ${current.length + 1}`] });
              }}
              className="text-[10px] font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              <i className="fa-solid fa-plus text-[9px]"></i>
              <span>Add Choice</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(field.options || []).map((opt, optIndex) => (
              <div
                key={optIndex}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...(field.options || [])];
                    next[optIndex] = e.target.value;
                    onUpdate(field.id, { options: next });
                  }}
                  className="bg-transparent border-none focus:outline-none text-xs text-slate-900 dark:text-white w-24"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (field.options || []).filter((_, i) => i !== optIndex);
                    onUpdate(field.id, { options: next });
                  }}
                  className="text-slate-400 hover:text-rose-500 ml-1"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const FormsStudioView: React.FC = () => {
  const { projectState, toast } = useOlio();
  const selectedProjectId = projectState.selectedProject?.id;

  const {
    forms,
    activeForm,
    activeFormId,
    isDirty,
    isLoading,
    selectForm,
    createForm,
    updateActiveFormMeta,
    addField,
    updateField,
    removeField,
    moveField,
    saveForm,
    deleteForm,
  } = useFormState(selectedProjectId, toast?.showToast);

  const [searchQuery, setSearchQuery] = useState("");
  // By default, show the Forms records tab for the selected form
  const [activeTab, setActiveTab] = useState<"records" | "fields" | "preview" | "api">("records");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Field addition quick drawer / modal state
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);

  // Form records state
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordSearchInput, setRecordSearchInput] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPageSize, setRecordsPageSize] = useState(FORM_RECORDS_DEFAULT_LIMIT);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<FormRecord | null>(null);

  // Live preview test state
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [isSubmittingPreview, setIsSubmittingPreview] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecordSearch(recordSearchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [recordSearchInput]);

  useEffect(() => {
    setRecordsPage(1);
    setRecordSearchInput("");
    setRecordSearch("");
  }, [activeForm?.id]);

  const loadRecords = useCallback(
    async (signal?: AbortSignal) => {
      if (!activeForm?.id) {
        setRecords([]);
        setTotalRecords(0);
        return;
      }
      setIsLoadingRecords(true);
      try {
        const res = await fetchFormRecordsApi(activeForm.id, selectedProjectId, {
          skip: (recordsPage - 1) * recordsPageSize,
          limit: recordsPageSize,
          signal,
        });
        if (signal?.aborted) return;
        setRecords(res.data || []);
        setTotalRecords(res.total || 0);
      } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        setRecords([]);
        setTotalRecords(0);
      } finally {
        if (!signal?.aborted) setIsLoadingRecords(false);
      }
    },
    [activeForm?.id, selectedProjectId, recordsPage, recordsPageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadRecords(controller.signal);
    return () => controller.abort();
  }, [loadRecords]);

  // Filter forms list
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const q = searchQuery.toLowerCase();
    return forms.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [forms, searchQuery]);

  const recordSearchIndex = useMemo(
    () =>
      records.map((r) => ({
        record: r,
        haystack: `${JSON.stringify(r.data || {})} ${new Date(r.created_at).toLocaleString()}`.toLowerCase(),
      })),
    [records]
  );

  const filteredRecords = useMemo(() => {
    if (!recordSearch.trim()) return records;
    const q = recordSearch.toLowerCase();
    return recordSearchIndex.filter((item) => item.haystack.includes(q)).map((item) => item.record);
  }, [records, recordSearch, recordSearchIndex]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName.trim()) return;
    setIsSubmitting(true);
    try {
      await createForm(newFormName.trim(), newFormDesc.trim() || undefined);
      setIsCreateModalOpen(false);
      setNewFormName("");
      setNewFormDesc("");
      setActiveTab("records");
    } catch (_) {
      // toast handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleSelectForm = useCallback(
    (id: string) => {
      selectForm(id);
      setRecordsPage(1);
      setActiveTab("records");
    },
    [selectForm]
  );

  const handleRecordsPageChange = useCallback((page: number) => {
    setRecordsPage(page);
  }, []);

  const handleRecordsPageSizeChange = useCallback((size: number) => {
    setRecordsPageSize(Math.min(FORM_RECORDS_MAX_LIMIT, size));
    setRecordsPage(1);
  }, []);

  const handleViewRecord = useCallback((record: FormRecord) => {
    setSelectedRecordDetail(record);
  }, []);

  const handlePreviewFieldChange = useCallback((name: string, value: any) => {
    setPreviewValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleQuickAddField = (fieldType: FormFieldType) => {
    const meta = AVAILABLE_FIELD_TYPES.find((f) => f.type === fieldType);
    const existingCount = (activeForm?.fields || []).filter((f) => f.type === fieldType).length;
    const suffix = existingCount > 0 ? `_${existingCount + 1}` : "";
    const rawKey = `${fieldType}${suffix}`;

    addField({
      name: rawKey,
      label: `${meta?.label || "Field"}${existingCount > 0 ? ` ${existingCount + 1}` : ""}`,
      type: fieldType,
      placeholder: meta?.defaultPlaceholder || "",
      required: false,
      options: fieldType === "select" || fieldType === "radio" ? ["Option 1", "Option 2", "Option 3"] : [],
    });
    setIsAddFieldOpen(false);
  };

  // Submit live preview form and save real record
  const handlePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm?.id) return;
    const payload = buildFormSubmissionData(activeForm.fields, previewValues);
    setIsSubmittingPreview(true);
    try {
      const newRecord = await createFormRecordApi(activeForm.id, payload, selectedProjectId);
      setPreviewSubmitted(true);
      toast?.showToast("Form response submitted and recorded!", "success");
      if (recordsPage === 1) {
        setRecords((prev) => [newRecord, ...prev].slice(0, recordsPageSize));
        setTotalRecords((prev) => prev + 1);
      } else {
        setRecordsPage(1);
        setTotalRecords((prev) => prev + 1);
      }
    } catch (err: any) {
      toast?.showToast(err.message || "Failed to submit response", "error");
    } finally {
      setIsSubmittingPreview(false);
    }
  };

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (!activeForm?.id) return;
    if (!confirm("Are you sure you want to delete this submission record?")) return;
    try {
      await deleteFormRecordApi(activeForm.id, recordId, selectedProjectId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setTotalRecords((prev) => {
        const next = Math.max(0, prev - 1);
        const maxPage = Math.max(1, Math.ceil(next / recordsPageSize));
        setRecordsPage((page) => Math.min(page, maxPage));
        return next;
      });
      if (selectedRecordDetail?.id === recordId) {
        setSelectedRecordDetail(null);
      }
      toast?.showToast("Record deleted.", "success");
    } catch (err: any) {
      toast?.showToast(err.message || "Failed to delete record.", "error");
    }
  }, [activeForm?.id, selectedProjectId, selectedRecordDetail?.id, recordsPageSize, toast]);

  const handleExportCsv = useCallback(async () => {
    if (!activeForm) return;
    try {
      const exportRows: FormRecord[] = [];
      let skip = 0;
      let total = Number.POSITIVE_INFINITY;

      while (skip < total) {
        const page = await fetchFormRecordsApi(activeForm.id, selectedProjectId, {
          skip,
          limit: FORM_RECORDS_MAX_LIMIT,
        });
        exportRows.push(...page.data);
        total = page.total;
        if (page.data.length === 0) break;
        skip += page.data.length;
      }

      if (exportRows.length === 0) return;

      const fieldCols = activeForm.fields;
      const headers = [...fieldCols.map((f) => `"${(f.label || f.name).replace(/"/g, '""')}"`), '"Submitted At"', '"Record ID"'];
      const rows = exportRows.map((r) => [
        ...fieldCols.map((f) => {
          const val = r.data?.[f.name] ?? r.data?.[f.id];
          if (val === undefined || val === null) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        }),
        `"${new Date(r.created_at).toLocaleString().replace(/"/g, '""')}"`,
        `"${r.id}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeForm.slug}_records_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast?.showToast(err.message || "Failed to export records", "error");
    }
  }, [activeForm, selectedProjectId, toast]);

  const apiBaseUrl = APP_CONFIG.apiBaseUrl;

  return (
    <div className="space-y-5">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Forms Studio
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Private REST APIs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build custom forms, view collected submission records, test live, and integrate via private authenticated endpoints
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center gap-2 transform active:scale-95"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>New Form</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Sidebar (Forms List) + Workspace */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column: Forms Navigation List */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-3 shadow-sm">
            {/* Search */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forms..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
              {isLoading && forms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <i className="fa-solid fa-spinner fa-spin text-brand-500 text-lg mb-2 block"></i>
                  Loading forms...
                </div>
              ) : filteredForms.length > 0 ? (
                filteredForms.map((form) => (
                  <FormSidebarItem
                    key={form.id}
                    form={form}
                    isSelected={form.id === activeFormId}
                    onSelect={handleSelectForm}
                  />
                ))
              ) : (
                <div className="py-8 text-center px-2">
                  <i className="fa-solid fa-file-circle-question text-slate-400 text-2xl mb-2 block"></i>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No forms found
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click "+ New Form" above to create your first private form.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Workspace: Active Form Editor / Tabs */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {activeForm ? (
            <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm space-y-5">
              {/* Active Form Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeForm.name}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      /{activeForm.slug}
                    </span>
                    {isDirty && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  {activeForm.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeForm.description}
                    </p>
                  )}
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveForm}
                    disabled={!isDirty}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isDirty
                        ? "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <i className="fa-solid fa-floppy-disk text-xs"></i>
                    <span>Save Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete form "${activeForm.name}"? This action cannot be undone.`
                        )
                      ) {
                        deleteForm(activeForm.id);
                      }
                    }}
                    className="p-2 w-8 h-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition flex items-center justify-center"
                    title="Delete Form"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </div>

              {/* Sub Navigation Tabs: Form Records is placed BEFORE Field Builder */}
              <div className="flex items-center gap-2 border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                {/* 1. Form Records (First tab, active by default) */}
                <button
                  type="button"
                  onClick={() => setActiveTab("records")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === "records"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-table-list text-xs"></i>
                  <span>Form Records ({totalRecords})</span>
                </button>

                {/* 2. Field Builder (Placed after Form Records) */}
                <button
                  type="button"
                  onClick={() => setActiveTab("fields")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === "fields"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-list-check text-xs"></i>
                  <span>Field Builder ({activeForm.fields.length})</span>
                </button>

                {/* 3. Live Preview */}
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === "preview"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-eye text-xs"></i>
                  <span>Live Preview</span>
                </button>

                {/* 4. Private REST APIs */}
                <button
                  type="button"
                  onClick={() => setActiveTab("api")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === "api"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-code text-xs"></i>
                  <span>Private REST APIs</span>
                </button>
              </div>

              {/* TAB 1: FORM RECORDS (DEFAULT VIEW) */}
              {activeTab === "records" && (
                <div className="space-y-4">
                  {/* Controls bar */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px] max-w-sm">
                      <div className="relative w-full">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-400"></i>
                        <input
                          type="text"
                          value={recordSearchInput}
                          onChange={(e) => setRecordSearchInput(e.target.value)}
                          placeholder="Search form records..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { void loadRecords(); }}
                        disabled={isLoadingRecords}
                        className="px-3 py-1.5 rounded-xl glass-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-500 flex items-center gap-1.5 transition disabled:opacity-50"
                        title="Refresh records"
                      >
                        <i
                          className={`fa-solid fa-arrows-rotate text-xs ${
                            isLoadingRecords ? "animate-spin text-brand-500" : ""
                          }`}
                        ></i>
                        <span>Refresh</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={totalRecords === 0}
                        className="px-3 py-1.5 rounded-xl glass-card text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-500 flex items-center gap-1.5 transition disabled:opacity-40"
                        title="Export records to CSV"
                      >
                        <i className="fa-solid fa-file-csv text-xs"></i>
                        <span>Export CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                      >
                        <i className="fa-solid fa-plus text-xs"></i>
                        <span>New Submission</span>
                      </button>
                    </div>
                  </div>

                  {/* Records Table */}
                  {isLoadingRecords && records.length === 0 ? (
                    <div className="py-12 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                      <i className="fa-solid fa-spinner fa-spin text-brand-500 text-2xl mb-2 block"></i>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Loading form submissions...
                      </p>
                    </div>
                  ) : filteredRecords.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800/60">
                            {activeForm.fields.map((field) => (
                              <th
                                key={field.id}
                                className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                              >
                                {field.label || field.name}
                              </th>
                            ))}
                            <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              Submitted At
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right whitespace-nowrap">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {filteredRecords.map((record) => (
                            <FormRecordRow
                              key={record.id}
                              record={record}
                              fields={activeForm.fields}
                              onView={handleViewRecord}
                              onDelete={handleDeleteRecord}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : recordSearch.trim() ? (
                    <div className="p-10 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No matching records on this page
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Search only applies to the current page. Clear search or switch pages.
                      </p>
                    </div>
                  ) : (
                    <div className="p-10 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-lg">
                        <i className="fa-solid fa-inbox"></i>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No Form Records Yet
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Responses submitted by users, API calls, or test preview submissions will appear here in tabular form.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <i className="fa-solid fa-eye text-xs"></i>
                        <span>Submit a Test Record</span>
                      </button>
                    </div>
                  )}

                  {totalRecords > 0 && (
                    <Pagination
                      currentPage={recordsPage}
                      totalItems={totalRecords}
                      pageSize={recordsPageSize}
                      pageSizeOptions={FORM_RECORD_PAGE_SIZES}
                      onPageChange={handleRecordsPageChange}
                      onPageSizeChange={handleRecordsPageSizeChange}
                      isLoading={isLoadingRecords}
                      itemLabel="submissions"
                    />
                  )}
                </div>
              )}

              {/* TAB 2: FIELD BUILDER */}
              {activeTab === "fields" && (
                <div className="space-y-4">
                  {/* Top quick add bar */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Form Fields:
                      </span>
                      <span className="text-xs text-slate-400">
                        Configure input fields, labels, placeholders & validation rules.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddFieldOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                      <span>Add Field</span>
                    </button>
                  </div>

                  {/* Fields list */}
                  {activeForm.fields.length > 0 ? (
                    <div className="space-y-3">
                      {activeForm.fields.map((field, index) => (
                        <FieldEditorCard
                          key={field.id}
                          field={field}
                          index={index}
                          isLast={index === activeForm.fields.length - 1}
                          onUpdate={updateField}
                          onMove={moveField}
                          onRemove={removeField}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                      <i className="fa-solid fa-list-ul text-slate-400 text-2xl"></i>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        No fields in this form yet
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Click "Add Field" to add input elements like Text, Email, or Dropdowns.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddFieldOpen(true)}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-plus text-xs"></i>
                        <span>Add First Field</span>
                      </button>
                    </div>
                  )}

                  {/* Form Settings Box */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Form Submission Settings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Submit Button Label
                        </label>
                        <input
                          type="text"
                          value={activeForm.settings?.submit_button_text || "Submit"}
                          onChange={(e) =>
                            updateActiveFormMeta({
                              settings: { submit_button_text: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Success Confirmation Message
                        </label>
                        <input
                          type="text"
                          value={
                            activeForm.settings?.success_message ||
                            "Thank you! Your response has been recorded."
                          }
                          onChange={(e) =>
                            updateActiveFormMeta({
                              settings: { success_message: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE PREVIEW */}
              {activeTab === "preview" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-600 dark:text-brand-400 flex items-center justify-between">
                    <span>
                      <i className="fa-solid fa-circle-info mr-1.5"></i>
                      Interactive live test rendering of your form. Submissions made here are recorded in <strong>Form Records</strong>.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewValues({});
                        setPreviewSubmitted(false);
                      }}
                      className="text-[10px] underline font-bold"
                    >
                      Reset Form
                    </button>
                  </div>

                  <div className="max-w-xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {activeForm.name}
                      </h3>
                      {activeForm.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {activeForm.description}
                        </p>
                      )}
                    </div>

                    {previewSubmitted ? (
                      <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center space-y-3">
                        <i className="fa-solid fa-circle-check text-3xl"></i>
                        <p className="text-sm font-bold">
                          {activeForm.settings?.success_message ||
                            "Thank you! Your response has been recorded."}
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewValues({});
                              setPreviewSubmitted(false);
                            }}
                            className="px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/10 transition"
                          >
                            Submit another response
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("records")}
                            className="px-4 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition"
                          >
                            View in Form Records
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handlePreviewSubmit} className="space-y-4 text-xs">
                        {activeForm.fields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {field.label}{" "}
                              {field.required && <span className="text-rose-500">*</span>}
                            </label>

                            {field.type === "textarea" ? (
                              <textarea
                                required={field.required}
                                placeholder={field.placeholder || ""}
                                rows={3}
                                value={previewValues[field.name] || ""}
                                onChange={(e) => handlePreviewFieldChange(field.name, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            ) : field.type === "select" ? (
                              <select
                                required={field.required}
                                value={previewValues[field.name] || ""}
                                onChange={(e) => handlePreviewFieldChange(field.name, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                <option value="">Select an option...</option>
                                {(field.options || []).map((opt, i) => (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "radio" ? (
                              <div className="space-y-1.5 pt-1">
                                {(field.options || []).map((opt, i) => (
                                  <label
                                    key={i}
                                    className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
                                  >
                                    <input
                                      type="radio"
                                      name={field.name}
                                      value={opt}
                                      checked={previewValues[field.name] === opt}
                                      onChange={(e) => handlePreviewFieldChange(field.name, e.target.value)}
                                      className="text-brand-500 focus:ring-brand-500"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            ) : field.type === "checkbox" ? (
                              <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-700 dark:text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={Boolean(previewValues[field.name])}
                                  onChange={(e) => handlePreviewFieldChange(field.name, e.target.checked)}
                                  className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500"
                                />
                                <span>I agree to provide this information</span>
                              </label>
                            ) : (
                              <input
                                type={
                                  field.type === "number"
                                    ? "number"
                                    : field.type === "email"
                                    ? "email"
                                    : field.type === "date"
                                    ? "date"
                                    : field.type === "url"
                                    ? "url"
                                    : field.type === "phone"
                                    ? "tel"
                                    : "text"
                                }
                                required={field.required}
                                placeholder={field.placeholder || ""}
                                value={previewValues[field.name] || ""}
                                onChange={(e) => handlePreviewFieldChange(field.name, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            )}
                          </div>
                        ))}

                        <button
                          type="submit"
                          disabled={isSubmittingPreview}
                          className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmittingPreview && <i className="fa-solid fa-spinner fa-spin text-xs"></i>}
                          <span>{activeForm.settings?.submit_button_text || "Submit"}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PRIVATE REST APIS */}
              {activeTab === "api" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-600 dark:text-brand-400 flex items-center justify-between">
                    <span>
                      <i className="fa-solid fa-lock mr-1.5"></i>
                      These REST endpoints are authenticated for private organizational access.
                    </span>
                  </div>

                  {/* 1. GET /api/v1/forms/{id}/records */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          GET
                        </span>
                        <code className="text-xs font-mono text-slate-900 dark:text-white">
                          /api/v1/forms/{activeForm.id}/records
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X GET "${apiBaseUrl}/forms/${activeForm.id}/records" \\\n  -H "Authorization: Bearer <ACCESS_TOKEN>" \\\n  -H "X-Tenant-Id: <TENANT_ID>"`,
                            "curl_get_records"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg glass-card text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition flex items-center gap-1"
                      >
                        <i
                          className={`fa-solid ${
                            copiedKey === "curl_get_records" ? "fa-check text-emerald-500" : "fa-copy"
                          }`}
                        ></i>
                        <span>{copiedKey === "curl_get_records" ? "Copied" : "Copy cURL"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Retrieve all submitted records/responses for this form.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
{`curl -X GET "${apiBaseUrl}/forms/${activeForm.id}/records" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "X-Tenant-Id: <TENANT_ID>"`}
                    </pre>
                  </div>

                  {/* 2. POST /api/v1/forms/{id}/records */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          POST
                        </span>
                        <code className="text-xs font-mono text-slate-900 dark:text-white">
                          /api/v1/forms/{activeForm.id}/records
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sampleData: Record<string, any> = {};
                          activeForm.fields.forEach((f) => {
                            sampleData[f.name] = f.placeholder || `sample_${f.name}`;
                          });
                          handleCopy(
                            `curl -X POST "${apiBaseUrl}/forms/${activeForm.id}/records" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer <ACCESS_TOKEN>" \\\n  -H "X-Tenant-Id: <TENANT_ID>" \\\n  -d '${JSON.stringify(
                              { data: sampleData },
                              null,
                              2
                            )}'`,
                            "curl_post_record"
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg glass-card text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition flex items-center gap-1"
                      >
                        <i
                          className={`fa-solid ${
                            copiedKey === "curl_post_record" ? "fa-check text-emerald-500" : "fa-copy"
                          }`}
                        ></i>
                        <span>{copiedKey === "curl_post_record" ? "Copied" : "Copy cURL"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Submit a new record submission to this form programmatically.
                    </p>
                    <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
{`curl -X POST "${apiBaseUrl}/forms/${activeForm.id}/records" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -H "X-Tenant-Id: <TENANT_ID>" \\
  -d '{"data": { ... }}'`}
                    </pre>
                  </div>

                  {/* 3. GET /api/v1/forms/{id} */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          GET
                        </span>
                        <code className="text-xs font-mono text-slate-900 dark:text-white">
                          /api/v1/forms/{activeForm.id}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X GET "${apiBaseUrl}/forms/${activeForm.id}" \\\n  -H "Authorization: Bearer <ACCESS_TOKEN>" \\\n  -H "X-Tenant-Id: <TENANT_ID>"`,
                            "curl_get"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg glass-card text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition flex items-center gap-1"
                      >
                        <i
                          className={`fa-solid ${
                            copiedKey === "curl_get" ? "fa-check text-emerald-500" : "fa-copy"
                          }`}
                        ></i>
                        <span>{copiedKey === "curl_get" ? "Copied" : "Copy cURL"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Retrieve form schema, field definitions, and settings for programmatic integration.
                    </p>
                  </div>

                  {/* 4. PUT /api/v1/forms/{id} */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          PUT
                        </span>
                        <code className="text-xs font-mono text-slate-900 dark:text-white">
                          /api/v1/forms/{activeForm.id}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `curl -X PUT "${apiBaseUrl}/forms/${activeForm.id}" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer <ACCESS_TOKEN>" \\\n  -H "X-Tenant-Id: <TENANT_ID>" \\\n  -d '${JSON.stringify(
                              {
                                name: activeForm.name,
                                fields: activeForm.fields,
                                settings: activeForm.settings,
                              },
                              null,
                              2
                            )}'`,
                            "curl_put"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg glass-card text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition flex items-center gap-1"
                      >
                        <i
                          className={`fa-solid ${
                            copiedKey === "curl_put" ? "fa-check text-emerald-500" : "fa-copy"
                          }`}
                        ></i>
                        <span>{copiedKey === "curl_put" ? "Copied" : "Copy cURL"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Update field definitions, labels, validation rules, or submission configurations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-xl">
                <i className="fa-solid fa-rectangle-list"></i>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Form Selected
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Select an existing form from the left sidebar to view records or edit fields, or create a new form to get started.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2 transition"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Create New Form</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <i className="fa-solid fa-plus text-xs"></i>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create New Form
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Form Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contact Us, Support Ticket, Inquiry Form"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of what this form collects..."
                  value={newFormDesc}
                  onChange={(e) => setNewFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFormName.trim() || isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/25 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Form"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Field Palette */}
      {isAddFieldOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg glass-panel p-6 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <i className="fa-solid fa-cubes text-xs"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Select Field Type
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pick a field type to append to your form
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFieldOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {AVAILABLE_FIELD_TYPES.map((meta) => (
                <button
                  key={meta.type}
                  type="button"
                  onClick={() => handleQuickAddField(meta.type)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 hover:border-brand-500 hover:bg-brand-500/5 transition text-left space-y-1 group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition flex items-center justify-center text-xs">
                      <i className={`fa-solid ${meta.icon}`}></i>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {meta.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddFieldOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Record Detail JSON */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg glass-panel p-6 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-800/70 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <i className="fa-solid fa-database text-xs"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Form Submission Record
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedRecordDetail.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                Submitted at: <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedRecordDetail.created_at).toLocaleString()}</strong>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono max-h-72 overflow-y-auto">
                {JSON.stringify(selectedRecordDetail.data, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(selectedRecordDetail.data, null, 2), "record_json")}
                className="px-3 py-1.5 rounded-xl glass-card text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition flex items-center gap-1.5"
              >
                <i className={`fa-solid ${copiedKey === "record_json" ? "fa-check text-emerald-500" : "fa-copy"}`}></i>
                <span>{copiedKey === "record_json" ? "Copied" : "Copy Payload"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
