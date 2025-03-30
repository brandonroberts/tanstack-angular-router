import {
  assertInInjectionContext,
  ComponentRef,
  computed,
  Directive,
  effect,
  inject,
  Injector,
  input,
  runInInjectionContext,
  Signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {
  AnyRouter,
  DeepPartial,
  MakeOptionalPathParams,
  MakeOptionalSearchParams,
  MakeRouteMatchUnion,
  MaskOptions,
  RegisteredRouter,
  RouterState,
  MatchRouteOptions as TanstackMatchRouteOptions,
  ToSubOptionsProps,
} from '@tanstack/router-core';
import { DefaultError } from './default-error';
import { RouteMatch } from './outlet';
import { injectRouter } from './router';
import { routerState } from './router-state';
import { Transitioner } from './transitioner';

@Directive({ hostDirectives: [Transitioner] })
export class Matches {
  private router = injectRouter();
  private vcr = inject(ViewContainerRef);

  private matchId = routerState({ select: (s) => s.matches[0]?.id });

  constructor() {
    effect((onCleanup) => {
      const matchId = this.matchId();
      if (!matchId) return;

      try {
        let ref: ComponentRef<any> | undefined = undefined;

        if (this.router.options.defaultPendingComponent) {
          ref = this.vcr.createComponent(
            this.router.options.defaultPendingComponent()
          );
          ref.changeDetectorRef.markForCheck();
        }

        this.router.getMatch(matchId)?.loadPromise?.then(() => {
          ref?.destroy();
          ref = this.vcr.createComponent(RouteMatch);
          ref.setInput('matchId', matchId);
          ref.changeDetectorRef.markForCheck();
        });
        onCleanup(() => ref?.destroy());
      } catch (err) {
        console.error(err);
        const errorCmp =
          this.router.options.defaultErrorComponent?.() || DefaultError;
        const ref = this.vcr.createComponent(errorCmp);
        ref.setInput('error', err);
        ref.changeDetectorRef.markForCheck();
        onCleanup(() => ref.destroy());
      }
    });
  }
}

export type MatchRouteOptions<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TTo extends string | undefined = undefined,
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = '',
> = ToSubOptionsProps<TRouter, TFrom, TTo> &
  DeepPartial<MakeOptionalSearchParams<TRouter, TFrom, TTo>> &
  DeepPartial<MakeOptionalPathParams<TRouter, TFrom, TTo>> &
  MaskOptions<TRouter, TMaskFrom, TMaskTo> &
  TanstackMatchRouteOptions & { injector?: Injector };

export function matchRoute<TRouter extends AnyRouter = RegisteredRouter>({
  injector,
}: { injector?: Injector } = {}) {
  !injector && assertInInjectionContext(matchRoute);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const router = injectRouter();
    const status = routerState({ select: (s) => s.status });

    return <
      const TFrom extends string = string,
      const TTo extends string | undefined = undefined,
      const TMaskFrom extends string = TFrom,
      const TMaskTo extends string = '',
    >(
      opts: MatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>
    ) => {
      const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
      return computed(() => {
        // track status
        status();
        return router.matchRoute(rest as any, {
          pending,
          caseSensitive,
          fuzzy,
          includeSearch,
        });
      });
    };
  });
}

export type MakeMatchRouteOptions<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TTo extends string | undefined = undefined,
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = '',
> = MatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;

@Directive({ selector: 'ng-template[matchRoute]' })
export class MatchRoute<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string = string,
  const TTo extends string | undefined = undefined,
  const TMaskFrom extends string = TFrom,
  const TMaskTo extends string = '',
> {
  matchRoute =
    input.required<
      MakeMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>
    >();

  private status = routerState({ select: (s) => s.status });
  private matchRouteFn = matchRoute();
  private params = computed(
    () => this.matchRouteFn(this.matchRoute() as any)() as boolean
  );

  private vcr = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  constructor() {
    effect((onCleanup) => {
      const [params] = [this.params(), this.status()];
      if (!params) return;

      const ref = this.vcr.createEmbeddedView(this.templateRef, {
        match: params,
      });
      ref.markForCheck();
      onCleanup(() => ref.destroy());
    });
  }

  static ngTemplateContextGuard<
    TRouter extends AnyRouter = RegisteredRouter,
    const TFrom extends string = string,
    const TTo extends string | undefined = undefined,
    const TMaskFrom extends string = TFrom,
    const TMaskTo extends string = '',
  >(
    _: MatchRoute<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>,
    ctx: unknown
  ): ctx is { match: boolean } {
    return true;
  }
}

export interface MatchesBaseOptions<TRouter extends AnyRouter, TSelected> {
  select?: (matches: Array<MakeRouteMatchUnion<TRouter>>) => TSelected;
  injector?: Injector;
}

export type MatchesResult<
  TRouter extends AnyRouter,
  TSelected,
> = unknown extends TSelected ? Array<MakeRouteMatchUnion<TRouter>> : TSelected;

export function matches<
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>({ injector, ...opts }: MatchesBaseOptions<TRouter, TSelected> = {}): Signal<
  MatchesResult<TRouter, TSelected>
> {
  !injector && assertInInjectionContext(matches);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    return routerState({
      injector,
      select: (state: RouterState<TRouter['routeTree']>) => {
        const matches = state.matches;
        return opts.select
          ? opts.select(matches as Array<MakeRouteMatchUnion<TRouter>>)
          : matches;
      },
    }) as Signal<MatchesResult<TRouter, TSelected>>;
  });
}

export function parentMatches<
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>({ injector, ...opts }: MatchesBaseOptions<TRouter, TSelected> = {}): Signal<
  MatchesResult<TRouter, TSelected>
> {
  !injector && assertInInjectionContext(parentMatches);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const closestMatch = inject(RouteMatch);
    return matches({
      injector,
      select: (matches: Array<MakeRouteMatchUnion<TRouter>>) => {
        matches = matches.slice(
          0,
          matches.findIndex((d) => d.id === closestMatch.matchId())
        );
        return opts.select
          ? opts.select(matches as Array<MakeRouteMatchUnion<TRouter>>)
          : matches;
      },
    }) as Signal<MatchesResult<TRouter, TSelected>>;
  });
}

export function childMatches<
  TRouter extends AnyRouter = RegisteredRouter,
  TSelected = unknown,
>({ injector, ...opts }: MatchesBaseOptions<TRouter, TSelected> = {}): Signal<
  MatchesResult<TRouter, TSelected>
> {
  !injector && assertInInjectionContext(childMatches);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const closestMatch = inject(RouteMatch);
    return matches({
      injector,
      select: (matches: Array<MakeRouteMatchUnion<TRouter>>) => {
        matches = matches.slice(
          matches.findIndex((d) => d.id === closestMatch.matchId()) + 1
        );
        return opts.select
          ? opts.select(matches as Array<MakeRouteMatchUnion<TRouter>>)
          : matches;
      },
    }) as Signal<MatchesResult<TRouter, TSelected>>;
  });
}
