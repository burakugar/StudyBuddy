import {
  Component, ElementRef, Renderer2, Inject, PLATFORM_ID, AfterViewInit, OnDestroy
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav #navEl class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
      <!-- Navigation Bar Content -->
      <div class="container-fluid">
        <a class="navbar-brand fw-bold text-primary" routerLink="/">
          <i class="bi bi-journal-bookmark-fill me-2"></i>Study Buddy
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <i class="bi bi-grid-1x2-fill me-1"></i>Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/matching" routerLinkActive="active">
                <i class="bi bi-search me-1"></i>Find Buddies
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/sessions" routerLinkActive="active">
                <i class="bi bi-calendar-event me-1"></i>Sessions
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/chats" routerLinkActive="active">
                <i class="bi bi-chat-dots me-1"></i>Chats
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/profile" routerLinkActive="active">
                <i class="bi bi-person-circle me-1"></i>Profile
              </a>
            </li>
          </ul>
          <div class="d-flex">
            <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" (click)="logout()">
              <i class="bi bi-box-arrow-right"></i>Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      height: 60px; /* Hardcoded */
    }
    .navbar {
      height: 60px; /* Hardcoded */
      /* HARDCODED border color */
      border-bottom: 1px solid #dee2e6;
      z-index: 1030;
    }
    /* Other component-specific styles */
    .nav-link {
      font-weight: 500;
      transition: color 0.15s ease-in-out;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
    .nav-link.active {
      font-weight: 600;
      color: var(--bs-primary) !important; /* Keep primary variable */
      border-bottom: 2px solid var(--bs-primary); /* Keep primary variable */
      margin-bottom: -2px;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
    }
    .nav-link i, .navbar-brand i, .btn i {
      font-size: 1.1em;
      line-height: 1;
      vertical-align: text-bottom;
    }
  `]
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  private isBrowser: boolean;
  private unlistenShow?: () => void;
  private unlistenHide?: () => void;
  private navElement?: HTMLElement;

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.navElement = this.el.nativeElement.querySelector('nav.navbar');
      const collapseElement = this.navElement?.querySelector('.navbar-collapse');

      if (this.navElement && collapseElement) {
        this.unlistenShow = this.renderer.listen(this.navElement, 'shown.bs.collapse', (event) => {
          if (event.target === collapseElement) {
            this.renderer.addClass(document.body, 'mobile-nav-open');
          }
        });
        this.unlistenHide = this.renderer.listen(this.navElement, 'hide.bs.collapse', (event) => {
          if (event.target === collapseElement) {
            this.renderer.removeClass(document.body, 'mobile-nav-open');
          }
        });
      } else {
        console.error('[HeaderComponent] Could not find navbar or collapse element to attach listeners.');
      }
    }
  }

  ngOnDestroy(): void {
    if (this.unlistenShow) this.unlistenShow();
    if (this.unlistenHide) this.unlistenHide();
  }

  logout(): void {
    console.log('[HeaderComponent] Logging out...');
    this.authService.logout();
  }
}
