import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from 'tanstack-angular-router-experimental';

import { router } from './router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // provideExperimentalZonelessChangeDetection(),
    provideRouter(router),
    provideHttpClient(withFetch()),
  ],
};
