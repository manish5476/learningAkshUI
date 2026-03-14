import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MasterValue } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-master-value-grid',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, InputTextModule, TooltipModule],
  templateUrl: './master-value-grid.component.html'
})
export class MasterValueGridComponent {
  // Modern Angular Signal Inputs
  values = input.required<MasterValue[]>();
  loading = input<boolean>(false);

  // Output events to notify the parent container
  onEdit = output<MasterValue>();
  onDelete = output<MasterValue>();
  onToggleStatus = output<MasterValue>();
}