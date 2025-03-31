/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  linkedSignal,
  Type,
  untracked,
  ViewContainerRef,
} from '@angular/core';

/**
 * NOTE: This is a copy of NgComponentOutlet with EnvironmentInjector support added
 */

@Directive({ selector: '[componentOutlet]', exportAs: 'componentOutlet' })
export class ComponentOutlet<T = any> {
  componentOutlet = input.required<Type<any>>();
  componentOutletInputs = input<Record<string, unknown>>();
  componentOutletInjector = input<Injector>();
  componentOutletEnvironmentInjector = input<EnvironmentInjector>();

  private previousComponentOutlet = linkedSignal({
    source: this.componentOutlet,
    computation: (_, prev) => prev?.source ?? null,
  });
  private previousComponentOutletInjector = linkedSignal({
    source: this.componentOutletInjector,
    computation: (_, prev) => prev?.source ?? null,
  });
  private previousComponentOutletEnvironmentInjector = linkedSignal({
    source: this.componentOutletEnvironmentInjector,
    computation: (_, prev) => prev?.source ?? null,
  });

  private needToRecreateComponentInstance = computed(() => {
    const [componentOutlet, previousComponentOutlet] = [
      this.componentOutlet(),
      this.previousComponentOutlet(),
    ];
    if (componentOutlet !== previousComponentOutlet) return true;

    const [componentOutletInjector, previousComponentOutletInjector] = [
      this.componentOutletInjector(),
      this.previousComponentOutletInjector(),
    ];
    if (componentOutletInjector !== previousComponentOutletInjector)
      return true;

    const [
      componentOutletEnvironmentInjector,
      previousComponentOutletEnvironmentInjector,
    ] = [
      this.componentOutletEnvironmentInjector(),
      this.previousComponentOutletEnvironmentInjector(),
    ];

    return (
      componentOutletEnvironmentInjector !==
      previousComponentOutletEnvironmentInjector
    );
  });

  private _componentRef: ComponentRef<T> | undefined;

  /**
   * A helper data structure that allows us to track inputs that were part of the
   * ngComponentOutletInputs expression. Tracking inputs is necessary for proper removal of ones
   * that are no longer referenced.
   */
  private _inputsUsed = new Map<string, boolean>();

  /**
   * Gets the instance of the currently-rendered component.
   * Will be null if no component has been rendered.
   */
  get componentInstance(): T | null {
    return this._componentRef?.instance ?? null;
  }

  private environmentInjector = inject(EnvironmentInjector);
  private viewContainerRef = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const needToRecreateComponentInstance =
        this.needToRecreateComponentInstance();
      if (!needToRecreateComponentInstance) {
        if (this._componentRef) {
          const inputs = untracked(this.componentOutletInputs);
          if (inputs) {
            for (const inputName of Object.keys(inputs)) {
              this._inputsUsed.set(inputName, true);
            }
            this._applyInputStateDiff(this._componentRef, inputs);
          }
          this._componentRef.changeDetectorRef.markForCheck();
        }

        return;
      }

      const [
        componentOutlet,
        componentOutletInputs,
        componentOutletInjector,
        componentOutletEnvironmentInjector,
      ] = [
        untracked(this.componentOutlet),
        untracked(this.componentOutletInputs),
        untracked(this.componentOutletInjector),
        untracked(this.componentOutletEnvironmentInjector),
      ];

      this.viewContainerRef.clear();
      this._inputsUsed.clear();
      this._componentRef = undefined;

      const injector =
        componentOutletInjector || this.viewContainerRef.parentInjector;
      const environmentInjector =
        componentOutletEnvironmentInjector || this.environmentInjector;

      this._componentRef = this.viewContainerRef.createComponent(
        componentOutlet,
        { injector, environmentInjector }
      );

      if (componentOutletInputs) {
        for (const inputName of Object.keys(componentOutletInputs)) {
          this._inputsUsed.set(inputName, true);
        }
        this._applyInputStateDiff(this._componentRef, componentOutletInputs);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this._componentRef?.destroy();
      this._componentRef = undefined;
      this.viewContainerRef.clear();
      this._inputsUsed.clear();
    });
  }

  private _applyInputStateDiff(
    componentRef: ComponentRef<unknown>,
    inputs: Record<string, unknown>
  ) {
    for (const [inputName, touched] of this._inputsUsed) {
      if (!touched) {
        // The input that was previously active no longer exists and needs to be set to undefined.
        componentRef.setInput(inputName, undefined);
        this._inputsUsed.delete(inputName);
      } else {
        // Since touched is true, it can be asserted that the inputs object is not empty.
        componentRef.setInput(inputName, inputs[inputName]);
        this._inputsUsed.set(inputName, false);
      }
    }
  }
}
