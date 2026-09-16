"use client";

import React, { useState } from "react";
import { useOlio } from "@/state/OlioProvider";

interface FrontendSeoHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCollectionSlug?: string;
}

export const FrontendSeoHelpModal: React.FC<FrontendSeoHelpModalProps> = ({
  isOpen,
  onClose,
  selectedCollectionSlug = "blog-posts",
}) => {
  const { toast } = useOlio();
  const [activeTab, setActiveTab] = useState<"nextjs-app" | "nextjs-pages" | "nuxt" | "api">("nextjs-app");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(label);
    if (toast) toast.showToast(`${label} copied to clipboard!`, "success");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const nextAppRouterCode = `// app/[collection]/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { collection: string; slug: string };
}

// 1. Fetch record from OlioCMS Public API Gateway
async function fetchOlioRecord(collectionSlug: string, recordSlug: string) {
  const apiBase = process.env.NEXT_PUBLIC_OLIO_API_URL || 'https://api.oliocms.com';
  const apiKey = process.env.OLIO_PUBLIC_API_KEY || 'pk_live_YOUR_TENANT_ID';

  const res = await fetch(\`\${apiBase}/public/collections/\${collectionSlug}/records?slug=\${recordSlug}\`, {
    headers: { 'X-API-Key': apiKey },
    next: { revalidate: 60 } // ISR Cache for 60 seconds
  });

  if (!res.ok) return null;
  const result = await res.json();
  return result.data?.[0] || null;
}

// 2. Dynamically Generate Metadata using OlioCMS SEO Fields
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const record = await fetchOlioRecord(params.collection, params.slug);
  if (!record) return { title: 'Page Not Found' };

  const data = record.data || {};
  const seo = data.seo || {};

  // Smart Fallback Hierarchy: Custom Meta Title -> Record Title -> Fallback Title
  const title = seo.title || data.title || data.name || 'Default Site Title';
  const description = seo.description || data.summary || data.description || '';
  const image = seo.og_image || data.featured_image || data.cover_image || '/images/default-og.png';
  const canonicalUrl = seo.canonical_url || \`https://yourwebsite.com/\${params.collection}/\${params.slug}\`;

  return {
    title,
    description,
    keywords: seo.keywords ? seo.keywords.split(',').map((k: string) => k.trim()) : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !seo.no_index,
      follow: !seo.no_index,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

// 3. Render Page with JSON-LD Structured Data
export default async function RecordPage({ params }: PageProps) {
  const record = await fetchOlioRecord(params.collection, params.slug);
  if (!record) notFound();

  const data = record.data || {};
  const seo = data.seo || {};

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seo.title || data.title,
    description: seo.description || data.summary,
    image: seo.og_image || data.featured_image,
    datePublished: record.created_at,
    dateModified: record.updated_at,
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      {/* Inject JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-4xl font-bold">{data.title}</h1>
      <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
    </main>
  );
}`;

  const nextSitemapCode = `// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yourwebsite.com';

  // Fetch all record slugs from OlioCMS for the target collection
  const res = await fetch('https://api.oliocms.com/public/collections/${selectedCollectionSlug}/records', {
    headers: { 'X-API-Key': process.env.OLIO_PUBLIC_API_KEY! },
    next: { revalidate: 3600 } // Cache sitemap for 1 hour
  });
  const { data: records } = await res.json();

  const dynamicRecords: MetadataRoute.Sitemap = (records || [])
    .filter((r: any) => !r.data?.seo?.no_index) // Exclude search-hidden records
    .map((record: any) => ({
      url: \`\${baseUrl}/${selectedCollectionSlug}/\${record.data.slug}\`,
      lastModified: new Date(record.updated_at || record.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...dynamicRecords,
  ];
}`;

  const nextPagesCode = `// pages/[collection]/[slug].tsx (Next.js Pages Router / React)
import Head from 'next/head';
import { GetServerSideProps } from 'next';

interface RecordPageProps {
  record: any;
}

export default function RecordPage({ record }: RecordPageProps) {
  if (!record) return <div>Record Not Found</div>;

  const data = record.data || {};
  const seo = data.seo || {};

  const title = seo.title || data.title || 'My Website';
  const description = seo.description || data.summary || '';
  const image = seo.og_image || data.featured_image || '/default-og.jpg';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {seo.keywords && <meta name="keywords" content={seo.keywords} />}
        {seo.no_index && <meta name="robots" content="noindex, nofollow" />}
        {seo.canonical_url && <link rel="canonical" href={seo.canonical_url} />}

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:type" content="article" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Head>

      <main className="container mx-auto p-6">
        <h1>{data.title}</h1>
        <article dangerouslySetInnerHTML={{ __html: data.content }} />
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const res = await fetch(
    \`https://api.oliocms.com/public/collections/\${params?.collection}/records?slug=\${params?.slug}\`,
    { headers: { 'X-API-Key': process.env.OLIO_PUBLIC_API_KEY! } }
  );
  const result = await res.json();
  return { props: { record: result.data?.[0] || null } };
};`;

  const nuxtCode = `<!-- pages/[collection]/[slug].vue (Nuxt 3) -->
<script setup>
const route = useRoute();

const { data: res } = await useFetch(
  \`https://api.oliocms.com/public/collections/\${route.params.collection}/records?slug=\${route.params.slug}\`,
  {
    headers: { 'X-API-Key': 'pk_live_YOUR_TENANT_ID' }
  }
);

const record = computed(() => res.value?.data?.[0]);
const data = computed(() => record.value?.data || {});
const seo = computed(() => data.value.seo || {});

// Bind reactive SEO metadata using Nuxt useSeoMeta
useSeoMeta({
  title: () => seo.value.title || data.value.title || 'Default Title',
  description: () => seo.value.description || data.value.summary || '',
  ogTitle: () => seo.value.title || data.value.title,
  ogDescription: () => seo.value.description || data.value.summary,
  ogImage: () => seo.value.og_image || data.value.featured_image,
  twitterCard: 'summary_large_image',
  robots: () => (seo.value.no_index ? 'noindex, nofollow' : 'index, follow')
});
</script>

<template>
  <div class="container mx-auto py-8">
    <h1 class="text-3xl font-bold">{{ data.title }}</h1>
    <div v-html="data.content"></div>
  </div>
</template>`;

  const apiPayloadCode = `// OlioCMS Public Record API Endpoint Response:
// GET /public/collections/${selectedCollectionSlug}/records?slug=my-first-post
{
  "status": "success",
  "data": [
    {
      "id": "e8d64121-6a2c-47b2-b439-d3e712a43b10",
      "created_at": "2026-09-16T12:00:00Z",
      "updated_at": "2026-09-16T14:30:00Z",
      "data": {
        "title": "Getting Started with OlioCMS Headless Architecture",
        "slug": "getting-started-oliocms",
        "content": "<p>OlioCMS provides fast dynamic content APIs...</p>",
        "featured_image": "/uploads/featured-cover.jpg",
        
        "seo": {
          "title": "Getting Started with OlioCMS Headless Architecture | Masterclass",
          "description": "Learn how to integrate OlioCMS as your headless content backend with Next.js, Nuxt, and React applications.",
          "keywords": "headless cms, oliocms, nextjs, seo",
          "canonical_url": "https://yourwebsite.com/blog/getting-started-oliocms",
          "og_image": "https://cdn.yourwebsite.com/uploads/featured-cover.jpg",
          "no_index": false
        }
      }
    }
  ]
}`;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[130] p-4 overflow-y-auto">
      <div
        className="w-full max-w-4xl glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <i className="fa-solid fa-code text-base"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Frontend SEO Integration Guide
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  SDK & API
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Learn how to consume, map, and render OlioCMS SEO metadata in your frontend website
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200/40 dark:border-slate-800/40 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("nextjs-app")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
              activeTab === "nextjs-app"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <i className="fa-brands fa-react text-sm"></i> Next.js App Router (13+)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("nextjs-pages")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
              activeTab === "nextjs-pages"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <i className="fa-solid fa-file-code text-sm"></i> Next.js Pages / React
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("nuxt")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
              activeTab === "nuxt"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <i className="fa-brands fa-vuejs text-sm"></i> Nuxt 3 (Vue)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("api")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
              activeTab === "api"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <i className="fa-solid fa-network-wired text-sm"></i> API JSON Payload
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Steps Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-brand-500/15 text-brand-500 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Fetch Record</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Call <code className="text-brand-500">/public/collections/{selectedCollectionSlug}/records</code>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-sky-500/15 text-sky-500 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Read _seo Payload</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Map title, description, OG image & indexing directives
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Render Tags & XML</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Inject HTML head tags, JSON-LD & dynamic <code className="text-emerald-500">sitemap.xml</code>
                </p>
              </div>
            </div>
          </div>

          {/* Code Viewer Section */}
          {activeTab === "nextjs-app" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <i className="fa-solid fa-file-code text-brand-500"></i> Next.js App Router Page & Metadata Mapping
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(nextAppRouterCode, "Next.js App Router Code")}
                    className="px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-500 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-brand-500/30"
                  >
                    <i className={`fa-solid ${copiedKey === "Next.js App Router Code" ? "fa-check" : "fa-copy"}`}></i>
                    <span>{copiedKey === "Next.js App Router Code" ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[340px]">
                  <pre>{nextAppRouterCode}</pre>
                </div>
              </div>

              {/* Sitemap Code Snippet */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <i className="fa-solid fa-sitemap text-emerald-500"></i> Dynamic Dynamic Sitemap Generator (app/sitemap.ts)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(nextSitemapCode, "Sitemap Code")}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <i className={`fa-solid ${copiedKey === "Sitemap Code" ? "fa-check" : "fa-copy"}`}></i>
                    <span>{copiedKey === "Sitemap Code" ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[220px]">
                  <pre>{nextSitemapCode}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === "nextjs-pages" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <i className="fa-solid fa-file-code text-brand-500"></i> Next.js Pages Router & React Head
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(nextPagesCode, "Pages Router Code")}
                  className="px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-500 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-brand-500/30"
                >
                  <i className={`fa-solid ${copiedKey === "Pages Router Code" ? "fa-check" : "fa-copy"}`}></i>
                  <span>{copiedKey === "Pages Router Code" ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[420px]">
                <pre>{nextPagesCode}</pre>
              </div>
            </div>
          )}

          {activeTab === "nuxt" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <i className="fa-brands fa-vuejs text-emerald-500"></i> Nuxt 3 useSeoMeta Integration
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(nuxtCode, "Nuxt 3 Code")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-emerald-500/30"
                >
                  <i className={`fa-solid ${copiedKey === "Nuxt 3 Code" ? "fa-check" : "fa-copy"}`}></i>
                  <span>{copiedKey === "Nuxt 3 Code" ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[420px]">
                <pre>{nuxtCode}</pre>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <i className="fa-solid fa-code-compare text-sky-500"></i> OlioCMS REST API Response Example
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(apiPayloadCode, "API Payload")}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500 text-sky-500 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-sky-500/30"
                >
                  <i className={`fa-solid ${copiedKey === "API Payload" ? "fa-check" : "fa-copy"}`}></i>
                  <span>{copiedKey === "API Payload" ? "Copied!" : "Copy Payload"}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[420px]">
                <pre>{apiPayloadCode}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <i className="fa-solid fa-circle-info text-brand-500"></i>
            <span>All public records automatically expose configured SEO metadata via API</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
