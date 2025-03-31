import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
  ValueEqualityFn,
} from '@angular/core';
import {
  RegisteredRouter,
  RouterState,
  shallow,
  type AnyRouter,
} from '@tanstack/router-core';
import { injectRouterState } from './router';

export type RouterStateResult<
  TRouter extends AnyRouter,
  TSelected,
> = unknown extends TSelected ? RouterState<TRouter['routeTree']> : TSelected;

export type RouterStateOptions<TRouter extends AnyRouter, TSelected> = {
  select?: (state: RouterState<TRouter['routeTree']>) => TSelected;
  equal?: ValueEqualityFn<
    RouterStateResult<NoInfer<TRouter>, NoInfer<TSelected>>
  >;
  injector?: Injector;
};

export function routerState<
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>({
  select,
  injector,
  equal = shallow,
}: RouterStateOptions<TRouter, TSelected> = {}) {
  !injector && assertInInjectionContext(routerState);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const rootRouterState = injectRouterState();
    return computed(
      () => {
        if (select) return select(rootRouterState());
        return rootRouterState() as any;
      },
      { equal }
    ) as Signal<RouterStateResult<TRouter, TSelected>>;
  });
}
