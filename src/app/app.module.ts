import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './routes/register/register.component';
import { LobbyComponent } from './routes/lobby/lobby.component';
import { LoginComponent } from './routes/login/login.component';
import { LoginSuccessComponent } from './routes/login-success/login-success.component';
import {HttpClientModule} from "@angular/common/http";
import { RoomComponent } from './routes/room/room.component';
import { RoletaComponent } from './routes/roleta/roleta.component';
import { BlockUIModule } from 'ng-block-ui';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    LobbyComponent,
    LoginSuccessComponent,
    RoomComponent,
    RoletaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BlockUIModule.forRoot()
  ],
  providers: [
    {
      provide: LOCALE_ID, useValue: 'pt-BR'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
