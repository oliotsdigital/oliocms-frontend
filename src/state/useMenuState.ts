"use client";

import { useState, useEffect, useCallback } from "react";
import { MenuSchema, MenuItem, MenuLocations, CreateMenuItemPayload } from "@/models/menu.model";
import {
  fetchMenusApi,
  createMenuApi,
  updateMenuApi,
  deleteMenuApi,
} from "@/api/menu.api";

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
        type: "collection",
        originalTitle: "Articles",
        level: 0,
        targetBlank: false,
      },
      {
        id: "item-7",
        label: "Contact",
        url: "/contact",
        type: "page",
        originalTitle: "Contact Us",
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
        id: "f-1",
        label: "Privacy Policy",
        url: "/privacy",
        type: "page",
        originalTitle: "Privacy",
        level: 0,
        targetBlank: false,
      },
      {
        id: "f-2",
        label: "Terms of Service",
        url: "/terms",
        type: "page",
        originalTitle: "Terms",
        level: 0,
        targetBlank: false,
      },
      {
        id: "f-3",
        label: "Support",
        url: "/support",
        type: "custom",
        level: 0,
        targetBlank: false,
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

  // Load menus from backend API with fallback to local storage
  const loadMenus = useCallback(async () => {
    setIsLoaded(false);
    try {
      let apiMenus: MenuSchema[] = [];
      if (projectId) {
        apiMenus = await fetchMenusApi(projectId);
      }

      if (apiMenus && apiMenus.length > 0) {
        setMenus(apiMenus);
        setActiveMenuId(apiMenus[0].id);
        setActiveMenu(JSON.parse(JSON.stringify(apiMenus[0])));
        try {
          localStorage.setItem(storageKey, JSON.stringify(apiMenus));
        } catch (_) {}
      } else {
        // If backend returned empty for this project, seed default primary navigation
        if (projectId) {
          try {
            const defaultMenu = createDefaultMenus(projectId)[0];
            const created = await createMenuApi({
              name: defaultMenu.name,
              slug: defaultMenu.slug,
              autoAddPages: defaultMenu.autoAddPages,
              locations: defaultMenu.locations,
              items: defaultMenu.items,
              projectId,
            });
            setMenus([created]);
            setActiveMenuId(created.id);
            setActiveMenu(created);
            try {
              localStorage.setItem(storageKey, JSON.stringify([created]));
            } catch (_) {}
            setIsDirty(false);
            setIsLoaded(true);
            return;
          } catch (seedErr) {
            console.warn("Could not seed default menu to API, falling back to local defaults:", seedErr);
          }
        }

        // Local storage / defaults fallback
        const stored = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
        let parsed: MenuSchema[] = [];
        if (stored) {
          try {
            parsed = JSON.parse(stored);
          } catch (e) {}
        }
        if (!parsed || parsed.length === 0) {
          parsed = createDefaultMenus(projectId);
        }
        setMenus(parsed);
        setActiveMenuId(parsed[0]?.id || "");
        setActiveMenu(parsed[0] ? JSON.parse(JSON.stringify(parsed[0])) : null);
      }
    } catch (err) {
      console.error("Error loading menus:", err);
      const stored = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setMenus(parsed);
          setActiveMenuId(parsed[0]?.id || "");
          setActiveMenu(parsed[0] || null);
        } catch (_) {}
      }
    } finally {
      setIsDirty(false);
      setIsLoaded(true);
    }
  }, [projectId, storageKey]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

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
      return {
        ...prev,
        autoAddPages: autoAdd,
      };
    });
  }, []);

  // Add items to active menu
  const addItemsToActiveMenu = useCallback((payloads: CreateMenuItemPayload[]) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);

      const newItems: MenuItem[] = payloads.map((p, index) => ({
        id: `item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        label: p.label,
        url: p.url,
        type: p.type,
        originalTitle: p.originalTitle || p.label,
        level: 0,
        targetBlank: false,
        icon: p.icon,
      }));

      return {
        ...prev,
        items: [...prev.items, ...newItems],
      };
    });
  }, []);

  // Update a single menu item
  const updateMenuItem = useCallback((itemId: string, updates: Partial<MenuItem>) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);

      const updatedItems = prev.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      return {
        ...prev,
        items: updatedItems,
      };
    });
  }, []);

  // Remove a single menu item
  const removeMenuItem = useCallback((itemId: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);

      const updatedItems = prev.items.filter((item) => item.id !== itemId);
      return {
        ...prev,
        items: updatedItems,
      };
    });
  }, []);

  // Move item up or down
  const moveMenuItem = useCallback((itemId: string, direction: "up" | "down") => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      const index = prev.items.findIndex((i) => i.id === itemId);
      if (index < 0) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.items.length - 1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const copy = [...prev.items];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);

      setIsDirty(true);
      return {
        ...prev,
        items: copy,
      };
    });
  }, []);

  // Indent item (increase level up to 2)
  const indentMenuItem = useCallback((itemId: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      const index = prev.items.findIndex((i) => i.id === itemId);
      if (index <= 0) return prev; // Cannot indent first item

      const prevItem = prev.items[index - 1];
      const currentItem = prev.items[index];

      // Cannot indent more than 1 level deeper than previous item, max level 2
      const maxAllowedLevel = Math.min(2, prevItem.level + 1);
      if (currentItem.level >= maxAllowedLevel) return prev;

      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...currentItem,
        level: currentItem.level + 1,
        parentId: prevItem.id,
      };

      setIsDirty(true);
      return {
        ...prev,
        items: updatedItems,
      };
    });
  }, []);

  // Outdent item (decrease level down to 0)
  const outdentMenuItem = useCallback((itemId: string) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      const index = prev.items.findIndex((i) => i.id === itemId);
      if (index < 0) return prev;

      const currentItem = prev.items[index];
      if (currentItem.level <= 0) return prev;

      const updatedItems = [...prev.items];
      const newLevel = currentItem.level - 1;
      updatedItems[index] = {
        ...currentItem,
        level: newLevel,
        parentId: newLevel === 0 ? null : currentItem.parentId,
      };

      setIsDirty(true);
      return {
        ...prev,
        items: updatedItems,
      };
    });
  }, []);

  // Bulk reorder items
  const reorderItems = useCallback((items: MenuItem[]) => {
    setActiveMenu((prev) => {
      if (!prev) return null;
      setIsDirty(true);
      return {
        ...prev,
        items,
      };
    });
  }, []);

  // Save active menu to Backend API and local cache
  const saveMenu = useCallback(async (): Promise<boolean> => {
    if (!activeMenu) return false;

    const updatedActiveMenu: MenuSchema = {
      ...activeMenu,
      updatedAt: new Date().toISOString(),
    };

    try {
      let savedMenu = updatedActiveMenu;
      // If menu is on backend, call updateMenuApi
      if (projectId && activeMenu.id && !activeMenu.id.startsWith("menu-")) {
        savedMenu = await updateMenuApi(activeMenu.id, {
          name: activeMenu.name,
          slug: activeMenu.slug,
          autoAddPages: activeMenu.autoAddPages,
          locations: activeMenu.locations,
          items: activeMenu.items,
          projectId,
        });
      } else if (projectId && activeMenu.id.startsWith("menu-")) {
        // Was a local dummy menu, create it on backend!
        savedMenu = await createMenuApi({
          name: activeMenu.name,
          slug: activeMenu.slug,
          autoAddPages: activeMenu.autoAddPages,
          locations: activeMenu.locations,
          items: activeMenu.items,
          projectId,
        });
      }

      const existingIndex = menus.findIndex((m) => m.id === activeMenu.id || m.id === savedMenu.id);
      let updatedList: MenuSchema[];
      if (existingIndex >= 0) {
        updatedList = [...menus];
        updatedList[existingIndex] = savedMenu;
      } else {
        updatedList = [...menus, savedMenu];
      }

      setMenus(updatedList);
      setActiveMenuId(savedMenu.id);
      setActiveMenu(savedMenu);
      setIsDirty(false);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
      } catch (_) {}

      return true;
    } catch (e) {
      console.error("Failed to save menu via API:", e);
      // Fallback: save to local storage
      const existingIndex = menus.findIndex((m) => m.id === activeMenu.id);
      const updatedList = [...menus];
      if (existingIndex >= 0) {
        updatedList[existingIndex] = updatedActiveMenu;
      } else {
        updatedList.push(updatedActiveMenu);
      }
      setMenus(updatedList);
      setActiveMenu(updatedActiveMenu);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
      } catch (_) {}
      throw e;
    }
  }, [activeMenu, menus, projectId, storageKey]);

  // Create a brand new menu via API
  const createMenu = useCallback(
    async (name: string): Promise<MenuSchema> => {
      const trimmed = name.trim() || "New Menu";

      let newMenu: MenuSchema;
      if (projectId) {
        try {
          newMenu = await createMenuApi({
            name: trimmed,
            autoAddPages: false,
            locations: { ...DEFAULT_LOCATIONS, primary: false },
            items: [],
            projectId,
          });
        } catch (err) {
          console.warn("API create failed, falling back to local creation:", err);
          newMenu = {
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
        }
      } else {
        newMenu = {
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
      }

      const updated = [...menus, newMenu];
      setMenus(updated);
      setActiveMenuId(newMenu.id);
      setActiveMenu(newMenu);
      setIsDirty(false);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save new menu locally:", e);
      }

      return newMenu;
    },
    [menus, projectId, storageKey]
  );

  // Delete active menu via API
  const deleteMenu = useCallback(
    async (id: string): Promise<boolean> => {
      if (projectId && !id.startsWith("menu-")) {
        try {
          await deleteMenuApi(id, projectId);
        } catch (err) {
          console.warn("Failed to delete menu via API:", err);
        }
      }

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
      return true;
    },
    [menus, projectId, storageKey]
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
    refreshMenus: loadMenus,
  };
}
