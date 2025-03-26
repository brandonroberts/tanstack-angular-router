import { createRootRoute } from 'tanstack-angular-router-experimental';
import { AppComponent } from '../app/app.component';

export const Route = createRootRoute({
  component: () => AppComponent,
});
