import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  DestroyRef,
  effect,
  EnvironmentInjector,
  inject,
  Injector,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { AnyRoute, RouterState } from '@tanstack/router-core';
import invariant from 'tiny-invariant';

import { DefaultNotFound } from './not-found';
import { injectRouteContext, injectRouter } from './router';
import { injectRouterContext } from './router-context';

@Component({
  selector: 'outlet',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Outlet {
  private router = injectRouter();
  private routerContext = injectRouterContext();
  private routeContext = injectRouteContext();
  private vcr = inject(ViewContainerRef);
  private injector = inject(Injector);
  private environmentInjector = inject(EnvironmentInjector);

  private fullMatches = computed(() => this.router.routerState().matches);
  private matchId = computed(
    () => this.routeContext?.id || this.fullMatches()[0]?.id
  );

  /**
   * NOTE: we slice off the first match because we let Angular renders the root route
   */
  private matches = computed(() => this.fullMatches().slice(1));
  private pendingMatches = computed(() =>
    this.router.routerState().pendingMatches?.slice(1)
  );
  private match = computed(() => {
    const matches = this.matches();
    const index = matches.findIndex((d) => d.id === this.routeContext?.id);
    return matches[index + 1];
  });
  private pendingMatch = computed(() => {
    const pendingMatches = this.pendingMatches();
    if (!pendingMatches) return null;
    const index = pendingMatches.findIndex(
      (d) => d.id === this.routeContext?.id
    );
    return pendingMatches[index + 1];
  });
  private routeMatch = computed(() => this.pendingMatch() || this.match());

  private route = computed(() => {
    const match = this.routeMatch();
    if (!match) return null;
    return this.router.routesById[match.routeId];
  });
  private parentGlobalNotFound = computed(() => {
    const matchId = this.matchId();
    if (!matchId) return null;

    const match = this.match();
    if (match) return null;

    const matches = this.fullMatches();
    const parentMatch = matches.find((d) => d.id === matchId);
    invariant(
      parentMatch,
      `Could not find parent match for matchId "${this.routeContext?.id}"`
    );
    const route = this.router.routesById[parentMatch.routeId];
    return { globalNotFound: parentMatch.globalNotFound, route };
  });

  private cmp?: Type<any>;
  private cmpRef?: ComponentRef<any>;

  constructor() {
    effect(() => {
      const parentGlobalNotFound = this.parentGlobalNotFound();
      if (parentGlobalNotFound && parentGlobalNotFound.globalNotFound) {
        return this.renderRouteNotFound(parentGlobalNotFound.route);
      }

      const match = this.routeMatch();
      if (!match) return;

      const route = this.route();
      if (!route) return;

      const injector = this.routerContext.getContext(
        match.routeId,
        match,
        this.vcr.injector
      );
      const environmentInjector = this.routerContext.getEnvContext(
        match.routeId,
        route.options.providers || [],
        this.router.injector,
        this.router
      );

      this.renderMatch(route, match, injector, environmentInjector);
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
      this.cmpRef = undefined;
      this.cmp = undefined;
    });
  }

  private renderRouteNotFound(route: AnyRoute) {
    this.vcr.clear();

    this.cmp =
      route.options.notFoundComponent?.() ||
      this.router.options.defaultNotFoundComponent?.() ||
      DefaultNotFound;

    if (!this.cmp) return;

    this.cmpRef = this.vcr.createComponent(this.cmp, {
      injector: this.injector,
      environmentInjector: this.environmentInjector,
    });
  }

  private renderMatch(
    route: AnyRoute,
    match: RouterState['matches'][number],
    injector: Injector,
    environmentInjector: EnvironmentInjector
  ) {
    let cmp: Type<any> | undefined = undefined;

    switch (match.status) {
      case 'pending': {
        cmp =
          route.options.pendingComponent?.() ||
          this.router.options.defaultPendingComponent?.() ||
          undefined;
        break;
      }

      case 'success':
        cmp = route.options.component?.() || Outlet;
        break;
    }

    if (!cmp) return;

    if (this.cmp !== cmp) {
      this.vcr.clear();

      this.cmpRef = this.vcr.createComponent(cmp, {
        injector,
        environmentInjector,
      });

      this.cmp = cmp;
    } else {
      this.cmpRef?.changeDetectorRef.markForCheck();
    }
  }
}
