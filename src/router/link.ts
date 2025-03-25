import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import {
  deepEqual,
  exactPathTest,
  LinkOptions,
  preloadWarning,
  removeTrailingSlash,
} from '@tanstack/router-core';
import { injectRouter } from './router';

@Directive({
  selector: 'a[link]',
  exportAs: 'link',
  host: {
    '(click)': 'type() === "internal" && handleClick($event)',
    '(focus)': 'type() === "internal" && handleFocus()',
    '(touchstart)': 'type() === "internal" && handleClick($event)',
    '(mouseenter)': 'type() === "internal" && handleMouseEnter($event)',
    '(mouseleave)': 'type() === "internal" && handleMouseLeave()',
    '[attr.data-active]': 'isActive()',
    '[attr.data-type]': 'type()',
    '[attr.data-transitioning]':
      'transitioning() ? "transitioning" : undefined',
    '[attr.href]': 'hostHref()',
    '[attr.role]': 'disabled() ? "link" : undefined',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.aria-current]': 'isActive() ? "page" : undefined',
  },
})
export class Link {
  linkOptions = input.required({
    alias: 'link',
    transform: (
      value:
        | (Omit<LinkOptions, 'to'> & {
            to: NonNullable<LinkOptions['to']>;
          })
        | NonNullable<LinkOptions['to']>
    ) => {
      return (typeof value === 'object' ? value : { to: value }) as LinkOptions;
    },
  });

  router = injectRouter();
  hostElement = inject<ElementRef<HTMLAnchorElement>>(ElementRef);

  private location = computed(() => this.router.routerState().location);
  private matches = computed(() => this.router.routerState().matches);
  private currentSearch = computed(
    () => this.router.routerState().location.search
  );

  private to = computed(() => this.linkOptions().to);
  protected disabled = computed(() => this.linkOptions().disabled);
  private userFrom = computed(() => this.linkOptions().from);
  private userReloadDocument = computed(
    () => this.linkOptions().reloadDocument
  );
  private userPreload = computed(() => this.linkOptions().preload);
  private userPreloadDelay = computed(() => this.linkOptions().preloadDelay);
  private exactActiveOptions = computed(
    () => this.linkOptions().activeOptions?.exact
  );
  private includeHashActiveOptions = computed(
    () => this.linkOptions().activeOptions?.includeHash
  );
  private includeSearchActiveOptions = computed(
    () => this.linkOptions().activeOptions?.includeSearch
  );
  private explicitUndefinedActiveOptions = computed(
    () => this.linkOptions().activeOptions?.explicitUndefined
  );

  protected type = computed(() => {
    const to = this.to();
    try {
      new URL(`${to}`);
      return 'external';
    } catch {}
    return 'internal';
  });

  private from = computed(() => {
    const userFrom = this.userFrom();
    if (userFrom) return userFrom;
    const matches = this.matches();
    return matches[matches.length - 1]?.fullPath;
  });

  private navigateOptions = computed(() => {
    return { ...this.linkOptions(), from: this.from() };
  });

  private next = computed(() => {
    const [options] = [this.navigateOptions(), this.currentSearch()];
    return this.router.buildLocation(options);
  });

  private preload = computed(() => {
    const userReloadDocument = this.userReloadDocument();
    if (userReloadDocument) return false;
    const userPreload = this.userPreload();
    if (userPreload) return userPreload;
    return this.router.options.defaultPreload;
  });

  private preloadDelay = computed(() => {
    const userPreloadDelay = this.userPreloadDelay();
    if (userPreloadDelay) return userPreloadDelay;
    return this.router.options.defaultPreloadDelay;
  });

  protected hostHref = computed(() => {
    const [type, to] = [this.type(), this.to()];
    if (type === 'external') return to;

    const disabled = this.disabled();
    if (disabled) return undefined;

    const next = this.next();
    return next.maskedLocation
      ? this.router.history.createHref(next.maskedLocation.href)
      : this.router.history.createHref(next.href);
  });

  private ready = signal(false);
  transitioning = signal(false);
  isActive = computed(() => {
    if (!this.ready()) return false;

    const [next, location, exact] = [
      this.next(),
      this.location(),
      this.exactActiveOptions(),
    ];
    if (exact) {
      const testExact = exactPathTest(
        location.pathname,
        next.pathname,
        this.router.basepath
      );
      if (!testExact) return false;
    } else {
      const currentPathSplit = removeTrailingSlash(
        location.pathname,
        this.router.basepath
      ).split('/');
      const nextPathSplit = removeTrailingSlash(
        next.pathname,
        this.router.basepath
      ).split('/');
      const pathIsFuzzyEqual = nextPathSplit.every(
        (d, i) => d === currentPathSplit[i]
      );
      if (!pathIsFuzzyEqual) {
        return false;
      }
    }

    const includeSearch = this.includeSearchActiveOptions() ?? true;

    if (includeSearch) {
      const searchTest = deepEqual(location.search, next.search, {
        partial: !exact,
        ignoreUndefined: !this.explicitUndefinedActiveOptions(),
      });
      if (!searchTest) {
        return false;
      }
    }

    const includeHash = this.includeHashActiveOptions();
    if (includeHash) {
      return location.hash === next.hash;
    }

    return true;
  });

  constructor() {
    effect(() => {
      this.ready.set(true);
    });

    effect(() => {
      const [disabled, preload] = [
        untracked(this.disabled),
        untracked(this.preload),
      ];
      if (!disabled && preload === 'render') {
        this.doPreload();
      }
    });
  }

  protected handleClick(event: MouseEvent) {
    const [disabled, target] = [
      this.disabled(),
      this.hostElement.nativeElement.target,
    ];

    if (
      disabled ||
      this.isCtrlEvent(event) ||
      event.defaultPrevented ||
      (target && target !== '_self') ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    this.transitioning.set(true);

    const unsub = this.router.subscribe('onResolved', () => {
      unsub();
      this.transitioning.set(false);
    });

    this.router.navigate(this.navigateOptions());
  }

  protected handleFocus() {
    if (this.disabled()) return;
    if (this.preload()) {
      this.doPreload();
    }
  }

  private preloadTimeout: ReturnType<typeof setTimeout> | null = null;
  protected handleMouseEnter(event: MouseEvent) {
    if (this.disabled() || !this.preload()) return;

    this.preloadTimeout = setTimeout(() => {
      this.preloadTimeout = null;
      this.doPreload();
    }, this.preloadDelay());
  }

  protected handleMouseLeave() {
    if (this.disabled()) return;
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
      this.preloadTimeout = null;
    }
  }

  private doPreload() {
    this.router.preloadRoute(this.navigateOptions()).catch((err) => {
      console.warn(err);
      console.warn(preloadWarning);
    });
  }

  private isCtrlEvent(e: MouseEvent) {
    return e.metaKey || e.altKey || e.ctrlKey || e.shiftKey;
  }
}
