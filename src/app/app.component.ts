import { Component } from '@angular/core';
import { injectRouter, Link, Outlet } from '@tanstack/angular-router';
import { TanStackRouterDevtoolsComponent } from '../router/router-devtools';

@Component({
  selector: 'app-root',
  imports: [Outlet, TanStackRouterDevtoolsComponent, Link],
  template: `
    <h1>Welcome to {{ title }}!</h1>
    <a link="/" class="chau">Home</a> | <a link="/about">About</a> |
    <a [link]="{ to: '/parent' }" [linkActive]="{ exact: false }">Parent 1</a>
    <hr />

    <outlet />

    @if (router) {
      <tan-stack-router-devtools
        [router]="router"
        [initialIsOpen]="true"
        position="bottom-right"
      />
    }
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
export class AppComponent {
  title = 'tanstack-router-angular';
  router = injectRouter();
}
