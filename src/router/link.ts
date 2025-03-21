import { computed, Directive, inject, input } from "@angular/core";
import { NavigateOptions } from "@tanstack/router-core";

import { Router } from "./router";

@Directive({
  selector: 'a[link]',
  host: {
    '(click)': 'navigate($event)',
    '[attr.href]': '_href()'
  }
})
export class Link {
  to = input<NavigateOptions['to']>();
  from = input<NavigateOptions['from']>();
  params = input<NavigateOptions['params']>();
  search = input<NavigateOptions['search']>();
  hash = input<NavigateOptions['hash']>();
  options = input<NavigateOptions>();
  router = inject(Router);
  private navigateOptions = computed(() => {
    const options: NavigateOptions = {
      to: this.to(),
      from: this.from(),
      params: this.params(),
      search: this.search(),
      hash: this.hash(),
      ...this.options()
    };

    return options;
  });
  _href = computed(() => this.router.buildLocation(this.navigateOptions()).href);

  navigate($event: Event) {
    $event.preventDefault();

    this.router.navigate(this.navigateOptions());
  }
}