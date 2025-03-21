import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from '@tanstack/angular-router';

import { router } from './router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(router)
  ]
};
