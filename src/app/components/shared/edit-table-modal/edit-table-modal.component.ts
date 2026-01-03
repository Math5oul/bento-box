import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table } from '../../../interfaces/table.interface';

@Component({
  selector: 'app-edit-table-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-table-modal.component.html',
  styleUrl: './edit-table-modal.component.scss',
})
export class EditTableModalComponent implements OnInit {
  @Input() table: Table | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    id: string;
    number: number;
    name?: string;
    capacity: number;
  }>();

  editingTable: { id: string; number: number; name?: string; capacity: number } = {
    id: '',
    number: 1,
    name: '',
    capacity: 4,
  };

  get isCreating(): boolean {
    return !this.table;
  }

  ngOnInit() {
    console.log('🎯 EditTableModal ngOnInit - table recebido:', this.table);
    if (this.table) {
      this.editingTable = {
        id: this.table.id,
        number: this.table.number,
        name: this.table.name || '',
        capacity: this.table.capacity,
      };
      console.log('🎯 EditTableModal - editingTable:', this.editingTable);
    } else {
      // Modo criação - não tem ID
      this.editingTable = {
        id: '',
        number: 1,
        name: '',
        capacity: 4,
      };
    }
  }

  onClose() {
    this.close.emit();
  }

  onSave() {
    // Remove name se estiver vazio
    const dataToSave: any = {
      number: this.editingTable.number,
      capacity: this.editingTable.capacity,
      name: this.editingTable.name?.trim() || undefined,
    };

    // Só inclui o ID se não estiver criando
    if (!this.isCreating) {
      dataToSave.id = this.editingTable.id;
    }

    this.save.emit(dataToSave);
  }
}
