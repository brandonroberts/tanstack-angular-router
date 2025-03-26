import {
  ComponentRef,
  DestroyRef,
  Directive,
  effect,
  inject,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {
  AnyRoute,
  getLocationChangeInfo,
  RouterState,
} from '@tanstack/router-core';

import { injectRouteContext, injectRouter } from './router';
import { injectRouterContext } from './router-context';

@Directive({ selector: 'outlet', exportAs: 'outlet' })
export class Outlet {
  private routeContext = injectRouteContext();
  private routerContext = injectRouterContext();
  private router = injectRouter();
  private vcr = inject(ViewContainerRef);

  private cmp: Type<any> | null = null;
  private cmpRef: ComponentRef<any> | null = null;

  constructor() {
    effect(() => {
      const routerState = this.router.routerState();

      const hasMatches = routerState.matches.length > 0;
      if (!hasMatches) return;

      const matchesToRender = this.getMatch(routerState.matches.slice(1));
      if (!matchesToRender) return;

      const route: AnyRoute = this.router.getRouteById(matchesToRender.routeId);
      const currentCmp = (
        route && route.options.component ? route.options.component() : undefined
      ) as Type<any>;
      if (!currentCmp) return;

      const injector = this.routerContext.getContext(
        matchesToRender.routeId,
        matchesToRender,
        this.vcr.injector
      );

      const environmentInjector = this.routerContext.getEnvContext(
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
        this.router.emit({
          type: 'onResolved',
          ...getLocationChangeInfo(routerState),
        });
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
    const idx = matches.findIndex(
      (match) => match.id === this.routeContext?.id
    );
    return matches[idx + 1];
  }
}
