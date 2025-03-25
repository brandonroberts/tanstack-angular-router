import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { createRoute } from '@tanstack/angular-router';
import { firstValueFrom } from 'rxjs';

import { Route as RootRoute } from './root.route';
import { TodosService } from './todos.service';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'about',
  component: () => AboutComponent,
  loader: async () => {
    const todosService = inject(TodosService);
    const todos = await firstValueFrom(todosService.getTodo(1));
    return { todos };
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
  loaderData = Route.loaderData();
}
