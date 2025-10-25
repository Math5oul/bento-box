import { Component, Input, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
// import { dataExamples } from '../data/bento-itens-example';
import { fillerExamples } from '../data/filler-itens';
import { GridItem } from '../interfaces/bento-box.interface';
import { BentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';
import { BentoToolbarComponent } from './bento-toolbar/bento-toolbar.component';
import { CartService } from '../services/cart-service/cart.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { StorageService } from '../services/storage-service/storage.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class BentoModuleComponent implements OnDestroy {
  data: GridItem[] = [];
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
  private productsSub?: Subscription;
  private searchSub?: Subscription;
  private allProducts: GridItem[] = [];
  private searchSubject = new Subject<string>();

  get selectedItem(): GridItem | null {
    return this._selectedItem;
  }

  set selectedItem(value: GridItem | null) {
    this._selectedItem = value;
  }

  constructor(
    public _cartService: CartService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load all products once and cache them
    this.productsSub = this.storageService.getProducts().subscribe(savedData => {
      this.allProducts = savedData;
      this.data = savedData;
    });

    // Set up search subscription with debouncing
    this.searchSub = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filterProducts(searchTerm);
      });

    if (this.fillers?.length === 0) {
      this.options.createFillers = false;
    }
  }

  ngOnDestroy(): void {
    if (this.productsSub) {
      this.productsSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
    this.searchSubject.complete();
  }

  onItemClick(item: GridItem) {
    this._selectedItem = item;
  }

  /**
   * Filtra os itens com base no nome do produto ou na descrição.
   * @param searchText Texto de pesquisa para filtrar os itens.
   */
  onSearch(searchText: string) {
    this.searchSubject.next(searchText);
  }

  /**
   * Filtra os produtos em cache com base no termo de pesquisa.
   * @param searchText Termo de pesquisa
   */
  private filterProducts(searchText: string): void {
    const term = searchText.toLowerCase().trim();

    this.data = !term
      ? this.allProducts
      : this.allProducts.filter((item: GridItem) => {
          const name = item.inputs?.productName?.toLowerCase() || '';
          const description = item.inputs?.description?.toLowerCase() || '';
          return name.includes(term) || description.includes(term);
        });

    // Trigger grid recalculation deterministically
    this.cdr.detectChanges();
    if (this.bentoBoxComponent) {
      this.bentoBoxComponent.restartGrid();
      this.bentoBoxComponent.recalculateGrid();
    }
  }

}
