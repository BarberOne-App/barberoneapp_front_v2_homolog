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

export type ProductStockMovementType = "entry" | "exit";

export interface ProductStockMovement {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  barbershopId: string;
  type: ProductStockMovementType;
  quantity: number;
  purchasePrice?: number | null;
  salePrice?: number | null;
  occurredAt: string;
  note?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: string;
  stockAfter: number;
}

export interface ListProductStockMovementsParams {
  productId?: string;
  type?: ProductStockMovementType;
  q?: string;
  limit?: number;
}

export interface ProductStockMovementPayload {
  productId: string;
  type: ProductStockMovementType;
  quantity: number;
  purchasePrice?: number | null;
  salePrice?: number | null;
  occurredAt?: string;
  note?: string | null;
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

export async function listProductStockMovements(
  params: ListProductStockMovementsParams = {},
) {
  const response = await api.get<ProductStockMovement[]>("/products/stock-movements", {
    params,
  });

  return response.data;
}

export async function createProductStockMovement(data: ProductStockMovementPayload) {
  const response = await api.post<{
    product: Product;
    movement: ProductStockMovement;
  }>("/products/stock-movements", data);

  return response.data;
}

export interface ProductOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ProductOrder {
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  payment: {
    id: string;
    method: string;
    status: string;
    paidAt: string | null;
  } | null;
  items: ProductOrderItem[];
}

export async function checkoutProductCart(items: Array<{ productId: string; quantity: number }>) {
  const response = await api.post<{
    orderId: string;
    paymentId: string;
    total: number;
    status: string;
    items: ProductOrderItem[];
  }>("/products/cart/checkout", { items });

  return response.data;
}

export async function listProductOrders() {
  const response = await api.get<ProductOrder[]>("/products/orders");
  return response.data;
}

export interface BarbershopProductOrder extends ProductOrder {
  client: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export async function listBarbershopProductOrders() {
  const response = await api.get<BarbershopProductOrder[]>("/products/orders/admin");
  return response.data;
}

export async function confirmProductOrderPayment(
  orderId: string,
  method: "dinheiro" | "pix" | "debito" | "credito",
) {
  const response = await api.patch<{ ok: boolean }>(`/products/orders/${orderId}/payment`, { method });
  return response.data;
}

export async function cancelProductOrder(orderId: string) {
  const response = await api.post<{ ok: boolean }>(`/products/orders/${orderId}/cancel`);
  return response.data;
}
