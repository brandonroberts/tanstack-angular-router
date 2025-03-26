import { ChangeDetectionStrategy, Component } from '@angular/core';
import { createFileRoute } from 'tanstack-angular-router-experimental';

export const Route = createFileRoute('/')({
  component: () => HomePage,
});

@Component({
  selector: 'app-home',
  template: `
    <h1>Home</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
