import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { getRouteParams } from '../router';

@Component({
  selector: 'child',
  standalone: true,
  imports: [CommonModule],
  template: ` Child {{ params().id }}`,
})
export class ChildComponent {
  params = getRouteParams<{ id: string }>();
}
