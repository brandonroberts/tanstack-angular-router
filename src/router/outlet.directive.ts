import {
  Directive,
  effect,
  inject,
  Injector,
  Type,
  ViewContainerRef,
} from '@angular/core';

import {
  getRouteContext,
  Router,
  ROUTE_CONTEXT,
} from './router.service';

@Directive({
  selector: 'outlet',
  standalone: true,
})
export class Outlet {
  private cmp!: Type<any>;
  private context? = getRouteContext();
  private router = inject(Router);
  private vcr = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const routerState = this.router.routerState();
      const hasMatches = routerState.matches.length > 0;
      
      if (!hasMatches) {
        return;
      }

      const matchesToRender = this.getMatch(routerState.matches.slice(1));
      const route = this.router.getRouteById(matchesToRender.routeId);
      const currentCmp = (route && route.options.component ? route.options.component({} as any) : undefined) as Type<any>;

      if (this.cmp !== currentCmp) {
        this.vcr.clear();
        this.vcr.createComponent(currentCmp, {
          injector: this.getInjector(matchesToRender),
        });
        this.cmp = currentCmp;
      }
    });
  }

  getInjector(matchesToRender: any) {
    const injector = Injector.create({
      providers: [
        {
          provide: ROUTE_CONTEXT,
          useValue: {
            id: matchesToRender.routeId,
            params: matchesToRender.params,
          },
        },
      ],
      parent: this.vcr.injector,
    });

    return injector;
  }

  getMatch(matches: any[]): any {
    const idx = matches.findIndex(
      (match) => match.id === this.context?.id
    );
    const matchesToRender = matches[idx + 1];

    return matchesToRender;
  }
}
