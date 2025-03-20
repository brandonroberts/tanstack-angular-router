import { Component, inject } from '@angular/core';

import { Outlet, Router } from '../router';


@Component({
  selector: 'parent',
  standalone: true,
  imports: [Outlet],
  template: `
    Parent -
    <a (click)="child('child')">Child</a> |
    <a (click)="child('1')">Child 1</a> |
    <a (click)="child('2')">Child 2</a>
    <hr />

    <outlet></outlet>
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

  child(num: string) {
    this.router.navigate(({ to: '/parent/$id', params: { id: num } }));
  }
}
