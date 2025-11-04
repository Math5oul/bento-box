import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  ProductModalService,
  ProductModalData,
} from '../../services/product-modal-service/product-modal.service';
import { ProductModalComponent } from '../simpleComponents/simple-product/product-modal/product-modal.component';

@Component({
  selector: 'app-product-modal-container',
  standalone: true,
  imports: [CommonModule, ProductModalComponent],
  template: `
    <app-product-modal
      [images]="modalData?.images || []"
      [productName]="modalData?.productName || ''"
      [price]="modalData?.price || 0"
      [description]="modalData?.description || ''"
      [sizes]="modalData?.sizes || []"
      [variations]="modalData?.variations || []"
      (orderSubmitted)="onOrderSubmitted($event)"
    ></app-product-modal>
  `,
})
export class ProductModalContainerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(ProductModalComponent) modalRef!: ProductModalComponent;

  modalData: ProductModalData | null = null;
  private destroy$ = new Subject<void>();

  constructor(private productModalService: ProductModalService) {}

  ngOnInit() {
    this.productModalService.modalData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.modalData = data;
    });
  }

  ngAfterViewInit() {
    // Escuta mudanças no modalData e controla o modal
    this.productModalService.modalData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data && this.modalRef) {
        this.modalRef.open();
      } else if (!data && this.modalRef) {
        this.modalRef.close();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onOrderSubmitted(order: any) {
    if (this.modalData?.onOrderSubmitted) {
      this.modalData.onOrderSubmitted(order);
    }
    this.productModalService.closeModal();
  }
}
