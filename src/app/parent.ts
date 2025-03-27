import { Component } from '@angular/core';

import {
  createRoute,
  injectRouter,
  Link,
  Outlet,
} from 'tanstack-angular-router-experimental';

import { Route as RootRoute } from './root.route';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'parent',
  component: () => Parent,
});

@Component({
  selector: 'parent',
  imports: [Outlet, Link],
  template: `
    Parent -
    <a [link]="{ to: '/parent/$id', params: { id: 'child' } }">Child</a>
    |
    <a [link]="{ to: '/parent/$id', params: { id: '1' } }">Child 1</a>
    |
    <a [link]="{ to: '/parent/$id', params: { id: '2' } }">Child 2</a>
    <hr />

    <outlet />
  `,
  styles: [
    `
      a {
        text-decoration: underline;
      }

      a[data-active='true'] {
        font-weight: bold;
        padding: 0.5rem;
        border: 1px solid red;
      }
    `,
  ],
})
export class Parent {
  router = injectRouter();
}
