import {
  assertInInjectionContext,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import {
  AnyRouter,
  RegisteredRouter,
  ResolveUseLoaderDeps,
  StrictOrFrom,
  UseLoaderDepsResult,
} from '@tanstack/router-core';
import { match } from './match';

export interface LoaderDepsBaseOptions<
  TRouter extends AnyRouter,
  TFrom,
  TSelected,
> {
  select?: (deps: ResolveUseLoaderDeps<TRouter, TFrom>) => TSelected;
  injector?: Injector;
}

export type LoaderDepsOptions<
  TRouter extends AnyRouter,
  TFrom extends string | undefined,
  TSelected,
> = StrictOrFrom<TRouter, TFrom> &
  LoaderDepsBaseOptions<TRouter, TFrom, TSelected>;

export type LoaderDepsRoute<out TId> = <
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>(
  opts?: LoaderDepsBaseOptions<TRouter, TId, TSelected>
) => Signal<UseLoaderDepsResult<TRouter, TId, TSelected>>;

export function loaderDeps<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string | undefined = undefined,
  TSelected = unknown,
>({
  injector,
  ...opts
}: LoaderDepsOptions<TRouter, TFrom, TSelected>): Signal<
  UseLoaderDepsResult<TRouter, TFrom, TSelected>
> {
  !injector && assertInInjectionContext(loaderDeps);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const { select, ...rest } = opts;
    return match({
      ...rest,
      select: (s) => {
        return select ? select(s.loaderDeps) : s.loaderDeps;
      },
    }) as Signal<UseLoaderDepsResult<TRouter, TFrom, TSelected>>;
  });
}
