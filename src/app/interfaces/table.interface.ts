/**
 * Interface de Mesa do Restaurante
 * Gerencia QR Code, clientes e consumo
 */
export interface Table {
  id: string;
  number: number; // Número da mesa (1, 2, 3...)
  name?: string; // Nome customizado da mesa (ex: "Varanda", "Salão Principal")
  status: TableStatus;
  capacity: number; // Quantas pessoas cabem

  // QR Code para acesso direto
  qrCode: string; // URL: /table/{tableId}/join
  qrCodeImage?: string; // Base64 da imagem do QR Code

  // Clientes vinculados
  clients: string[]; // Array de User IDs (registrados)
  anonymousClients: AnonymousSession[]; // Sessões anônimas ativas

  // Pedidos e consumo
  currentOrders: string[]; // Array de Order IDs
  totalConsumption: number;

  // Controle
  openedAt?: Date;
  closedAt?: Date;
  openedBy?: string; // Admin ID

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sessão Anônima de Cliente
 */
export interface AnonymousSession {
  sessionId: string;
  sessionToken: string;
  joinedAt: Date;
  expiresAt: Date;
  deviceInfo?: string; // User agent do navegador
}

/**
 * Enum de Status da Mesa
 */
export enum TableStatus {
  AVAILABLE = 'available', // Disponível
  OCCUPIED = 'occupied', // Ocupada
  RESERVED = 'reserved', // Reservada
  CLOSED = 'closed', // Fechada (aguardando pagamento)
}

/**
 * DTO para Criar Mesa
 */
export interface CreateTableDTO {
  number: number;
  name?: string;
  capacity: number;
}

/**
 * DTO para Atualizar Mesa
 */
export interface UpdateTableDTO {
  number?: number;
  name?: string;
  capacity?: number;
  status?: TableStatus;
}

/**
 * DTO para Abrir Mesa
 */
export interface OpenTableDTO {
  adminId: string;
}

/**
 * DTO para Fechar Mesa
 */
export interface CloseTableDTO {
  adminId: string;
  paymentType: 'split' | 'together'; // Dividir conta ou pagar junto
}

/**
 * DTO para Vincular Cliente à Mesa
 */
export interface AssignClientDTO {
  userId: string;
  tableId: string;
}

/**
 * Response ao entrar na mesa via QR Code
 */
export interface JoinTableResponse {
  success: boolean;
  table: Table;
  sessionToken: string;
  sessionExpiry: Date;
  message: string;
}
