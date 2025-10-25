import { CommonModule } from "@angular/common";
import { Component, Input, ViewChild } from "@angular/core";
import { SanitizePipe } from "../../../pipes/sanitize.pipe";
import { ProductModalComponent } from "./product-modal/product-modal.component";
import { CartService } from "../../../services/cart-service/cart.service";

@Component({
  selector: "app-simple-product",
  standalone: true,
  imports: [CommonModule, SanitizePipe, ProductModalComponent],
  templateUrl: "./simple-product.component.html",
  styleUrl: "./simple-product.component.scss",
})
export class SimpleProductComponent {
  @Input() inputs: {
    format: "1x1" | "1x2" | "2x1" | "2x2";
    colorMode: string;
    images: string[];
    productName: string;
    description: string;
    price: number;
    editMode: boolean;
  } = {
    format: "1x1",
    colorMode: "dark",
    images: [],
    productName: "",
    description: "",
    price: 0,
    editMode: false
  };

  @ViewChild(ProductModalComponent) productModal!: ProductModalComponent;
  handleClick(event: MouseEvent) {
    if (this.inputs.editMode) {
      return;
    } else {
      this.productModal.open();
    }
  }

  constructor(private cartService: CartService) {}

  handleOrder(order: {
    quantity: number;
    productName?: string;
    observations?: string;
  }) {

    this.cartService.addItem({
      productName: this.inputs.productName,
      price: this.inputs.price,
      quantity: order.quantity,
      observations: order.observations || "",
      image: this.inputs.images[0],
    });

  }
}
