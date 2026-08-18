"use client";

import React from "react";

interface WelcomeBannerProps {
  userName?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userName = "Alex" }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-gradient-to-r from-brand-600/10 via-purple-600/5 to-transparent">
      <div className="max-w-xl">
        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
          Onboarding Wizard
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
          Welcome to OlioCMS, {userName}!
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Complete your store setup checklist below to initialize your GraphQL & REST API endpoints for product syncing.
        </p>
      </div>
    </div>
  );
};
