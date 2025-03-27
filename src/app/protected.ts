import { Component, inject } from '@angular/core';
import { createRoute, redirect } from 'tanstack-angular-router-experimental';
import { AuthState } from './auth-state';
import { Route as RootRoute } from './root.route';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'protected',
  component: () => Protected,
  beforeLoad: ({ location }) => {
    const authState = inject(AuthState);
    if (!authState.isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

@Component({
  selector: 'protected',
  template: `
    <h1>This is protected route</h1>
  `,
})
export class Protected {}
