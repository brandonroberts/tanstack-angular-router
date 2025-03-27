import { Component, inject } from '@angular/core';
import {
  createRoute,
  injectRouter,
  redirect,
} from 'tanstack-angular-router-experimental';
import { AuthState } from './auth-state';

import { Route as RootRoute } from './root.route';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: 'login',
  component: () => Login,
  validateSearch: (search) => ({ redirect: search['redirect'] as string }),
  beforeLoad: ({ search }) => {
    const authState = inject(AuthState);
    if (authState.isAuthenticated()) {
      console.log('already logged in');
      throw redirect({ to: search.redirect || '/' });
    }
  },
});

@Component({
  selector: 'login',
  template: `
    <h1>Login</h1>

    <form (submit)="onSubmit($event)">
      <input
        placeholder="username"
        [value]="authState.username()"
        name="username"
        required
      />
      <button type="submit">Login</button>
    </form>
  `,
})
export class Login {
  authState = inject(AuthState);
  router = injectRouter();
  search = Route.routeSearch();

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get('username');
    if (!username || typeof username !== 'string') return;

    this.authState.username.set(username);
    this.router.navigate({ to: this.search().redirect || '/' });
  }
}
