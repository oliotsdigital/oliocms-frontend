export interface MediaItem {
  id: number | string;
  name: string;
  url: string;
  size: string;
  format: string;
}

export interface NewMediaForm {
  name: string;
  url: string;
}
