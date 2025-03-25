import { Component, inject, runInInjectionContext } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { createRoute } from '@tanstack/angular-router';
import { firstValueFrom } from 'rxjs';

import { TodosService } from './todos.service';
import { Route as RootRoute } from './root.route';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'about',
  component: () => AboutComponent,
  loader: ({ context, route }) => {
    const routeInjector = (
      context as { getRouteInjector: Function }
    ).getRouteInjector(route.id);

    return runInInjectionContext(routeInjector, async () => {
      const todosService = inject(TodosService);
      const todos = await firstValueFrom(todosService.getTodo(1));

      return { todos };
    });
  },
});

@Component({
  selector: 'about',
  standalone: true,
  imports: [JsonPipe],
  template: `
    TanStack Routing in Angular

    <hr />
    Loader Data: {{ loaderData() | json }}

    <hr />
  `,
})
export class AboutComponent {
  loaderData = Route.getLoaderData();
}
