import {
  EnvironmentInjector,
  inject,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  Provider,
  Type,
} from '@angular/core';
import {
  AnyRoute,
  RouteContext as RouteContextCore,
  RouterConstructorOptions,
  RouterCore,
} from '@tanstack/router-core';
import { context } from './context';
import { createRouter, NgRouter } from './create-router';

export type RouteObject = {
  element: Type<any>;
  children?: RouteObject[];
};

export interface RouteContext extends RouteContextCore {
  id: string;
  params: any;
}

export const Router = new InjectionToken<NgRouter<any, any, any, any, any>>(
  '@tanstack/angular-router'
);

export const ROUTE_CONTEXT = new InjectionToken<RouteContext>('Route Context');

export function injectRouter() {
  return inject(Router);
}

export function injectRouteContext() {
  return inject(ROUTE_CONTEXT, { optional: true, skipSelf: true });
}

export function provideRouter(
  options: RouterConstructorOptions<AnyRoute, any, any, any, any>
) {
  return makeEnvironmentProviders([
    {
      provide: Router,
      useFactory: () => {
        const injector = inject(EnvironmentInjector);
        return createRouter({
          ...options,
          context: {
            ...options.context,
            getRouteInjector(routeId: string, providers: Provider[] = []) {
              return context.getEnvContext(routeId, providers, injector);
            },
          },
        });
      },
    },
  ]);
}

export type TypedRouter<T extends AnyRoute> = RouterCore<T, 'never', false>;
export type RouterContext<T extends Record<string, any>> = T & {
  getRouteInjector: (routeId: string, providers?: Provider[]) => Injector;
};
