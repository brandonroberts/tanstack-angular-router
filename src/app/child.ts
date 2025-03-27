import { Component } from '@angular/core';

import { createRoute } from 'tanstack-angular-router-experimental';

import { Route as ParentRoute } from './parent';

export const Route = createRoute({
  getParentRoute: () => ParentRoute,
  path: '$id',
  component: () => Child,
});

@Component({
  selector: 'child',
  template: `
    Child {{ params().id }}
  `,
})
export class Child {
  params = Route.routeParams();
}
