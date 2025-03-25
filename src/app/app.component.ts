import { Component, inject, OnInit } from '@angular/core';

import { Outlet, Link, Router, AnyRouter } from '@tanstack/angular-router';

import { TanStackRouterDevtoolsComponent } from '../router/router-devtools';

@Component({
  selector: 'app-root',
  imports: [Outlet, TanStackRouterDevtoolsComponent, Link],
  template: `
    <h1>Welcome to {{ title }}!</h1>

    <a link to="/">Home</a> | <a link to="/about">About</a> |
    <a link to="/parent/$id" [params]="{ id: '1' }">Parent 1</a>
    <hr />

    <outlet />

    @if (routerInstance) {
      <tan-stack-router-devtools
        [router]="routerInstance"
        [initialIsOpen]="true"
        position="bottom-right"
      />
    }
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'tanstack-router-angular';
  router = inject(Router);
  routerInstance: AnyRouter | null = null;

  ngOnInit() {
    this.routerInstance = this.router;
  }
}
