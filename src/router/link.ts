import { computed, Directive, input } from '@angular/core';
import { NavigateOptions } from '@tanstack/router-core';
import { injectRouter } from './router';

@Directive({
  selector: 'a[link]',
  exportAs: 'link',
  host: {
    '(click)': 'navigate($event)',
    '[attr.href]': 'hostHref()',
  },
})
export class Link {
  toOptions = input.required<
    | (Omit<NavigateOptions, 'to'> & { to: NonNullable<NavigateOptions['to']> })
    | NonNullable<NavigateOptions['to']>
  >({ alias: 'link' });

  router = injectRouter();

  private navigateOptions = computed(() => {
    const to = this.toOptions();
    if (typeof to === 'object') return to;
    return { to };
  });

  protected hostHref = computed(
    () => this.router.buildLocation(this.navigateOptions()).href
  );

  navigate($event: Event) {
    $event.preventDefault();

    this.router.navigate(this.navigateOptions());
  }
}
