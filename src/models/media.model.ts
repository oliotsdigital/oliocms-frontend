export interface MediaItem {
  id: number | string;
  name: string;
  url: string;
  size: string;
  format: string;
  key?: string;
  path?: string;
  lastModified?: string;
}

export interface NewMediaForm {
  name: string;
  url: string;
  file?: File | null;
}
