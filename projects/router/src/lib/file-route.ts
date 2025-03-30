import {
  AnyContext,
  AnyRoute,
  AnyRouter,
  Constrain,
  ConstrainLiteral,
  FileBaseRouteOptions,
  FileRoutesByPath,
  LazyRouteOptions,
  RegisteredRouter,
  ResolveParams,
  RouteById,
  RouteConstraints,
  RouteIds,
  RouteLoaderFn,
  UpdatableRouteOptions,
} from '@tanstack/router-core';
import warning from 'tiny-warning';
import { loaderData, LoaderDataRoute } from './loader-data';
import { loaderDeps, LoaderDepsRoute } from './loader-deps';
import { match, MatchRoute } from './match';
import { params, ParamsRoute } from './params';
import { createRoute, Route } from './route';
import { RouteContextRoute } from './route-context';
import { search, SearchRoute } from './search';

export function createFileRoute<
  TFilePath extends keyof FileRoutesByPath,
  TParentRoute extends AnyRoute = FileRoutesByPath[TFilePath]['parentRoute'],
  TId extends RouteConstraints['TId'] = FileRoutesByPath[TFilePath]['id'],
  TPath extends RouteConstraints['TPath'] = FileRoutesByPath[TFilePath]['path'],
  TFullPath extends
    RouteConstraints['TFullPath'] = FileRoutesByPath[TFilePath]['fullPath'],
>(
  path: TFilePath
): FileRoute<TFilePath, TParentRoute, TId, TPath, TFullPath>['createRoute'] {
  return new FileRoute<TFilePath, TParentRoute, TId, TPath, TFullPath>(path, {
    silent: true,
  }).createRoute;
}

/**
 @deprecated It's no longer recommended to use the `FileRoute` class directly.
  Instead, use `createFileRoute('/path/to/file')(options)` to create a file route.
 */
export class FileRoute<
  TFilePath extends keyof FileRoutesByPath,
  TParentRoute extends AnyRoute = FileRoutesByPath[TFilePath]['parentRoute'],
  TId extends RouteConstraints['TId'] = FileRoutesByPath[TFilePath]['id'],
  TPath extends RouteConstraints['TPath'] = FileRoutesByPath[TFilePath]['path'],
  TFullPath extends
    RouteConstraints['TFullPath'] = FileRoutesByPath[TFilePath]['fullPath'],
> {
  silent?: boolean;

  constructor(
    public path: TFilePath,
    _opts?: { silent: boolean }
  ) {
    this.silent = _opts?.silent;
  }

  createRoute = <
    TSearchValidator = undefined,
    TParams = ResolveParams<TPath>,
    TRouteContextFn = AnyContext,
    TBeforeLoadFn = AnyContext,
    TLoaderDeps extends Record<string, any> = {},
    TLoaderFn = undefined,
    TChildren = unknown,
  >(
    options?: FileBaseRouteOptions<
      TParentRoute,
      TId,
      TPath,
      TSearchValidator,
      TParams,
      TLoaderDeps,
      TLoaderFn,
      AnyContext,
      TRouteContextFn,
      TBeforeLoadFn
    > &
      UpdatableRouteOptions<
        TParentRoute,
        TId,
        TFullPath,
        TParams,
        TSearchValidator,
        TLoaderFn,
        TLoaderDeps,
        AnyContext,
        TRouteContextFn,
        TBeforeLoadFn
      >
  ): Route<
    TParentRoute,
    TPath,
    TFullPath,
    TFilePath,
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
  > => {
    warning(
      this.silent,
      'FileRoute is deprecated and will be removed in the next major version. Use the createFileRoute(path)(options) function instead.'
    );
    const route = createRoute(options as any);
    (route as any).isRoot = false;
    return route as any;
  };
}

/**
 @deprecated It's recommended not to split loaders into separate files.
  Instead, place the loader function in the the main route file, inside the
  `createFileRoute('/path/to/file)(options)` options.
 */
export function FileRouteLoader<
  TFilePath extends keyof FileRoutesByPath,
  TRoute extends FileRoutesByPath[TFilePath]['preLoaderRoute'],
>(
  _path: TFilePath
): <TLoaderFn>(
  loaderFn: Constrain<
    TLoaderFn,
    RouteLoaderFn<
      TRoute['parentRoute'],
      TRoute['types']['id'],
      TRoute['types']['params'],
      TRoute['types']['loaderDeps'],
      TRoute['types']['routerContext'],
      TRoute['types']['routeContextFn'],
      TRoute['types']['beforeLoadFn']
    >
  >
) => TLoaderFn {
  warning(
    false,
    `FileRouteLoader is deprecated and will be removed in the next major version. Please place the loader function in the the main route file, inside the \`createFileRoute('/path/to/file')(options)\` options`
  );
  return (loaderFn) => loaderFn as any;
}

export class LazyRoute<TRoute extends AnyRoute> {
  options: {
    id: string;
  } & LazyRouteOptions;

  constructor(
    opts: {
      id: string;
    } & LazyRouteOptions
  ) {
    this.options = opts;
  }

  match: MatchRoute<TRoute['id']> = (opts) => {
    return match({ ...opts, from: this.options.id } as any) as any;
  };

  routeContext: RouteContextRoute<TRoute['id']> = (opts) => {
    return match({
      ...opts,
      from: this.options.id,
      select: (d: any) => (opts?.select ? opts.select(d.context) : d.context),
    }) as any;
  };

  search: SearchRoute<TRoute['id']> = (opts) => {
    return search({ ...opts, from: this.options.id } as any) as any;
  };

  params: ParamsRoute<TRoute['id']> = (opts) => {
    return params({ ...opts, from: this.options.id } as any) as any;
  };

  loaderDeps: LoaderDepsRoute<TRoute['id']> = (opts) => {
    return loaderDeps({ ...opts, from: this.options.id } as any);
  };

  loaderData: LoaderDataRoute<TRoute['id']> = (opts) => {
    return loaderData({ ...opts, from: this.options.id } as any);
  };
}

export function createLazyRoute<
  TRouter extends AnyRouter = RegisteredRouter,
  TId extends string = string,
  TRoute extends AnyRoute = RouteById<TRouter['routeTree'], TId>,
>(id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>) {
  return (opts: LazyRouteOptions) => {
    return new LazyRoute<TRoute>({
      id: id,
      ...opts,
    });
  };
}
export function createLazyFileRoute<
  TFilePath extends keyof FileRoutesByPath,
  TRoute extends FileRoutesByPath[TFilePath]['preLoaderRoute'],
>(id: TFilePath) {
  return (opts: LazyRouteOptions) => new LazyRoute<TRoute>({ id, ...opts });
}
