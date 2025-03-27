import { createRootRoute } from 'tanstack-angular-router-experimental';

import { App } from './app';

export const Route = createRootRoute({ component: () => App });
