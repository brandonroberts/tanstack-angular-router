import { createRoute } from 'tanstack-angular-router-experimental';

import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Route as RootRoute } from '../root.route';
import { Spinner } from '../spinner';
import { TodosClient } from '../todos-client';

export const AboutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'about',
  pendingComponent: () => Spinner,
  loader: async () => {
    const todosService = inject(TodosClient);
    const todos = await firstValueFrom(todosService.getTodo(1));
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    return { todos };
  },
}).lazy(() => import('./about').then((m) => m.LazyAboutRoute));
