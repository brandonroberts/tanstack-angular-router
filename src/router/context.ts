import { createEnvironmentInjector, EnvironmentInjector, Injectable, Injector, Provider } from "@angular/core";
import { ROUTE_CONTEXT } from "./router";

export class ContextService {
  private readonly injectors = new Map<string, Injector>();
  private readonly envInjectors = new Map<string, EnvironmentInjector>();

  private setContext(routeId: string, injector: Injector) {
    this.injectors.set(routeId, injector);
  }

  getContext(routeId: string, context: any, parent: Injector) {
    const injector = this.injectors.get(routeId);

    if (injector) {
      return injector;
    }

    const newInjector = this.getInjector(routeId, context, parent);
    this.setContext(routeId, newInjector);

    return newInjector;
  }

  getEnvContext(routeId: string, providers: Provider[], parent: EnvironmentInjector) {
    const injector = this.envInjectors.get(routeId);

    if (injector) {
      return injector;
    }

    const newInjector = this.getEnvInjector(routeId, providers, parent)
    this.envInjectors.set(routeId, newInjector);

    return newInjector;
  }

  private getInjector(routeId: string, context: any, parentInjector: Injector) {
    const injector = Injector.create({
      providers: [
        {
          provide: ROUTE_CONTEXT,
          useValue: {
            id: context.routeId,
            params: context.params,
          },
        }
      ],
      parent: parentInjector,
      name: routeId
    });

    return injector;
  }

  getEnvInjector(routeId: string, providers: Provider[] = [], injector: EnvironmentInjector) {
    const envInjector = createEnvironmentInjector(providers, injector, routeId);

    return envInjector;
  }
}

export const context = new ContextService();