import { Component, Input } from '@angular/core';
import { dataExamples } from '../data/bento-itens-example';
import { fillerExamples } from '../data/filler-itens';
import { GridItem } from '../interfaces/bento-box.interface';
import { BentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';
import { BentoToolbarComponent } from './bento-toolbar/bento-toolbar.component';
import { CartComponent } from '../components/cart/cart.component';
import { CartService } from '../services/cart-service/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-module',
  standalone: true,
  imports: [
    BentoBoxComponent,
    BentoToolbarComponent,
    CartComponent,
    CommonModule,
  ],
  templateUrl: './bento-module.component.html',
  styleUrl: './bento-module.component.scss',
})
export class BentoModuleComponent {
  @Input() data: GridItem[] = dataExamples;
  @Input() fillers?: GridItem[] = fillerExamples;
  @Input() toolbar: boolean = true;
  @Input() options: BentoOptions = {
    createFillers: true,
    cellWidth: 160,
    cellHeight: 180,
    gridGap: 8,
    maxCols: 5,
    maxWidth: 0,
    mode: 'autoFill',
  };

  public selectedItem!: GridItem;

  constructor(public _cartService: CartService) {}

  ngOnInit(): void {
    if (this.fillers?.length === 0) {
      this.options.createFillers = false;
    }
  }

  onSelectedItemChange(event: any) {
    this.selectedItem = event;
  }

  isCartOpen = false;

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }
}
