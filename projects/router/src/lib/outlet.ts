import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  resource,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {
  createControlledPromise,
  getLocationChangeInfo,
  isNotFound,
  isRedirect,
  rootRouteId,
  pick as routerCorePick,
} from '@tanstack/router-core';
import invariant from 'tiny-invariant';
import warning from 'tiny-warning';
import { ComponentOutlet } from './component-outlet';
import { DefaultError } from './default-error';
import { DefaultNotFound } from './default-not-found';
import { Key } from './key';
import { ERROR_COMPONENT_CONTEXT, NOT_FOUND_COMPONENT_CONTEXT } from './route';
import { injectRouter } from './router';
import { routerState } from './router-state';
import { isDevMode } from './utils';

@Directive()
export class OnRendered {
  private match = inject(RouteMatch);
  private router = injectRouter();
  private parentRouteId = routerState({
    select: (s) => {
      const index = s.matches.findIndex((d) => d.id === this.match.matchId());
      return s.matches[index - 1]?.routeId as string;
    },
  });
  private location = routerState({
    select: (s) => s.resolvedLocation?.state.key,
  });

  constructor() {
    effect(() => {
      const [parentRouteId] = [this.parentRouteId(), this.location()];
      if (!parentRouteId || parentRouteId !== rootRouteId) return;

      this.router.emit({
        type: 'onRendered',
        ...getLocationChangeInfo(this.router.state),
      });
    });
  }
}

@Component({
  selector: 'route-match,RouteMatch',
  template: `
    <!--    @let match = this.match();-->

    <!--    @if (match) {-->
    <!--      @if (match.status === 'notFound' && notFoundMatch()) {-->
    <!--        <ng-container-->
    <!--          [componentOutlet]="notFoundMatch()!.component"-->
    <!--          [componentOutletInjector]="notFoundMatch()!.injector"-->
    <!--        />-->
    <!--      } @else if (-->
    <!--        (match.status === 'redirected' || match.status === 'pending') &&-->
    <!--        !matchLoadResource.value() &&-->
    <!--        pendingMatch()-->
    <!--      ) {-->
    <!--        <ng-container [componentOutlet]="pendingMatch()!.component" />-->
    <!--      } @else if (match.status === 'error' && errorMatch()) {-->
    <!--        <ng-container-->
    <!--          [componentOutlet]="errorMatch()!.component"-->
    <!--          [componentOutletInjector]="errorMatch()!.injector"-->
    <!--        />-->
    <!--      } @else if (match.status === 'success' && successMatch()) {-->
    <!--        <ng-container-->
    <!--          [componentOutlet]="successMatch()!.component"-->
    <!--          [componentOutletInjector]="successMatch()!.injector"-->
    <!--          [componentOutletEnvironmentInjector]="-->
    <!--            successMatch()!.environmentInjector-->
    <!--          "-->
    <!--        />-->
    <!--      }-->
    <!--    }-->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [OnRendered],
  // imports: [ComponentOutlet, Key],
})
export class RouteMatch {
  matchId = input.required<string>();

  private isDevMode = isDevMode();
  private injector = inject(Injector);
  private vcr = inject(ViewContainerRef);
  private environmentInjector = inject(EnvironmentInjector);
  private router = injectRouter();

  private resetKey = routerState({ select: (s) => s.loadedAt.toString() });
  private routeId = routerState({
    select: (s) =>
      s.matches.find((d) => d.id === this.matchId())?.routeId as string,
  });
  private route = computed(() => this.router.routesById[this.routeId()]);
  private pendingComponent = computed(
    () =>
      this.route().options.pendingComponent ||
      this.router.options.defaultPendingComponent
  );
  private errorComponent = computed(
    () =>
      this.route().options.errorComponent ||
      this.router.options.defaultErrorComponent
  );
  private onCatch = computed(
    () => this.route().options.onCatch || this.router.options.defaultOnCatch
  );

  private matchState = routerState({
    select: (s) => {
      const matchIndex = s.matches.findIndex((d) => d.id === this.matchId());
      const match = s.matches[matchIndex]!;

      if (!match) return null;
      const routeId = match.routeId as string;

      return {
        routeId,
        match: routerCorePick(match, ['id', 'status', 'error']),
      };
    },
  });

  private matchRouteId = computed(() => {
    const matchState = this.matchState();
    if (!matchState) return null;
    return matchState.routeId;
  });
  private matchRoute = computed(() => {
    const matchRouteId = this.matchRouteId();
    if (!matchRouteId) return null;
    return this.router.routesById[matchRouteId]!;
  });
  protected match = computed(
    () => {
      const matchState = this.matchState();
      if (!matchState) return null;
      return matchState.match;
    },
    { equal: (a, b) => !!a && !!b && a.id === b.id && a.status === b.status }
  );
  protected matchLoadResource = resource({
    request: this.match,
    loader: ({ request }) => {
      if (!request) return Promise.resolve() as any;

      const loadPromise = this.router.getMatch(request.id)?.loadPromise;
      if (!loadPromise) return Promise.resolve() as any;

      if (request.status === 'pending') {
        const pendingMinMs =
          this.matchRoute()?.options.pendingMinMs ??
          this.router.options.defaultPendingMinMs;

        let minPendingPromise = this.router.getMatch(
          request.id
        )?.minPendingPromise;

        if (pendingMinMs && !minPendingPromise) {
          // Create a promise that will resolve after the minPendingMs
          if (!this.router.isServer) {
            minPendingPromise = createControlledPromise<void>();
            Promise.resolve().then(() => {
              this.router.updateMatch(request.id, (prev) => ({
                ...prev,
                minPendingPromise,
              }));
            });

            setTimeout(() => {
              minPendingPromise?.resolve();
              // We've handled the minPendingPromise, so we can delete it
              this.router.updateMatch(request.id, (prev) => ({
                ...prev,
                minPendingPromise: undefined,
              }));
            }, pendingMinMs);
          }
        }

        return (minPendingPromise?.then(() => loadPromise) || loadPromise).then(
          () => request
        );
      }

      return loadPromise.then(() => request);
    },
  });

  // protected pendingMatch = computed(() => {
  //   const match = this.match();
  //   if (!match || (match.status !== 'pending' && match.status !== 'redirected'))
  //     return null;
  //
  //   const pendingComponent = this.pendingComponent()?.();
  //   if (!pendingComponent) return null;
  //
  //   return { component: pendingComponent };
  // });
  //
  // protected notFoundMatch = computed(() => {
  //   const match = this.match();
  //   if (!match || match.status !== 'notFound') return null;
  //   invariant(isNotFound(match.error), 'Expected a notFound error');
  //
  //   const route = this.route();
  //   let notFoundCmp: Type<any> | undefined = undefined;
  //
  //   if (!route.options.notFoundComponent) {
  //     notFoundCmp = this.router.options.defaultNotFoundComponent?.();
  //     if (!notFoundCmp) {
  //       if (this.isDevMode) {
  //         warning(
  //           route.options.notFoundComponent,
  //           `A notFoundError was encountered on the route with ID "${route.id}", but a notFoundComponent option was not configured, nor was a router level defaultNotFoundComponent configured. Consider configuring at least one of these to avoid TanStack Router's overly generic defaultNotFoundComponent (<p>Page not found</p>)`
  //         );
  //       }
  //       notFoundCmp = DefaultNotFound;
  //     }
  //   } else {
  //     notFoundCmp = route.options.notFoundComponent?.();
  //   }
  //
  //   if (!notFoundCmp) return null;
  //
  //   const injector = this.router.getRouteInjector(
  //     route.id + '-not-found',
  //     this.injector,
  //     [{ provide: NOT_FOUND_COMPONENT_CONTEXT, useValue: { data: undefined } }]
  //   );
  //
  //   return { component: notFoundCmp, injector };
  // });
  //
  // protected errorMatch = computed(() => {
  //   const match = this.match();
  //   if (!match || match.status !== 'error') return null;
  //
  //   const matchRoute = this.matchRoute();
  //   if (!matchRoute) return null;
  //
  //   const errorComponent = this.errorComponent()?.() || DefaultError;
  //   const injector = this.router.getRouteInjector(
  //     matchRoute.id + '-error',
  //     this.injector,
  //     [
  //       {
  //         provide: ERROR_COMPONENT_CONTEXT,
  //         useValue: {
  //           error: match.error,
  //           info: { componentStack: '' },
  //           reset: () => {
  //             void this.router.invalidate();
  //           },
  //         },
  //       },
  //     ]
  //   );
  //   return { component: errorComponent, injector };
  // });
  //
  // protected successMatch = computed(() => {
  //   const match = this.match();
  //   if (!match || match.status !== 'success') return null;
  //
  //   const matchRoute = this.matchRoute();
  //   if (!matchRoute) return null;
  //
  //   const successComponent = matchRoute.options.component?.() || Outlet;
  //   const injector = this.router.getRouteInjector(matchRoute.id, this.injector);
  //   const environmentInjector = this.router.getRouteEnvInjector(
  //     matchRoute.id,
  //     this.environmentInjector,
  //     matchRoute.options.providers || [],
  //     this.router
  //   );
  //
  //   return { component: successComponent, injector, environmentInjector };
  // });

  private cmp?: Type<any>;
  private cmpRef?: ComponentRef<any>;

  constructor() {
    effect(() => {
      const routeId = this.routeId();
      invariant(
        routeId,
        `Could not find routeId for matchId "${this.matchId()}". Please file an issue!`
      );

      const match = this.match();
      if (!match) return;

      const [route] = [this.matchRoute(), this.resetKey()];
      if (!route) return;

      if (match.status === 'notFound') {
        invariant(isNotFound(match.error), 'Expected a notFound error');

        let notFoundCmp: Type<any> | undefined;

        if (!route.options.notFoundComponent) {
          notFoundCmp = this.router.options.defaultNotFoundComponent?.();
          if (!notFoundCmp) {
            if (this.isDevMode) {
              warning(
                route.options.notFoundComponent,
                `A notFoundError was encountered on the route with ID "${route.id}", but a notFoundComponent option was not configured, nor was a router level defaultNotFoundComponent configured. Consider configuring at least one of these to avoid TanStack Router's overly generic defaultNotFoundComponent (<p>Page not found</p>)`
              );
            }
            notFoundCmp = DefaultNotFound;
          }
        } else {
          notFoundCmp = route.options.notFoundComponent?.();
        }

        if (!notFoundCmp) return null;

        const injector = this.router.getRouteInjector(
          route.id + '-not-found',
          this.injector,
          [{ provide: NOT_FOUND_COMPONENT_CONTEXT, useValue: {} }]
        );
        this.vcr.clear();
        const ref = this.vcr.createComponent(notFoundCmp, { injector });
        ref.changeDetectorRef.markForCheck();
        return;
      }

      if (match.status === 'redirected' || match.status === 'pending') {
        if (match.status === 'redirected') {
          invariant(isRedirect(match.error), 'Expected a redirect error');
        }

        if (!this.matchLoadResource.value()) {
          const pendingComponent = this.pendingComponent()?.();
          if (!pendingComponent) return;
          this.vcr.clear();
          const ref = this.vcr.createComponent(pendingComponent);
          ref.changeDetectorRef.markForCheck();
        }

        return;
      }

      if (match.status === 'error') {
        const errorComponent = this.errorComponent()?.() || DefaultError;
        const injector = this.router.getRouteInjector(
          route.id + '-error',
          this.injector,
          [
            {
              provide: ERROR_COMPONENT_CONTEXT,
              useValue: {
                error: match.error,
                info: { componentStack: '' },
                reset: () => {
                  void this.router.invalidate();
                },
              },
            },
          ]
        );

        this.vcr.clear();
        const ref = this.vcr.createComponent(errorComponent, { injector });
        ref.changeDetectorRef.markForCheck();
        return;
      }

      if (match.status === 'success') {
        const successComponent = route.options.component?.() || Outlet;

        if (this.cmp === successComponent) {
          this.cmpRef?.changeDetectorRef.markForCheck();
          return;
        }

        this.vcr.clear();
        this.cmpRef = undefined;
        const injector = this.router.getRouteInjector(route.id, this.injector);
        const environmentInjector = this.router.getRouteEnvInjector(
          route.id,
          this.environmentInjector,
          route.options.providers || [],
          this.router
        );
        this.cmpRef = this.vcr.createComponent(successComponent, {
          injector,
          environmentInjector,
        });
        this.cmpRef.changeDetectorRef.markForCheck();
        this.cmp = successComponent;
      }

      return;
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
      this.cmpRef = undefined;
      this.cmp = undefined;
    });
  }
}

@Component({
  selector: 'outlet,Outlet',
  template: `
    <!--    @if (notFoundComponentData(); as notFoundComponentData) {-->
    <!--      <ng-container-->
    <!--        [componentOutlet]="notFoundComponentData.component"-->
    <!--        [componentOutletInjector]="notFoundComponentData.injector"-->
    <!--      />-->
    <!--    } @else if (childMatchId()) {-->
    <!--      @let childMatchId = this.childMatchId()!;-->
    <!--      @if (childMatchId === rootRouteId) {-->
    <!--        @if (!matchLoadResource.value()) {-->
    <!--          @if (defaultPendingComponent) {-->
    <!--            <ng-container [componentOutlet]="defaultPendingComponent" />-->
    <!--          }-->
    <!--        } @else {-->
    <!--          <route-match [matchId]="childMatchId" />-->
    <!--        }-->
    <!--      } @else {-->
    <!--        <route-match *key="resetKey()" [matchId]="childMatchId" />-->
    <!--      }-->
    <!--    }-->
  `,
  imports: [RouteMatch, ComponentOutlet, Key],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Outlet {
  private closestMatch = inject(RouteMatch);
  private router = injectRouter();
  private vcr = inject(ViewContainerRef);
  private isDevMode = isDevMode();

  protected readonly rootRouteId = rootRouteId;
  protected readonly defaultPendingComponent =
    this.router.options.defaultPendingComponent?.();

  private routeId = routerState({
    select: (s) =>
      s.matches.find((d) => d.id === this.closestMatch.matchId())
        ?.routeId as string,
  });

  private route = computed(() => this.router.routesById[this.routeId()]!);

  private parentGlobalNotFound = routerState({
    select: (s) => {
      const closestMatchId = this.closestMatch.matchId();
      const parentMatch = s.matches.find((d) => d.id === closestMatchId);

      if (!parentMatch) {
        warning(
          false,
          `Could not find parent match for matchId "${closestMatchId}". Please file an issue!`
        );
        return false;
      }

      return parentMatch.globalNotFound;
    },
  });

  protected notFoundComponentData = computed(() => {
    const parentGlobalNotFound = this.parentGlobalNotFound();
    if (!parentGlobalNotFound) return null;

    const route = this.route();
    let notFoundCmp: Type<any> | undefined = undefined;

    if (!route.options.notFoundComponent) {
      notFoundCmp = this.router.options.defaultNotFoundComponent?.();
      if (!notFoundCmp) {
        if (this.isDevMode) {
          warning(
            route.options.notFoundComponent,
            `A notFoundError was encountered on the route with ID "${route.id}", but a notFoundComponent option was not configured, nor was a router level defaultNotFoundComponent configured. Consider configuring at least one of these to avoid TanStack Router's overly generic defaultNotFoundComponent (<p>Page not found</p>)`
          );
        }
        notFoundCmp = DefaultNotFound;
      }
    } else {
      notFoundCmp = route.options.notFoundComponent?.();
    }

    if (!notFoundCmp) return null;

    const injector = this.router.getRouteInjector(
      route.id + '-not-found',
      this.vcr.injector,
      [{ provide: NOT_FOUND_COMPONENT_CONTEXT, useValue: { data: undefined } }]
    );

    return { component: notFoundCmp, injector };
  });

  protected childMatchId = routerState({
    select: (s) => {
      const matches = s.matches;
      const index = matches.findIndex(
        (d) => d.id === this.closestMatch.matchId()
      );
      if (index === -1) return null;
      return matches[index + 1]?.id;
    },
  });

  protected matchLoadResource = resource({
    request: this.childMatchId,
    loader: ({ request }) => {
      if (!request) return Promise.resolve() as any;
      const loadPromise = this.router.getMatch(request)?.loadPromise;
      if (!loadPromise) return Promise.resolve() as any;
      return loadPromise.then(() => request);
    },
  });

  private renderedId?: string;
  private cmpRef?: ComponentRef<any>;

  constructor() {
    effect(() => {
      const parentGlobalNotFound = this.parentGlobalNotFound();
      if (parentGlobalNotFound) {
        this.vcr.clear();

        const route = this.route();
        let notFoundCmp: Type<any> | undefined = undefined;

        if (!route.options.notFoundComponent) {
          notFoundCmp = this.router.options.defaultNotFoundComponent?.();
          if (!notFoundCmp) {
            if (this.isDevMode) {
              warning(
                route.options.notFoundComponent,
                `A notFoundError was encountered on the route with ID "${route.id}", but a notFoundComponent option was not configured, nor was a router level defaultNotFoundComponent configured. Consider configuring at least one of these to avoid TanStack Router's overly generic defaultNotFoundComponent (<p>Page not found</p>)`
              );
            }
            notFoundCmp = DefaultNotFound;
          }
        } else {
          notFoundCmp = route.options.notFoundComponent?.();
        }

        if (!notFoundCmp) return null;

        const injector = this.router.getRouteInjector(
          route.id + '-not-found',
          this.vcr.injector,
          [{ provide: NOT_FOUND_COMPONENT_CONTEXT, useValue: {} }]
        );
        const ref = this.vcr.createComponent(notFoundCmp, { injector });
        ref.changeDetectorRef.markForCheck();
        return;
      }

      const childMatchId = this.childMatchId();
      if (!childMatchId) return;

      if (this.renderedId === childMatchId) {
        this.cmpRef?.changeDetectorRef.markForCheck();
        return;
      }

      this.vcr.clear();
      this.cmpRef = undefined;

      if (childMatchId === rootRouteId && !this.matchLoadResource.value()) {
        if (this.defaultPendingComponent) {
          const ref = this.vcr.createComponent(this.defaultPendingComponent);
          ref.changeDetectorRef.markForCheck();
        }
        return;
      }

      this.cmpRef = this.vcr.createComponent(RouteMatch);
      this.cmpRef.setInput('matchId', childMatchId);
      this.cmpRef.changeDetectorRef.markForCheck();
      this.renderedId = childMatchId;
      return;
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
      this.cmpRef = undefined;
      this.renderedId = undefined;
    });
  }
}
