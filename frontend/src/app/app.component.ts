import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { AuthService } from './core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <app-header *ngIf="isAuthenticated$ | async"></app-header>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }
}

// Empty export to ensure file is recognized as a module
export {};
