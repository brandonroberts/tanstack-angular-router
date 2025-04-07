import { createRouter } from 'tanstack-angular-router-experimental';

import { AboutRoute } from './about/about.route';
import { Route as ChildRoute } from './child';
import { Route as HomeRoute } from './home';
import { Route as LoginRoute } from './login';
import { Route as ParentRoute } from './parent';
import { Route as ProtectedRoute } from './protected';
import { Route as RootRoute } from './root.route';

export const routeTree = RootRoute.addChildren([
  HomeRoute,
  AboutRoute,
  ParentRoute.addChildren([ChildRoute]),
  ProtectedRoute,
  LoginRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/router-core' {
  interface Register {
    // This infers the type of our router and registers it across your entire project
    router: typeof router;
  }
}
