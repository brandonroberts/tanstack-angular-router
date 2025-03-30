import { NgComponentOutlet } from '@angular/common';
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
import { DefaultError } from './default-error';
import { DefaultNotFound } from './default-not-found';
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
    @let match = this.match();

    @switch (match.status) {
      @case ('notFound') {
        @if (notFoundMatch(); as notFoundMatch) {
          <ng-container
            [ngComponentOutlet]="notFoundMatch.component"
            [ngComponentOutletInjector]="notFoundMatch.injector"
          />
        }
      }

      <!-- TODO: clean this up once Angular supports multiple cases -->
      @case ('redirected') {
        @if (matchLoadResource.isLoading()) {
          @if (pendingMatch(); as pendingMatch) {
            <ng-container [ngComponentOutlet]="pendingMatch.component" />
          }
        }
      }
      @case ('pending') {
        @if (matchLoadResource.isLoading()) {
          @if (pendingMatch(); as pendingMatch) {
            <ng-container [ngComponentOutlet]="pendingMatch.component" />
          }
        }
      }

      @case ('error') {
        @if (errorMatch(); as errorMatch) {
          <ng-container
            [ngComponentOutlet]="errorMatch.component"
            [ngComponentOutletInjector]="errorMatch.injector"
          />
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [OnRendered],
  imports: [NgComponentOutlet],
})
export class RouteMatch {
  matchId = input.required<string>();

  private isDevMode = isDevMode();
  private vcr = inject(ViewContainerRef);
  private injector = inject(Injector);
  private environmentInjector = inject(EnvironmentInjector);
  private router = injectRouter();
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
      const routeId = match.routeId as string;

      return {
        routeId,
        match: routerCorePick(match, ['id', 'status', 'error']),
      };
    },
  });

  private matchRouteId = computed(() => this.matchState().routeId);
  private matchRoute = computed(
    () => this.router.routesById[this.matchRouteId()]!
  );
  protected match = computed(() => this.matchState().match, {
    equal: (a, b) => a.id === b.id && a.status === b.status,
  });
  protected matchLoadResource = resource({
    request: this.match,
    loader: ({ request }) => {
      const loadPromise = this.router.getMatch(request.id)?.loadPromise;
      if (!loadPromise) return Promise.resolve();

      if (request.status === 'pending') {
        const pendingMinMs =
          this.matchRoute().options.pendingMinMs ??
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

        return minPendingPromise?.then(() => loadPromise) || loadPromise;
      }

      return loadPromise;
    },
  });

  protected pendingMatch = computed(() => {
    const match = this.match();
    if (match.status !== 'pending' && match.status !== 'redirected')
      return null;

    const pendingComponent = this.pendingComponent()?.();
    if (!pendingComponent) return null;

    return { component: pendingComponent };
  });

  protected notFoundMatch = computed(() => {
    const match = this.match();
    if (match.status !== 'notFound') return null;
    invariant(isNotFound(match.error), 'Expected a notFound error');

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
      this.injector,
      [{ provide: NOT_FOUND_COMPONENT_CONTEXT, useValue: { data: undefined } }]
    );

    return { component: notFoundCmp, injector };
  });

  protected errorMatch = computed(() => {
    const match = this.match();
    if (match.status !== 'error') return null;
    const errorComponent = this.errorComponent()?.() || DefaultError;
    const injector = this.router.getRouteInjector(
      this.matchRoute().id + '-error',
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
    return { component: errorComponent, injector };
  });

  constructor() {
    let cmp: Type<any> | undefined = undefined;
    let cmpRef: ComponentRef<any> | undefined = undefined;

    effect((onCleanup) => {
      const routeId = this.routeId();
      invariant(
        routeId,
        `Could not find routeId for matchId "${this.matchId()}". Please file an issue!`
      );

      const match = this.match();
      if (match.status === 'error') {
        this.onCatch()?.(match.error as Error);
        return;
      }

      if (match.status === 'redirected') {
        invariant(isRedirect(match.error), 'Expected a redirect error');
        return;
      }

      if (match.status === 'success') {
        /**
         * NOTE: we need to render the success case via VCR because
         * ngComponentOutlet does not support EnvironmentInjector yet
         */

        const currentCmp = this.matchRoute().options.component?.() || Outlet;

        if (cmp === currentCmp) {
          cmpRef?.changeDetectorRef.markForCheck();
        } else {
          const injector = this.router.getRouteInjector(
            this.matchRoute().id,
            this.injector
          );
          const environmentInjector = this.router.getRouteEnvInjector(
            this.matchRoute().id,
            this.environmentInjector,
            this.matchRoute().options.providers || [],
            this.router
          );
          cmp = currentCmp;
          cmpRef = this.vcr.createComponent(currentCmp, {
            injector,
            environmentInjector,
          });
          cmpRef.changeDetectorRef.markForCheck();
        }
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
      cmpRef?.destroy();
      cmpRef = undefined;
      cmp = undefined;
    });
  }
}

@Component({
  selector: 'outlet,Outlet',
  template: `
    @if (notFoundComponentData(); as notFoundComponentData) {
      <ng-container
        [ngComponentOutlet]="notFoundComponentData.component"
        [ngComponentOutletInjector]="notFoundComponentData.injector"
      />
    } @else {
      @if (childMatchId(); as childMatchId) {
        @if (childMatchId === rootRouteId) {
          @if (matchLoadResource.isLoading()) {
            @if (defaultPendingComponent) {
              <ng-container [ngComponentOutlet]="defaultPendingComponent" />
            }
          } @else {
            <route-match [matchId]="childMatchId" />
          }
        } @else {
          <route-match [matchId]="childMatchId" />
        }
      }
    }
  `,
  imports: [NgComponentOutlet, RouteMatch],
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
      const matches = s.matches;
      const parentMatch = matches.find(
        (d) => d.id === this.closestMatch.matchId()
      );

      invariant(
        parentMatch,
        `Could not find parent match for matchId "${this.closestMatch.matchId()}"`
      );

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
      return matches[index + 1]?.id;
    },
  });

  protected matchLoadResource = resource({
    request: this.childMatchId,
    loader: ({ request }) => {
      const loadPromise = this.router.getMatch(request)?.loadPromise;
      if (!loadPromise) return Promise.resolve();
      return loadPromise;
    },
  });
}
