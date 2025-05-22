import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { finalize, Subscription, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatInfoDto } from '../../../core/models/chat.models';
import { StudySessionDto } from '../../../core/models/study-session.models';
import { NearbyUserDto, UserProfileDto } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { StudySessionService } from '../../../core/services/study-session.service';
import { UserService } from '../../../core/services/user.service';

type LeafletType = typeof import('leaflet');
type LIconType = import('leaflet').Icon<import('leaflet').IconOptions>;
type LPolylineType = import('leaflet').Polyline<any>;

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dashboardMap') mapContainer!: ElementRef;

  private leaflet?: LeafletType;
  private map?: L.Map;
  private userMarker?: L.Marker;
  private buddyMarkers: L.Marker[] = [];
  private buddyLines: LPolylineType[] = [];

  greetingName: string = 'User';
  isLoadingMap = true;
  isLoadingChats = false;
  isLoadingSessions = false;
  mapError: string | null = null;
  sessionsError: string | null = null;
  stats = { matches: 0, sessions: 0, activeChats: 0 };
  upcomingSessions: StudySessionDto[] = [];
  recentActivity: any[] = [];
  defaultAvatar = environment.defaultAvatarUrl;
  currentUserProfile: UserProfileDto | null = null;
  nearbyUsers: NearbyUserDto[] = [];

  private nearbyUsersSubscription?: Subscription;
  private chatSubscription?: Subscription;
  private userSubscription?: Subscription;
  private sessionsSubscription?: Subscription;
  private profileSubscription?: Subscription;
  private _initialDataLoadAttempted = false;
  private _delayTimerSubscription?: Subscription;
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private studySessionService: StudySessionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    console.log(`[DashboardViewComponent] Constructor. isBrowser: ${this.isBrowser}`);
  }

  ngOnInit(): void {
    console.log('[DashboardViewComponent] ngOnInit');
    this.isLoadingMap = true;
    this.isLoadingSessions = true;
    this.isLoadingChats = true;

    this.userSubscription = this.authService.currentUser$.subscribe(basicUser => {
      if (basicUser) {
        console.log('[DashboardViewComponent] Current basic user received:', basicUser.id);
        this.loadFullUserProfile(basicUser.id);
      } else {
        console.log('[DashboardViewComponent] No basic user detected.');
        this.zone.run(() => {
          this.currentUserProfile = null;
          this.resetState();
        });
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      console.log('[DashboardViewComponent] ngAfterViewInit - Initializing map (if browser).');
      this.initMap();
    } else {
      this.isLoadingMap = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    console.log('[DashboardViewComponent] ngOnDestroy');
    this.nearbyUsersSubscription?.unsubscribe();
    this.chatSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.sessionsSubscription?.unsubscribe();
    this.profileSubscription?.unsubscribe();
    this._delayTimerSubscription?.unsubscribe();

    if (this.isBrowser && this.map) {
      try {
        this.map.remove();
        console.log("[DashboardViewComponent] Leaflet map instance removed.");
      } catch (e) {
        console.error("[DashboardViewComponent] Error removing map instance:", e);
      }
      this.map = undefined;
    }
  }

  loadFullUserProfile(userId: number): void {
    console.log(`[DashboardViewComponent] Loading full profile for user ${userId}`);
    this.profileSubscription?.unsubscribe();
    this.profileSubscription = this.userService.getMyProfile().subscribe({
      next: (profile) => {
        console.log('[DashboardViewComponent] Full profile loaded:', profile);
        this.zone.run(() => {
          const profileChanged = this.currentUserProfile?.id !== profile.id || this.currentUserProfile?.profilePictureUrl !== profile.profilePictureUrl;
          const isInitialProfileLoad = !this.currentUserProfile && !!profile;
          this.currentUserProfile = profile;

          this.greetingName = this.currentUserProfile.fullName?.split(' ')[0] || 'User';

          if (this.isBrowser && this.map && this.currentUserProfile) {
            console.log('[DashboardViewComponent] Profile updated, refreshing map markers.');
            this.updateMapMarkers();
          }

          if (profile && (!this._initialDataLoadAttempted || profileChanged)) {
            console.log('[DashboardViewComponent] Profile loaded/changed, triggering initial data load (delayed).');
            const delayMs = isInitialProfileLoad ? 150 : 0;
            this._delayTimerSubscription?.unsubscribe();
            this._delayTimerSubscription = timer(delayMs).subscribe(() => {
              if (this.currentUserProfile) {
                this.loadInitialData(this.currentUserProfile);
              }
            });
          } else if (profile && this._initialDataLoadAttempted) {
            console.log('[DashboardViewComponent] Profile refreshed, ensuring loading flags are off.');
            if (this.isLoadingMap && (this.nearbyUsers.length > 0 || this.mapError)) this.isLoadingMap = false;
            if (this.isLoadingSessions && (this.upcomingSessions.length > 0 || this.sessionsError)) this.isLoadingSessions = false;
            if (this.isLoadingChats && (this.recentActivity.length > 0)) this.isLoadingChats = false;
            this.cdr.markForCheck();
          } else {
            console.warn('[DashboardViewComponent] Profile loaded, but not triggering initial data load (already attempted or no profile).');
          }
        });
      },
      error: (err) => {
        console.error('[DashboardViewComponent] Error loading profile:', err);
        this.isLoadingMap = false;
        this.isLoadingSessions = false;
        this.isLoadingChats = false;
        this.mapError = "Could not load your profile details.";
        this.cdr.markForCheck();
      }
    });
  }

  loadInitialData(userProfile: UserProfileDto): void {
    console.log('[DashboardViewComponent] Starting initial data load.');
    if (!userProfile) {
      console.warn('[DashboardViewComponent] Cannot load initial data: userProfile is null.');
      this.resetState();
      return;
    }

    this.mapError = null;
    this.sessionsError = null;
    this.nearbyUsers = [];
    this.upcomingSessions = [];
    this.recentActivity = [];
    this.stats = { matches: 0, sessions: 0, activeChats: 0 };

    this.isLoadingMap = true;
    this.isLoadingChats = true;
    this.isLoadingSessions = true;
    this._initialDataLoadAttempted = true;
    this.cdr.markForCheck();

    this.loadNearbyUsers(userProfile);
    this.loadChats();
    this.loadSessions();
  }

  resetState(): void {
    console.log('[DashboardViewComponent] Resetting component state.');
    this.nearbyUsersSubscription?.unsubscribe();
    this.chatSubscription?.unsubscribe();
    this.sessionsSubscription?.unsubscribe();
    this.profileSubscription?.unsubscribe();
    this._delayTimerSubscription?.unsubscribe();

    this.greetingName = 'User';
    this.isLoadingMap = false;
    this.isLoadingChats = false;
    this.isLoadingSessions = false;
    this.mapError = null;
    this.sessionsError = null;
    this.stats = { matches: 0, sessions: 0, activeChats: 0 };
    this.upcomingSessions = [];
    this.recentActivity = [];
    this.nearbyUsers = [];
    this._initialDataLoadAttempted = false;
    this.currentUserProfile = null;

    if (this.isBrowser) {
      this.clearMapMarkers();
      if (this.map) {
        const defaultCoords: L.LatLngTuple = [50.08, 14.42];
        this.map.setView(defaultCoords, 13);
      }
    }

    this.cdr.markForCheck();
  }

  loadNearbyUsers(userProfile: UserProfileDto): void {
    this.nearbyUsersSubscription?.unsubscribe();
    const radiusKm = 10;
    const limit = 20;

    console.log(`[DashboardViewComponent] Loading nearby users for profile ID: ${userProfile.id}`);

    if (!userProfile.latitude || !userProfile.longitude) {
      console.warn('[DashboardViewComponent] User location not set. Cannot load nearby users.');
      this.isLoadingMap = false;
      this.mapError = "Set your location in profile to see nearby buddies.";
      this.nearbyUsers = [];
      this.stats.matches = 0;
      if (this.isBrowser) {
        this.clearMapMarkers();
        this.updateMapMarkers();
      }
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingMap = true;
    this.mapError = null;
    if (this.isBrowser) this.clearMapMarkers();
    this.cdr.markForCheck();

    this.nearbyUsersSubscription = this.userService.getNearbyUsers(radiusKm, limit)
      .pipe(finalize(() => {
        console.log('[DashboardViewComponent] Finalizing nearby users load.');
        this.isLoadingMap = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (nearbyUsersData) => {
          console.log('[DashboardViewComponent] Received nearby users data:', nearbyUsersData);
          this.zone.run(() => {
            this.nearbyUsers = nearbyUsersData.filter(u => u.latitude != null && u.longitude != null);
            this.stats.matches = this.nearbyUsers.length;
            console.log(`[DashboardViewComponent] Filtered nearby users count: ${this.nearbyUsers.length}`);
            if (this.isBrowser) {
              this.updateMapMarkers();
            }
          });
        },
        error: (err) => {
          console.error('[DashboardViewComponent] Error loading nearby users:', err);
          this.mapError = err?.message || 'Failed to load nearby users.';
          this.nearbyUsers = [];
          this.stats.matches = 0;
          this.cdr.markForCheck();
        }
      });
  }


  loadChats(): void {
    console.log('[DashboardViewComponent] Loading chats.');
    this.isLoadingChats = true;
    this.cdr.markForCheck();
    this.chatSubscription?.unsubscribe();
    this.chatSubscription = this.chatService.getMyChats()
      .pipe(finalize(() => {
        console.log('[DashboardViewComponent] Finalizing chats load.');
        this.isLoadingChats = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (chats) => {
          console.log(`[DashboardViewComponent] Received ${chats.length} chats.`);
          this.zone.run(() => {
            this.stats.activeChats = chats.length;
            this.updateRecentActivity(chats);
          });
        },
        error: (err) => {
          console.error('[DashboardViewComponent] Error loading chats:', err);
          this.cdr.markForCheck();
        }
      });
  }

  loadSessions(): void {
    console.log('[DashboardViewComponent] Loading sessions.');
    this.isLoadingSessions = true;
    this.sessionsError = null;
    this.cdr.markForCheck();
    this.sessionsSubscription?.unsubscribe();
    this.sessionsSubscription = this.studySessionService.getMyUpcomingSessions(5)
      .pipe(finalize(() => {
        console.log('[DashboardViewComponent] Finalizing sessions load.');
        this.isLoadingSessions = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (sessions) => {
          console.log(`[DashboardViewComponent] Received ${sessions.length} upcoming sessions.`);
          this.zone.run(() => {
            this.upcomingSessions = sessions;
            this.stats.sessions = sessions.length;
          });
        },
        error: (err) => {
          console.error('[DashboardViewComponent] Error loading sessions:', err);
          this.sessionsError = err?.message || 'Failed to load upcoming sessions.';
          this.cdr.markForCheck();
        }
      });
  }


  updateRecentActivity(chats: ChatInfoDto[]): void {
    console.log('[DashboardViewComponent] Updating recent activity based on chats.');
    const sortedChats = chats
      .filter(chat => chat.lastMessageTimestamp)
      .sort((a, b) => new Date(b.lastMessageTimestamp!).getTime() - new Date(a.lastMessageTimestamp!).getTime())
      .slice(0, 5);

    this.recentActivity = sortedChats.map(chat => ({
      id: chat.chatId,
      icon: 'bi bi-chat-dots-fill',
      text: `Chat with ${chat.otherUserName}`,
      link: `/chats/${chat.chatId}`,
      timestamp: chat.lastMessageTimestamp!
    }));
    console.log('[DashboardViewComponent] Recent activity updated:', this.recentActivity);
    this.cdr.markForCheck();
  }

  private async initMap(): Promise<void> {
    if (this.map || !this.mapContainer?.nativeElement || !this.isBrowser) {
      console.log('[DashboardViewComponent] Skipping map initialization (already initialized, no container, or not browser).');
      if (!this.map && this.isLoadingMap && this.isBrowser) {
        this.isLoadingMap = false;
        this.mapError = "Map container not found.";
        this.cdr.markForCheck();
      }
      return;
    }

    console.log('[DashboardViewComponent] Attempting to initialize Leaflet map.');
    this.isLoadingMap = true;
    this.mapError = null;
    this.cdr.markForCheck();

    try {
      this.leaflet = await import('leaflet');
      const L = this.leaflet;

      const defaultCoords: L.LatLngTuple = [50.08, 14.42];
      const initialCenter: L.LatLngTuple = (this.currentUserProfile?.latitude != null && this.currentUserProfile?.longitude != null)
        ? [this.currentUserProfile.latitude, this.currentUserProfile.longitude]
        : defaultCoords;

      console.log('[DashboardViewComponent] Creating Leaflet map instance with center:', initialCenter);

      this.zone.runOutsideAngular(() => {
        this.map = L.map(this.mapContainer.nativeElement, {
          center: initialCenter,
          zoom: 14,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          minZoom: 3,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map!);

        this.zone.run(() => {
          setTimeout(() => this.map?.invalidateSize(), 0);
        });
      });


      console.log('[DashboardViewComponent] Leaflet map initialized successfully.');

      this.updateMapMarkers();

      this.isLoadingMap = false;
      this.cdr.markForCheck();

    } catch (e) {
      console.error('[DashboardViewComponent] Error initializing Leaflet map:', e);
      this.mapError = 'Could not initialize the map.';
      this.isLoadingMap = false;
      this.cdr.markForCheck();
    }
  }

  private updateMapMarkers(): void {
    if (!this.isBrowser || !this.leaflet || !this.map) {
      console.log('[DashboardViewComponent] Skipping marker update (not browser, leaflet/map not ready).');
      return;
    }
    console.log('[DashboardViewComponent] Updating map markers with profile pictures and lines.');

    const L = this.leaflet;
    this.clearMapMarkers();

    const allCoords: L.LatLngTuple[] = [];

    const currentUserCoords: L.LatLngTuple | null =
      (this.currentUserProfile?.latitude != null && this.currentUserProfile?.longitude != null)
        ? [this.currentUserProfile.latitude, this.currentUserProfile.longitude]
        : null;

    if (currentUserCoords) {
      console.log('[DashboardViewComponent] Adding user avatar marker at:', currentUserCoords);
      allCoords.push(currentUserCoords);

      const userIcon = L.icon({
        iconUrl: this.currentUserProfile?.profilePictureUrl || this.defaultAvatar,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35],
        className: 'user-avatar-icon'
      });

      this.userMarker = L.marker(currentUserCoords, { icon: userIcon })
        .bindPopup(`<b>You are here</b><br>${this.currentUserProfile?.fullName || 'Your Location'}`)
        .addTo(this.map);
    } else {
      console.log('[DashboardViewComponent] User location not available, skipping user marker.');
    }

    console.log(`[DashboardViewComponent] Adding ${this.nearbyUsers.length} buddy markers and lines.`);
    this.nearbyUsers.forEach((buddy, index) => {
      if (buddy.latitude && buddy.longitude) {
        const buddyCoords: L.LatLngTuple = [buddy.latitude, buddy.longitude];
        console.log(`[DashboardViewComponent] Adding buddy marker ${index + 1} for ${buddy.fullName} at:`, buddyCoords);
        allCoords.push(buddyCoords);

        const buddyIcon = L.icon({
          iconUrl: buddy.profilePictureUrl || this.defaultAvatar,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -30],
          className: 'buddy-avatar-icon'
        });

        const buddyMarker = L.marker(buddyCoords, { icon: buddyIcon })
          .bindPopup(`<b>${buddy.fullName}</b><br>~${buddy.distanceKm?.toFixed(1) ?? '?'} km away`)
          .addTo(this.map!);
        this.buddyMarkers.push(buddyMarker);

        if (currentUserCoords) {
          const linePoints: L.LatLngTuple[] = [currentUserCoords, buddyCoords];
          const line = L.polyline(linePoints, {
            color: '#6c757d',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 8'
          }).addTo(this.map!);
          this.buddyLines.push(line);
        }

      } else {
        console.warn(`[DashboardViewComponent] Skipping buddy marker/line for ${buddy.fullName} due to missing coordinates.`);
      }
    });

    if (allCoords.length > 0) {
      console.log(`[DashboardViewComponent] Fitting map bounds to ${allCoords.length} markers.`);
      const bounds = L.latLngBounds(allCoords);
      const maxZoomLevel = allCoords.length === 1 ? 14 : 17;
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: maxZoomLevel });
    } else if (currentUserCoords) {
      console.log('[DashboardViewComponent] No nearby buddies, centering map on user location.');
      this.map.setView(currentUserCoords, 14);
    } else {
      console.log('[DashboardViewComponent] No markers to show, using default map view.');
    }

    console.log('[DashboardViewComponent] Map markers and lines updated.');
    this.cdr.markForCheck();
  }

  private clearMapMarkers(): void {
    if (!this.isBrowser || !this.map) return;
    console.log('[DashboardViewComponent] Clearing existing map markers and lines.');

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
      this.userMarker = undefined;
    }
    this.buddyMarkers.forEach(marker => this.map?.removeLayer(marker));
    this.buddyMarkers = [];

    this.buddyLines.forEach(line => this.map?.removeLayer(line));
    this.buddyLines = [];
  }

  viewAllSessions(): void {
    this.router.navigate(['/sessions']);
  }

  getSessionCreatorInitials(session: StudySessionDto): string {
    return session.creatorName
      ? session.creatorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : '??';
  }
}
