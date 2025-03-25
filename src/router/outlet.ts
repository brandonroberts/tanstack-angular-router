import {
  ComponentRef,
  DestroyRef,
  Directive,
  effect,
  inject,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { AnyRoute, RouterState } from '@tanstack/router-core';

import { context } from './context';
import { injectRouteContext, injectRouter } from './router';

@Directive({ selector: 'outlet', exportAs: 'outlet' })
export class Outlet {
  private context? = injectRouteContext();
  private router = injectRouter();
  private vcr = inject(ViewContainerRef);

  private cmp: Type<any> | null = null;
  private cmpRef: ComponentRef<any> | null = null;

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
        this.cmpRef = this.vcr.createComponent(currentCmp, {
          injector,
          environmentInjector,
        });
        this.cmp = currentCmp;
      } else {
        this.cmpRef?.changeDetectorRef.markForCheck();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
      this.cmp = null;
      this.cmpRef = null;
    });
  }

  getMatch(matches: RouterState['matches']) {
    const idx = matches.findIndex((match) => match.id === this.context?.id);
    return matches[idx + 1];
  }
}
