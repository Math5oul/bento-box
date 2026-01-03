import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../../interfaces/category.interface';
import { CategoryCardComponent } from '../category-card/category-card.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, CategoryCardComponent],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
})
export class CategoryListComponent {
  @Input() categories: Category[] = [];
  @Input() loading: boolean = false;
  @Input() searchTerm: string = '';
  @Input() totalCategories: number = 0;
  @Input() draggedCategory: Category | null = null;
  @Input() dragOverCategory: Category | null = null;

  @Output() editCategory = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<Category>();
  @Output() openDiscounts = new EventEmitter<Category>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; category: Category }>();
  @Output() dragOver = new EventEmitter<{ event: DragEvent; category: Category }>();
  @Output() dragLeave = new EventEmitter<DragEvent>();
  @Output() drop = new EventEmitter<{ event: DragEvent; category: Category }>();
  @Output() dragEnd = new EventEmitter<void>();
  @Output() touchStart = new EventEmitter<{ event: TouchEvent; category: Category }>();
  @Output() touchMove = new EventEmitter<TouchEvent>();
  @Output() touchEnd = new EventEmitter<TouchEvent>();
  @Output() touchCancel = new EventEmitter<void>();

  onEditCategory(category: Category): void {
    this.editCategory.emit(category);
  }

  onDeleteCategory(category: Category): void {
    this.deleteCategory.emit(category);
  }

  onOpenDiscounts(category: Category): void {
    this.openDiscounts.emit(category);
  }

  onDragStart(event: DragEvent, category: Category): void {
    this.dragStart.emit({ event, category });
  }

  onDragOver(event: DragEvent, category: Category): void {
    this.dragOver.emit({ event, category });
  }

  onDragLeave(event: DragEvent): void {
    this.dragLeave.emit(event);
  }

  onDrop(event: DragEvent, category: Category): void {
    this.drop.emit({ event, category });
  }

  onDragEnd(): void {
    this.dragEnd.emit();
  }

  onTouchStart(event: TouchEvent, category: Category): void {
    this.touchStart.emit({ event, category });
  }

  onTouchMove(event: TouchEvent): void {
    this.touchMove.emit(event);
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEnd.emit(event);
  }

  onTouchCancel(): void {
    this.touchCancel.emit();
  }

  isDragging(category: Category): boolean {
    return this.draggedCategory?._id === category._id;
  }

  isDragOver(category: Category): boolean {
    return this.dragOverCategory?._id === category._id;
  }
}
