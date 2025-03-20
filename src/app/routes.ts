import { BaseRootRoute, BaseRoute } from '@tanstack/router-core';

import {
  AboutComponent,
  loader as aboutLoader,
  // action as aboutAction,
} from './about.component';
import { HomeComponent } from './home.component';
import { ParentComponent } from './parent.component';
import { ChildComponent } from './child.component';
import { AppComponent } from './app.component';

import { createRouter, TANSTACK_ROUTER } from '@tanstack/angular-router';

const rootRoute = new BaseRootRoute({ component: () => AppComponent });
const homeRoute = new BaseRoute({ getParentRoute: () => rootRoute, path: '/', component: () => HomeComponent });
const aboutRoute = new BaseRoute({ getParentRoute: () => rootRoute, path: 'about', component: () => AboutComponent, loader: aboutLoader });
const parentRoute = new BaseRoute({ getParentRoute: () => rootRoute, path: 'parent', component: () => ParentComponent });
const childRoute = new BaseRoute({ getParentRoute: () => parentRoute, path: '$id', component: () => ChildComponent });

const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  parentRoute.addChildren([childRoute]),
]);

export const router = createRouter({
  routeTree
});

export function provideRouter() {
  return {
    provide: TANSTACK_ROUTER,
    useFactory: () => {
      return router
    }
  }
}

declare module '@tanstack/router-core' {
  interface Register {
    // This infers the type of our router and registers it across your entire project
    router: typeof router
  }
}