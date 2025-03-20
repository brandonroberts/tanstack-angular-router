import { Component, inject, OnInit } from '@angular/core';

import { Outlet, Router } from '@tanstack/angular-router';
import { TanStackRouterDevtoolsComponent } from '../router/router-devtools';
import { router } from './routes';
import { AnyRouter } from '@tanstack/router-core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [Outlet, TanStackRouterDevtoolsComponent],
  template: `
    <h1>Welcome to {{title}}!</h1>

    <a (click)="go('/')">Home</a> |
    <a (click)="go('/about')">About</a> |
    <a (click)="go('/parent/1')">Parent 1</a>
    <hr />

    <outlet />
    
   @if(routerInstance) {
      <tan-stack-router-devtools 
        [router]="routerInstance"
        [initialIsOpen]="true"
        position="bottom-right"
      />
    </ng-container>
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'tanstack-router-angular';
  router = inject(Router);
  routerInstance: AnyRouter | null = null;

  ngOnInit() {
    this.routerInstance = router;
  }

  go(to: any) {
    this.router.navigate({ to });
  }
}
