import { Component } from '@angular/core';

import { getRouteParams } from '@tanstack/angular-router';

@Component({
  selector: 'child',
  template: ` Child {{ params().id }}`,
})
export class ChildComponent {
  params = getRouteParams<{ id: string }>();
}
