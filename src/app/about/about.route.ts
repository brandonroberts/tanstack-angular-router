import { createRoute } from '@tanstack/angular-router';

import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Route as RootRoute } from '../root.route';
import { TodosService } from '../todos.service';

export const AboutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'about',
  loader: async () => {
    const todosService = inject(TodosService);
    const todos = await firstValueFrom(todosService.getTodo(1));
    return { todos };
  },
}).lazy(() => import('./about.component').then((m) => m.LazyAboutRoute));
