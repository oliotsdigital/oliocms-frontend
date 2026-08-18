"use client";

import React from "react";
import { AuthForm } from "@/models/auth.model";

interface LoginFormCardProps {
  authForm: AuthForm;
  isDarkMode: boolean;
  onFormChange: (fields: Partial<AuthForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleTheme: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginFormCard: React.FC<LoginFormCardProps> = ({
  authForm,
  isDarkMode,
  onFormChange,
  onSubmit,
  onToggleTheme,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  return (
    <>
      {/* Top Right Corner Screen Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onToggleTheme}
          type="button"
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-500 transition shadow-md"
          title="Toggle Theme"
        >
          <i
            className={`fa-solid ${
              isDarkMode ? "fa-sun text-amber-400" : "fa-moon text-slate-600"
            }`}
          ></i>
        </button>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Centered Logo Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDarkMode ? "/logos/oliocms_logo_dark.png" : "/logos/oliocms_logo_light.png"}
            alt="OlioCMS Logo"
            className="h-16 md:h-18 w-auto max-w-full object-contain mb-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector(".auth-logo-fallback")) {
                const fallback = document.createElement("div");
                fallback.className = "auth-logo-fallback flex items-center justify-center gap-2.5 mb-2";
                fallback.innerHTML = `<div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30 text-white font-bold text-xl"><i class="fa-solid fa-cubes"></i></div><span class="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Olio<span class="text-brand-500">CMS</span></span>`;
                parent.prepend(fallback);
              }
            }}
          />
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log in to manage your headless content.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <i className="fa-regular fa-envelope absolute left-3 top-3 text-slate-400 text-xs"></i>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => onFormChange({ email: e.target.value })}
                required
                placeholder="admin@oliocms.io"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                onClick={onForgotPassword}
                type="button"
                className="text-[11px] text-brand-500 hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-400 text-xs"></i>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => onFormChange({ password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <span>Sign In</span>
            <i className="fa-solid fa-right-to-bracket text-xs"></i>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <button
              onClick={onSwitchToRegister}
              type="button"
              className="text-brand-500 font-semibold hover:underline ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </>
  );
};
