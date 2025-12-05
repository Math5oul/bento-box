/**
 * Interface para categorias de relatório personalizadas
 * Usadas apenas para organização de relatórios fiscais/impostos
 * Independente das categorias de produtos do sistema
 */
export interface ReportCategory {
  _id: string;
  name: string;
  description?: string;
  color?: string; // Para visualização em gráficos
  productIds: string[]; // IDs dos produtos nesta categoria
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dados de relatório de vendas por período
 */
export interface SalesReport {
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalRevenue: number;
  salesByCategory: CategorySalesData[];
  salesByProduct: ProductSalesData[];
  salesByPaymentMethod: PaymentMethodData[];
  dailySales: DailySalesData[];
}

/**
 * Dados de vendas por categoria de relatório
 */
export interface CategorySalesData {
  categoryId: string;
  categoryName: string;
  color?: string;
  quantity: number;
  revenue: number;
  percentage: number;
  products: ProductSalesData[];
}

/**
 * Dados de vendas por produto
 */
export interface ProductSalesData {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  averagePrice: number;
}

/**
 * Dados de vendas por método de pagamento
 */
export interface PaymentMethodData {
  method: 'dinheiro' | 'debito' | 'credito' | 'pix';
  count: number;
  revenue: number;
  percentage: number;
}

/**
 * Dados de vendas diárias
 */
export interface DailySalesData {
  date: Date;
  sales: number;
  revenue: number;
}

/**
 * Filtros para geração de relatórios
 */
export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  categoryIds?: string[];
  productIds?: string[];
  paymentMethods?: string[];
}
