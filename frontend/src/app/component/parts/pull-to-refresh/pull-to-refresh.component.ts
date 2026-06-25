import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable pull-to-refresh wrapper.
 *
 * Wrap any page/content with <app-pull-to-refresh (refresh)="reload()">…</app-pull-to-refresh>.
 * When the user is at the top of the nearest scrollable area and drags downward,
 * a refresh indicator appears (fading in + rotating with the pull). Once the pull
 * passes the threshold and the gesture is released, it locks into a spinning
 * "refreshing" state for ~2s, emits `refresh`, then resets.
 *
 * Supports touch (mobile/tablet) and mouse (desktop).
 */
@Component({
  selector: 'app-pull-to-refresh',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './pull-to-refresh.component.html',
  styleUrl: './pull-to-refresh.component.scss',
})
export class PullToRefreshComponent implements AfterViewInit, OnDestroy { 
  @Input() threshold = 70; 
  @Input() maxPull = 120; 
  @Input() refreshDuration = 2000; 
  @Output() refresh = new EventEmitter<void>();

  pullDistance = 0;
  dragging = false;
  refreshing = false;

  private startY = 0;
  private active = false;
  private scrollEl: HTMLElement | null = null;
  private readonly isBrowser: boolean;

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;
    el.addEventListener('touchstart', this.onTouchStart, { passive: true });
    el.addEventListener('touchmove', this.onTouchMove, { passive: false });
    el.addEventListener('touchend', this.onPointerUp, { passive: true });
    el.addEventListener('mousedown', this.onMouseDown);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);
    el.removeEventListener('touchend', this.onPointerUp);
    el.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  /* ── Touch ─────────────────────────────────────────── */
  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    this.onDown(e.touches[0].clientY, e.target as HTMLElement);
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.active) return;
    this.onMove(e.touches[0].clientY, e);
  };

  /* ── Mouse ─────────────────────────────────────────── */
  private onMouseDown = (e: MouseEvent) => {
    this.onDown(e.clientY, e.target as HTMLElement);
    if (this.active) {
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.active) return;
    this.onMove(e.clientY, e);
  };

  private onMouseUp = () => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.onPointerUp();
  };

  /* ── Shared gesture logic ──────────────────────────── */
  private onDown(clientY: number, target: HTMLElement): void {
    if (this.refreshing) return;
    this.scrollEl = this.findScrollable(target);
    const atTop = !this.scrollEl || this.scrollEl.scrollTop <= 0;
    if (atTop) {
      this.active = true;
      this.startY = clientY;
      this.dragging = false;
      this.pullDistance = 0;
    } else {
      this.active = false;
    }
  }

  private onMove(clientY: number, e: Event): void {
    if (this.refreshing) return;

    // Bail out if the inner content has since been scrolled away from the top.
    if (this.scrollEl && this.scrollEl.scrollTop > 0) {
      this.active = false;
      this.reset();
      return;
    }

    const delta = clientY - this.startY;
    if (delta <= 0) {
      // Moving upward — let native scroll take over.
      if (this.pullDistance > 0) {
        this.pullDistance = 0;
        this.dragging = false;
      }
      return;
    }

    // Pulling down at the top → drive the indicator and block native scroll.
    e.preventDefault();
    this.dragging = true;
    this.pullDistance = this.resistance(delta);
  }

  private onPointerUp = () => {
    if (!this.active || this.refreshing) {
      this.active = false;
      return;
    }
    this.active = false;

    if (this.pullDistance >= this.threshold) {
      this.startRefresh();
    } else {
      this.reset();
    }
  };

  /** Apply diminishing-returns resistance so the pull feels elastic. */
  private resistance(delta: number): number {
    const pulled = delta * 0.5;
    if (pulled <= this.maxPull) return pulled;
    // Beyond the cap, allow only a tiny bit of extra travel.
    return this.maxPull + (pulled - this.maxPull) * 0.1;
  }

  private startRefresh(): void {
    this.refreshing = true;
    this.dragging = false;
    this.pullDistance = this.threshold; // lock indicator in the active position

    setTimeout(() => {
      this.refresh.emit();
      this.finishRefresh();
    }, this.refreshDuration);
  }

  private finishRefresh(): void {
    this.refreshing = false;
    this.reset();
  }

  private reset(): void {
    this.dragging = false;
    this.pullDistance = 0;
  }

  /** Walk up the DOM from the touch target to the nearest scrollable element. */
  private findScrollable(el: HTMLElement | null): HTMLElement | null {
    let node: HTMLElement | null = el;
    const root = this.host.nativeElement;
    while (node && node !== root) {
      const style = getComputedStyle(node);
      const overflowY = style.overflowY;
      const scrollable =
        (overflowY === 'auto' || overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight;
      if (scrollable) return node;
      node = node.parentElement;
    }
    return null;
  }

  /* ── Template helpers ──────────────────────────────── */
  get indicatorOpacity(): number {
    if (this.refreshing) return 1;
    return Math.min(1, this.pullDistance / this.threshold);
  }

  get indicatorOffset(): number {
    // Slide the indicator down as the user pulls (starts hidden above the top).
    const travel = this.refreshing ? this.threshold : this.pullDistance;
    return travel - 44;
  }

  get iconRotation(): number {
    return (this.pullDistance / this.threshold) * 270;
  }
}
