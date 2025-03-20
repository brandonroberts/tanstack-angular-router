import { Component, inject } from '@angular/core';

import { Outlet, Router } from '../router';

@Component({
  selector: 'app-root',
  imports: [Outlet],
  template: `
    <h1>Welcome to {{title}}!</h1>

    <a (click)="go('/')">Home</a> |
    <a (click)="go('/about')">About</a> |
    <a (click)="go('/parent/1')">Parent 1</a>
    <hr />

    <outlet />
  `,
  styles: [],
})
export class AppComponent {
  title = 'tanstack-router-angular';
  router = inject(Router);

  go(to: any) {
    this.router.navigate({ to });
  }
}
