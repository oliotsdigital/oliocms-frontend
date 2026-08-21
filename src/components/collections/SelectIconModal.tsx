"use client";

import React, { useState } from "react";

interface SelectIconModalProps {
  isOpen: boolean;
  currentIcon?: string;
  onClose: () => void;
  onSelectIcon: (iconClass: string) => void;
}

export const ICON_CATEGORIES = [
  {
    name: "General & Content",
    icons: [
      { class: "fa-cube", label: "Cube" },
      { class: "fa-cubes", label: "Cubes" },
      { class: "fa-box", label: "Box / Product" },
      { class: "fa-layer-group", label: "Layer Group" },
      { class: "fa-newspaper", label: "Articles" },
      { class: "fa-file-lines", label: "Documents" },
      { class: "fa-pen-to-square", label: "Posts" },
      { class: "fa-images", label: "Gallery / Media" },
      { class: "fa-film", label: "Videos" },
      { class: "fa-quote-left", label: "Testimonials" },
    ],
  },
  {
    name: "Ecommerce & Business",
    icons: [
      { class: "fa-cart-shopping", label: "Cart" },
      { class: "fa-store", label: "Store" },
      { class: "fa-bag-shopping", label: "Products" },
      { class: "fa-receipt", label: "Invoices" },
      { class: "fa-credit-card", label: "Payments" },
      { class: "fa-dollar-sign", label: "Pricing" },
      { class: "fa-chart-line", label: "Analytics" },
      { class: "fa-briefcase", label: "Services" },
    ],
  },
  {
    name: "Users & Structure",
    icons: [
      { class: "fa-users", label: "Users / Team" },
      { class: "fa-user-tie", label: "Clients" },
      { class: "fa-address-book", label: "Contacts" },
      { class: "fa-folder", label: "Folders" },
      { class: "fa-tag", label: "Tags" },
      { class: "fa-list-check", label: "Tasks" },
      { class: "fa-database", label: "Database" },
      { class: "fa-sitemap", label: "Structure" },
    ],
  },
  {
    name: "System & Engagement",
    icons: [
      { class: "fa-star", label: "Reviews" },
      { class: "fa-heart", label: "Favorites" },
      { class: "fa-bookmark", label: "Bookmarks" },
      { class: "fa-comment", label: "Comments" },
      { class: "fa-bullhorn", label: "Announcements" },
      { class: "fa-gear", label: "Settings" },
      { class: "fa-shield-halved", label: "Security" },
      { class: "fa-calendar-days", label: "Events" },
      { class: "fa-globe", label: "Location" },
    ],
  },
];

export const SelectIconModal: React.FC<SelectIconModalProps> = ({
  isOpen,
  currentIcon = "fa-cube",
  onClose,
  onSelectIcon,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const handleSelect = (iconClass: string) => {
    onSelectIcon(iconClass);
    onClose();
  };

  const filteredCategories = ICON_CATEGORIES.map((cat) => ({
    ...cat,
    icons: cat.icons.filter(
      (ic) =>
        ic.label.toLowerCase().includes(search.toLowerCase()) ||
        ic.class.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.icons.length > 0);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className={`fa-solid ${currentIcon} text-brand-500`}></i>
              Select Sidebar Collection Icon
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose an icon to visually represent this collection in the navigation sidebar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl transition"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4 pb-2 shrink-0">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icon name or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Icon Grid Categories Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-5">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div key={category.name} className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {category.name}
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {category.icons.map((ic) => {
                    const isSelected = currentIcon === ic.class;
                    return (
                      <button
                        key={ic.class}
                        type="button"
                        onClick={() => handleSelect(ic.class)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center group ${
                          isSelected
                            ? "bg-brand-500/15 border-brand-500 text-brand-500 ring-2 ring-brand-500/30 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-brand-500/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <i className={`fa-solid ${ic.class} text-xl transition transform group-hover:scale-110 ${
                          isSelected ? "text-brand-500" : "text-slate-700 dark:text-slate-300"
                        }`}></i>
                        <span className="text-[11px] truncate max-w-full font-medium leading-tight">
                          {ic.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400">
              <i className="fa-solid fa-icons text-3xl mb-2 opacity-50"></i>
              <p className="text-xs">No icons matching &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
