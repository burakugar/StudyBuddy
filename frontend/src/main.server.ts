import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfigServer } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, appConfigServer);

// Export bootstrap function as both default and named export
export default bootstrap;
export { bootstrap };
