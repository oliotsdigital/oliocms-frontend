"use client";

import React from "react";
import Link from "next/link";
import { ChecklistState } from "@/models/checklist.model";

interface SetupChecklistProps {
  checklist: ChecklistState;
  completedCount: number;
  progressPercent: number;
  dismissed: boolean;
  onDismiss: () => void;
  onToggleItem: (key: keyof ChecklistState) => void;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({
  checklist,
  progressPercent,
  dismissed,
  onDismiss,
  onToggleItem,
}) => {
  if (dismissed) return null;

  const taskItems: {
    key: keyof ChecklistState;
    label: string;
    href: string;
  }[] = [
    { key: "profile", label: "Complete user profile", href: "/profile-settings" },
    { key: "collections", label: "Explore content collections", href: "/collections" },
  ];

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-300/80 dark:border-slate-800/80">
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-300/60 dark:divide-slate-800/60">
        
        {/* Left Column: Guided Tour Overview */}
        <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="text-2xl">👋</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Discover your application!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Follow the guided tour to get the most out of OlioCMS.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {progressPercent}% completed
              </span>
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div>
              <button
                onClick={onDismiss}
                className="px-4 py-2 rounded-xl glass-card border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition shadow-sm"
              >
                Close guided tour
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Initial Setup Tasks List */}
        <div className="md:col-span-7 p-6 md:p-8 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Your tasks
          </h3>

          <div className="glass-card rounded-xl p-3 md:p-4 space-y-2.5 border border-slate-200/80 dark:border-slate-800/80">
            {taskItems.map((item) => {
              const isDone = checklist[item.key];
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg transition hover:bg-slate-200/30 dark:hover:bg-slate-800/30"
                >
                  <div
                    onClick={() => onToggleItem(item.key)}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : "border-2 border-slate-400 dark:border-slate-600"
                      }`}
                    >
                      {isDone && <i className="fa-solid fa-check text-[10px]"></i>}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isDone
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {isDone ? (
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      Done
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-[11px] font-medium text-brand-500 hover:text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <span>Start task</span>
                      <i className="fa-solid fa-chevron-right text-[9px]"></i>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
