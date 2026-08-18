import { MediaItem, NewMediaForm } from "@/models/media.model";

const INITIAL_MEDIA: MediaItem[] = [
  { id: 1, name: "minimal-headphones.jpg", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300", size: "1.2 MB", format: "jpg" },
  { id: 2, name: "leather-watch.jpg", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300", size: "850 KB", format: "jpg" },
  { id: 3, name: "smart-speaker.jpg", url: "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=300", size: "2.1 MB", format: "jpg" },
  { id: 4, name: "wireless-mouse.jpg", url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=300", size: "640 KB", format: "jpg" },
  { id: 5, name: "modern-backpack.jpg", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=300", size: "1.8 MB", format: "jpg" },
  { id: 6, name: "ceramic-cup.jpg", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=300", size: "920 KB", format: "jpg" },
];

export async function fetchMediaApi(): Promise<MediaItem[]> {
  await new Promise((res) => setTimeout(res, 200));
  return [...INITIAL_MEDIA];
}

export async function uploadMediaApi(form: NewMediaForm): Promise<MediaItem> {
  await new Promise((res) => setTimeout(res, 300));
  return {
    id: Date.now(),
    name: form.name || "uploaded-image.jpg",
    url: form.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300",
    size: "1.5 MB",
    format: "jpg",
  };
}

export async function deleteMediaApi(id: number | string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 150));
  return true;
}
