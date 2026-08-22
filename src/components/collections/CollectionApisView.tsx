"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionSchemaApi } from "@/api/collection.api";
import { APP_CONFIG } from "@/config/app.config";
import { useOlio } from "@/state/OlioProvider";

interface CollectionApisViewProps {
  collectionId: string;
}

type CodeTab = "nextjs" | "curl" | "js" | "python";
type EndpointTab = "list" | "single" | "schema";

export const CollectionApisView: React.FC<CollectionApisViewProps> = ({ collectionId }) => {
  const { toast, projectState } = useOlio();
  const selectedProjectId = projectState.selectedProject?.id;
  const [schema, setSchema] = useState<CollectionSchema | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeEndpoint, setActiveEndpoint] = useState<EndpointTab>("list");
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("nextjs");

  // Query Params Controls for GET List & Filter
  const [limit, setLimit] = useState("20");
  const [page, setPage] = useState("1");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldFilters, setFieldFilters] = useState<{ field: string; op: string; val: string }[]>([]);

  // Single Record ID parameter for GET Single Record
  const [singleRecordId, setSingleRecordId] = useState("rec_sample_id");

  // Live Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResponseStatus, setTestResponseStatus] = useState<number | null>(null);
  const [testResponseHeaders, setTestResponseHeaders] = useState<Record<string, string> | null>(null);
  const [testResponseBody, setTestResponseBody] = useState<string | null>(null);

  const apiBaseUrl = APP_CONFIG.apiBaseUrl.replace(/\/$/, "");
  const publicApiKey = schema ? `pk_live_${schema.tenant_id.replace(/-/g, "")}` : "pk_live_sample";

  const loadSchema = async () => {
    setLoading(true);
    const data = await fetchCollectionSchemaApi(collectionId);
    setSchema(data);
    setLoading(false);
  };

  useEffect(() => {
    if (collectionId) {
      loadSchema();
    }
  }, [collectionId]);

  // Construct Query String dynamically
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (page && page !== "1") params.append("page", page);
    if (limit && limit !== "20") params.append("limit", limit);
    if (sortBy && sortBy !== "created_at") params.append("sort_by", sortBy);
    if (order && order !== "desc") params.append("order", order);
    if (selectedFields.length > 0) params.append("fields", selectedFields.join(","));

    fieldFilters.forEach(({ field, op, val }) => {
      if (field && val) {
        if (op === "eq") params.append(field, val);
        else params.append(`${field}[${op}]`, val);
      }
    });

    const str = params.toString();
    return str ? `?${str}` : "";
  };

  const projectId = selectedProjectId || schema?.project_id || "";

  const currentQueryString = buildQueryString();
  const listEndpointUrl = schema ? `${apiBaseUrl}/public/${schema.slug}${currentQueryString}` : "";
  const singleEndpointUrl = schema
    ? `${apiBaseUrl}/public/${schema.slug}/${singleRecordId || ":record_id"}`
    : "";
  const schemaEndpointUrl = schema ? `${apiBaseUrl}/public/${schema.slug}/schema` : "";

  const activeEndpointUrl =
    activeEndpoint === "list"
      ? listEndpointUrl
      : activeEndpoint === "single"
      ? singleEndpointUrl
      : schemaEndpointUrl;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (toast) toast.showToast(`Copied ${label} to clipboard!`, "success");
  };

  // Add Dynamic Field Filter Row
  const handleAddFilterRow = () => {
    if (!schema || !schema.schema_definition || schema.schema_definition.length === 0) return;
    const firstField = schema.schema_definition[0].name;
    setFieldFilters([...fieldFilters, { field: firstField, op: "eq", val: "" }]);
  };

  const handleRemoveFilterRow = (index: number) => {
    setFieldFilters(fieldFilters.filter((_, idx) => idx !== index));
  };

  const handleFilterChange = (index: number, key: "field" | "op" | "val", val: string) => {
    const updated = [...fieldFilters];
    updated[index][key] = val;
    setFieldFilters(updated);
  };

  const handleToggleFieldSelection = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields(selectedFields.filter((f) => f !== fieldName));
    } else {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };

  // Execute Live Test Request
  const handleExecuteLiveTest = async () => {
    if (!activeEndpointUrl) return;
    setIsTesting(true);
    setTestResponseStatus(null);
    setTestResponseHeaders(null);
    setTestResponseBody(null);

    try {
      const res = await fetch(activeEndpointUrl, {
        headers: {
          "X-API-Key": publicApiKey,
          Accept: "application/json",
          ...(projectId ? { "X-Project-Id": projectId } : {}),
        },
      });

      setTestResponseStatus(res.status);
      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setTestResponseHeaders(headersObj);

      const data = await res.json();
      setTestResponseBody(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResponseStatus(500);
      setTestResponseBody(JSON.stringify({ error: err.message || "Network request failed" }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  // Code Snippets Generator
  const getNextJsSnippet = () => {
    return `// Next.js Server Component (ISR with 60s Revalidation)
export default async function ${schema?.name.replace(/[^a-zA-Z0-9]/g, "") || "Collection"}Page() {
  const res = await fetch(
    '${activeEndpointUrl}',
    {
      headers: {
        'X-API-Key': '${publicApiKey}'${projectId ? `,\n        'X-Project-Id': '${projectId}'` : ""}
      },
      next: { revalidate: 60 }
    }
  );
  
  if (!res.ok) throw new Error('Failed to fetch collection data');
  const payload = await res.json();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">${schema?.name || "Collection"} Data</h1>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}`;
  };

  const getCurlSnippet = () => {
    return `curl -X GET "${activeEndpointUrl}" \\
  -H "X-API-Key: ${publicApiKey}" \\${projectId ? `\n  -H "X-Project-Id: ${projectId}" \\` : ""}
  -H "Accept: application/json"`;
  };

  const getJsSnippet = () => {
    return `// JavaScript Fetch
async function get${schema?.name.replace(/[^a-zA-Z0-9]/g, "") || "Collection"}Data() {
  const response = await fetch('${activeEndpointUrl}', {
    method: 'GET',
    headers: {
      'X-API-Key': '${publicApiKey}',${projectId ? `\n      'X-Project-Id': '${projectId}',` : ""}
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log(data);
  return data;
}

get${schema?.name.replace(/[^a-zA-Z0-9]/g, "") || "Collection"}Data();`;
  };

  const getPythonSnippet = () => {
    return `# Python requests
import requests

url = "${activeEndpointUrl}"
headers = {
    "X-API-Key": "${publicApiKey}"${projectId ? `,\n    "X-Project-Id": "${projectId}"` : ""}
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
  };

  const currentCodeSnippet =
    activeCodeTab === "nextjs"
      ? getNextJsSnippet()
      : activeCodeTab === "curl"
      ? getCurlSnippet()
      : activeCodeTab === "js"
      ? getJsSnippet()
      : getPythonSnippet();

  // Prompt Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Generate AI Prompt from .env template
  const generateAiPrompt = () => {
    if (!schema) return "";
    const fieldsStr = JSON.stringify(schema.schema_definition || [], null, 2);
    let tpl = APP_CONFIG.apiPromptTemplate;
    tpl = tpl.replace(/{{COLLECTION_NAME}}/g, schema.name);
    tpl = tpl.replace(/{{COLLECTION_SLUG}}/g, schema.slug);
    tpl = tpl.replace(/{{ENDPOINT_URL}}/g, activeEndpointUrl);
    tpl = tpl.replace(/{{API_KEY}}/g, publicApiKey);
    tpl = tpl.replace(/{{PROJECT_ID}}/g, projectId);
    tpl = tpl.replace(/{{SCHEMA_FIELDS}}/g, fieldsStr);
    return tpl;
  };

  const handleCopyPrompt = () => {
    const promptText = generateAiPrompt();
    navigator.clipboard.writeText(promptText);
    if (toast) toast.showToast("Copied AI implementation prompt to clipboard!", "success");
  };

  return (
    <AppLayout pageTitle={schema ? `${schema.name} APIs` : "Collection APIs"}>
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/collections" className="hover:text-brand-500 transition">
              Collections
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            {schema && (
              <>
                <Link href={`/collections/${schema.id}`} className="hover:text-brand-500 transition">
                  {schema.name}
                </Link>
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </>
            )}
            <span className="text-slate-900 dark:text-white font-bold">Public GET APIs</span>
          </div>

          {schema && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition transform active:scale-95"
                title="Get AI Prompt to implement this API in external websites"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                <span>Get Prompt</span>
              </button>

              <Link
                href={`/collections/${schema.id}`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
              >
                <i className="fa-solid fa-table-cells text-xs"></i> View Records
              </Link>
            </div>
          )}
        </div>

        {/* Hero API Banner */}
        {loading ? (
          <div className="h-44 rounded-3xl glass-panel animate-pulse" />
        ) : schema ? (
          <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl relative overflow-hidden bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shrink-0">
                    <i className={`fa-solid ${schema.icon || "fa-cube"} text-lg`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {schema.name} API Gateway
                    </h2>
                    <p className="text-xs font-mono text-slate-400">
                      Slug: <span className="text-brand-500 font-bold">/{schema.slug}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                  Automatically generated, high-performance read-only REST API endpoints for your user-defined collection.
                  No JWT authentication required—ideal for external website storefronts, Next.js ISR, or mobile apps.
                </p>
              </div>

              {/* API Keys & Context Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5 shrink-0 w-full lg:w-96 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Public Read API Key
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Read-Only
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs text-brand-400">
                  <span className="truncate">{publicApiKey}</span>
                  <button
                    onClick={() => handleCopy(publicApiKey, "Public API Key")}
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="Copy API Key"
                  >
                    <i className="fa-solid fa-copy text-xs"></i>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Headers: <code className="text-slate-200">X-API-Key</code>
                    {projectId && (
                      <>
                        {" + "}
                        <code className="text-slate-200">X-Project-Id</code>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => handleCopy(`${apiBaseUrl}/public/${schema.slug}`, "Base URL")}
                    className="text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <i className="fa-solid fa-link text-[10px]"></i> Base URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl">
            <p className="text-xs font-bold text-rose-500">Collection schema not found.</p>
          </div>
        )}

        {schema && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Endpoints Navigator & Query Builder (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Endpoint Tabs Bar */}
              <div className="glass-panel rounded-2xl p-2 border border-slate-200/50 dark:border-slate-800/50 shadow-md flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveEndpoint("list")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeEndpoint === "list"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">GET</span>
                  <span>List & Filter Records</span>
                </button>

                <button
                  onClick={() => setActiveEndpoint("single")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeEndpoint === "single"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">GET</span>
                  <span>Single Record</span>
                </button>

                <button
                  onClick={() => setActiveEndpoint("schema")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeEndpoint === "schema"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">GET</span>
                  <span>Schema Definition</span>
                </button>
              </div>

              {/* Live URL Endpoint Box */}
              <div className="glass-panel rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <i className="fa-solid fa-globe text-brand-500"></i> Endpoint URL
                  </span>
                  <button
                    onClick={() => handleCopy(activeEndpointUrl, "Endpoint URL")}
                    className="text-xs text-brand-500 hover:underline font-semibold flex items-center gap-1"
                  >
                    <i className="fa-solid fa-copy text-xs"></i> Copy URL
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs break-all border border-slate-800 flex items-center justify-between">
                  <span>{activeEndpointUrl}</span>
                </div>
              </div>

              {/* Endpoint Specific Query Parameter Configurator */}
              {activeEndpoint === "list" && (
                <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-sliders text-brand-500"></i> Query Parameter Builder
                    </h3>
                    <span className="text-[11px] text-slate-400">Construct pagination, sorting & filters</span>
                  </div>

                  {/* Standard Pagination & Sort Controls */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Page
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={page}
                        onChange={(e) => setPage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Limit (Max 100)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="created_at">created_at</option>
                        <option value="updated_at">updated_at</option>
                        {schema.schema_definition.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name} ({f.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Order
                      </label>
                      <select
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="desc">desc (Descending)</option>
                        <option value="asc">asc (Ascending)</option>
                      </select>
                    </div>
                  </div>

                  {/* Field Selection Checklist */}
                  <div className="space-y-2 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Field Selection (?fields=...)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {schema.schema_definition.map((f) => {
                        const isChecked = selectedFields.includes(f.name);
                        return (
                          <button
                            key={f.name}
                            type="button"
                            onClick={() => handleToggleFieldSelection(f.name)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                              isChecked
                                ? "bg-brand-500 text-white font-bold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            {isChecked && <i className="fa-solid fa-check text-[10px] mr-1"></i>}
                            {f.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Field Filters Section */}
                  <div className="space-y-3 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Dynamic Schema Filters
                      </label>
                      <button
                        type="button"
                        onClick={handleAddFilterRow}
                        className="px-3 py-1 rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white font-bold text-xs transition flex items-center gap-1"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i> Add Filter
                      </button>
                    </div>

                    {fieldFilters.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No custom filters added yet. Click &quot;Add Filter&quot; above.</p>
                    ) : (
                      <div className="space-y-2">
                        {fieldFilters.map((flt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              value={flt.field}
                              onChange={(e) => handleFilterChange(idx, "field", e.target.value)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                            >
                              {schema.schema_definition.map((f) => (
                                <option key={f.name} value={f.name}>
                                  {f.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={flt.op}
                              onChange={(e) => handleFilterChange(idx, "op", e.target.value)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                            >
                              <option value="eq">= (Equals)</option>
                              <option value="gte">&gt;= (Greater or Equal)</option>
                              <option value="lte">&lt;= (Less or Equal)</option>
                              <option value="gt">&gt; (Greater Than)</option>
                              <option value="lt">&lt; (Less Than)</option>
                              <option value="contains">contains (Text Search)</option>
                            </select>

                            <input
                              type="text"
                              value={flt.val}
                              placeholder="Filter value..."
                              onChange={(e) => handleFilterChange(idx, "val", e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveFilterRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeEndpoint === "single" && (
                <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-key text-brand-500"></i> Record Identifier
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Record UUID / ID
                    </label>
                    <input
                      type="text"
                      value={singleRecordId}
                      onChange={(e) => setSingleRecordId(e.target.value)}
                      placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Schema Inspector Table */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-table-list text-brand-500"></i> Schema Field Definition Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Field Key</th>
                        <th className="py-2.5 px-3">Label</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Filter Syntax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {schema.schema_definition.map((f) => (
                        <tr key={f.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono font-bold text-brand-500">{f.name}</td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{f.label}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              {f.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {f.type === "number"
                              ? `?${f.name}[gte]=100 & ?${f.name}[lte]=500`
                              : f.type === "boolean"
                              ? `?${f.name}=true`
                              : `?${f.name}[contains]=query`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Code Snippets & Live Test Console (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Code Snippets Box */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-code text-brand-500"></i> Code Integration
                  </h3>
                  <button
                    onClick={() => handleCopy(currentCodeSnippet, "Code Snippet")}
                    className="text-xs text-brand-500 hover:underline font-semibold flex items-center gap-1"
                  >
                    <i className="fa-solid fa-copy text-xs"></i> Copy Snippet
                  </button>
                </div>

                {/* Code Languages Selector */}
                <div className="flex items-center gap-1 border-b border-slate-200/40 dark:border-slate-800/40 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveCodeTab("nextjs")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === "nextjs"
                        ? "bg-brand-500 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Next.js (ISR)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab("curl")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === "curl"
                        ? "bg-brand-500 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveCodeTab("js")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === "js"
                        ? "bg-brand-500 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setActiveCodeTab("python")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCodeTab === "python"
                        ? "bg-brand-500 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                </div>

                {/* Code Block */}
                <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800 shadow-inner">
                  <pre>{currentCodeSnippet}</pre>
                </div>
              </div>

              {/* Live Test Console Box */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-play text-emerald-500"></i> Interactive Test Console
                  </h3>
                  <button
                    onClick={handleExecuteLiveTest}
                    disabled={isTesting}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
                  >
                    {isTesting ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin text-xs"></i> Testing...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-bolt text-xs"></i> Send Live Request
                      </>
                    )}
                  </button>
                </div>

                {/* Live Response Container */}
                {testResponseStatus !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Response Status</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          testResponseStatus >= 200 && testResponseStatus < 300
                            ? "bg-emerald-500/20 text-emerald-400"
                            : testResponseStatus === 304
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {testResponseStatus} {testResponseStatus === 304 ? "Not Modified" : "OK"}
                      </span>
                    </div>

                    {testResponseHeaders && (
                      <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div>
                          <strong>ETag:</strong> {testResponseHeaders["etag"] || "N/A"}
                        </div>
                        <div>
                          <strong>Cache-Control:</strong> {testResponseHeaders["cache-control"] || "N/A"}
                        </div>
                      </div>
                    )}

                    {testResponseBody && (
                      <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800 shadow-inner">
                        <pre>{testResponseBody}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Prompt Modal Popup */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5 text-white relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    AI Implementation Prompt
                  </h3>
                  <p className="text-xs text-slate-400">
                    Copy and paste this prompt into ChatGPT, Claude, Cursor, or Copilot to auto-code your API integration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Prompt Content Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-file-lines text-purple-400"></i> Prompt Template
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                  Loaded from .env (NEXT_PUBLIC_API_PROMPT_TEMPLATE)
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-y-auto max-h-96 border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner select-all">
                {generateAiPrompt()}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Template placeholders: <code className="text-slate-300">{"{{COLLECTION_NAME}}"}</code>, <code className="text-slate-300">{"{{ENDPOINT_URL}}"}</code>, <code className="text-slate-300">{"{{API_KEY}}"}</code>
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPromptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition transform active:scale-95 flex items-center gap-2 shrink-0"
                >
                  <i className="fa-solid fa-copy text-xs"></i> Copy Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
