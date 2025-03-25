import { Component, inject } from '@angular/core';

import { getRouteParams } from '@tanstack/angular-router';
import { TodosService } from './todos.service';

@Component({
  selector: 'child',
  template: ` Child {{ params().id }}`,
})
export class ChildComponent {
  params = getRouteParams<{ id: string }>();
  // todosService = inject(TodosService);
}
