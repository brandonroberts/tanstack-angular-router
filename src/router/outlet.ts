import {
  Directive,
  effect,
  inject,
  Type,
  ViewContainerRef,
} from '@angular/core';

import { injectRouteContext, Router } from './router';
import { AnyRoute } from '@tanstack/router-core';

import { context } from './context';

@Directive({
  selector: 'outlet',
})
export class Outlet {
  private cmp!: Type<any>;
  private context? = injectRouteContext();
  private router = inject(Router);
  private vcr = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const routerState = this.router.routerState();
      const hasMatches = routerState.matches.length > 0;

      if (!hasMatches) {
        return;
      }

      const matchesToRender = this.getMatch(routerState.matches.slice(1));
      const route: AnyRoute = this.router.getRouteById(matchesToRender.routeId);
      const currentCmp = (
        route && route.options.component ? route.options.component() : undefined
      ) as Type<any>;
      const injector = context.getContext(
        matchesToRender.routeId,
        matchesToRender,
        this.vcr.injector
      );
      const environmentInjector = context.getEnvContext(
        matchesToRender.routeId,
        route.options.providers || [],
        this.router.injector
      );

      if (this.cmp !== currentCmp) {
        this.vcr.clear();
        this.vcr.createComponent(currentCmp, {
          injector,
          environmentInjector,
        });
        this.cmp = currentCmp;
      }
    });
  }

  getMatch(matches: any[]): any {
    const idx = matches.findIndex((match) => match.id === this.context?.id);
    const matchesToRender = matches[idx + 1];

    return matchesToRender;
  }
}
