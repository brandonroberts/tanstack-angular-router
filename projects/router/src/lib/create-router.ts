import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  computed,
  effect,
  EnvironmentInjector,
  inject,
  linkedSignal,
  PLATFORM_ID,
  Provider,
  signal,
  Type,
} from '@angular/core';
import type { RouterHistory } from '@tanstack/history';
import {
  AnyRoute,
  CreateRouterFn,
  getLocationChangeInfo,
  RouterConstructorOptions,
  RouterCore,
  TrailingSlashOption,
  trimPathRight,
} from '@tanstack/router-core';
import { RouteLoaderData, RouteRouteParams, RouteRouteSearch } from './route';

declare module '@tanstack/router-core' {
  export interface UpdatableRouteOptionsExtensions {
    component?: () => Type<any>;
    notFoundComponent?: () => Type<any>;
    pendingComponent?: () => Type<any>;
    errorComponent?: () => Type<any>;
    providers?: Provider[];
  }
  export interface RouterOptionsExtensions {
    /**
     * The default `component` a route should use if no component is provided.
     *
     * @default Outlet
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#defaultcomponent-property)
     */
    // defaultComponent?: RouteComponent
    /**
     * The default `errorComponent` a route should use if no error component is provided.
     *
     * @default ErrorComponent
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#defaulterrorcomponent-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/solid/guide/data-loading#handling-errors-with-routeoptionserrorcomponent)
     */
    defaultErrorComponent?: () => Type<any>;
    /**
     * The default `pendingComponent` a route should use if no pending component is provided.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#defaultpendingcomponent-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/solid/guide/data-loading#showing-a-pending-component)
     */
    defaultPendingComponent?: () => Type<any>;
    /**
     * The default `notFoundComponent` a route should use if no notFound component is provided.
     *
     * @default NotFound
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#defaultnotfoundcomponent-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/solid/guide/not-found-errors#default-router-wide-not-found-handling)
     */
    defaultNotFoundComponent?: () => Type<any>;
    /**
     * The default `onCatch` handler for errors caught by the Router ErrorBoundary
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultoncatch-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#handling-errors-with-routeoptionsoncatch)
     */
    defaultOnCatch?: (error: Error) => void;
  }
  export interface RouteExtensions<
    TId extends string,
    TFullPath extends string,
  > {
    loaderData: RouteLoaderData<TId>;
    routeParams: RouteRouteParams<TId>;
    routeSearch: RouteRouteSearch<TId>;
  }
}

export const createRouter: CreateRouterFn = (options) => {
  return new NgRouter(options);
};

export class NgRouter<
  in out TRouteTree extends AnyRoute,
  in out TTrailingSlashOption extends TrailingSlashOption = 'never',
  in out TDefaultStructuralSharingOption extends boolean = false,
  in out TRouterHistory extends RouterHistory = RouterHistory,
  in out TDehydrated extends Record<string, any> = Record<string, any>,
> extends RouterCore<
  TRouteTree,
  TTrailingSlashOption,
  TDefaultStructuralSharingOption,
  TRouterHistory,
  TDehydrated
> {
  injector = inject(EnvironmentInjector);
  private platformId = inject(PLATFORM_ID);
  private appRef = inject(ApplicationRef);

  historyState = linkedSignal(() => this.history);
  routerState = linkedSignal(() => this.state);
  isTransitioning = signal(false);

  private status = computed(() => this.routerState().status);
  private prevStatus = linkedSignal<'pending' | 'idle', 'pending' | 'idle'>({
    source: this.status,
    computation: (src, prev) => prev?.source ?? src,
  });
  private location = computed(() => this.routerState().location);
  private prevLocation = linkedSignal<
    ReturnType<typeof this.location>,
    ReturnType<typeof this.location> | undefined
  >({
    source: this.location,
    computation: (src, prev) => prev?.source,
  });
  private matches = computed(() => this.routerState().matches);

  hasPendingMatches = computed(() =>
    this.matches().some((match) => match.status === 'pending')
  );

  isLoading = computed(() => this.routerState().isLoading);
  prevIsLoading = linkedSignal<boolean, boolean>({
    source: this.isLoading,
    computation: (src, prev) => prev?.source ?? src,
  });

  isAnyPending = computed(
    () => this.isLoading() || this.isTransitioning() || this.hasPendingMatches()
  );
  prevIsAnyPending = linkedSignal<boolean, boolean>({
    source: this.isAnyPending,
    computation: (src, prev) => prev?.source ?? src,
  });

  isPagePending = computed(() => this.isLoading() || this.hasPendingMatches());
  prevIsPagePending = linkedSignal<boolean, boolean>({
    source: this.isPagePending,
    computation: (src, prev) => prev?.source ?? src,
  });

  constructor(
    options: RouterConstructorOptions<
      TRouteTree,
      TTrailingSlashOption,
      TDefaultStructuralSharingOption,
      TRouterHistory,
      TDehydrated
    >
  ) {
    super(options);

    if (isPlatformBrowser(this.platformId)) {
      this.startTransition = (fn: () => void) => {
        this.isTransitioning.set(true);
        // NOTE: not quite the same as `React.startTransition` but close enough
        queueMicrotask(() => {
          fn();
          this.isTransitioning.set(false);
          this.appRef.tick();
        });
      };
    }

    effect(() => {
      const [prevLocation, location] = [this.prevLocation(), this.location()];
      if (prevLocation && location.state.key === prevLocation?.state.key) {
        return;
      }

      const [prevStatus, status] = [this.prevStatus(), this.status()];

      // when the router transitions from non-idle to idle, we emit a `onRendered` event
      if (prevStatus !== 'idle' && status === 'idle') {
        this.emit({ type: 'onRendered', ...getLocationChangeInfo(this.state) });
      }
    });

    effect((onCleanup) => {
      const unsub = this.__store.subscribe(() => {
        this.routerState.set(this.state);
      });
      onCleanup(() => unsub());
    });

    effect((onCleanup) => {
      const unsub = this.history.subscribe(() => {
        this.historyState.set(this.history);
        void this.load();
      });

      // track history state
      this.historyState();
      const nextLocation = this.buildLocation({
        to: this.latestLocation.pathname,
        search: true,
        params: true,
        hash: true,
        state: true,
        _includeValidateSearch: true,
      });

      if (
        trimPathRight(this.latestLocation.href) !==
        trimPathRight(nextLocation.href)
      ) {
        void this.commitLocation({ ...nextLocation, replace: true });
      }

      onCleanup(() => unsub());
    });

    effect(() => {
      const [prevIsLoading, isLoading] = [
        this.prevIsLoading(),
        this.isLoading(),
      ];
      if (prevIsLoading && !isLoading) {
        this.emit({
          type: 'onLoad', // When the new URL has committed, when the new matches have been loaded into state.matches
          ...getLocationChangeInfo(this.state),
        });
      }
    });

    effect(() => {
      const [prevIsPagePending, isPagePending] = [
        this.prevIsPagePending(),
        this.isPagePending(),
      ];
      if (prevIsPagePending && !isPagePending) {
        this.emit({
          type: 'onBeforeRouteMount',
          ...getLocationChangeInfo(this.state),
        });
      }
    });

    effect(() => {
      const [prevIsAnyPending, isAnyPending] = [
        this.prevIsAnyPending(),
        this.isAnyPending(),
      ];
      // The router was pending and now it's not
      if (prevIsAnyPending && !isAnyPending) {
        this.emit({ type: 'onResolved', ...getLocationChangeInfo(this.state) });
        this.__store.setState((s) => ({
          ...s,
          status: 'idle',
          resolvedLocation: s.location,
        }));
      }
    });
  }

  getRouteById(routeId: string) {
    return this.routesById[routeId];
  }
}
