import { Component } from '@angular/core';

import { createRoute } from 'tanstack-angular-router-experimental';

import { Route as RootRoute } from './root.route';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: () => Home,
});

@Component({
  selector: 'home',
  template: `
    Hello from TanStack Router
  `,
})
export class Home {}
