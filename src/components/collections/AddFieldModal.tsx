"use client";

import React, { useState } from "react";
import { FieldType } from "@/models/collection.model";

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFieldType: (type: FieldType, title: string) => void;
}

interface FieldOption {
  type: FieldType;
  title: string;
  description: string;
  badge: React.ReactNode;
  category: "default" | "custom";
}

const FIELD_OPTIONS: FieldOption[] = [
  {
    type: "string",
    title: "Text",
    description: "Small or long text like title or description",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        Aa
      </span>
    ),
    category: "default",
  },
  {
    type: "boolean",
    title: "Boolean",
    description: "Yes or no, 1 or 0, true or false",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-toggle-on"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "richtext",
    title: "Rich text (Blocks)",
    description: "The new JSON-based rich text editor",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-list-check"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "json",
    title: "JSON",
    description: "Data in JSON format",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0">
        {"{}"}
      </span>
    ),
    category: "default",
  },
  {
    type: "number",
    title: "Number",
    description: "Numbers (integer, float, decimal)",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0">
        123
      </span>
    ),
    category: "default",
  },
  {
    type: "email",
    title: "Email",
    description: "Email field with validations format",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        @
      </span>
    ),
    category: "default",
  },
  {
    type: "date",
    title: "Date",
    description: "A date picker with hours, minutes and seconds",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-calendar-days"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "password",
    title: "Password",
    description: "Password field with encryption",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-lock"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "media",
    title: "Media",
    description: "Files like images, videos, etc",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-photo-film"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "enumeration",
    title: "Enumeration",
    description: "List of values, then pick one",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-list-ul"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "relation",
    title: "Relation",
    description: "Refers to a Collection Type",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-link"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "uid",
    title: "UID",
    description: "Unique identifier",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-key"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "markdown",
    title: "Rich text (Markdown)",
    description: "The classic rich text editor",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-file-pen"></i>
      </span>
    ),
    category: "default",
  },
  {
    type: "component",
    title: "Component",
    description: "Group of fields that you can repeat or reuse",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-cubes"></i>
      </span>
    ),
    category: "custom",
  },
  {
    type: "dynamiczone",
    title: "Dynamic zone",
    description: "Dynamically pick component when editing content",
    badge: (
      <span className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <i className="fa-solid fa-infinity"></i>
      </span>
    ),
    category: "custom",
  },
];

export const AddFieldModal: React.FC<AddFieldModalProps> = ({
  isOpen,
  onClose,
  onSelectFieldType,
}) => {
  const [activeTab, setActiveTab] = useState<"default" | "custom">("default");

  if (!isOpen) return null;

  const displayedOptions = FIELD_OPTIONS.filter((opt) => opt.category === activeTab);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/40 dark:border-slate-800/40">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-sliders text-brand-500"></i>
              Select a field for your collection type
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose a property type to add to your collection schema definition
            </p>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-center">
            {/* Tabs */}
            <div className="flex items-center gap-4 text-xs font-bold tracking-wider uppercase">
              <button
                type="button"
                onClick={() => setActiveTab("default")}
                className={`pb-1 transition border-b-2 ${
                  activeTab === "default"
                    ? "text-brand-500 border-brand-500"
                    : "text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                DEFAULT
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`pb-1 transition border-b-2 ${
                  activeTab === "custom"
                    ? "text-brand-500 border-brand-500"
                    : "text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                CUSTOM
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition flex items-center justify-center"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Options Grid Body */}
        <div className="py-6 overflow-y-auto max-h-[65vh] pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedOptions.map((opt) => (
              <div
                key={opt.type}
                onClick={() => {
                  onSelectFieldType(opt.type, opt.title);
                  onClose();
                }}
                className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/50 transition-all duration-200 flex items-start gap-4 shadow-sm hover:shadow-xl"
              >
                {opt.badge}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
