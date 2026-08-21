import { Brand, NewBrandForm } from "@/models/brand.model";

const INITIAL_BRANDS: Brand[] = [
  { id: 1, name: "Lumina Audio", slug: "lumina-audio", parent: "None", thumb: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100" },
  { id: 2, name: "Apex Gear", slug: "apex-gear", parent: "None", thumb: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=100" },
];

export async function fetchBrandsApi(projectId?: string): Promise<Brand[]> {
  await new Promise((res) => setTimeout(res, 100));
  return [...INITIAL_BRANDS];
}

export async function createBrandApi(form: NewBrandForm): Promise<Brand> {
  await new Promise((res) => setTimeout(res, 250));
  return {
    id: Date.now(),
    name: form.name,
    slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    parent: form.parent || "None",
    description: form.description,
    thumb: form.thumb || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100",
  };
}

export async function deleteBrandApi(id: number | string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 150));
  return true;
}
