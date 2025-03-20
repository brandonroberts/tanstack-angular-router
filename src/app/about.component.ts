import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';

import { getLoaderData } from '@tanstack/angular-router';

export const loader = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const todos = await res.json();

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

    1. Submit the form without entering a name to see the action data containing the validation message.<br>
    2. Enter a name and submit to be redirected back to home with the name in the query params.

    <form novalidate (submit)="onSubmit($event)">
      <div>Name: <input type="name" name="name" /></div>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class AboutComponent {
  loaderData = getLoaderData();
  // actionData$ = getActionData();
  // router = inject(Router);

  onSubmit($event: any) {
    $event.preventDefault();

    // this.router.navigate({ to: '/about' });
    // this.router.getRoute("/about").action.submit({
    //   test: 1
    // } as any)
    // router.navigate({ to: "/about" });
  }
}
