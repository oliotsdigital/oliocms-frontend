export type StockStatus = 'In Stock' | 'Out of Stock' | 'Backorder';
export type ProductType = 'Simple' | 'Variable' | 'Digital';

export interface Product {
  id: number | string;
  name: string;
  category: string;
  price: string;
  regularPrice?: string;
  sku: string;
  stockStatus: StockStatus;
  type: ProductType;
  image: string;
  shortDesc?: string;
  description?: string;
  length?: string;
  width?: string;
  height?: string;
  weight?: string;
  slug?: string;
  visibility?: string;
  brand?: string;
}

export interface NewProductForm {
  name: string;
  shortDesc: string;
  description: string;
  category: string;
  type: ProductType;
  regularPrice: string;
  price: string;
  sku: string;
  stockStatus: StockStatus;
  length: string;
  width: string;
  height: string;
  weight: string;
  slug: string;
  visibility: string;
  brand: string;
  image: string;
}
