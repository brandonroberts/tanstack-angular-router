import {
  assertInInjectionContext,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  resource,
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
import { ERROR_COMPONENT_CONTEXT } from './route';
import { injectRouter } from './router';
import { routerState } from './router-state';
import { Transitioner } from './transitioner';

@Component({
  selector: 'matches,Matches',
  template: `
    <!--    <ng-template try [tryCatch]="catchTmpl">-->
    <!--      @if (rootMatchId(); as rootMatchId) {-->
    <!--        @if (!matchLoadResource.value()) {-->
    <!--          @if (defaultPendingComponent) {-->
    <!--            <ng-container [ngComponentOutlet]="defaultPendingComponent" />-->
    <!--          }-->
    <!--        } @else {-->
    <!--          <route-match [matchId]="rootMatchId" />-->
    <!--        }-->
    <!--      }-->
    <!--    </ng-template>-->
    <!--    <ng-template #catchTmpl let-error="error">-->
    <!--      <ng-container-->
    <!--        [ngComponentOutlet]="defaultErrorComponent"-->
    <!--        [ngComponentOutletInjector]="getErrorComponentInjector(error)"-->
    <!--      />-->
    <!--    </ng-template>-->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [Transitioner],
  // imports: [NgComponentOutlet, RouteMatch, TryCatch],
})
export class Matches {
  private router = injectRouter();
  private injector = inject(Injector);
  private vcr = inject(ViewContainerRef);

  private resetKey = routerState({ select: (s) => s.loadedAt.toString() });
  private rootMatchId = routerState({ select: (s) => s.matches[0]?.id });
  private matchLoadResource = resource({
    request: this.rootMatchId,
    loader: ({ request }) => {
      if (!request) return Promise.resolve() as any;
      const loadPromise = this.router.getMatch(request)?.loadPromise;
      if (!loadPromise) return Promise.resolve() as any;
      return loadPromise.then(() => request);
    },
  });
  private defaultPendingComponent =
    this.router.options.defaultPendingComponent?.();

  constructor() {
    effect(() => {
      const loadResourceValue = this.matchLoadResource.value();
      if (!loadResourceValue) {
        if (this.defaultPendingComponent) {
          this.vcr.clear();
          const ref = this.vcr.createComponent(this.defaultPendingComponent);
          ref.changeDetectorRef.markForCheck();
        }
        return;
      }

      const [matchId] = [this.rootMatchId(), this.resetKey()];

      this.vcr.clear();

      if (!matchId) return;

      try {
        const ref = this.vcr.createComponent(RouteMatch);
        ref.setInput('matchId', matchId);
        ref.changeDetectorRef.markForCheck();
      } catch (err) {
        console.error(err);
        const injector = Injector.create({
          providers: [
            {
              provide: ERROR_COMPONENT_CONTEXT,
              useValue: {
                error: err,
                info: { componentStack: '' },
                reset: () => {
                  void this.router.invalidate();
                },
              },
            },
          ],
          parent: this.injector,
        });
        const ref = this.vcr.createComponent(DefaultError, { injector });
        ref.changeDetectorRef.markForCheck();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
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
