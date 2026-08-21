import { Category, NewCategoryForm } from "@/models/category.model";

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Electronics", slug: "electronics", parent: "None", thumb: "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=100" },
  { id: 2, name: "Accessories", slug: "accessories", parent: "None", thumb: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=100" },
  { id: 3, name: "Apparel", slug: "apparel", parent: "None", thumb: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=100" },
];

export async function fetchCategoriesApi(projectId?: string): Promise<Category[]> {
  await new Promise((res) => setTimeout(res, 100));
  return [...INITIAL_CATEGORIES];
}

export async function createCategoryApi(form: NewCategoryForm): Promise<Category> {
  await new Promise((res) => setTimeout(res, 250));
  return {
    id: Date.now(),
    name: form.name,
    slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    parent: form.parent || "None",
    description: form.description,
    thumb: form.thumb || "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=100",
  };
}

export async function deleteCategoryApi(id: number | string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 150));
  return true;
}
