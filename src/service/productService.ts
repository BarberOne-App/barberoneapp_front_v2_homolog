import api from "./api";

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  subscriberDiscount?: number;
  subscriber_discount?: number;
  imageUrl?: string | null;
  image_url?: string | null;
  stock: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  barbershopId?: string;
}

export interface ListProductsParams {
  active?: boolean;
  category?: string;
  q?: string;
}

export interface ProductPayload {
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  subscriberDiscount?: number;
  imageUrl?: string | null;
  stock?: number;
  active?: boolean;
}

export async function listProducts(params: ListProductsParams = {}) {
  const response = await api.get<Product[]>("/products", { params });

  return response.data;
}

export async function createProduct(data: ProductPayload) {
  const response = await api.post<Product>("/products", data);

  return response.data;
}

export async function updateProduct(productId: string, data: Partial<ProductPayload>) {
  const response = await api.patch<Product>(`/products/${productId}`, data);

  return response.data;
}

export async function deleteProduct(productId: string) {
  const response = await api.delete<{
    ok: boolean;
    product: Product;
    deletedHard: boolean;
    reason: string;
  }>(`/products/${productId}`);

  return response.data;
}

export async function reactivateProduct(productId: string) {
  const response = await api.patch<{
    ok: boolean;
    product: Product;
    reason: string;
  }>(`/products/${productId}/reactivate`);

  return response.data;
}
