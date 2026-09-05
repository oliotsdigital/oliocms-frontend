"use client";

import { useState, useEffect, useCallback } from "react";
import { MenuSchema, MenuItem, MenuLocations, CreateMenuItemPayload } from "@/models/menu.model";

const DEFAULT_LOCATIONS: MenuLocations = {
  primary: true,
  footer: false,
  mobile: true,
  topbar: false,
};

const createDefaultMenus = (projectId?: string): MenuSchema[] => [
  {
    id: "menu-primary-default",
    projectId,
    name: "Primary Navigation",
    slug: "primary-navigation",
    autoAddPages: false,
    locations: {
      primary: true,
      footer: false,
      mobile: true,
      topbar: false,
    },
    items: [
      {
        id: "item-1",
        label: "Home",
        url: "/",
        type: "page",
        originalTitle: "Home",
        level: 0,
        targetBlank: false,
      },
      {
        id: "item-2",
        label: "About Us",
        url: "/about",
        type: "page",
        originalTitle: "About Us",
        level: 0,
        targetBlank: false,
      },
      {
        id: "item-3",
        label: "Services",
        url: "/services",
        type: "page",
        originalTitle: "Services",
        level: 0,
        targetBlank: false,
      },
      {
        id: "item-4",
        label: "Web Development",
        url: "/services/web-development",
        type: "custom",
        level: 1, // Sub item!
        targetBlank: false,
      },
      {
        id: "item-5",
        label: "SEO & Growth",
        url: "/services/seo",
        type: "custom",
        level: 1, // Sub item!
        targetBlank: false,
      },
      {
        id: "item-6",
        label: "Blog",
        url: "/blog",
        type: "page",
        originalTitle: "Blog",
        level: 0,
        targetBlank: false,
      },
      {
        id: "item-7",
        label: "Contact",
        url: "/contact",
        type: "page",
        originalTitle: "Contact",
        level: 0,
        targetBlank: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "menu-footer-default",
    projectId,
    name: "Footer Menu",
    slug: "footer-menu",
    autoAddPages: false,
    locations: {
      primary: false,
      footer: true,
      mobile: false,
      topbar: false,
    },
    items: [
      {
        id: "footer-1",
        label: "Privacy Policy",
        url: "/privacy-policy",
        type: "page",
        originalTitle: "Privacy Policy",
        level: 0,
        targetBlank: false,
      },
      {
        id: "footer-2",
        label: "Terms of Service",
        url: "/terms",
        type: "page",
        originalTitle: "Terms of Service",
        level: 0,
        targetBlank: false,
      },
      {
        id: "footer-3",
        label: "Support",
        url: "https://support.olioverse.com",
        type: "custom",
        level: 0,
        targetBlank: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useMenuState(projectId?: string) {
  const storageKey = `oliocms_menus_${projectId || "default"}`;
  const [menus, setMenus] = useState<MenuSchema[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [activeMenu, setActiveMenu] = useState<MenuSchema | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load menus from storage
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      let parsed: MenuSchema[] = [];
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse menus from local storage", e);
        }
      }

      if (!parsed || parsed.length === 0) {
        parsed = createDefaultMenus(projectId);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      }

      setMenus(parsed);
      const initialActive = parsed[0]?.id || "";
      setActiveMenuId(initialActive);
      setActiveMenu(parsed[0] ? JSON.parse(JSON.stringify(parsed[0])) : null);
      setIsDirty(false);
      setIsLoaded(true);
    } catch (err) {
      console.error("Error loading menus:", err);
      setIsLoaded(true);
    }
  }, [storageKey, projectId]);

  // Handle switching active menu
  const selectMenu = useCallback(
    (id: string) => {
      const found = menus.find((m) => m.id === id);
      if (found) {
        setActiveMenuId(id);
        setActiveMenu(JSON.parse(JSON.stringify(found)));
        setIsDirty(false);
      }
    },
    [menus]
  );

  // Update active menu name
  const updateActiveMenuName = useCallback((name: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);
      return {
        ...prev,
        name,
        slug: name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-"),
      };
    });
  }, []);

  // Update locations
  const updateActiveMenuLocations = useCallback((locs: Partial<MenuLocations>) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);
      return {
        ...prev,
        locations: { ...prev.locations, ...locs },
      };
    });
  }, []);

  // Update autoAddPages
  const updateActiveMenuAutoAddPages = useCallback((autoAdd: boolean) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);
      return { ...prev, autoAddPages: autoAdd };
    });
  }, []);

  // Add items to current menu
  const addItemsToActiveMenu = useCallback((itemsToAdd: CreateMenuItemPayload[]) => {
    if (!itemsToAdd.length) return;
    setActiveMenu((prev) => {
      if (!prev) return null;
      const newItems: MenuItem[] = itemsToAdd.map((payload) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        label: payload.label,
        url: payload.url,
        type: payload.type,
        originalTitle: payload.originalTitle,
        icon: payload.icon,
        level: 0,
        targetBlank: false,
      }));

      setIsDirty(true);
      return {
        ...prev,
        items: [...prev.items, ...newItems],
      };
    });
  }, []);

  // Update specific item
  const updateMenuItem = useCallback((itemId: string, patch: Partial<MenuItem>) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);
      return {
        ...prev,
        items: prev.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      };
    });
  }, []);

  // Remove specific item
  const removeMenuItem = useCallback((itemId: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);
      const index = prev.items.findIndex((it) => it.id === itemId);
      if (index === -1) return prev;

      // If removed item had children, promote their level by 1
      const itemToRemove = prev.items[index];
      const newItems = prev.items.filter((it) => it.id !== itemId);
      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  // Move item up / down
  const moveMenuItem = useCallback((itemId: string, direction: "up" | "down") => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      const index = prev.items.findIndex((it) => it.id === itemId);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.items.length - 1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const newItems = [...prev.items];
      const [movedItem] = newItems.splice(index, 1);
      newItems.splice(targetIndex, 0, movedItem);

      // If moved to first index, level must be 0
      if (targetIndex === 0) {
        movedItem.level = 0;
      }

      setIsDirty(true);
      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  // Indent item (WordPress sub-item)
  const indentMenuItem = useCallback((itemId: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      const index = prev.items.findIndex((it) => it.id === itemId);
      if (index <= 0) return prev; // Cannot indent first item

      const prevItem = prev.items[index - 1];
      const currentItem = prev.items[index];
      
      // Maximum level 2 (Parent -> Child -> Grandchild)
      // Level cannot be more than prevItem.level + 1
      const maxAllowed = Math.min(2, prevItem.level + 1);
      if (currentItem.level >= maxAllowed) return prev;

      const newLevel = currentItem.level + 1;
      setIsDirty(true);
      return {
        ...prev,
        items: prev.items.map((it, idx) =>
          idx === index ? { ...it, level: newLevel } : it
        ),
      };
    });
  }, []);

  // Outdent item
  const outdentMenuItem = useCallback((itemId: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      const index = prev.items.findIndex((it) => it.id === itemId);
      if (index === -1) return prev;

      const currentItem = prev.items[index];
      if (currentItem.level <= 0) return prev;

      setIsDirty(true);
      return {
        ...prev,
        items: prev.items.map((it, idx) =>
          idx === index ? { ...it, level: currentItem.level - 1 } : it
        ),
      };
    });
  }, []);

  // Reorder items completely (for drag & drop)
  const reorderItems = useCallback((newItems: MenuItem[]) => {
    // Ensure first item is never indented
    if (newItems.length > 0 && newItems[0].level > 0) {
      newItems[0].level = 0;
    }
    setIsDirty(true);
    setActiveMenu((prev) => (prev ? { ...prev, items: newItems } : null));
  }, []);

  // Save active menu to local storage
  const saveMenu = useCallback(() => {
    if (!activeMenu) return false;

    const now = new Date().toISOString();
    const updatedActiveMenu: MenuSchema = {
      ...activeMenu,
      updatedAt: now,
    };

    const existingIndex = menus.findIndex((m) => m.id === activeMenu.id);
    let updatedList: MenuSchema[];
    if (existingIndex >= 0) {
      updatedList = menus.map((m) => (m.id === activeMenu.id ? updatedActiveMenu : m));
    } else {
      updatedList = [...menus, updatedActiveMenu];
    }

    setMenus(updatedList);
    setActiveMenu(updatedActiveMenu);
    setIsDirty(false);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      return true;
    } catch (e) {
      console.error("Failed to save menu to local storage:", e);
      return false;
    }
  }, [activeMenu, menus, storageKey]);

  // Create a brand new menu
  const createMenu = useCallback(
    (name: string) => {
      const trimmed = name.trim() || "New Menu";
      const newMenu: MenuSchema = {
        id: `menu-${Date.now()}`,
        projectId,
        name: trimmed,
        slug: trimmed
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-"),
        autoAddPages: false,
        locations: { ...DEFAULT_LOCATIONS, primary: false },
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [...menus, newMenu];
      setMenus(updated);
      setActiveMenuId(newMenu.id);
      setActiveMenu(newMenu);
      setIsDirty(false);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save new menu:", e);
      }

      return newMenu;
    },
    [menus, projectId, storageKey]
  );

  // Delete active menu
  const deleteMenu = useCallback(
    (id: string) => {
      const filtered = menus.filter((m) => m.id !== id);
      setMenus(filtered);
      try {
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      } catch (e) {
        console.error("Failed to persist after menu deletion:", e);
      }

      if (filtered.length > 0) {
        setActiveMenuId(filtered[0].id);
        setActiveMenu(JSON.parse(JSON.stringify(filtered[0])));
      } else {
        setActiveMenuId("");
        setActiveMenu(null);
      }
      setIsDirty(false);
    },
    [menus, storageKey]
  );

  return {
    menus,
    activeMenu,
    activeMenuId,
    isDirty,
    isLoaded,
    selectMenu,
    updateActiveMenuName,
    updateActiveMenuLocations,
    updateActiveMenuAutoAddPages,
    addItemsToActiveMenu,
    updateMenuItem,
    removeMenuItem,
    moveMenuItem,
    indentMenuItem,
    outdentMenuItem,
    reorderItems,
    saveMenu,
    createMenu,
    deleteMenu,
  };
}
