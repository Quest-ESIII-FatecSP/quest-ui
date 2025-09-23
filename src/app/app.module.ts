import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './routes/register/register.component';
import { LobbyComponent } from './routes/lobby/lobby.component';
import { LoginComponent } from './routes/login/login.component';
import {ZardProgressBarComponent} from "@shared/components/progress-bar/progress-bar.component";

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LobbyComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ZardProgressBarComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
