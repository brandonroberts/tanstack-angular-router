import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { getRouteParams } from '@tanstack/angular-router';
import { linkedQueryParam } from '../router/linked-query-params';

@Component({
  selector: 'child',
  imports: [FormsModule],
  template: ` Child {{ params().id }} - search: {{ search() }}
  
    <input [(ngModel)]="search" name="search "/>
  `,
})
export class ChildComponent {
  params = getRouteParams<{ id: string }>();

  search = linkedQueryParam('search');
}
