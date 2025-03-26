import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Link, Outlet } from 'tanstack-angular-router-experimental';

@Component({
  selector: 'app-root',
  template: `
    <h1>File Routing</h1>

    <ul>
      <li>
        <a link="/">Home</a>
      </li>
      <li>
        <a link="/about">About</a>
      </li>
      <li>
        <a link="/lazy-foo">Lazy Foo</a>
      </li>
    </ul>

    <hr />

    <outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Outlet, Link],
})
export class AppComponent {
  title = 'file-routing';
}
