import {
  createEnvironmentInjector,
  Directive,
  effect,
  EnvironmentInjector,
  inject,
  Injector,
  Type,
  ViewContainerRef,
} from '@angular/core';

import {
  getRouteContext,
  Router,
  ROUTE_CONTEXT,
  RouteContext,
} from './router';
import { AnyRoute, AnyRouter } from '@tanstack/router-core';
import { ContextService } from './context';

@Directive({
  selector: 'outlet'
})
export class Outlet {
  private cmp!: Type<any>;
  private context? = getRouteContext();
  private router = inject(Router);
  private vcr = inject(ViewContainerRef);
  private injectorContext = inject(ContextService);

  constructor() {
    effect(() => {
      const routerState = this.router.routerState();
      const hasMatches = routerState.matches.length > 0;
      
      if (!hasMatches) {
        return;
      }

      const matchesToRender = this.getMatch(routerState.matches.slice(1));
      const route: AnyRoute = this.router.getRouteById(matchesToRender.routeId);
      const currentCmp = (route && route.options.component ? route.options.component() : undefined) as Type<any>;
      const injector = this.injectorContext.getContext(matchesToRender.routeId, matchesToRender, this.vcr.injector);

      if (this.cmp !== currentCmp) {
        this.vcr.clear();
        this.vcr.createComponent(currentCmp, {
          injector,
          // environmentInjector,
        });
        this.cmp = currentCmp;
      }
    });
  }

  getInjector(matchesToRender: { routeId: string, params: any }) {
    // const parentInjector = this.context?.injector || this.router.options.context.injector
    
    const injector = Injector.create({
      providers: [
        {
          provide: ROUTE_CONTEXT,
          useValue: {
            id: matchesToRender.routeId,
            params: matchesToRender.params,
            // injector: parentInjector
          },
        }
      ],
      parent: this.vcr.injector
    });

    return injector;
  }  

  getEnvInjector() {
    const parentInjector = this.context?.injector || this.router.options.context.injector
    
    const injector = createEnvironmentInjector([], parentInjector);

    return injector;
  }

  getMatch(matches: any[]): any {
    const idx = matches.findIndex(
      (match) => match.id === this.context?.id
    );
    const matchesToRender = matches[idx + 1];

    return matchesToRender;
  }
}
