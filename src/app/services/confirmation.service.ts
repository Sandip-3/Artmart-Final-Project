import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationDialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new BehaviorSubject<ConfirmationDialog | null>(null);
  public confirmation$ = this.confirmationSubject.asObservable();
  
  private resolveFunction?: (result: boolean) => void;

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  confirm(
    title: string, 
    message: string, 
    confirmText: string = 'Yes', 
    cancelText: string = 'Cancel',
    type: 'danger' | 'warning' | 'info' = 'warning'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolveFunction = resolve;
      
      const confirmation: ConfirmationDialog = {
        id: this.generateId(),
        title,
        message,
        confirmText,
        cancelText,
        type
      };
      
      this.confirmationSubject.next(confirmation);
    });
  }

  confirmAction(result: boolean): void {
    if (this.resolveFunction) {
      this.resolveFunction(result);
      this.resolveFunction = undefined;
    }
    this.confirmationSubject.next(null);
  }

  dismiss(): void {
    this.confirmAction(false);
  }
} 