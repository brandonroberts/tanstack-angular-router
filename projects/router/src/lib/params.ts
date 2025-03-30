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
  ResolveUseParams,
  StrictOrFrom,
  ThrowConstraint,
  ThrowOrOptional,
  UseParamsResult,
} from '@tanstack/router-core';
import { match } from './match';

export interface ParamsBaseOptions<
  TRouter extends AnyRouter,
  TFrom,
  TStrict extends boolean,
  TThrow extends boolean,
  TSelected,
> {
  select?: (params: ResolveUseParams<TRouter, TFrom, TStrict>) => TSelected;
  shouldThrow?: TThrow;
  injector?: Injector;
}

export type ParamsOptions<
  TRouter extends AnyRouter,
  TFrom extends string | undefined,
  TStrict extends boolean,
  TThrow extends boolean,
  TSelected,
> = StrictOrFrom<TRouter, TFrom, TStrict> &
  ParamsBaseOptions<TRouter, TFrom, TStrict, TThrow, TSelected>;

export type ParamsRoute<out TFrom> = <
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>(
  opts?: ParamsBaseOptions<
    TRouter,
    TFrom,
    /* TStrict */ true,
    /* TThrow */ true,
    TSelected
  >
) => Signal<UseParamsResult<TRouter, TFrom, true, TSelected>>;

export function params<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string | undefined = undefined,
  TStrict extends boolean = true,
  TThrow extends boolean = true,
  TSelected = unknown,
>({
  injector,
  ...opts
}: ParamsOptions<
  TRouter,
  TFrom,
  TStrict,
  ThrowConstraint<TStrict, TThrow>,
  TSelected
>): Signal<
  ThrowOrOptional<UseParamsResult<TRouter, TFrom, TStrict, TSelected>, TThrow>
> {
  !injector && assertInInjectionContext(params);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    return match({
      from: opts.from!,
      strict: opts.strict,
      shouldThrow: opts.shouldThrow,
      select: (match) => {
        return opts.select ? opts.select(match.params) : match.params;
      },
    }) as any;
  });
}
