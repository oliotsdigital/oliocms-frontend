"use client";

import React from "react";
import { MediaItem } from "@/models/media.model";

interface MediaGridProps {
  mediaList: MediaItem[];
  onDeleteMedia: (id: number | string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaList,
  onDeleteMedia,
}) => {
  if (mediaList.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <i className="fa-solid fa-images text-3xl text-slate-400 mb-2"></i>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No media assets found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {mediaList.map((item) => (
        <div key={item.id} className="glass-card rounded-xl p-2.5 space-y-2 group relative">
          <div className="aspect-square rounded-lg overflow-hidden relative bg-slate-900/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <button
              onClick={() => onDeleteMedia(item.id)}
              className="absolute top-2 right-2 w-6 h-6 rounded-md bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
              title="Delete File"
            >
              <i className="fa-solid fa-trash text-[10px]"></i>
            </button>
          </div>

          <div>
            <p className="text-[11px] font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
              <span>{item.size}</span>
              <span className="uppercase font-mono">{item.format}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
