"use client";

import React from "react";
import { AuthForm } from "@/models/auth.model";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface RegisterFormCardProps {
  authForm: AuthForm;
  isDarkMode: boolean;
  isLoading?: boolean;
  onFormChange: (fields: Partial<AuthForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleTheme: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterFormCard: React.FC<RegisterFormCardProps> = ({
  authForm,
  isDarkMode,
  isLoading = false,
  onFormChange,
  onSubmit,
  onToggleTheme,
  onSwitchToLogin,
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
          <BrandLogo className="h-16 md:h-[4.5rem] max-w-full mb-2" />
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to OlioCMS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Signup to your OlioCMS account to start building.
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
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-400 text-xs"></i>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => onFormChange({ password: e.target.value })}
                required
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <i className="fa-solid fa-shield-halved absolute left-3 top-3 text-slate-400 text-xs"></i>
              <input
                type="password"
                value={authForm.confirmPassword || ""}
                onChange={(e) => onFormChange({ confirmPassword: e.target.value })}
                required
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Olio Account</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              type="button"
              className="text-brand-500 font-semibold hover:underline ml-1"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </>
  );
};
