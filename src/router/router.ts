import {
  computed,
  EnvironmentInjector,
  inject,
  InjectionToken,
  Type,
} from '@angular/core';
import {
  AnyRouter,
  RouteContext as RouteContextCore
} from '@tanstack/router-core';
import { NgRouter } from './create-router';

export type RouteObject = {
  element: Type<any>;
  children?: RouteObject[];
};

export interface RouteContext extends RouteContextCore {
  id: string;
  params: any;
  injector: EnvironmentInjector
}

export const Router = new InjectionToken<NgRouter<any, any, any, any, any>>('@tanstack/angular-router');

export const ROUTE_CONTEXT = new InjectionToken<RouteContext>('Route Context');

export function getRouter() {
  const router = inject(Router);

  return router;
}

export function getRouteContext() {
  return inject(ROUTE_CONTEXT, { optional: true, skipSelf: true });
}

export function getLoaderData<T extends object = object>() {
  const router = inject(Router);
  const context = getRouteContext();

  return computed(() => {
    const routerState = router.routerState();
    const route = routerState.matches.find((match) => match.routeId === context!.id);

    return ((route && route.loaderData) || {}) as T;
  });
}

export function getRouteParams<T extends object = object>() {
  const router = inject(Router);
  const context = getRouteContext();

  return computed(() => {
    const routerState = router.routerState();
    const route = routerState.matches.find((match) => match.routeId === context!.id);

    return ((route && route.params) || {}) as T;
  });
}

export function provideRouter(router: AnyRouter) {
  return [
    {
      provide: Router,
      useFactory: () => {
        router.update({
          context: {
            injector: inject(EnvironmentInjector)
          }
        });
        return router
      }
    }
  ]
}
