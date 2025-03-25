import { TanStackRouterDevtoolsCore } from '@tanstack/router-devtools-core';
import type { AnyRouter } from '@tanstack/router-core';
import type { JSX } from 'solid-js';
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  NgZone,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';

@Component({
  selector: 'tan-stack-router-devtools',
  template: `<div #devToolsContainer></div>`,
})
export class TanStackRouterDevtoolsComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() initialIsOpen?: boolean;
  @Input() panelProps?: JSX.HTMLAttributes<HTMLDivElement>;
  @Input() closeButtonProps?: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  @Input() toggleButtonProps?: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  @Input() position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  @Input() containerElement?: string | any;
  @Input() router?: AnyRouter;
  @Input() shadowDOMTarget?: ShadowRoot;

  @ViewChild('devToolsContainer', { static: true })
  devToolsContainer!: ElementRef<HTMLDivElement>;

  private devtools?: TanStackRouterDevtoolsCore;
  private cleanup?: () => void;
  private isDevtoolsMounted = false;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.router) {
      console.warn('No router provided to TanStackRouterDevtools');
      return;
    }

    // Delay initialization to ensure proper state
    setTimeout(() => this.initializeDevtools(), 0);
  }

  ngAfterViewInit(): void {
    // If not initialized in ngOnInit, try again here
    if (!this.isDevtoolsMounted && this.router) {
      this.initializeDevtools();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.devtools) {
      if (this.router) {
        this.initializeDevtools();
      }
      return;
    }

    if (changes['router'] && this.router) {
      this.updateRouter();
    }

    // Update options if any of them changed
    if (
      changes['initialIsOpen'] ||
      changes['panelProps'] ||
      changes['closeButtonProps'] ||
      changes['toggleButtonProps'] ||
      changes['position'] ||
      changes['containerElement'] ||
      changes['shadowDOMTarget']
    ) {
      this.updateOptions();
    }
  }

  private initializeDevtools(): void {
    if (!this.router || !this.devToolsContainer || this.isDevtoolsMounted)
      return;

    this.ngZone.runOutsideAngular(() => {
      try {
        // Create a clean initial options object
        const options = {
          router: this.router as AnyRouter,
          routerState: this.router!.state,
          initialIsOpen: this.initialIsOpen,
          panelProps: this.panelProps,
          closeButtonProps: this.closeButtonProps,
          toggleButtonProps: this.toggleButtonProps,
          position: this.position,
          containerElement: this.containerElement,
          shadowDOMTarget: this.shadowDOMTarget,
        };

        // Initialize with all options at once
        this.devtools = new TanStackRouterDevtoolsCore(options);

        // Set up manual router state tracking
        this.setupStateTracking();

        // Mount the devtools to the DOM
        this.devtools.mount(this.devToolsContainer.nativeElement);
        this.isDevtoolsMounted = true;
      } catch (err) {
        console.error('Failed to initialize TanStack Router DevTools:', err);
      }
    });
  }

  private setupStateTracking(): void {
    if (!this.router || !this.devtools) return;

    // Set up a polling mechanism to check for router state changes
    // since Angular's router state doesn't have a subscribe method
    const checkInterval = 100; // ms
    let previousState = this.router.state;

    const intervalId = setInterval(() => {
      if (this.router && this.devtools) {
        const currentState = this.router.state;

        // If state reference has changed
        if (currentState !== previousState) {
          previousState = currentState;

          this.ngZone.runOutsideAngular(() => {
            this.devtools?.setRouterState(currentState);
          });
        }
      }
    }, checkInterval);

    // Store cleanup function
    this.cleanup = () => clearInterval(intervalId);
  }

  private updateRouter(): void {
    if (!this.devtools || !this.router) return;

    this.ngZone.runOutsideAngular(() => {
      try {
        // Update router reference
        this.devtools?.setRouter(this.router as AnyRouter);

        // Update router state
        this.devtools?.setRouterState(this.router!.state);

        // Reset state tracking
        if (this.cleanup) {
          this.cleanup();
        }
        this.setupStateTracking();
      } catch (err) {
        console.error('Error updating TanStack Router DevTools router:', err);
      }
    });
  }

  private updateOptions(): void {
    if (!this.devtools) return;

    this.ngZone.runOutsideAngular(() => {
      try {
        this.devtools?.setOptions({
          initialIsOpen: this.initialIsOpen,
          panelProps: this.panelProps,
          closeButtonProps: this.closeButtonProps,
          toggleButtonProps: this.toggleButtonProps,
          position: this.position,
          containerElement: this.containerElement,
          shadowDOMTarget: this.shadowDOMTarget,
        });
      } catch (err) {
        console.error('Error updating TanStack Router DevTools options:', err);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up interval
    if (this.cleanup) {
      this.cleanup();
    }

    // Unmount devtools
    if (this.devtools) {
      this.ngZone.runOutsideAngular(() => {
        try {
          this.devtools?.unmount();
          this.isDevtoolsMounted = false;
        } catch (err) {
          console.error('Error unmounting TanStack Router DevTools:', err);
        }
      });
    }
  }
}
