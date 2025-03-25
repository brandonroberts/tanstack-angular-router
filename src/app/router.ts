import { TypedRouter } from '@tanstack/angular-router';

import { Route as HomeRoute } from './home.component';
import { Route as ParentRoute } from './parent.component';
import { Route as ChildRoute } from './child.component';
import { Route as RootRoute } from './root.route';
import { Route as AboutRoute } from './about.component';

export const routeTree = RootRoute.addChildren([
  HomeRoute,
  AboutRoute,
  ParentRoute.addChildren([ChildRoute]),
]);

export type router = TypedRouter<typeof routeTree>;

declare module '@tanstack/router-core' {
  interface Register {
    // This infers the type of our router and registers it across your entire project
    router: router;
  }
}
