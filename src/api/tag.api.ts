import { Tag, NewTagForm } from "@/models/tag.model";

const INITIAL_TAGS: Tag[] = [
  { id: 1, name: "Featured Product", slug: "featured-product", thumb: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=100" },
  { id: 2, name: "Winter Sale", slug: "winter-sale", thumb: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=100" },
];

export async function fetchTagsApi(projectId?: string): Promise<Tag[]> {
  await new Promise((res) => setTimeout(res, 100));
  return [...INITIAL_TAGS];
}

export async function createTagApi(form: NewTagForm): Promise<Tag> {
  await new Promise((res) => setTimeout(res, 250));
  return {
    id: Date.now(),
    name: form.name,
    slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    description: form.description,
    thumb: form.thumb || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=100",
  };
}

export async function deleteTagApi(id: number | string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 150));
  return true;
}
