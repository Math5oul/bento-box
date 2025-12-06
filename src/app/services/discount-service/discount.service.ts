import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth-service/auth.service';
import { Category } from '../../interfaces/category.interface';

/**
 * Interface para resultado do cálculo de desconto simples
 */
export interface DiscountCalculation {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  hasDiscount: boolean;
}

/**
 * Interface para cálculo detalhado de preço (produto completo)
 */
export interface DetailedPriceCalculation {
  // Preço base (produto ou tamanho)
  basePriceOriginal: number;
  basePriceWithDiscount: number;
  baseDiscountPercent: number;
  baseDiscountAmount: number;

  // Preço da variação (sempre sem desconto)
  variationPrice: number;

  // Preço total
  originalTotalPrice: number; // base original + variação
  finalTotalPrice: number; // base com desconto + variação
  totalDiscount: number; // desconto total em valor
  hasDiscount: boolean;
}

/**
 * Serviço para calcular descontos baseado no role do usuário
 */
@Injectable({
  providedIn: 'root',
})
export class DiscountService {
  private authService = inject(AuthService);

  /**
   * Calcula o preço com desconto para um produto baseado na categoria
   */
  calculatePrice(price: number, category: Category | null): DiscountCalculation {
    const result: DiscountCalculation = {
      originalPrice: price,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: price,
      hasDiscount: false,
    };

    // Se não tem categoria ou descontos, retorna preço original
    if (!category || !category.discounts || category.discounts.length === 0) {
      return result;
    }

    // Pega o usuário atual
    const user = this.authService.getCurrentUser();

    if (!user || !user.role) {
      return result;
    }

    // Busca desconto para o role do usuário
    // role pode ser um ObjectId (string) ou o roleDetails pode ter _id
    const userRoleId = typeof user.role === 'string' ? user.role : user.roleDetails?._id;

    const discount = category.discounts.find(d => d.roleId === userRoleId);

    if (discount && discount.discountPercent > 0) {
      result.discountPercent = discount.discountPercent;
      result.discountAmount = (price * discount.discountPercent) / 100;
      result.finalPrice = price - result.discountAmount;
      result.hasDiscount = true;
    }

    return result;
  }

  /**
   * Obtém o percentual de desconto para uma categoria (se houver)
   */
  getDiscountPercent(category: Category | null): number {
    if (!category || !category.discounts || category.discounts.length === 0) {
      return 0;
    }

    const user = this.authService.getCurrentUser();
    if (!user || !user.role) {
      return 0;
    }

    const userRoleId = typeof user.role === 'string' ? user.role : user.roleDetails?._id;
    const discount = category.discounts.find(d => d.roleId === userRoleId);

    return discount?.discountPercent || 0;
  }

  /**
   * Verifica se há desconto aplicável para uma categoria
   */
  hasDiscount(category: Category | null): boolean {
    return this.getDiscountPercent(category) > 0;
  }

  /**
   * Calcula preço completo de um item (base + variação)
   * Aplica desconto APENAS no preço base, nunca na variação
   *
   * @param basePrice - Preço base do produto ou preço do tamanho selecionado
   * @param variationPrice - Preço da variação selecionada (opcional)
   * @param category - Categoria do produto
   * @returns DetailedPriceCalculation com todos os detalhes de preço
   */
  calculateFullItemPrice(
    basePrice: number,
    variationPrice: number = 0,
    category: Category | null
  ): DetailedPriceCalculation {
    // Calcula desconto apenas no preço base
    const baseCalc = this.calculatePrice(basePrice, category);

    // Monta o resultado detalhado
    const result: DetailedPriceCalculation = {
      // Preço base
      basePriceOriginal: baseCalc.originalPrice,
      basePriceWithDiscount: baseCalc.finalPrice,
      baseDiscountPercent: baseCalc.discountPercent,
      baseDiscountAmount: baseCalc.discountAmount,

      // Variação (sempre sem desconto)
      variationPrice: variationPrice,

      // Totais
      originalTotalPrice: baseCalc.originalPrice + variationPrice,
      finalTotalPrice: baseCalc.finalPrice + variationPrice,
      totalDiscount: baseCalc.discountAmount,
      hasDiscount: baseCalc.hasDiscount,
    };

    return result;
  }

  /**
   * Calcula preço para um tamanho específico (usado nos botões de tamanho)
   *
   * @param sizePrice - Preço do tamanho
   * @param category - Categoria do produto
   * @returns DiscountCalculation com desconto aplicado no tamanho
   */
  calculateSizePrice(sizePrice: number, category: Category | null): DiscountCalculation {
    return this.calculatePrice(sizePrice, category);
  }

  /**
   * Calcula preço completo de um item do carrinho
   * Usa os dados salvos no CartItem para recalcular
   *
   * @param item - Item do carrinho com informações de preço
   * @returns DetailedPriceCalculation recalculado
   */
  recalculateCartItemPrice(item: {
    basePriceOriginal?: number;
    variationPrice?: number;
    category?: any;
  }): DetailedPriceCalculation | null {
    if (!item.basePriceOriginal) {
      return null;
    }

    return this.calculateFullItemPrice(
      item.basePriceOriginal,
      item.variationPrice || 0,
      item.category || null
    );
  }

  /**
   * Calcula o preço com desconto usando roleId específico (para admin criando pedidos)
   */
  calculatePriceWithRole(
    price: number,
    category: Category | null,
    roleId: string | null
  ): DiscountCalculation {
    const result: DiscountCalculation = {
      originalPrice: price,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: price,
      hasDiscount: false,
    };

    // Se não tem categoria, descontos ou roleId, retorna preço original
    if (!category || !category.discounts || category.discounts.length === 0 || !roleId) {
      return result;
    }

    // Busca desconto para o role fornecido
    const discount = category.discounts.find(d => d.roleId === roleId);

    if (discount && discount.discountPercent > 0) {
      result.discountPercent = discount.discountPercent;
      result.discountAmount = (price * discount.discountPercent) / 100;
      result.finalPrice = price - result.discountAmount;
      result.hasDiscount = true;
    }

    return result;
  }

  /**
   * Calcula preço completo com roleId específico
   */
  calculateFullItemPriceWithRole(
    basePrice: number,
    variationPrice: number,
    category: Category | null,
    roleId: string | null
  ): DetailedPriceCalculation {
    const basePriceCalc = this.calculatePriceWithRole(basePrice, category, roleId);

    const result: DetailedPriceCalculation = {
      basePriceOriginal: basePrice,
      basePriceWithDiscount: basePriceCalc.finalPrice,
      baseDiscountPercent: basePriceCalc.discountPercent,
      baseDiscountAmount: basePriceCalc.discountAmount,

      variationPrice: variationPrice,

      originalTotalPrice: basePrice + variationPrice,
      finalTotalPrice: basePriceCalc.finalPrice + variationPrice,
      totalDiscount: basePriceCalc.discountAmount,
      hasDiscount: basePriceCalc.hasDiscount,
    };

    return result;
  }

  /**
   * Formata preço em BRL
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }
}
