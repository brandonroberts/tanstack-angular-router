import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import {
  AnyContext,
  AnyRoute,
  AnyRouter,
  BaseRootRoute,
  BaseRoute,
  BaseRouteApi,
  ConstrainLiteral,
  LazyRouteOptions,
  RegisteredRouter,
  ResolveFullPath,
  ResolveId,
  ResolveParams,
  ResolveUseLoaderData,
  ResolveUseParams,
  ResolveUseSearch,
  RootRouteOptions,
  RouteById,
  RouteConstraints,
  RouteIds,
  RouteOptions,
} from '@tanstack/router-core';
import { injectRouteContext, injectRouter, RouterContext } from './router';

function loaderData({
  id,
  injector,
}: { id?: string; injector?: Injector } = {}) {
  !injector && assertInInjectionContext(loaderData);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const router = injectRouter();
    const routeId = id ?? injectRouteContext()?.id;

    if (!routeId) {
      throw new Error('routeId is required');
    }

    return computed(() => {
      const routerState = router.routerState();
      const route = routerState.matches.find(
        (match) => match.routeId === routeId
      );

      return (route && route.loaderData) || undefined;
    });
  });
}

function routeSearch({
  id,
  injector,
}: { id?: string; injector?: Injector } = {}) {
  !injector && assertInInjectionContext(routeSearch);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const router = injectRouter();
    const routeId = id ?? injectRouteContext()?.id;

    if (!routeId) {
      throw new Error('routeId is required');
    }

    return computed(() => {
      const routerState = router.routerState();
      const route = routerState.matches.find(
        (match) => match.routeId === routeId
      );

      return (route && route.search) || ({} as Record<string, unknown>);
    });
  });
}

function routeParams({
  id,
  injector,
}: { id?: string; injector?: Injector } = {}) {
  !injector && assertInInjectionContext(routeParams);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const router = injectRouter();
    const routeId = id ?? injectRouteContext()?.id;

    if (!routeId) {
      throw new Error('routeId is required');
    }

    return computed(() => {
      const routerState = router.routerState();
      const route = routerState.matches.find(
        (match) => match.routeId === routeId
      );

      return (route && route.params) || {};
    });
  });
}

export function routeApi<
  const TId,
  TRouter extends AnyRouter = RegisteredRouter,
>({
  id,
  injector,
}: {
  id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>;
  injector?: Injector;
}): BaseRouteApi<TId, TRouter> & {
  loaderData: () => Signal<ResolveUseLoaderData<TRouter, TId, false>>;
  routeParams: () => Signal<ResolveUseParams<TRouter, TId, false>>;
  routeSearch: () => Signal<ResolveUseSearch<TRouter, TId, false>>;
} {
  !injector && assertInInjectionContext(routeApi);

  if (!injector) {
    injector = inject(Injector);
  }

  const _loaderData = loaderData.bind(null, { id, injector });
  const _routeParams = routeParams.bind(null, { id, injector });
  const _routeSearch = routeSearch.bind(null, { id, injector });

  return runInInjectionContext(injector, () => {
    const routeApi = new BaseRouteApi<TId, TRouter>({ id });

    return Object.assign(routeApi, {
      loaderData: _loaderData,
      routeParams: _routeParams,
      routeSearch: _routeSearch,
    });
  });
}

class Route<
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

  loaderData<
    TRouter extends AnyRouter = RegisteredRouter,
    const TFrom extends string | undefined = undefined,
  >({ injector }: { injector?: Injector } = {}): Signal<
    ResolveUseLoaderData<TRouter, TFrom, false>
  > {
    return loaderData({ id: this.id, injector });
  }

  routeParams<
    TRouter extends AnyRouter = RegisteredRouter,
    const TFrom extends string | undefined = undefined,
    TStrict extends boolean = false,
  >({ injector }: { injector?: Injector } = {}): Signal<
    ResolveUseParams<TRouter, TFrom, TStrict>
  > {
    return routeParams({ id: this.id, injector });
  }

  routeSearch<
    TRouter extends AnyRouter = RegisteredRouter,
    const TFrom extends string | undefined = undefined,
    TStrict extends boolean = false,
  >({ injector }: { injector?: Injector } = {}): Signal<
    ResolveUseSearch<TRouter, TFrom, TStrict>
  > {
    return routeSearch({ id: this.id, injector });
  }
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
  TRouterContext extends Record<string, any> = AnyContext,
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
    RouterContext<TRouterContext>,
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
  RouterContext<TRouterContext>,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  TChildren
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
    RouterContext<TRouterContext>,
    TRouteContextFn,
    TBeforeLoadFn,
    TLoaderDeps,
    TLoaderFn,
    TChildren
  >(options);
}

export class LazyRoute<TRoute extends AnyRoute> {
  constructor(
    public readonly options: LazyRouteOptions & { id: TRoute['id'] }
  ) {}

  loaderData<TRouter extends AnyRouter = RegisteredRouter>({
    injector,
  }: { injector?: Injector } = {}): Signal<
    ResolveUseLoaderData<TRouter, TRoute['id'], false>
  > {
    return loaderData({ id: this.options.id, injector });
  }

  routeParams<TRouter extends AnyRouter = RegisteredRouter>({
    injector,
  }: { injector?: Injector } = {}): Signal<
    ResolveUseParams<TRouter, TRoute['id'], false>
  > {
    return routeParams({ id: this.options.id, injector });
  }

  routeSearch<TRouter extends AnyRouter = RegisteredRouter>({
    injector,
  }: { injector?: Injector } = {}): Signal<
    ResolveUseSearch<TRouter, TRoute['id'], false>
  > {
    return routeSearch({ id: this.options.id, injector });
  }
}

export function createLazyRoute<
  TRouter extends AnyRouter = RegisteredRouter,
  TId extends string = string,
  TRoute extends AnyRoute = RouteById<TRouter['routeTree'], TId>,
>(id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>) {
  return (options: LazyRouteOptions) => {
    return new LazyRoute<TRoute>(Object.assign(options, { id }));
  };
}

class RootRoute<
  in out TSearchValidator = undefined,
  in out TRouterContext extends Record<string, any> = {},
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
    if (options?.loader) {
      const originalLoader = options.loader;
      options.loader = (...args: Parameters<typeof originalLoader>) => {
        const { context, route } = args[0];
        const routeInjector = (
          context as RouterContext<TRouterContext>
        ).getRouteInjector(route.id);
        return runInInjectionContext(
          routeInjector,
          originalLoader.bind(null, ...args)
        );
      };
    }

    super(options);
  }
}

export function createRootRoute<
  TSearchValidator = undefined,
  TRouterContext extends Record<string, any> = {},
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
  if (options?.loader) {
    options.loader = runFnInInjectionContext(options.loader);
  }

  if (options?.shouldReload && typeof options.shouldReload === 'function') {
    options.shouldReload = runFnInInjectionContext(options.shouldReload);
  }

  if (options?.beforeLoad) {
    options.beforeLoad = runFnInInjectionContext(options.beforeLoad);
  }

  return new RootRoute<
    TSearchValidator,
    TRouterContext,
    TRouteContextFn,
    TBeforeLoadFn,
    TLoaderDeps,
    TLoaderFn
  >(options);
}

export type AnyRootRoute = RootRoute<any, any, any, any, any, any, any, any>;

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
    const { context, location } = args[0];
    const routeInjector = context.getRouteInjector(location.href);
    return runInInjectionContext(routeInjector, originalFn.bind(null, ...args));
  };
}
