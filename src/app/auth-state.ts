import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthState {
  username = signal('');
  isAuthenticated = computed(() => this.username() !== '');
}
