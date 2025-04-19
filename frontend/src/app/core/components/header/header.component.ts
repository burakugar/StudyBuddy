// frontend/src/app/core/components/header/header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" routerLink="/">Study Buddy</a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/matching" routerLinkActive="active">Find Buddies</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/chat" routerLinkActive="active">Chats</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/profile" routerLinkActive="active">Profile</a>
            </li>
          </ul>

          <button class="btn btn-outline-danger" (click)="logout()">
            Logout
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }

    .nav-link.active {
      font-weight: 500;
      color: #007bff !important;
    }
  `]
})
export class HeaderComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
