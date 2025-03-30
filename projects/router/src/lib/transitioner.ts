import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { getLocationChangeInfo, trimPathRight } from '@tanstack/router-core';
import { injectRouter } from './router';
import { routerState } from './router-state';

@Directive()
export class Transitioner {
  private router = injectRouter();
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);

  private hasPendingMatches = routerState({
    select: (s) => s.matches.some((d) => d.status === 'pending'),
  });

  private isLoading = routerState({ select: (s) => s.isLoading });
  private previousIsLoading = linkedSignal<boolean, boolean>({
    source: this.isLoading,
    computation: (src, prev) => prev?.source ?? src,
  });

  private isTransitioning = signal(false);

  private isAnyPending = computed(
    () => this.isLoading() || this.isTransitioning() || this.hasPendingMatches()
  );
  private previousIsAnyPending = linkedSignal<boolean, boolean>({
    source: this.isAnyPending,
    computation: (src, prev) => prev?.source ?? src,
  });

  private isPagePending = computed(
    () => this.isLoading() || this.hasPendingMatches()
  );
  private previousIsPagePending = linkedSignal<boolean, boolean>({
    source: this.isPagePending,
    computation: (src, prev) => prev?.source ?? src,
  });

  private mountLoadForRouter = { router: this.router, mounted: false };

  constructor() {
    if (!this.router.isServer) {
      this.router.startTransition = (fn) => {
        this.isTransitioning.set(true);
        fn();
        this.isTransitioning.set(false);
      };
    }

    // Try to load the initial location
    afterNextRender(() => {
      untracked(() => {
        const window = this.document.defaultView;
        if (
          (typeof window !== 'undefined' && this.router.clientSsr) ||
          (this.mountLoadForRouter.router === this.router &&
            this.mountLoadForRouter.mounted)
        ) {
          return;
        }
        this.mountLoadForRouter = { router: this.router, mounted: true };
        const tryLoad = async () => {
          try {
            await this.router.load();
          } catch (err) {
            console.error(err);
          }
        };
        void tryLoad();
      });
    });

    effect(() => {
      const [previousIsLoading, isLoading] = [
        this.previousIsLoading(),
        this.isLoading(),
      ];
      if (previousIsLoading && !isLoading) {
        this.router.emit({
          type: 'onLoad',
          ...getLocationChangeInfo(this.router.state),
        });
      }
    });

    effect(() => {
      const [isPagePending, previousIsPagePending] = [
        this.isPagePending(),
        this.previousIsPagePending(),
      ];
      // emit onBeforeRouteMount
      if (previousIsPagePending && !isPagePending) {
        this.router.emit({
          type: 'onBeforeRouteMount',
          ...getLocationChangeInfo(this.router.state),
        });
      }
    });

    effect(() => {
      const [isAnyPending, previousIsAnyPending] = [
        this.isAnyPending(),
        this.previousIsAnyPending(),
      ];
      // The router was pending and now it's not
      if (previousIsAnyPending && !isAnyPending) {
        this.router.emit({
          type: 'onResolved',
          ...getLocationChangeInfo(this.router.state),
        });

        this.router.__store.setState((s) => ({
          ...s,
          status: 'idle',
          resolvedLocation: s.location,
        }));

        if (
          typeof this.document !== 'undefined' &&
          'querySelector' in this.document
        ) {
          const hashScrollIntoViewOptions =
            this.router.state.location.state.__hashScrollIntoViewOptions ??
            true;

          if (
            hashScrollIntoViewOptions &&
            this.router.state.location.hash !== ''
          ) {
            const el = this.document.getElementById(
              this.router.state.location.hash
            );
            if (el) el.scrollIntoView(hashScrollIntoViewOptions);
          }
        }
      }
    });
  }

  ngOnInit() {
    // Subscribe to location changes
    // and try to load the new location
    const unsub = this.router.history.subscribe(() => this.router.load());

    const nextLocation = this.router.buildLocation({
      to: this.router.latestLocation.pathname,
      search: true,
      params: true,
      hash: true,
      state: true,
      _includeValidateSearch: true,
    });

    if (
      trimPathRight(this.router.latestLocation.href) !==
      trimPathRight(nextLocation.href)
    ) {
      void this.router.commitLocation({ ...nextLocation, replace: true });
    }

    this.destroyRef.onDestroy(() => unsub());
  }
}
