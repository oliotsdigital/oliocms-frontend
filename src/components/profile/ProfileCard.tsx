"use client";

import React, { useState } from "react";
import { useOlio } from "@/state/OlioProvider";
import { changePasswordApi } from "@/api/auth.api";

export const ProfileCard: React.FC = () => {
  const { profile, toast } = useOlio();

  // Change Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      if (toast) toast.showToast("Please enter a new password", "error");
      return;
    }

    if (newPassword.length < 6) {
      if (toast) toast.showToast("Password must be at least 6 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      if (toast) toast.showToast("New passwords do not match!", "error");
      return;
    }

    setIsChangingPassword(true);
    const res = await changePasswordApi(newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      if (toast) toast.showToast(res.message || "Password updated successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      if (toast) toast.showToast(res.message || "Failed to update password", "error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* User Information Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          {profile.profile.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.profile.avatar}
              alt={profile.profile.name || "Profile"}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-brand-500/20 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-xl ring-4 ring-brand-500/20 shadow-lg">
              <i className="fa-solid fa-user"></i>
            </div>
          )}
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {profile.profile.name || "Your profile"}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {profile.profile.role}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.profile.name}
              placeholder="Full name"
              onChange={(e) => profile.updateProfileFields({ name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile.profile.email}
              placeholder="you@example.com"
              onChange={(e) => profile.updateProfileFields({ email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Headless API Endpoint Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={profile.profile.apiKey}
                placeholder="No API key yet"
                className="flex-1 px-3 py-2.5 rounded-xl text-xs font-mono glass-card border border-slate-200 dark:border-slate-800 text-slate-500"
              />
              <button
                onClick={profile.copyApiKey}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-md shadow-brand-500/20"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-end">
          <button
            onClick={profile.saveProfile}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <i className="fa-solid fa-check text-xs"></i>
            <span>Save Profile Changes</span>
          </button>
        </div>
      </div>

      {/* Security & Change Password Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-base">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Security & Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your account authentication password (minimum 6 characters)
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Must contain at least 6 characters.
            </p>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              {isChangingPassword ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-lock text-xs"></i>
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

