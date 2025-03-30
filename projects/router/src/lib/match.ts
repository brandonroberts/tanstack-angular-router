import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import {
  AnyRouter,
  MakeRouteMatch,
  MakeRouteMatchUnion,
  RegisteredRouter,
  StrictOrFrom,
  ThrowConstraint,
  ThrowOrOptional,
} from '@tanstack/router-core';
import invariant from 'tiny-invariant';
import { RouteMatch } from './outlet';
import { routerState } from './router-state';

export interface MatchBaseOptions<
  TRouter extends AnyRouter,
  TFrom,
  TStrict extends boolean,
  TThrow extends boolean,
  TSelected,
> {
  select?: (
    match: MakeRouteMatch<TRouter['routeTree'], TFrom, TStrict>
  ) => TSelected;
  shouldThrow?: TThrow;
  injector?: Injector;
}

export type MatchRoute<out TFrom> = <
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>(
  opts?: MatchBaseOptions<TRouter, TFrom, true, true, TSelected>
) => Signal<MatchResult<TRouter, TFrom, true, TSelected>>;

export type MatchOptions<
  TRouter extends AnyRouter,
  TFrom extends string | undefined,
  TStrict extends boolean,
  TThrow extends boolean,
  TSelected,
> = StrictOrFrom<TRouter, TFrom, TStrict> &
  MatchBaseOptions<TRouter, TFrom, TStrict, TThrow, TSelected>;

export type MatchResult<
  TRouter extends AnyRouter,
  TFrom,
  TStrict extends boolean,
  TSelected,
> = unknown extends TSelected
  ? TStrict extends true
    ? MakeRouteMatch<TRouter['routeTree'], TFrom, TStrict>
    : MakeRouteMatchUnion<TRouter>
  : TSelected;

export function match<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string | undefined = undefined,
  TStrict extends boolean = true,
  TThrow extends boolean = true,
  TSelected = unknown,
>({
  injector,
  ...opts
}: MatchOptions<
  TRouter,
  TFrom,
  TStrict,
  ThrowConstraint<TStrict, TThrow>,
  TSelected
>): Signal<
  ThrowOrOptional<MatchResult<TRouter, TFrom, TStrict, TSelected>, TThrow>
> {
  !injector && assertInInjectionContext(match);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const closestMatch = inject(RouteMatch, { optional: true });
    const nearestMatchId = computed(() => {
      if (opts.from) return null;
      return closestMatch?.matchId();
    });

    return routerState({
      select: (s) => {
        const match = s.matches.find((d) => {
          return opts.from
            ? opts.from === d.routeId
            : d.id === nearestMatchId();
        });

        invariant(
          !((opts.shouldThrow ?? true) && !match),
          `Could not find ${opts.from ? `an active match from "${opts.from}"` : 'a nearest match!'}`
        );

        if (match === undefined) {
          return undefined;
        }

        return opts.select ? opts.select(match) : match;
      },
      injector,
    });
  }) as any;
}
