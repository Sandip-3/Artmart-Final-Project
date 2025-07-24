import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService, ConfirmationDialog } from '../../services/confirmation.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ]),
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  confirmation: ConfirmationDialog | null = null;
  private destroy$ = new Subject<void>();

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.confirmationService.confirmation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmation => {
        this.confirmation = confirmation;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onConfirm(): void {
    this.confirmationService.confirmAction(true);
  }

  onCancel(): void {
    this.confirmationService.confirmAction(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  getModalClasses(): string {
    if (!this.confirmation) return '';
    
    const baseClasses = 'p-6 bg-white rounded-lg shadow-xl max-w-md w-full mx-4';
    
    switch (this.confirmation.type) {
      case 'danger':
        return `${baseClasses} border-t-4 border-red-500`;
      case 'warning':
        return `${baseClasses} border-t-4 border-yellow-500`;
      case 'info':
        return `${baseClasses} border-t-4 border-blue-500`;
      default:
        return `${baseClasses} border-t-4 border-yellow-500`;
    }
  }

  getIconClasses(): string {
    if (!this.confirmation) return '';
    
    switch (this.confirmation.type) {
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-yellow-500';
    }
  }

  getConfirmButtonClasses(): string {
    if (!this.confirmation) return '';
    
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (this.confirmation.type) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`;
      case 'info':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      default:
        return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`;
    }
  }
} 