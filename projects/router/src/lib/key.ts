import {
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  linkedSignal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

@Directive({ selector: 'ng-template[key]' })
export class Key {
  key = input.required<string>();

  private vcr = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  private previousKey = linkedSignal<string, string | undefined>({
    source: this.key,
    computation: (_, prev) => prev?.source ?? undefined,
  });

  constructor() {
    effect(() => {
      const [key, previousKey] = [this.key(), this.previousKey()];
      if (key === previousKey) return;

      this.vcr.clear();
      const ref = this.vcr.createEmbeddedView(this.templateRef, {
        key,
        previousKey,
      });
      ref.markForCheck();
    });

    inject(DestroyRef).onDestroy(() => {
      this.vcr.clear();
    });
  }
}
