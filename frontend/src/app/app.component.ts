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
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isAuthenticated$!: Observable<boolean>;
  title='frontend';

  constructor(private authService: AuthService) {
    console.log('[AppComponent] Constructor executed');
  }

  ngOnInit(): void {
    console.log('[AppComponent] ngOnInit');
    this.authService.checkToken().subscribe(isAuthenticated => {
      console.log('[AppComponent] Initial authentication check result:', isAuthenticated);
    });

    this.isAuthenticated$ = this.authService.isAuthenticated$;

    if (!this.isAuthenticated$) {
      console.error("[AppComponent] CRITICAL: isAuthenticated$ is still undefined after assignment in ngOnInit!");
    } else {
      console.log("[AppComponent] isAuthenticated$ assigned successfully in ngOnInit.");
    }
  }
}
