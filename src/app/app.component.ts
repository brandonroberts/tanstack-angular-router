import { Component } from '@angular/core';
import { injectRouter, Link, Outlet } from '@tanstack/angular-router';
import { TanStackRouterDevtoolsComponent } from '../router/router-devtools';

@Component({
  selector: 'app-root',
  imports: [Outlet, TanStackRouterDevtoolsComponent, Link],
  template: `
    <h1>Welcome to {{ title }}!</h1>

    <a link="/">Home</a> | <a link="/about">About</a> |
    <a [link]="{ to: '/parent/$id', params: { id: '1' } }">Parent 1</a>
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
  styles: [],
})
export class AppComponent {
  title = 'tanstack-router-angular';
  router = injectRouter();
}
