export interface Category {
  id: number | string;
  name: string;
  slug: string;
  parent: string;
  description?: string;
  thumb: string;
}

export interface NewCategoryForm {
  name: string;
  slug: string;
  parent: string;
  description: string;
  thumb: string;
}
