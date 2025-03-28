import { Component } from '@angular/core';
import {
  Link,
  linkOptions,
  Outlet,
  RouterDevtools,
} from 'tanstack-angular-router-experimental';

@Component({
  selector: 'app-root',
  imports: [Outlet, Link, RouterDevtools],
  template: `
    <h1>Welcome to {{ title }}!</h1>
    @for (link of links; track link.to) {
      <a [link]="link">{{ link.label }}</a>
      |
    }
    <hr />

    <outlet />

    <router-devtools />
  `,
  styles: [
    `
      a[data-active='true'] {
        font-weight: bold;
        padding: 0.5rem;
        border: 1px solid;
      }
    `,
  ],
})
export class App {
  title = 'tanstack-router-angular';

  protected links = linkOptions([
    { to: '/', label: 'Home' },
    { to: '/about', preload: 'intent', label: 'About' },
    { to: '/parent', label: 'Parent', activeOptions: { exact: false } },
    { to: '/protected', label: 'Protected' },
    { to: '/login', label: 'Login', search: { redirect: '' } },
  ]);
}
