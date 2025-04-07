import {
  afterNextRender,
  assertInInjectionContext,
  computed,
  DestroyRef,
  Directive,
  EmbeddedViewRef,
  inject,
  Injector,
  input,
  runInInjectionContext,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AnyRouter,
  DeepPartial,
  MakeOptionalPathParams,
  MakeOptionalSearchParams,
  MaskOptions,
  RegisteredRouter,
  MatchRouteOptions as TanstackMatchRouteOptions,
  ToSubOptionsProps,
} from '@tanstack/router-core';
import { map, Subscription, switchMap } from 'rxjs';
import { Link } from './link';
import { injectRouter } from './router';
import { routerState$ } from './router-state';

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

export function matchRoute$<TRouter extends AnyRouter = RegisteredRouter>({
  injector,
}: { injector?: Injector } = {}) {
  !injector && assertInInjectionContext(matchRoute$);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const router = injectRouter();
    const status$ = routerState$({ select: (s) => s.status });

    return <
      const TFrom extends string = string,
      const TTo extends string | undefined = undefined,
      const TMaskFrom extends string = TFrom,
      const TMaskTo extends string = '',
    >(
      opts: MatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>
    ) => {
      const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
      return status$.pipe(
        map(() =>
          router.matchRoute(rest as any, {
            pending,
            caseSensitive,
            fuzzy,
            includeSearch,
          })
        )
      );
    };
  });
}

export function matchRoute<TRouter extends AnyRouter = RegisteredRouter>({
  injector,
}: { injector?: Injector } = {}) {
  !injector && assertInInjectionContext(matchRoute);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const matchRoute$Return = matchRoute$({ injector });
    return <
      const TFrom extends string = string,
      const TTo extends string | undefined = undefined,
      const TMaskFrom extends string = TFrom,
      const TMaskTo extends string = '',
    >(
      opts: MatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>
    ) => {
      return toSignal(matchRoute$Return(opts as any), { injector });
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

@Directive({ selector: 'ng-template[matchRoute]', exportAs: 'matchRoute' })
export class MatchRoute<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string = string,
  const TTo extends string | undefined = undefined,
  const TMaskFrom extends string = TFrom,
  const TMaskTo extends string = '',
> {
  matchRoute = input<
    Partial<MakeMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>>
  >({});

  private status$ = routerState$({ select: (s) => s.status });
  private matchRouteFn = matchRoute$();

  private parentLink = inject(Link, { optional: true });
  private matchRouteOptions = computed(() => {
    const parentLinkOptions = this.parentLink?.linkOptions();
    return { ...parentLinkOptions, ...this.matchRoute() };
  });

  private match$ = toObservable(this.matchRouteOptions).pipe(
    switchMap((matchRoute) => this.matchRouteFn(matchRoute as any))
  );
  private match = toSignal(this.match$);

  private vcr = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  private ref?: EmbeddedViewRef<any>;

  constructor() {
    let subscription: Subscription;
    afterNextRender(() => {
      subscription = this.status$.subscribe(() => {
        if (this.ref) {
          this.ref.markForCheck();
          return;
        }

        this.ref = this.vcr.createEmbeddedView(this.templateRef, {
          match: this.match,
          match$: this.match$,
        });
        this.ref.markForCheck();
      });
    });

    inject(DestroyRef).onDestroy(() => {
      subscription?.unsubscribe();
      this.vcr.clear();
      this.ref?.destroy();
    });
  }
}
