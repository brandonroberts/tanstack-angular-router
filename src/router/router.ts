import {
  EnvironmentInjector,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Provider,
  Type,
} from '@angular/core';
import {
  AnyRoute,
  RouteContext as RouteContextCore,
  RouterConstructorOptions,
  RouterCore} from '@tanstack/router-core';
import { createRouter, NgRouter } from './create-router';
import { context } from './context';

export type RouteObject = {
  element: Type<any>;
  children?: RouteObject[];
};

export interface RouteContext extends RouteContextCore {
  id: string;
  params: any;
}

export const Router = new InjectionToken<NgRouter<any, any, any, any, any>>('@tanstack/angular-router');

export const ROUTE_CONTEXT = new InjectionToken<RouteContext>('Route Context');

export function getRouter() {
  const router = inject(Router);

  return router;
}

export function injectRouteContext() {
  return inject(ROUTE_CONTEXT, { optional: true, skipSelf: true });
}

export function provideRouter(options: RouterConstructorOptions<AnyRoute, any, any, any, any>) {
  return makeEnvironmentProviders([
    {
      provide: Router,
      useFactory: () => {
        const injector = inject(EnvironmentInjector);
        const router = createRouter({
          ...options,
          context: {
            ...options.context,
            getRouteInjector(routeId: string, providers: Provider[] = []) {
              return context.getEnvContext(routeId, providers, injector);
            }
          }
        });

        return router;
      }
    }
  ]);
}

export type TypedRouter<T extends AnyRoute> = RouterCore<T, "never", false>;
