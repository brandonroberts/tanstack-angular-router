import { Component } from '@angular/core';

import { createRoute } from 'tanstack-angular-router-experimental';

import { Route as ParentRoute } from './parent.component';

export const Route = createRoute({
  getParentRoute: () => ParentRoute,
  path: '$id',
  component: () => ChildComponent,
});

@Component({
  selector: 'child',
  template: ` Child {{ params().id }}`,
})
export class ChildComponent {
  params = Route.routeParams();
}
