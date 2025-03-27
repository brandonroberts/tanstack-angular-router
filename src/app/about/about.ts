import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { createLazyRoute } from 'tanstack-angular-router-experimental';

export const LazyAboutRoute = createLazyRoute('/about')({
  component: () => About,
});

@Component({
  selector: 'about',
  imports: [JsonPipe],
  template: `
    TanStack Routing in Angular

    <hr />

    <h2>Loader Data</h2>
    @if (loaderData()?.todos; as todos) {
      <pre>{{ todos | json }}</pre>
    } @else {
      <p>Loading...</p>
    }

    <hr />
  `,
})
export class About {
  loaderData = LazyAboutRoute.loaderData();
}
