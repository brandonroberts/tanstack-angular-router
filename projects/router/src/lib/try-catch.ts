import {
  DestroyRef,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';

@Directive({ selector: 'ng-template[try]' })
export class TryCatch {
  tryCatch = input<TemplateRef<unknown>>();

  private templateRef = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);

  private ref?: EmbeddedViewRef<unknown>;

  constructor() {
    effect(() => {
      try {
        this.ref = this.vcr.createEmbeddedView(this.templateRef);
        this.ref.markForCheck();
      } catch (err) {
        console.error(err);
        const tryCatchTmpl = untracked(this.tryCatch);
        if (tryCatchTmpl) {
          this.ref = this.vcr.createEmbeddedView(tryCatchTmpl, { error: err });
          this.ref.markForCheck();
        }
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.ref?.destroy();
      this.ref = undefined;
      this.vcr.clear();
    });
  }
}
