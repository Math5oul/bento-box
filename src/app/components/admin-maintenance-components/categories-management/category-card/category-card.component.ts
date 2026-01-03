import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../../interfaces/category.interface';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.scss'],
})
export class CategoryCardComponent {
  @Input() category!: Category;
  @Input() isDragging: boolean = false;
  @Input() isDragOver: boolean = false;

  @Output() editCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<Category>();
  @Output() openDiscounts = new EventEmitter<Category>();
  @Output() dragStart = new EventEmitter<DragEvent>();
  @Output() dragOver = new EventEmitter<DragEvent>();
  @Output() dragLeave = new EventEmitter<DragEvent>();
  @Output() drop = new EventEmitter<DragEvent>();
  @Output() dragEnd = new EventEmitter<void>();
  @Output() touchStart = new EventEmitter<TouchEvent>();
  @Output() touchMove = new EventEmitter<TouchEvent>();
  @Output() touchEnd = new EventEmitter<TouchEvent>();
  @Output() touchCancel = new EventEmitter<void>();

  onEdit(): void {
    this.editCategory.emit(this.category);
  }

  onDelete(): void {
    this.deleteCategory.emit(this.category);
  }

  onOpenDiscounts(): void {
    this.openDiscounts.emit(this.category);
  }
}
