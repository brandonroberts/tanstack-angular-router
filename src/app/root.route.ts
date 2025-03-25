import { createRootRoute } from "@tanstack/angular-router";

import { AppComponent } from "./app.component";

export const Route = createRootRoute({ component: () => AppComponent });
