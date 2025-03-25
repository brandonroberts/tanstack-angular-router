import { Component, inject } from '@angular/core';

import { createRoute, Link, Outlet, Router } from '@tanstack/angular-router';

import { Route as RootRoute } from './root.route';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'parent',
  component: () => ParentComponent,
});

@Component({
  selector: 'parent',
  imports: [Outlet, Link],
  template: `
    Parent -
    <a link to="/parent/$id" [params]="{ id: 'child' }">Child</a> |
    <a link to="/parent/$id" [params]="{ id: '1' }">Child 1</a> |
    <a link to="/parent/$id" [params]="{ id: '2' }">Child 2</a>
    <hr />

    <outlet />
  `,
  styles: [
    `
      a {
        text-decoration: underline;
      }
    `,
  ],
})
export class ParentComponent {
  router = inject(Router);
}
