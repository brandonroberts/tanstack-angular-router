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
  UseRouteContextBaseOptions,
  UseRouteContextOptions,
  UseRouteContextResult,
} from '@tanstack/router-core';
import { match } from './match';

export type RouteContextRoute<out TFrom> = <
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>(
  opts?: UseRouteContextBaseOptions<TRouter, TFrom, true, TSelected> & {
    injector?: Injector;
  }
) => Signal<UseRouteContextResult<TRouter, TFrom, true, TSelected>>;

export function routeContext<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string | undefined = undefined,
  TStrict extends boolean = true,
  TSelected = unknown,
>({
  injector,
  ...opts
}: UseRouteContextOptions<TRouter, TFrom, TStrict, TSelected> & {
  injector?: Injector;
}): Signal<UseRouteContextResult<TRouter, TFrom, TStrict, TSelected>> {
  !injector && assertInInjectionContext(routeContext);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    return match({
      ...(opts as any),
      select: (match) => {
        return opts.select ? opts.select(match.context) : match.context;
      },
    }) as any;
  });
}
