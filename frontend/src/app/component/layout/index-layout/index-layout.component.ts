import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PullToRefreshComponent } from '../../parts/pull-to-refresh/pull-to-refresh.component';

@Component({
  selector: 'app-index-layout',
  standalone: true,
  imports: [RouterOutlet, PullToRefreshComponent],
  templateUrl: './index-layout.component.html',
  styleUrl: './index-layout.component.scss',
})
export class IndexLayoutComponent {
  constructor(private router: Router) {}

  /** Reloads the currently active routed page (triggered by pull-to-refresh). */
  refreshPage(): void {
    const url = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([url]);
    });
  }
}
