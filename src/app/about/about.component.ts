import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { createLazyRoute, routeApi } from '@tanstack/angular-router';

export const LazyAboutRoute = createLazyRoute('/about')({
  component: () => AboutComponent,
});

@Component({
  selector: 'about',
  standalone: true,
  imports: [JsonPipe],
  template: `
    TanStack Routing in Angular

    <hr />
    Loader Data: {{ loaderData() | json }}

    <hr />
  `,
})
export class AboutComponent {
  routeApi = routeApi({ id: '/about' });
  loaderData = this.routeApi.loaderData();
}
