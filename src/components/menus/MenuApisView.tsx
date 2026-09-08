"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { MenuItem, MenuSchema } from "@/models/menu.model";
import { fetchMenuByIdApi, fetchMenusApi } from "@/api/menu.api";
import { APP_CONFIG } from "@/config/app.config";
import { useOlio } from "@/state/OlioProvider";

interface MenuApisViewProps {
  menuId: string;
}

type CodeTab = "nextjs" | "curl" | "js" | "python";
type EndpointTab = "single" | "list";

export const MenuApisView: React.FC<MenuApisViewProps> = ({ menuId }) => {
  const { toast, projectState } = useOlio();
  const selectedProjectId = projectState.selectedProject?.id;
  const [menu, setMenu] = useState<MenuSchema | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeEndpoint, setActiveEndpoint] = useState<EndpointTab>("single");
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("nextjs");

  // Endpoint Options
  const [format, setFormat] = useState<"tree" | "flat">("tree");
  const [useSlug, setUseSlug] = useState<boolean>(true);
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Live Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResponseStatus, setTestResponseStatus] = useState<number | null>(null);
  const [testResponseHeaders, setTestResponseHeaders] = useState<Record<string, string> | null>(null);
  const [testResponseBody, setTestResponseBody] = useState<string | null>(null);

  // AI Prompt Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const apiBaseUrl = APP_CONFIG.apiBaseUrl.replace(/\/$/, "");

  // Resolve tenant ID for public API key
  const tenantId = useMemo(() => {
    if (menu?.tenantId) return menu.tenantId;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tenant_id") || sessionStorage.getItem("tenant_id");
      if (stored) return stored;
    }
    return "";
  }, [menu]);

  const publicApiKey = tenantId ? `pk_live_${tenantId.replace(/-/g, "")}` : "pk_live_sample";
  const projectId = selectedProjectId || menu?.projectId || "";

  // Load Menu Data
  const loadMenu = async () => {
    setLoading(true);
    try {
      let data = await fetchMenuByIdApi(menuId, selectedProjectId);
      if (!data && selectedProjectId) {
        // Fallback: search in list
        const list = await fetchMenusApi(selectedProjectId);
        data = list.find((m) => m.id === menuId || m.slug === menuId) || null;
      }
      setMenu(data);
    } catch (err) {
      console.error("Failed to load menu details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (menuId) {
      loadMenu();
    }
  }, [menuId, selectedProjectId]);

  // Determine menu identifier (slug or UUID)
  const menuIdentifier = useMemo(() => {
    if (!menu) return menuId;
    return useSlug && menu.slug ? menu.slug : menu.id;
  }, [menu, useSlug, menuId]);

  // Construct URLs
  const singleEndpointUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (format !== "flat") {
      params.append("format", format);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return `${apiBaseUrl}/public/menus/${menuIdentifier}${query}`;
  }, [apiBaseUrl, menuIdentifier, format]);

  const listEndpointUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (locationFilter && locationFilter !== "all") {
      params.append("location", locationFilter);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return `${apiBaseUrl}/public/menus${query}`;
  }, [apiBaseUrl, locationFilter]);

  const activeEndpointUrl = activeEndpoint === "single" ? singleEndpointUrl : listEndpointUrl;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (toast) toast.showToast(`Copied ${label} to clipboard!`, "success");
  };

  // Live Test Execution
  const handleExecuteLiveTest = async () => {
    if (!activeEndpointUrl) return;
    setIsTesting(true);
    setTestResponseStatus(null);
    setTestResponseHeaders(null);
    setTestResponseBody(null);

    try {
      const headers: Record<string, string> = {
        "X-API-Key": publicApiKey,
        Accept: "application/json",
      };
      if (projectId) {
        headers["X-Project-Id"] = projectId;
      }

      const res = await fetch(activeEndpointUrl, { headers });
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
    const compName = menu?.name ? menu.name.replace(/[^a-zA-Z0-9]/g, "") : "Navigation";
    return `// Next.js Server Component (ISR with 60s Revalidation)
import Link from 'next/link';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: string;
  targetBlank?: boolean;
  children?: MenuItem[];
}

interface MenuResponse {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

async function getMenu(): Promise<MenuResponse> {
  const res = await fetch(
    '${activeEndpointUrl}',
    {
      headers: {
        'X-API-Key': '${publicApiKey}'${projectId ? `,\n        'X-Project-Id': '${projectId}'` : ""}
      },
      next: { revalidate: 60 } // Automatic ISR caching
    }
  );

  if (!res.ok) throw new Error('Failed to fetch menu data');
  return res.json();
}

export default async function ${compName}Bar() {
  const menu = await getMenu();

  return (
    <nav className="flex items-center gap-6 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="font-bold text-lg text-slate-900 dark:text-white">
        {menu.name}
      </div>
      <ul className="flex items-center gap-4 text-sm font-medium">
        {menu.items.map((item) => (
          <li key={item.id} className="relative group">
            <Link
              href={item.url}
              target={item.targetBlank ? '_blank' : undefined}
              rel={item.targetBlank ? 'noopener noreferrer' : undefined}
              className="text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-brand-400 transition"
            >
              {item.label}
              {item.children && item.children.length > 0 && (
                <span className="ml-1 text-xs opacity-70">▼</span>
              )}
            </Link>

            {/* Dropdown Menu for child items */}
            {item.children && item.children.length > 0 && (
              <ul className="absolute left-0 top-full hidden group-hover:block bg-white dark:bg-slate-800 shadow-xl rounded-xl p-2 min-w-[180px] border border-slate-100 dark:border-slate-700 z-50">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.url}
                      target={child.targetBlank ? '_blank' : undefined}
                      className="block px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
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
async function fetchMenuNavigation() {
  const response = await fetch('${activeEndpointUrl}', {
    method: 'GET',
    headers: {
      'X-API-Key': '${publicApiKey}',${projectId ? `\n      'X-Project-Id': '${projectId}',` : ""}
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const menu = await response.json();
  console.log('Navigation Menu:', menu);
  return menu;
}

fetchMenuNavigation();`;
  };

  const getPythonSnippet = () => {
    return `# Python requests
import requests

url = "${activeEndpointUrl}"
headers = {
    "X-API-Key": "${publicApiKey}"${projectId ? `,\n    "X-Project-Id": "${projectId}"` : ""},
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
response.raise_for_status()

menu = response.json()
print("Menu name:", menu.get("name"))
print("Items count:", len(menu.get("items", [])))`;
  };

  const currentCodeSnippet =
    activeCodeTab === "nextjs"
      ? getNextJsSnippet()
      : activeCodeTab === "curl"
      ? getCurlSnippet()
      : activeCodeTab === "js"
      ? getJsSnippet()
      : getPythonSnippet();

  // AI Prompt Generator
  const generateAiPrompt = () => {
    const menuName = menu?.name || "Navigation Menu";
    const sampleItems = menu?.items ? JSON.stringify(menu.items.slice(0, 5), null, 2) : "[]";
    return `I need you to build a responsive, accessible navigation bar / header component in my Next.js / React project using Tailwind CSS that consumes the Headless Navigation Menu REST API for '${menuName}'.

API Details:
- Endpoint: ${activeEndpointUrl}
- Method: GET
- Headers:
  - X-API-Key: ${publicApiKey}
  - X-Project-Id: ${projectId}
  - Accept: application/json
- Format: ${format === "tree" ? "Hierarchical tree with nested 'children: [...]'" : "Flat array with 'parentId' and 'level'"}

Sample Menu Payload:
{
  "id": "${menu?.id || menuId}",
  "name": "${menuName}",
  "slug": "${menu?.slug || "menu-slug"}",
  "items": ${sampleItems}
}

Requirements:
1. Create a modern TypeScript Navigation component (e.g. Header / Navbar) that fetches and displays this menu.
2. If building for Next.js, use Server Components with Incremental Static Regeneration (ISR, e.g. next: { revalidate: 60 }) for fast performance and instant SEO.
3. Support multi-level dropdowns for items with children (with smooth transitions and mobile drawer view).
4. Implement accessible navigation (role="navigation", aria-expanded for dropdowns, keyboard focus support).
5. Clean, production-ready code with responsive Tailwind CSS styling (desktop horizontal bar + mobile hamburger sheet).`;
  };

  const handleCopyPrompt = () => {
    const promptText = generateAiPrompt();
    navigator.clipboard.writeText(promptText);
    if (toast) toast.showToast("Copied AI implementation prompt to clipboard!", "success");
  };

  // Active locations labels
  const activeLocations = useMemo(() => {
    if (!menu?.locations) return [];
    const locs: string[] = [];
    if (menu.locations.primary) locs.push("Primary Navigation");
    if (menu.locations.footer) locs.push("Footer Menu");
    if (menu.locations.mobile) locs.push("Mobile Navigation");
    if (menu.locations.topbar) locs.push("Top Bar Menu");
    return locs;
  }, [menu]);

  return (
    <AppLayout pageTitle={menu ? `${menu.name} APIs` : "Menu APIs"}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/menus" className="hover:text-brand-500 transition">
              Menus
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            {menu && (
              <>
                <Link href={`/menus?id=${menu.id}`} className="hover:text-brand-500 transition">
                  {menu.name}
                </Link>
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </>
            )}
            <span className="text-slate-900 dark:text-white font-bold">Public GET APIs</span>
          </div>

          {menu && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition transform active:scale-95"
                title="Get AI Prompt to generate frontend components"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                <span>Get Prompt</span>
              </button>

              <Link
                href={`/menus?id=${menu.id}`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <i className="fa-solid fa-pen-to-square text-xs text-brand-500"></i>
                <span>Edit in Studio</span>
              </Link>
            </div>
          )}
        </div>

        {/* Hero API Banner */}
        {loading ? (
          <div className="h-44 rounded-3xl glass-panel animate-pulse" />
        ) : menu ? (
          <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl relative overflow-hidden bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shrink-0">
                    <i className="fa-solid fa-bars-staggered text-lg"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                        {menu.name} API Gateway
                      </h2>
                      {activeLocations.map((loc) => (
                        <span
                          key={loc}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-500 border border-brand-500/20"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-mono text-slate-400">
                      Slug: <span className="text-brand-500 font-bold">/public/menus/{menu.slug || menu.id}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                  Automatically generated, CDN-cached public REST API for headless website navigation.
                  Supports nested hierarchical trees (`?format=tree`) and flat arrays for headers, footers, and mobile drawers.
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
                    onClick={() => handleCopy(`${apiBaseUrl}/public/menus/${menu.slug || menu.id}`, "Endpoint URL")}
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
            <p className="text-xs font-bold text-rose-500">Navigation menu not found.</p>
          </div>
        )}

        {menu && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Endpoints Navigator & Parameter Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Endpoint Tabs Bar */}
              <div className="glass-panel rounded-2xl p-2 border border-slate-200/50 dark:border-slate-800/50 shadow-md flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveEndpoint("single")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeEndpoint === "single"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">GET</span>
                  <span>Single Menu</span>
                </button>

                <button
                  onClick={() => setActiveEndpoint("list")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeEndpoint === "list"
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">GET</span>
                  <span>List All Project Menus</span>
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

              {/* Query Controls Configurator */}
              {activeEndpoint === "single" ? (
                <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-sliders text-brand-500"></i> Query Parameter Builder
                    </h3>
                    <span className="text-[11px] text-slate-400">Configure hierarchy serialization & identifier</span>
                  </div>

                  {/* Format Switcher */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Serialization Format (?format=...)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormat("tree")}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                          format === "tree"
                            ? "border-brand-500 bg-brand-500/10 dark:bg-brand-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                            format === "tree"
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-slate-400"
                          }`}
                        >
                          {format === "tree" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Hierarchical Tree (`tree`)</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 font-semibold">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Returns nested <code className="font-mono text-brand-500">children: []</code> arrays. Ideal for rendering multi-level navigation dropdowns.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormat("flat")}
                        className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                          format === "flat"
                            ? "border-brand-500 bg-brand-500/10 dark:bg-brand-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                            format === "flat"
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-slate-400"
                          }`}
                        >
                          {format === "flat" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Flat List (`flat`)
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Returns a linear array of items with <code className="font-mono text-brand-500">parentId</code> and <code className="font-mono text-brand-500">level</code>.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Identifier Switcher */}
                  <div className="space-y-2 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Menu URL Identifier
                    </label>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="menuIdType"
                          checked={useSlug}
                          onChange={() => setUseSlug(true)}
                          className="text-brand-500 focus:ring-brand-500"
                        />
                        <span>
                          Human-readable Slug: <code className="font-mono text-brand-500 font-bold">{menu.slug || "menu-slug"}</code>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="menuIdType"
                          checked={!useSlug}
                          onChange={() => setUseSlug(false)}
                          className="text-brand-500 focus:ring-brand-500"
                        />
                        <span>
                          Permanent UUID: <code className="font-mono text-slate-500">{menu.id}</code>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-filter text-brand-500"></i> Filter Project Menus
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Filter by Assigned Location (?location=...)
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="all">All Locations (Unfiltered)</option>
                      <option value="primary">primary (Primary Navigation)</option>
                      <option value="footer">footer (Footer Navigation)</option>
                      <option value="mobile">mobile (Mobile Menu)</option>
                      <option value="topbar">topbar (Top Bar)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Menu Items Matrix / Structure Inspector */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <i className="fa-solid fa-sitemap text-brand-500"></i> Menu Items Structure Matrix
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Total: <strong className="text-slate-900 dark:text-white">{menu.items.length}</strong> items
                  </span>
                </div>

                {menu.items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    This menu has no items. Add items in the Menu Studio to see them reflected here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Item Hierarchy & Label</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Target URL</th>
                          <th className="py-2.5 px-3 text-right">Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                        {menu.items.map((item: MenuItem, idx: number) => {
                          const indent = (item.level || 0) * 20;
                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2" style={{ paddingLeft: `${indent}px` }}>
                                  {item.level > 0 && (
                                    <i className="fa-solid fa-arrow-turn-down text-[10px] text-brand-500 -rotate-90"></i>
                                  )}
                                  <i
                                    className={`fa-solid ${item.icon || "fa-link"} text-xs text-slate-400`}
                                  ></i>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {item.label}
                                  </span>
                                  {item.level > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono text-slate-400">
                                      L{item.level}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-500 font-mono text-[10px] uppercase font-bold">
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                {item.url}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {item.targetBlank ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                                    _blank
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">same tab</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Code Snippets & Interactive Live Test Console (5 cols) */}
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
                        {testResponseStatus} {testResponseStatus === 304 ? "Not Modified" : testResponseStatus === 200 ? "OK" : "Error"}
                      </span>
                    </div>

                    {testResponseHeaders && (
                      <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800">
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

      {/* AI Implementation Prompt Modal Popup */}
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
                    Copy and paste this prompt into ChatGPT, Claude, Cursor, or Copilot to auto-generate a responsive navigation bar.
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
                  Tailored for Navigation Menus
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-y-auto max-h-96 border border-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner select-all">
                {generateAiPrompt()}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Includes format <code className="text-slate-300">?format={format}</code> & headers
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
