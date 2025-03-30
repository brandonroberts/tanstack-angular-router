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
  RouterState,
} from '@tanstack/router-core';
import { routerState } from './router-state';

export interface LocationBaseOptions<TRouter extends AnyRouter, TSelected> {
  select?: (state: RouterState<TRouter['routeTree']>['location']) => TSelected;
  injector?: Injector;
}

export type LocationResult<
  TRouter extends AnyRouter,
  TSelected,
> = unknown extends TSelected
  ? RouterState<TRouter['routeTree']>['location']
  : TSelected;

export function location<
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>({ injector, select }: LocationBaseOptions<TRouter, TSelected> = {}): Signal<
  LocationResult<TRouter, TSelected>
> {
  !injector && assertInInjectionContext(location);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    return routerState({
      select: (state) => (select ? select(state.location) : state.location),
      injector,
    }) as Signal<LocationResult<TRouter, TSelected>>;
  });
}
