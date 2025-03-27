import { Component } from '@angular/core';
import {
  Link,
  Outlet,
  RouterDevtools,
} from 'tanstack-angular-router-experimental';

@Component({
  selector: 'app-root',
  imports: [Outlet, Link, RouterDevtools],
  template: `
    <h1>Welcome to {{ title }}!</h1>
    <a link="/" class="chau">Home</a>
    |
    <a link="/about">About</a>
    |
    <a [link]="{ to: '/parent' }" [linkActive]="{ exact: false }">Parent 1</a>
    |
    <a [link]="{ to: '/protected' }">Protected</a>
    |
    <a [link]="{ to: '/login' }">Login</a>
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
}
