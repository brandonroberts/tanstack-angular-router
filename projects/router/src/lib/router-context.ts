import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  InjectionToken,
  Injector,
  Provider,
} from '@angular/core';
import { AnyRouter } from '@tanstack/router-core';
import { ROUTE_CONTEXT } from './router';

class RouterContext {
  private readonly injectors = new Map<string, Injector>();
  private readonly envInjectors = new Map<string, EnvironmentInjector>();

  getContext(routeId: string, context: Record<string, any>, parent: Injector) {
    const existingInjector = this.injectors.get(routeId);
    if (existingInjector) return existingInjector;

    const injector = Injector.create({
      providers: [
        {
          provide: ROUTE_CONTEXT,
          useValue: { id: context['routeId'], params: context['params'] },
        },
      ],
      parent,
      name: routeId,
    });

    // cache
    this.injectors.set(routeId, injector);

    return injector;
  }

  getEnvContext(
    routeId: string,
    providers: Provider[],
    parent: EnvironmentInjector,
    router: AnyRouter
  ) {
    const existingInjector = this.envInjectors.get(routeId);
    if (existingInjector) return existingInjector;

    const routeByRouteId =
      router.routesById[routeId] || router.routesByPath[routeId];
    let route = routeByRouteId;

    // walk up the route hierarchy to build the providers
    while (route) {
      const routeInjector = this.envInjectors.get(route.id);
      if (routeInjector) {
        parent = routeInjector;
        route = route.parentRoute;
        continue;
      }

      if (route.options?.providers) {
        providers.push(...route.options.providers);
      }

      route = route.parentRoute;
    }

    const envInjector = createEnvironmentInjector(providers, parent, routeId);

    // cache
    this.envInjectors.set(routeId, envInjector);

    return envInjector;
  }
}

export const ROUTER_CONTEXT = new InjectionToken<RouterContext>(
  'ROUTER_CONTEXT',
  { factory: () => new RouterContext() }
);

export function injectRouterContext() {
  return inject(ROUTER_CONTEXT);
}
