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
 * Variação selecionada do produto
 */
export interface OrderItemVariation {
  title: string;
  description?: string;
  image?: string;
  price: number;
}

/**
 * Item do Pedido
 */
export interface OrderItem {
  // productId can be a legacy numeric id or a MongoDB ObjectId string
  productId?: string | number; // ID do item do menu (bento-box)
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string; // Observações do item (ex: "Sem cebola")
  selectedSize?: OrderItemSize; // Tamanho selecionado
  selectedVariation?: OrderItemVariation; // Variação selecionada
  status?: OrderStatus;
  paidQuantity?: number; // Quantidade já paga deste item
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
  // Status opcional do pedido ao criar (ex: pending). Caso não enviado, backend define default.
  status?: OrderStatus;
  items: CreateOrderItemDTO[];
  notes?: string;
}

/**
 * DTO para Item ao Criar Pedido
 */
export interface CreateOrderItemDTO {
  productId?: string | number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  status?: OrderStatus;
  notes?: string;
  selectedSize?: OrderItemSize; // Tamanho selecionado
  selectedVariation?: OrderItemVariation; // Variação selecionada
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
