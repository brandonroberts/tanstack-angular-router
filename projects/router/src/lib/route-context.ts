import { runInInjectionContext } from '@angular/core';
import { LoaderFnContext } from '@tanstack/router-core';

export function runLoaderInRouteContext(cb: Function): any {
  return ({ context, route }: LoaderFnContext) => {
    const routeInjector = (context as any).getRouteInjector(route.id);

    return runInInjectionContext(routeInjector, cb());
  };
}
