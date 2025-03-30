import { DOCUMENT } from '@angular/common';
import {
  assertInInjectionContext,
  computed,
  inject,
  Injector,
  runInInjectionContext,
  type Signal,
  type ValueEqualityFn,
} from '@angular/core';

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: () => T,
  key: K,
  equal: (a: T[K], b: T[K]) => boolean = Object.is
) {
  return computed(() => obj()[key], { equal });
}

export function omit<TObject extends object, TKeys extends (keyof TObject)[]>(
  objFn: () => TObject,
  keysToOmit: TKeys,
  equal: ValueEqualityFn<NoInfer<Omit<TObject, TKeys[number]>>> = Object.is
): Signal<Omit<TObject, TKeys[number]>> {
  return computed(
    () => {
      const obj = objFn();
      const result = {} as Record<string, any>;

      for (const key of Object.keys(obj)) {
        if (keysToOmit.includes(key as keyof TObject)) continue;
        Object.assign(result, { [key]: obj[key as keyof TObject] });
      }

      return result as Omit<TObject, TKeys[number]>;
    },
    { equal }
  );
}

export function isDevMode({ injector }: { injector?: Injector } = {}) {
  !injector && assertInInjectionContext(isDevMode);

  if (!injector) {
    injector = inject(Injector);
  }

  return runInInjectionContext(injector, () => {
    const document = inject(DOCUMENT);
    const window = document.defaultView;
    return !!window && 'ng' in window;
  });
}
