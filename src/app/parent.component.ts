import { Component, inject } from '@angular/core';

import { Link, Outlet, Router } from '@tanstack/angular-router';

@Component({
  selector: 'parent',
  imports: [Outlet, Link],
  template: `
    Parent -
    <a link to="/parent/$id" [params]="{ id: 'child' }">Child</a> |
    <a link to="/parent/$id" [params]="{ id: '1'} ">Child 1</a> |
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
