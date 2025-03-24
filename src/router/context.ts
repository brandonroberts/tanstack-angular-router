import { Injectable, Injector } from "@angular/core";
import { ROUTE_CONTEXT } from "./router";

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  injectors = new Map<string, Injector>();

  private setContext(routeId: string, injector: Injector) {
    this.injectors.set(routeId, injector);
  }

  getContext(routeId: string, context: any, parent: Injector) {
    const injector = this.injectors.get(routeId);

    if (injector) {
      return injector;
    }

    const newInjector = this.createContext(context, parent);
    this.setContext(routeId, newInjector);

    return newInjector;
  }

  private createContext(context: any, parentInjector: Injector) {
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
      parent: parentInjector
    });

    return injector;    
  }
}