export interface Tag {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  thumb: string;
}

export interface NewTagForm {
  name: string;
  slug: string;
  description: string;
  thumb: string;
}
