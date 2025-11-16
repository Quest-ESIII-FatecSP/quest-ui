import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './routes/register/register.component';
import { LobbyComponent } from './routes/lobby/lobby.component';
import { LoginComponent } from './routes/login/login.component';
import {ZardProgressBarComponent} from "@shared/components/progress-bar/progress-bar.component";
import { LoginSuccessComponent } from './routes/login-success/login-success.component';
import {HttpClientModule} from "@angular/common/http";
import { RoomComponent } from './routes/room/room.component';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    LobbyComponent,
    LoginSuccessComponent,
    RoomComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ZardProgressBarComponent,
    HttpClientModule
  ],
  providers: [
    {
      provide: LOCALE_ID, useValue: 'pt-BR'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
