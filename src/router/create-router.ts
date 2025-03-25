import {
  EnvironmentInjector,
  inject,
  Provider,
  signal,
  Type,
} from '@angular/core';
import type { RouterHistory } from '@tanstack/history';
import type {
  AnyRoute,
  CreateRouterFn,
  RouterConstructorOptions,
  TrailingSlashOption,
} from '@tanstack/router-core';
import { RouterCore } from '@tanstack/router-core';

declare module '@tanstack/router-core' {
  export interface UpdatableRouteOptionsExtensions {
    component: () => Type<any>;

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
    // defaultErrorComponent?: ErrorRouteComponent
    /**
     * The default `pendingComponent` a route should use if no pending component is provided.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#defaultpendingcomponent-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/solid/guide/data-loading#showing-a-pending-component)
     */
    // defaultPendingComponent?: RouteComponent
    /**
     * The default `notFoundComponent` a route should use if no notFound component is provided.
     *
     * @default NotFound
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#defaultnotfoundcomponent-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/solid/guide/not-found-errors#default-router-wide-not-found-handling)
     */
    // defaultNotFoundComponent?: NotFoundRouteComponent
    /**
     * A component that will be used to wrap the entire router.
     *
     * This is useful for providing a context to the entire router.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#wrap-property)
     */
    // Wrap?: (props: { children: any }) => Type<unknown>
    /**
     * A component that will be used to wrap the inner contents of the router.
     *
     * This is useful for providing a context to the inner contents of the router where you also need access to the router context and hooks.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/solid/api/router/RouterOptionsType#innerwrap-property)
     */
    // InnerWrap?: (props: { children: any }) => Type<unknown>

    /**
     * The default `onCatch` handler for errors caught by the Router ErrorBoundary
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultoncatch-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#handling-errors-with-routeoptionsoncatch)
     */
    defaultOnCatch?: (error: Error) => void;
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
  readonly routerState = signal(this.state);
  readonly injector = inject(EnvironmentInjector);

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
    void this.load({ sync: true });
    this.__store.subscribe(() => {
      this.routerState.set(this.state);
    });
  }

  getRouteById(routeId: string) {
    return this.routesById[routeId];
  }
}
