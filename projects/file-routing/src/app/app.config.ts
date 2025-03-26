import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from 'tanstack-angular-router-experimental';
import { routeTree } from '../routeTree.gen';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter({ routeTree }),
  ],
};
