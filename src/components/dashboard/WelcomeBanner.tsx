"use client";

import React from "react";

interface WelcomeBannerProps {
  userName?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userName }) => {
  return (
    <div className="pt-1">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Welcome to OlioCMS{userName ? `, ${userName}` : ""}!
      </h1>
    </div>
  );
};
