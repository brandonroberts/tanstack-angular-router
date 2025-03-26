import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { createLazyFileRoute } from 'tanstack-angular-router-experimental';

export const Route = createLazyFileRoute('/lazy-foo')({
  component: () => LazyPage,
});

@Component({
  selector: 'app-lazy',
  template: `
    <h1>Lazy page foo</h1>
    <hr />
    <pre>{{ loaderData() | json }}</pre>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
})
export class LazyPage {
  loaderData = Route.loaderData();
}
