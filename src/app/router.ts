
import { createRoute, TypedRouter } from '@tanstack/angular-router';

import { HomeComponent } from './home.component';
import { Route as ParentRoute } from './parent.component';
import { Route as ChildRoute } from './child.component';
import { Route as RootRoute } from './root.route';
import { Route as AboutRoute } from './about.component';

const HomeRoute = createRoute({ getParentRoute: () => RootRoute, path: '/', component: () => HomeComponent });

export const routeTree = RootRoute.addChildren([
  HomeRoute,
  AboutRoute,
  ParentRoute.addChildren([ChildRoute]),
]);

export type router = TypedRouter<typeof routeTree>;

declare module '@tanstack/router-core' {
  interface Register {
    // This infers the type of our router and registers it across your entire project
    router: router
  }
}
