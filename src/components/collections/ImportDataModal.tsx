"use client";

import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { CollectionSchema, FieldDefinition } from "@/models/collection.model";
import { batchCreateCollectionRecordsApi } from "@/api/collection.api";
import { useOlio } from "@/state/OlioProvider";

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: CollectionSchema;
  onSuccess: () => void;
}

type ImportStep = "upload" | "map" | "preview" | "importing" | "complete";

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  schema,
  onSuccess,
}) => {
  const { toast } = useOlio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [autoMatchedFields, setAutoMatchedFields] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setFileColumns([]);
    setRawRows([]);
    setColumnMapping({});
    setAutoMatchedFields(new Set());
    setErrorMsg(null);
    setIsProcessingFile(false);
    setIsImporting(false);
    setImportStats(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Intelligent column matcher between file headers and collection schema fields
  const performAutoMapping = (headers: string[], fields: FieldDefinition[]) => {
    const mapping: Record<string, string> = {};
    const autoMatched = new Set<string>();

    fields.forEach((field) => {
      const fieldKey = field.name.toLowerCase().trim();
      const fieldLabel = (field.label || "").toLowerCase().trim();

      // 1. Exact match with field name or label
      let match = headers.find((h) => {
        const headerNorm = h.toLowerCase().trim();
        return headerNorm === fieldKey || headerNorm === fieldLabel;
      });

      // 2. Common synonyms and partial matches
      if (!match) {
        if (fieldKey === "title" || fieldKey === "name") {
          match = headers.find((h) => {
            const lower = h.toLowerCase().trim();
            return (
              lower === "title" ||
              lower === "name" ||
              lower === "product name" ||
              lower === "item name" ||
              lower === "heading" ||
              lower.includes("title")
            );
          });
        } else if (fieldKey === "slug") {
          match = headers.find((h) => {
            const lower = h.toLowerCase().trim();
            return lower === "slug" || lower === "handle" || lower === "url" || lower === "url slug" || lower.includes("slug");
          });
        } else if (fieldKey === "media" || field.type === "media") {
          match = headers.find((h) => {
            const lower = h.toLowerCase().trim();
            return (
              lower === "media" ||
              lower === "image" ||
              lower === "images" ||
              lower === "photo" ||
              lower === "picture" ||
              lower === "thumbnail" ||
              lower === "featured image" ||
              lower.includes("image")
            );
          });
        } else if (fieldKey === "price") {
          match = headers.find((h) => {
            const lower = h.toLowerCase().trim();
            return lower === "price" || lower === "cost" || lower === "amount" || lower === "rate";
          });
        } else if (fieldKey === "description" || fieldKey === "desc") {
          match = headers.find((h) => {
            const lower = h.toLowerCase().trim();
            return lower === "description" || lower === "desc" || lower === "details" || lower === "summary";
          });
        }
      }

      if (match) {
        mapping[field.name] = match;
        autoMatched.add(field.name);
      } else {
        mapping[field.name] = "";
      }
    });

    setColumnMapping(mapping);
    setAutoMatchedFields(autoMatched);
  };

  // Process selected file (.xlsx, .xls, .csv)
  const processFile = async (uploadedFile: File) => {
    setErrorMsg(null);
    const ext = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      setErrorMsg("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    setIsProcessingFile(true);
    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setErrorMsg("The selected file contains no sheets.");
        setIsProcessingFile(false);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const parsed: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!parsed || parsed.length === 0) {
        setErrorMsg("The uploaded sheet has no rows of data.");
        setIsProcessingFile(false);
        return;
      }

      const detectedColumns = Object.keys(parsed[0]);
      if (detectedColumns.length === 0) {
        setErrorMsg("Could not detect any column headers in the file.");
        setIsProcessingFile(false);
        return;
      }

      setFile(uploadedFile);
      setFileColumns(detectedColumns);
      setRawRows(parsed);
      performAutoMapping(detectedColumns, schema.schema_definition || []);
      setStep("map");
    } catch (err: any) {
      setErrorMsg(`Failed to parse file: ${err?.message || "Unknown error reading file"}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
    if (e.target) e.target.value = "";
  };

  // Transform raw row data into mapped collection record format
  const transformRowToRecord = (row: Record<string, any>, idx: number) => {
    const record: Record<string, any> = {};

    (schema.schema_definition || []).forEach((field) => {
      const mappedCol = columnMapping[field.name];
      if (mappedCol && row[mappedCol] !== undefined && row[mappedCol] !== "") {
        let val = row[mappedCol];
        if (field.type === "number") {
          const num = Number(val);
          record[field.name] = !isNaN(num) ? num : null;
        } else if (field.type === "boolean") {
          const str = String(val).toLowerCase().trim();
          record[field.name] = str === "true" || str === "1" || str === "yes" || str === "y";
        } else {
          record[field.name] = String(val).trim();
        }
      } else {
        record[field.name] = null;
      }
    });

    // Auto-generate slug from title or name if slug is unmapped or empty
    if (!record["slug"] || !String(record["slug"]).trim()) {
      const baseTitle = record["title"] || record["name"] || `record-${idx + 1}`;
      const cleanSlug = String(baseTitle)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-");
      record["slug"] = cleanSlug || `record-${idx + 1}`;
    }

    return record;
  };

  // Live preview of mapped rows (first 4 items)
  const previewMappedRows = useMemo(() => {
    return rawRows.slice(0, 4).map((r, i) => transformRowToRecord(r, i));
  }, [rawRows, columnMapping, schema]);

  // Execute Batch Import
  const handleExecuteImport = async () => {
    // Validate required fields mapping
    const missingRequired = (schema.schema_definition || []).filter((f) => {
      // Slug can be auto-generated even if not mapped
      if (f.name === "slug") return false;
      return f.validation?.required && !columnMapping[f.name];
    });

    if (missingRequired.length > 0) {
      setErrorMsg(
        `Please map all required fields: ${missingRequired.map((f) => f.label || f.name).join(", ")}`
      );
      return;
    }

    setErrorMsg(null);
    setIsImporting(true);
    setStep("importing");

    // Transform all rows
    const transformed = rawRows.map((r, i) => transformRowToRecord(r, i));

    const res = await batchCreateCollectionRecordsApi(schema.id, transformed);
    setIsImporting(false);

    if (res.error) {
      setErrorMsg(res.error);
      setStep("map");
    } else {
      setImportStats({
        imported: res.importedCount ?? transformed.length,
        failed: res.failedCount ?? 0,
        errors: res.errors || [],
      });
      setStep("complete");
      if (toast) {
        toast.showToast(`Successfully imported ${res.importedCount ?? transformed.length} records!`, "success");
      }
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <i className="fa-solid fa-file-import text-sm"></i>
              </span>
              <span>Import Data into {schema.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload XLSX or CSV spreadsheets and map columns directly into collection fields
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold pb-3 border-b border-slate-200/30 dark:border-slate-800/30">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition ${
              step === "upload"
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            <span>Upload File</span>
          </div>
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition ${
              step === "map" || step === "preview"
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
            <span>Map Columns</span>
          </div>
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition ${
              step === "importing" || step === "complete"
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
            <span>Finish</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2.5">
            <i className="fa-solid fa-triangle-exclamation text-base shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD FILE */}
        {step === "upload" && (
          <div className="mt-6 flex-1 flex flex-col items-center justify-center py-8">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-xl p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                isDragOver
                  ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
                  : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-500/60 hover:bg-brand-500/5"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-2xl mb-1 shadow-sm">
                {isProcessingFile ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {isProcessingFile ? "Parsing spreadsheet..." : "Drag & drop your file here, or browse"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports Microsoft Excel (<strong className="font-semibold text-brand-500">.xlsx, .xls</strong>) and CSV (<strong className="font-semibold text-brand-500">.csv</strong>)
                </p>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  <i className="fa-solid fa-file-excel text-emerald-500 mr-1.5"></i> Excel Sheet
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  <i className="fa-solid fa-file-csv text-blue-500 mr-1.5"></i> CSV File
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 & 3: COLUMN MAPPING & PREVIEW */}
        {(step === "map" || step === "preview") && file && (
          <div className="mt-4 flex-1 flex flex-col min-h-0">
            {/* File Info Bar */}
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0">
                  <i className="fa-solid fa-file-excel"></i>
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {rawRows.length} rows parsed &bull; {fileColumns.length} columns detected
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(step === "map" ? "preview" : "map")}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:text-brand-500 text-xs font-semibold transition flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                >
                  <i className={`fa-solid ${step === "map" ? "fa-table" : "fa-sliders"} text-xs`}></i>
                  <span>{step === "map" ? "Preview Data" : "Edit Mappings"}</span>
                </button>
                <button
                  type="button"
                  onClick={resetState}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-rose-500 text-xs transition"
                  title="Upload another file"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
              </div>
            </div>

            {/* MAPPING VIEW */}
            {step === "map" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pb-1">
                  <span>Match each collection field with its corresponding column in your file:</span>
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i> Auto-matched {autoMatchedFields.size} fields
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(schema.schema_definition || []).map((field) => {
                    const mappedValue = columnMapping[field.name] || "";
                    const isAuto = autoMatchedFields.has(field.name) && mappedValue;
                    const isSlug = field.name.toLowerCase() === "slug";

                    return (
                      <div
                        key={field.name}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          mappedValue
                            ? "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                            : "bg-slate-100/30 dark:bg-slate-800/20 border-dashed border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {/* Field Info */}
                        <div className="min-w-0 sm:w-1/2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {field.label || field.name}
                            </span>
                            {field.validation?.required && (
                              <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                            {field.validation?.unique && (
                              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                Unique
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>Key: {field.name}</span>
                            <span>&bull;</span>
                            <span className="capitalize">{field.type}</span>
                            {isSlug && !mappedValue && (
                              <span className="text-amber-500 text-[10px] font-sans font-medium">
                                (Auto-generates from Title if unmapped)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Selector */}
                        <div className="sm:w-1/2 flex items-center gap-2">
                          <i className="fa-solid fa-arrow-right-arrow-left text-slate-400 text-xs hidden sm:block shrink-0"></i>
                          <div className="relative flex-1">
                            <select
                              value={mappedValue}
                              onChange={(e) => {
                                setColumnMapping({
                                  ...columnMapping,
                                  [field.name]: e.target.value,
                                });
                                // Remove auto-badge on manual edit
                                const nextAuto = new Set(autoMatchedFields);
                                nextAuto.delete(field.name);
                                setAutoMatchedFields(nextAuto);
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none transition appearance-none pr-8 ${
                                mappedValue
                                  ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                  : "bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-400 focus:ring-2 focus:ring-brand-500"
                              }`}
                            >
                              <option value="">-- Do Not Import (Skip) --</option>
                              {fileColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                          </div>

                          {isAuto && (
                            <span
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold shrink-0"
                              title="Automatically matched based on header name"
                            >
                              <i className="fa-solid fa-check"></i>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PREVIEW VIEW */}
            {step === "preview" && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preview of the first {previewMappedRows.length} rows as they will be saved:
                </p>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <th className="p-3 font-bold text-[11px]">#</th>
                        {(schema.schema_definition || []).map((f) => (
                          <th key={f.name} className="p-3 font-bold text-[11px] whitespace-nowrap">
                            {f.label || f.name}
                            {f.validation?.required && <span className="text-rose-500 ml-0.5">*</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {previewMappedRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 font-mono text-[11px]">
                          <td className="p-3 text-slate-400">{rIdx + 1}</td>
                          {(schema.schema_definition || []).map((f) => {
                            const val = row[f.name];
                            return (
                              <td key={f.name} className="p-3 max-w-[200px] truncate text-slate-800 dark:text-slate-200">
                                {val !== null && val !== undefined ? String(val) : (
                                  <span className="text-slate-400 italic">null</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Controls */}
            <div className="pt-4 mt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Ready to import <strong className="font-bold text-slate-900 dark:text-white">{rawRows.length}</strong> records
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
                  <span>Confirm & Import Records</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORTING SPINNER */}
        {step === "importing" && (
          <div className="mt-8 flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-2xl shadow-lg shadow-brand-500/10">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Importing records into {schema.name}...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Validating schemas, formatting data types, and generating unique slugs
              </p>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETED */}
        {step === "complete" && importStats && (
          <div className="mt-6 flex-1 flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/10">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Import Complete!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Successfully ingested <strong className="text-emerald-500 font-bold">{importStats.imported}</strong> records into {schema.name}.
              </p>
            </div>

            {importStats.errors.length > 0 && (
              <div className="w-full max-w-lg p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs text-left max-h-32 overflow-y-auto">
                <p className="font-bold mb-1">Row warnings / skipped:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {importStats.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition"
            >
              View Records in Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
