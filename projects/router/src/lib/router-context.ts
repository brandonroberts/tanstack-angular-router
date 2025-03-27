import {
  createEnvironmentInjector,
  EnvironmentInjector,
  inject,
  InjectionToken,
  Injector,
  Provider,
} from '@angular/core';
import { ROUTE_CONTEXT } from './router';

class RouterContext {
  private readonly injectors = new Map<string, Injector>();
  private readonly envInjectors = new Map<string, EnvironmentInjector>();

  private setContext(routeId: string, injector: Injector) {
    this.injectors.set(routeId, injector);
  }

  getContext(routeId: string, context: Record<string, any>, parent: Injector) {
    const injector = this.injectors.get(routeId);

    if (injector) {
      return injector;
    }

    const newInjector = this.getInjector(routeId, context, parent);
    this.setContext(routeId, newInjector);

    return newInjector;
  }

  getEnvContext(
    routeId: string,
    providers: Provider[],
    parent: EnvironmentInjector
  ) {
    const injector = this.envInjectors.get(routeId);

    if (injector) {
      return injector;
    }

    const newInjector = this.getEnvInjector(routeId, providers, parent);
    this.envInjectors.set(routeId, newInjector);

    return newInjector;
  }

  private getInjector(
    routeId: string,
    context: Record<string, any>,
    parentInjector: Injector
  ) {
    return Injector.create({
      providers: [
        {
          provide: ROUTE_CONTEXT,
          useValue: { id: context['routeId'], params: context['params'] },
        },
      ],
      parent: parentInjector,
      name: routeId,
    });
  }

  getEnvInjector(
    routeId: string,
    providers: Provider[] = [],
    injector: EnvironmentInjector
  ) {
    return createEnvironmentInjector(providers, injector, routeId);
  }
}

export const ROUTER_CONTEXT = new InjectionToken<RouterContext>(
  'ROUTER_CONTEXT',
  { factory: () => new RouterContext() }
);

export function injectRouterContext() {
  return inject(ROUTER_CONTEXT);
}
