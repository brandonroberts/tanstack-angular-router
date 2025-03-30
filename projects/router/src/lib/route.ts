import {
  InjectionToken,
  Provider,
  runInInjectionContext,
  type Type,
} from '@angular/core';
import {
  AnyContext,
  AnyRoute,
  BaseRootRoute,
  BaseRoute,
  BaseRouteApi,
  ResolveFullPath,
  ResolveId,
  ResolveParams,
  RootRouteId,
  RootRouteOptions,
  RouteConstraints,
  RouteOptions,
  type AnyRouter,
  type ConstrainLiteral,
  type ErrorComponentProps,
  type NotFoundRouteProps,
  type RegisteredRouter,
  type RouteIds,
} from '@tanstack/router-core';
import { loaderData, LoaderDataRoute } from './loader-data';
import { loaderDeps, LoaderDepsRoute } from './loader-deps';
import { match, MatchRoute } from './match';
import { params, ParamsRoute } from './params';
import { routeContext, RouteContextRoute } from './route-context';
import { search, SearchRoute } from './search';

declare module '@tanstack/router-core' {
  export interface UpdatableRouteOptionsExtensions {
    component?: () => RouteComponent;
    errorComponent?: false | null | (() => RouteComponent);
    notFoundComponent?: () => RouteComponent;
    pendingComponent?: () => RouteComponent;
    providers?: Provider[];
  }

  export interface RouteExtensions<
    TId extends string,
    TFullPath extends string,
  > {
    match: MatchRoute<TId>;
    routeContext: RouteContextRoute<TId>;
    search: SearchRoute<TId>;
    params: ParamsRoute<TId>;
    loaderDeps: LoaderDepsRoute<TId>;
    loaderData: LoaderDataRoute<TId>;
  }
}

export const ERROR_COMPONENT_CONTEXT = new InjectionToken<ErrorComponentProps>(
  'ERROR_COMPONENT_CONTEXT'
);
export const NOT_FOUND_COMPONENT_CONTEXT =
  new InjectionToken<NotFoundRouteProps>('NOT_FOUND_COMPONENT_CONTEXT');

export type RouteComponent<TComponent extends object = object> =
  Type<TComponent>;

export function routeApi<
  const TId,
  TRouter extends AnyRouter = RegisteredRouter,
>(id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>) {
  return new RouteApi<TId, TRouter>({ id });
}

export class RouteApi<
  TId,
  TRouter extends AnyRouter = RegisteredRouter,
> extends BaseRouteApi<TId, TRouter> {
  /**
   * @deprecated Use the `getRouteApi` function instead.
   */
  constructor({ id }: { id: TId }) {
    super({ id });
  }

  match: MatchRoute<TId> = (opts) => {
    return match({ ...opts, from: this.id } as any) as any;
  };

  routeContext: RouteContextRoute<TId> = (opts) => {
    return routeContext({ ...opts, from: this.id } as any);
  };

  search: SearchRoute<TId> = (opts) => {
    return search({ ...opts, from: this.id } as any) as any;
  };

  params: ParamsRoute<TId> = (opts) => {
    return params({ ...opts, from: this.id } as any) as any;
  };

  loaderDeps: LoaderDepsRoute<TId> = (opts) => {
    return loaderData({ ...opts, from: this.id, strict: false } as any);
  };

  loaderData: LoaderDataRoute<TId> = (opts) => {
    return loaderDeps({ ...opts, from: this.id, strict: false } as any);
  };
}

export class Route<
  in out TParentRoute extends RouteConstraints['TParentRoute'] = AnyRoute,
  in out TPath extends RouteConstraints['TPath'] = '/',
  in out TFullPath extends RouteConstraints['TFullPath'] = ResolveFullPath<
    TParentRoute,
    TPath
  >,
  in out TCustomId extends RouteConstraints['TCustomId'] = string,
  in out TId extends RouteConstraints['TId'] = ResolveId<
    TParentRoute,
    TCustomId,
    TPath
  >,
  in out TSearchValidator = undefined,
  in out TParams = ResolveParams<TPath>,
  in out TRouterContext = AnyContext,
  in out TRouteContextFn = AnyContext,
  in out TBeforeLoadFn = AnyContext,
  in out TLoaderDeps extends Record<string, any> = {},
  in out TLoaderFn = undefined,
  in out TChildren = unknown,
  in out TFileRouteTypes = unknown,
> extends BaseRoute<
  TParentRoute,
  TPath,
  TFullPath,
  TCustomId,
  TId,
  TSearchValidator,
  TParams,
  TRouterContext,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  TChildren,
  TFileRouteTypes
> {
  /**
   * @deprecated Use the `createRoute` function instead.
   */
  constructor(
    options?: RouteOptions<
      TParentRoute,
      TId,
      TCustomId,
      TFullPath,
      TPath,
      TSearchValidator,
      TParams,
      TLoaderDeps,
      TLoaderFn,
      TRouterContext,
      TRouteContextFn,
      TBeforeLoadFn
    >
  ) {
    super(options);
  }

  match: MatchRoute<TId> = (opts) => {
    return match({ ...opts, from: this.id } as any) as any;
  };

  routeContext: RouteContextRoute<TId> = (opts?) => {
    return match({
      ...opts,
      from: this.id,
      select: (d) => (opts?.select ? opts.select(d.context) : d.context),
    }) as any;
  };

  search: SearchRoute<TId> = (opts) => {
    return search({ ...opts, from: this.id } as any) as any;
  };

  params: ParamsRoute<TId> = (opts) => {
    return params({ ...opts, from: this.id } as any) as any;
  };

  loaderDeps: LoaderDepsRoute<TId> = (opts) => {
    return loaderDeps({ ...opts, from: this.id } as any);
  };

  loaderData: LoaderDataRoute<TId> = (opts) => {
    return loaderData({ ...opts, from: this.id } as any);
  };
}

export function createRoute<
  TParentRoute extends RouteConstraints['TParentRoute'] = AnyRoute,
  TPath extends RouteConstraints['TPath'] = '/',
  TFullPath extends RouteConstraints['TFullPath'] = ResolveFullPath<
    TParentRoute,
    TPath
  >,
  TCustomId extends RouteConstraints['TCustomId'] = string,
  TId extends RouteConstraints['TId'] = ResolveId<
    TParentRoute,
    TCustomId,
    TPath
  >,
  TSearchValidator = undefined,
  TParams = ResolveParams<TPath>,
  TRouteContextFn = AnyContext,
  TBeforeLoadFn = AnyContext,
  TLoaderDeps extends Record<string, any> = {},
  TLoaderFn = undefined,
  TChildren = unknown,
>(
  options: RouteOptions<
    TParentRoute,
    TId,
    TCustomId,
    TFullPath,
    TPath,
    TSearchValidator,
    TParams,
    TLoaderDeps,
    TLoaderFn,
    AnyContext,
    TRouteContextFn,
    TBeforeLoadFn
  >
): Route<
  TParentRoute,
  TPath,
  TFullPath,
  TCustomId,
  TId,
  TSearchValidator,
  TParams,
  AnyContext,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  TChildren,
  unknown
> {
  if (options.loader) {
    options.loader = runFnInInjectionContext(options.loader);
  }

  if (options.shouldReload && typeof options.shouldReload === 'function') {
    options.shouldReload = runFnInInjectionContext(options.shouldReload);
  }

  if (options.beforeLoad) {
    options.beforeLoad = runFnInInjectionContext(options.beforeLoad);
  }

  return new Route<
    TParentRoute,
    TPath,
    TFullPath,
    TCustomId,
    TId,
    TSearchValidator,
    TParams,
    AnyContext,
    TRouteContextFn,
    TBeforeLoadFn,
    TLoaderDeps,
    TLoaderFn,
    TChildren,
    unknown
  >(options);
}

export type AnyRootRoute = RootRoute<any, any, any, any, any, any, any, any>;

export function createRootRouteWithContext<TRouterContext extends {}>() {
  return <
    TRouteContextFn = AnyContext,
    TBeforeLoadFn = AnyContext,
    TSearchValidator = undefined,
    TLoaderDeps extends Record<string, any> = {},
    TLoaderFn = undefined,
  >(
    options?: RootRouteOptions<
      TSearchValidator,
      TRouterContext,
      TRouteContextFn,
      TBeforeLoadFn,
      TLoaderDeps,
      TLoaderFn
    >
  ) => {
    return createRootRoute<
      TSearchValidator,
      TRouterContext,
      TRouteContextFn,
      TBeforeLoadFn,
      TLoaderDeps,
      TLoaderFn
    >(options as any);
  };
}

export class RootRoute<
  in out TSearchValidator = undefined,
  in out TRouterContext = {},
  in out TRouteContextFn = AnyContext,
  in out TBeforeLoadFn = AnyContext,
  in out TLoaderDeps extends Record<string, any> = {},
  in out TLoaderFn = undefined,
  in out TChildren = unknown,
  in out TFileRouteTypes = unknown,
> extends BaseRootRoute<
  TSearchValidator,
  TRouterContext,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  TChildren,
  TFileRouteTypes
> {
  /**
   * @deprecated `RootRoute` is now an internal implementation detail. Use `createRootRoute()` instead.
   */
  constructor(
    options?: RootRouteOptions<
      TSearchValidator,
      TRouterContext,
      TRouteContextFn,
      TBeforeLoadFn,
      TLoaderDeps,
      TLoaderFn
    >
  ) {
    super(options);
  }

  match: MatchRoute<RootRouteId> = (opts) => {
    return match({ ...opts, from: this.id } as any) as any;
  };

  routeContext: RouteContextRoute<RootRouteId> = (opts) => {
    return match({
      ...opts,
      from: this.id,
      select: (d) => (opts?.select ? opts.select(d.context) : d.context),
    }) as any;
  };

  search: SearchRoute<RootRouteId> = (opts) => {
    return search({ ...opts, from: this.id } as any) as any;
  };

  params: ParamsRoute<RootRouteId> = (opts) => {
    return params({ ...opts, from: this.id } as any) as any;
  };

  loaderDeps: LoaderDepsRoute<RootRouteId> = (opts) => {
    return loaderDeps({ ...opts, from: this.id } as any);
  };

  loaderData: LoaderDataRoute<RootRouteId> = (opts) => {
    return loaderData({ ...opts, from: this.id } as any);
  };
}

export function createRootRoute<
  TSearchValidator = undefined,
  TRouterContext = {},
  TRouteContextFn = AnyContext,
  TBeforeLoadFn = AnyContext,
  TLoaderDeps extends Record<string, any> = {},
  TLoaderFn = undefined,
>(
  options?: RootRouteOptions<
    TSearchValidator,
    TRouterContext,
    TRouteContextFn,
    TBeforeLoadFn,
    TLoaderDeps,
    TLoaderFn
  >
): RootRoute<
  TSearchValidator,
  TRouterContext,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  unknown,
  unknown
> {
  return new RootRoute<
    TSearchValidator,
    TRouterContext,
    TRouteContextFn,
    TBeforeLoadFn,
    TLoaderDeps,
    TLoaderFn
  >(options);
}

export class NotFoundRoute<
  TParentRoute extends AnyRootRoute,
  TRouterContext = AnyContext,
  TRouteContextFn = AnyContext,
  TBeforeLoadFn = AnyContext,
  TSearchValidator = undefined,
  TLoaderDeps extends Record<string, any> = {},
  TLoaderFn = undefined,
  TChildren = unknown,
> extends Route<
  TParentRoute,
  '/404',
  '/404',
  '404',
  '404',
  TSearchValidator,
  {},
  TRouterContext,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  TChildren
> {
  constructor(
    options: Omit<
      RouteOptions<
        TParentRoute,
        string,
        string,
        string,
        string,
        TSearchValidator,
        {},
        TLoaderDeps,
        TLoaderFn,
        TRouterContext,
        TRouteContextFn,
        TBeforeLoadFn
      >,
      | 'caseSensitive'
      | 'parseParams'
      | 'stringifyParams'
      | 'path'
      | 'id'
      | 'params'
    >
  ) {
    super({
      ...(options as any),
      id: '404',
    });
  }
}

function runFnInInjectionContext<TFn extends (...args: any[]) => any>(fn: TFn) {
  const originalFn = fn;
  return (...args: Parameters<TFn>) => {
    const { context, location, route } = args[0];
    const routeInjector = context.getRouteInjector(route?.id || location.href);
    return runInInjectionContext(routeInjector, originalFn.bind(null, ...args));
  };
}
