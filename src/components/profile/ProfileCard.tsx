"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";

export const ProfileCard: React.FC = () => {
  const { profile } = useOlio();

  return (
    <div className="max-w-xl mx-auto glass-panel p-6 rounded-2xl space-y-5">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.profile.avatar}
          alt={profile.profile.name}
          className="w-16 h-16 rounded-2xl object-cover ring-4 ring-brand-500/20"
        />
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{profile.profile.name}</h2>
          <p className="text-xs text-slate-500">{profile.profile.role}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            value={profile.profile.name}
            onChange={(e) => profile.updateProfileFields({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            value={profile.profile.email}
            onChange={(e) => profile.updateProfileFields({ email: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Headless API Endpoint Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={profile.profile.apiKey}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-mono glass-card border border-slate-200 dark:border-slate-800 text-slate-500"
            />
            <button
              onClick={profile.copyApiKey}
              className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-end">
        <button
          onClick={profile.saveProfile}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition shadow-md shadow-brand-500/20"
        >
          Save Profile Changes
        </button>
      </div>
    </div>
  );
};
