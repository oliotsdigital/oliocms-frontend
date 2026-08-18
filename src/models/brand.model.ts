export interface Brand {
  id: number | string;
  name: string;
  slug: string;
  parent: string;
  description?: string;
  thumb: string;
}

export interface NewBrandForm {
  name: string;
  slug: string;
  parent: string;
  description: string;
  thumb: string;
}
