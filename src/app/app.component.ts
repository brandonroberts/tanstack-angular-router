import { Component } from '@angular/core';
import { injectRouter, Link, Outlet } from '@tanstack/angular-router';
import { TanStackRouterDevtoolsComponent } from '../router/router-devtools';

@Component({
  selector: 'app-root',
  imports: [Outlet, TanStackRouterDevtoolsComponent, Link],
  template: `
    <h1>Welcome to {{ title }}!</h1>

    <a #link="link" link="/" [class.active]="link.isActive()">Home</a> |
    <a #aboutLink="link" link="/about" [class.active]="aboutLink.isActive()"
      >About</a
    >
    |
    <a
      #parentOneLink="link"
      [link]="{ to: '/parent/$id', params: { id: '1' } }"
      [class.active]="parentOneLink.isActive()"
      >Parent 1</a
    >
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
      .active {
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
