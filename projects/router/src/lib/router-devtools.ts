import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  signal,
  untracked,
} from '@angular/core';
import { TanStackRouterDevtoolsCore } from '@tanstack/router-devtools-core';
import { Router } from './router';

@Directive({ selector: 'router-devtools', host: { style: 'display: block;' } })
export class RouterDevtools {
  private injectedRouter = inject(Router);
  private host = inject<ElementRef<HTMLDivElement>>(ElementRef);
  private ngZone = inject(NgZone);

  router = input(this.injectedRouter);
  initialIsOpen = input(undefined, { transform: booleanAttribute });
  panelOptions = input<Partial<HTMLDivElement>>({});
  closeButtonOptions = input<Partial<HTMLButtonElement>>({});
  toggleButtonOptions = input<Partial<HTMLButtonElement>>({});
  shadowDOMTarget = input<ShadowRoot>();
  containerElement = input<string | HTMLElement>();
  position = input<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>();

  private activeRouterState = computed(() => this.router().routerState());

  private devtools = signal<TanStackRouterDevtoolsCore | null>(null);

  constructor() {
    afterNextRender(() => {
      const [
        router,
        initialIsOpen,
        panelOptions,
        closeButtonOptions,
        toggleButtonOptions,
        shadowDOMTarget,
        containerElement,
        position,
        activeRouterState,
      ] = [
        untracked(this.router),
        untracked(this.initialIsOpen),
        untracked(this.panelOptions),
        untracked(this.closeButtonOptions),
        untracked(this.toggleButtonOptions),
        untracked(this.shadowDOMTarget),
        untracked(this.containerElement),
        untracked(this.position),
        untracked(this.activeRouterState),
      ];

      // initial devTools
      this.devtools.set(
        new TanStackRouterDevtoolsCore({
          router,
          routerState: activeRouterState,
          initialIsOpen,
          position,
          panelProps: panelOptions,
          closeButtonProps: closeButtonOptions,
          toggleButtonProps: toggleButtonOptions,
          shadowDOMTarget,
          containerElement,
        })
      );
    });

    effect(() => {
      const devtools = this.devtools();
      if (!devtools) return;
      this.ngZone.runOutsideAngular(() => devtools.setRouter(this.router()));
    });

    effect(() => {
      const devtools = this.devtools();
      if (!devtools) return;
      this.ngZone.runOutsideAngular(() =>
        devtools.setRouterState(this.activeRouterState())
      );
    });

    effect(() => {
      const devtools = this.devtools();
      if (!devtools) return;

      this.ngZone.runOutsideAngular(() => {
        devtools.setOptions({
          initialIsOpen: this.initialIsOpen(),
          panelProps: this.panelOptions(),
          closeButtonProps: this.closeButtonOptions(),
          toggleButtonProps: this.toggleButtonOptions(),
          position: this.position(),
          containerElement: this.containerElement(),
          shadowDOMTarget: this.shadowDOMTarget(),
        });
      });
    });

    effect((onCleanup) => {
      const devtools = this.devtools();
      if (!devtools) return;
      this.ngZone.runOutsideAngular(() =>
        devtools.mount(this.host.nativeElement)
      );
      onCleanup(() => {
        this.ngZone.runOutsideAngular(() => devtools.unmount());
      });
    });
  }
}
