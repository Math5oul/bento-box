/**
 * Interface de Pedido
 * Vinculado a mesa e cliente (registrado ou anônimo)
 */
export interface Order {
  id: string;
  tableId: string;

  // Cliente pode ser registrado OU anônimo
  clientId?: string; // User ID se registrado
  sessionToken?: string; // Session Token se anônimo
  clientName: string; // Nome para exibição

  items: OrderItem[];
  totalAmount: number;

  status: OrderStatus;
  notes?: string; // Observações gerais do pedido

  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

/**
 * Tamanho selecionado do produto
 */
export interface OrderItemSize {
  name: string;
  abbreviation: string;
  price: number;
}

/**
 * Item do Pedido
 */
export interface OrderItem {
  productId: number; // ID do item do menu (bento-box)
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string; // Observações do item (ex: "Sem cebola")
  selectedSize?: OrderItemSize; // Tamanho selecionado
}

/**
 * Enum de Status do Pedido
 */
export enum OrderStatus {
  PENDING = 'pending', // Aguardando confirmação
  CONFIRMED = 'confirmed', // Confirmado
  PREPARING = 'preparing', // Em preparo
  READY = 'ready', // Pronto
  DELIVERED = 'delivered', // Entregue
  CANCELLED = 'cancelled', // Cancelado
}

/**
 * DTO para Criar Pedido
 */
export interface CreateOrderDTO {
  tableId: string;
  // Um dos dois é obrigatório
  clientId?: string;
  sessionToken?: string;
  clientName: string;
  items: CreateOrderItemDTO[];
  notes?: string;
}

/**
 * DTO para Item ao Criar Pedido
 */
export interface CreateOrderItemDTO {
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  selectedSize?: OrderItemSize; // Tamanho selecionado
}

/**
 * DTO para Atualizar Pedido
 */
export interface UpdateOrderDTO {
  status?: OrderStatus;
  items?: OrderItem[];
  notes?: string;
}

/**
 * DTO para Cancelar Pedido
 */
export interface CancelOrderDTO {
  orderId: string;
  reason?: string;
}

/**
 * Resumo de Consumo da Mesa
 */
export interface ConsumptionSummary {
  tableId: string;
  tableNumber: number;
  totalOrders: number;
  totalAmount: number;
  orders: Order[];

  // Quebra por cliente
  clientBreakdown: ClientConsumption[];
}

/**
 * Consumo por Cliente
 */
export interface ClientConsumption {
  clientId?: string;
  sessionToken?: string;
  clientName: string;
  isAnonymous: boolean;
  orders: Order[];
  totalAmount: number;
}
