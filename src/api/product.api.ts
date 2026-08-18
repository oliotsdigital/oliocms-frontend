import { Product, NewProductForm } from "@/models/product.model";

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Minimalist Leather Backpack",
    category: "Accessories",
    price: "189.00",
    regularPrice: "210.00",
    sku: "OLIO-BP-001",
    stockStatus: "In Stock",
    type: "Simple",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
    shortDesc: "Premium handcrafted leather bag",
    description: "Full grain genuine leather backpack built for daily city travel and laptops.",
    brand: "Olio Studio",
  },
  {
    id: 2,
    name: "Studio Wireless Headphones",
    category: "Electronics",
    price: "249.00",
    regularPrice: "299.00",
    sku: "OLIO-HP-002",
    stockStatus: "In Stock",
    type: "Simple",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200",
    shortDesc: "Active noise cancelling wireless headset",
    description: "High fidelity acoustic sound with 40-hour battery life.",
    brand: "Lumina Audio",
  },
  {
    id: 3,
    name: "Classic Analog Timepiece",
    category: "Apparel",
    price: "129.00",
    regularPrice: "149.00",
    sku: "OLIO-WT-003",
    stockStatus: "Out of Stock",
    type: "Variable",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200",
    shortDesc: "Stainless steel analog wrist watch",
    description: "Water resistant vintage timepiece with genuine leather strap.",
    brand: "Chronos",
  },
];

export async function fetchProductsApi(): Promise<Product[]> {
  await new Promise((res) => setTimeout(res, 200));
  return [...INITIAL_PRODUCTS];
}

export async function createProductApi(newProd: NewProductForm): Promise<Product> {
  await new Promise((res) => setTimeout(res, 300));
  return {
    id: Date.now(),
    name: newProd.name,
    category: newProd.category,
    price: newProd.price || "99.00",
    regularPrice: newProd.regularPrice,
    sku: newProd.sku || "OLIO-NEW-100",
    stockStatus: newProd.stockStatus,
    type: newProd.type,
    image: newProd.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200",
    shortDesc: newProd.shortDesc,
    description: newProd.description,
    length: newProd.length,
    width: newProd.width,
    height: newProd.height,
    weight: newProd.weight,
    slug: newProd.slug,
    visibility: newProd.visibility,
    brand: newProd.brand,
  };
}

export async function updateProductApi(updatedProduct: Product): Promise<Product> {
  await new Promise((res) => setTimeout(res, 200));
  return updatedProduct;
}

export async function deleteProductApi(id: number | string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 150));
  return true;
}
