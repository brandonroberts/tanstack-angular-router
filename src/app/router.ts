import { BaseRootRoute, BaseRoute } from '@tanstack/router-core';

import {
  AboutComponent,
  // action as aboutAction,
} from './about.component';
import { HomeComponent } from './home.component';
import { ParentComponent } from './parent.component';
import { ChildComponent } from './child.component';
import { AppComponent } from './app.component';
import { TypedRouter, context as injectorContexts } from '@tanstack/angular-router';
import { createEnvironmentInjector, runInInjectionContext, inject, EnvironmentInjector } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TodosService } from './todos.service';


const rootRoute = new BaseRootRoute({ component: () => AppComponent });
const homeRoute = new BaseRoute({ getParentRoute: () => rootRoute, path: '/', component: () => HomeComponent });

const aboutRoute = new BaseRoute({
  getParentRoute: () => rootRoute,
  path: 'about',
  component: () => AboutComponent,
  loader: ({ context, route }) => {
    const routeInjector = (context as any).getRouteInjector(route.id);

    return runInInjectionContext(routeInjector, async() => {
      const todosService = inject(TodosService);
      const todos = await firstValueFrom(todosService.getTodo(1));

      return { todos };
    });
  }
});

const parentRoute = new BaseRoute({ getParentRoute: () => rootRoute, path: 'parent', component: () => ParentComponent });
const childRoute = new BaseRoute({ getParentRoute: () => parentRoute, path: '$id', component: () => ChildComponent });

export const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutRoute,
  parentRoute.addChildren([childRoute]),
]);

export type router = TypedRouter<typeof routeTree>;

declare module '@tanstack/router-core' {
  interface Register {
    // This infers the type of our router and registers it across your entire project
    router: router
  }
}