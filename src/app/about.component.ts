import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';

import { getLoaderData, LoaderFnContext } from '@tanstack/angular-router';
import { firstValueFrom } from 'rxjs';

import { TodosService } from './todos.service';

export const loader = async (ctx: unknown) => {
  const {context} = ctx as LoaderFnContext;
  const injector = context.injector;
  const todosService = injector.get(TodosService);
  const todos = await firstValueFrom(todosService.getTodo(1));

  return { todos };
};

@Component({
  selector: 'about',
  standalone: true,
  imports: [JsonPipe],
  template: `
    TanStack Routing in Angular

    <hr />
    <!-- Action Data: {{ actionData$ | async | json }} -->

    <hr />
    Loader Data: {{ loaderData() | json }}

    <hr />
<!-- 
    1. Submit the form without entering a name to see the action data containing the validation message.<br>
    2. Enter a name and submit to be redirected back to home with the name in the query params.

    <form novalidate (submit)="onSubmit($event)">
      <div>Name: <input type="name" name="name" /></div>

      <button type="submit">Submit</button>
    </form> -->
  `,
})
export class AboutComponent {
  loaderData = getLoaderData();
  // actionData$ = getActionData();
  // router = inject(Router);
  // todosService = inject(TodosService);

  onSubmit($event: any) {
    $event.preventDefault();

    // this.router.navigate({ to: '/about' });
    // this.router.getRoute("/about").action.submit({
    //   test: 1
    // } as any)
    // router.navigate({ to: "/about" });
  }
}
