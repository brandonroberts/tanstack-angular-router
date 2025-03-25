import { Component } from '@angular/core';

import { createRoute } from '@tanstack/angular-router';

import { Route as RootRoute } from './root.route';

export const Route = createRoute({ getParentRoute: () => RootRoute, path: '/', component: () => HomeComponent });

@Component({
  selector: 'home',
  standalone: true,
  template: `
    Hello from TanStack Router
  `,
})
export class HomeComponent {}
