export type MenuItemType = "page" | "custom" | "collection" | "category";

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: MenuItemType;
  targetBlank?: boolean;
  titleAttr?: string;
  classes?: string;
  parentId?: string | null;
  level: number; // 0 = root, 1 = sub item, 2 = sub-sub item
  originalTitle?: string;
  icon?: string;
}

export interface MenuLocations {
  primary: boolean;
  footer: boolean;
  mobile: boolean;
  topbar: boolean;
}

export interface MenuSchema {
  id: string;
  projectId?: string;
  name: string;
  slug: string;
  autoAddPages: boolean;
  locations: MenuLocations;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemPayload {
  label: string;
  url: string;
  type: MenuItemType;
  originalTitle?: string;
  icon?: string;
}
