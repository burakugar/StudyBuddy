# StudyBuddy 🎓

StudyBuddy is a web application for students to find study partners, manage study sessions, and chat.

## Core Features

*   **User Accounts:** Registration, login, password reset, and editable profiles (courses, interests, availability, location).
*   **Buddy Matching:** Find study partners based on common courses, interests, and availability.
*   **Real-time Chat:** Instant messaging with matched buddies.
*   **Study Sessions:** Create, browse, join, and manage study groups.
*   **Nearby Users:** Discover other users on a map based on location.
*   **Dashboard:** Overview of activities, nearby users, and upcoming sessions.

## Tech Stack

**Backend:**
*   Java (Spring Boot)
*   Spring Security (JWT)
*   Spring Data JPA (Hibernate)
*   Spring WebSocket (STOMP)
*   Spring Mail
*   PostgreSQL

**Frontend:**
*   Angular (TypeScript)
*   RxJS
*   Angular Router, Forms, HttpClient
*   Bootstrap 5 (Styling)
*   Leaflet.js (Maps)
*   Angular Universal (SSR)

**Database:**
*   PostgreSQL 15

**Tools:**
*   Docker & Docker Compose (for PostgreSQL)
*   OpenAPI/Swagger (API Docs)

## Project Structure

```
./
├── backend/          # Spring Boot application
│   └── src/
│       ├── main/
│       │   ├── java/com/studybuddy/  # Core Java code
│       │   └── resources/
│       │       ├── application.properties
│       │       └── db/init.sql       # DB init script
│       └── ...
├── frontend/         # Angular application
│   └── src/
│       ├── app/                      # Core Angular code
│       ├── environments/             # Environment configs
│       └── ...
├── docker-compose.yml  # For PostgreSQL
└── README.md
```

## Prerequisites

*   **JDK 17+** (or version compatible with your Spring Boot)
*   **Node.js & npm** (LTS version, e.g., v18+)
*   **Angular CLI** (`npm install -g @angular/cli`)
*   **Docker & Docker Compose**
*   **Maven or Gradle** (for backend, ensure your project has the wrapper: `./mvnw` or `./gradlew`)

## Setup and Running

**1. Start Database (PostgreSQL via Docker):**
   From the project root directory (where `docker-compose.yml` is):
   ```bash
   docker-compose up -d postgres
   ```
   This uses `backend/src/main/resources/db/init.sql` to set up tables and sample data.

**2. Configure Backend (`backend/src/main/resources/application.properties`):**
   *   **Database:** Already configured for the Docker setup.
   *   **JWT Secret:**
        ```properties
        jwt.secret=xxxx# Example, use a strong one if deploying
        ```
   *   **Mail Sender (for password reset):**
        ```properties
        # Replace with your actual Gmail or other provider credentials
        spring.mail.username=email
        spring.mail.password=mail password
        ```
   *   **Frontend URL:**
        ```properties
        frontend.url=http://localhost:4200
        ```

**3. Run Backend:**
   Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
   If using Maven:
   ```bash
   ./mvnw spring-boot:run
   ```
   If using Gradle:
   ```bash
   ./gradlew bootRun
   ```
   The backend will be at `http://localhost:8080`.

**4. Configure Frontend Proxy (for development):**
   In the `frontend` directory, create `proxy.conf.json`:
   ```json
   // frontend/proxy.conf.json
   {
     "/api": {
       "target": "http://localhost:8080",
       "secure": false,
       "changeOrigin": true
     }
   }
   ```
   *(Ensure your `angular.json` or `package.json` script for `start` uses this proxy, e.g., `ng serve --proxy-config proxy.conf.json`)*

**5. Run Frontend:**
   Navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   npm start 
   # or: ng serve --proxy-config proxy.conf.json
   ```
   The frontend will be at `http://localhost:4200`.

## Accessing the Application

*   **Frontend:** `http://localhost:4200`
*   **Backend API Docs (Swagger):** `http://localhost:8080/swagger-ui.html`

## Sample User Credentials

(From `backend/src/main/resources/db/init.sql`)
*   **Email:** `john.doe@university.edu` (and others)
*   **Password (for all sample users):** `adminadmin`
    *(Note: The `init.sql` uses bcrypt hashes. "adminadmin" is the plaintext password that should correspond to these hashes if the backend's `PasswordEncoder` is set up correctly.)*

## Key Functionality Points

*   **Authentication:** JWT tokens are used for securing API endpoints.
*   **User Profiles:** Users can manage their academic details, study preferences, courses, interests, availability, and location.
*   **Matching:** The system suggests study buddies based on commonalities in courses, interests, and overlapping availability.
*   **Chat:** Real-time messaging is enabled via WebSockets (with HTTP polling as a fallback in the current frontend `ChatService`).
*   **Study Sessions:** Users can create and manage study sessions, which can be linked to courses.
*   **Nearby Users:** Location data (latitude/longitude) is used to display nearby users on a map.
*   **Database Initialization:** The `init.sql` script populates the database with sample users, courses, interests, matches, and chats for testing.