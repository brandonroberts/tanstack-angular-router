import { ChangeDetectionStrategy, Component } from '@angular/core';
import { createFileRoute } from 'tanstack-angular-router-experimental';

export const Route = createFileRoute('/about')({
  component: () => AboutPage,
});

@Component({
  selector: 'app-about',
  template: `
    <h1>About</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {}
