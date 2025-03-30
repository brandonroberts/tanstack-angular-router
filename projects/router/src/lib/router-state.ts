import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import {
  RegisteredRouter,
  RouterState,
  shallow,
  type AnyRouter,
} from '@tanstack/router-core';
import { injectRouterState } from './router';

export type RouterStateOptions<TRouter extends AnyRouter, TSelected> = {
  select?: (state: RouterState<TRouter['routeTree']>) => TSelected;
  injector?: Injector;
};

export type RouterStateResult<
  TRouter extends AnyRouter,
  TSelected,
> = unknown extends TSelected ? RouterState<TRouter['routeTree']> : TSelected;

export function routerState<
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>({ select, injector }: RouterStateOptions<TRouter, TSelected> = {}) {
  !injector && assertInInjectionContext(routerState);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const rootRouterState = injectRouterState();
    return computed(
      () => {
        if (select) return select(rootRouterState());
        return rootRouterState();
      },
      { equal: shallow }
    ) as Signal<RouterStateResult<TRouter, TSelected>>;
  });
}
