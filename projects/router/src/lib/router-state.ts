import {
  assertInInjectionContext,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import { injectStore } from '@tanstack/angular-store';
import {
  RegisteredRouter,
  RouterState,
  type AnyRouter,
} from '@tanstack/router-core';
import { injectRouter } from './router';

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
    const router = injectRouter();
    return injectStore(router.__store, (state) => {
      if (select) return select(state);
      return state;
    }) as Signal<RouterStateResult<TRouter, TSelected>>;
  });
}
