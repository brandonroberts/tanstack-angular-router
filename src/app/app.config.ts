import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from './routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter()
  ]
};
