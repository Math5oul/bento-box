import { CommonModule } from "@angular/common";
import { Component, Input, ViewChild } from "@angular/core";
import { SanitizePipe } from "../../../pipes/sanitize.pipe";
import { ProductModalComponent } from "./product-modal/product-modal.component";
import { CartService } from "../../../services/cart.service";

@Component({
  selector: "app-simple-product",
  standalone: true,
  imports: [CommonModule, SanitizePipe, ProductModalComponent],
  templateUrl: "./simple-product.component.html",
  styleUrl: "./simple-product.component.scss",
})
export class SimpleProductComponent {
  @Input() format: "1x1" | "1x2" | "2x1" | "2x2" = "1x1";
  @Input() colorMode: string = "dark";
  @Input() images: string[] = [];
  @Input() productName: string = "";
  @Input() description: string = "";
  @Input() price: number = 0;

  @ViewChild(ProductModalComponent) productModal!: ProductModalComponent;
  openModal() {
    this.productModal.open();
  }

  constructor(private cartService: CartService) {}

  handleOrder(order: {
    quantity: number;
    productName?: string;
    observations?: string;
  }) {
    // This logs the order details to the browser console
    console.log("Pedido enviado:", order);

    // This adds the selected product and quantity to the cart using the CartService
    this.cartService.addItem({
      productName: this.productName,
      price: this.price,
      quantity: order.quantity,
    });

    // This logs the updated total value of the cart to the console
    console.log("Valor total do carrinho:", this.cartService.getTotal());
  }
}
