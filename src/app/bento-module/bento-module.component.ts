import { Component, Input, ViewChild } from '@angular/core';
import { dataExamples } from '../data/bento-itens-example';
import { fillerExamples } from '../data/filler-itens';
import { GridItem } from '../interfaces/bento-box.interface';
import { BentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';
import { BentoToolbarComponent } from './bento-toolbar/bento-toolbar.component';
import { CartService } from '../services/cart-service/cart.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-bento-module',
  standalone: true,
  imports: [
    BentoBoxComponent,
    BentoToolbarComponent,
    HeaderComponent,
    CommonModule,
  ],
  templateUrl: './bento-module.component.html',
  styleUrl: './bento-module.component.scss',
})
export class BentoModuleComponent {
  @Input() originalData: GridItem[] = dataExamples;
  data = [...this.originalData];
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

  @ViewChild(BentoBoxComponent) bentoBoxComponent!: BentoBoxComponent;

  private _selectedItem: GridItem | null = null;

  get selectedItem(): GridItem | null {
    return this._selectedItem;
  }

  set selectedItem(value: GridItem | null) {
    this._selectedItem = value;
  }

  constructor(public _cartService: CartService) {}

  ngOnInit(): void {
    if (this.fillers?.length === 0) {
      this.options.createFillers = false;
    }
  }
  onItemClick(item: GridItem) {
    this._selectedItem = item;
  }

  /**
   * Filtra os itens com base no nome do produto ou na descrição.
   * @param searchText Texto de pesquisa para filtrar os itens.
   */
  onSearch(searchText: string) {
    const term = searchText.toLowerCase().trim();

    if (!term) {
      this.data = [...this.originalData];
    } else {
      this.data = this.originalData.filter((item) => {
        const name = item.inputs?.productName?.toLowerCase() || '';
        const description = item.inputs?.description?.toLowerCase() || '';
        return name.includes(term) || description.includes(term);
      });
    }

    setTimeout(() => {
      this.bentoBoxComponent.restartGrid();
      this.bentoBoxComponent.recalculateGrid();
    });
  }

}
