import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LobbyComponent } from './routes/lobby/lobby.component';
import { LoginComponent } from './routes/login/login.component';
import { LoginSuccessComponent } from './routes/login-success/login-success.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RoomComponent } from './routes/room/room.component';
import { BlockUIModule } from 'ng-block-ui';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { QuestWheelComponent } from './components/quest-wheel/quest-wheel.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import {CardComponent} from "./components/card/card.component";
import {CardSelectionComponent} from "./components/card-selection/card-selection.component";
import {QuestionSectionComponent} from "./components/question-section/question-section.component";
import { PowerTrayComponent } from './components/power-tray/power-tray.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LobbyComponent,
    LoginSuccessComponent,
    RoomComponent,
    QuestWheelComponent,
    CardComponent,
    CardSelectionComponent,
    QuestionSectionComponent,
    PowerTrayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BlockUIModule.forRoot(),
    BrowserAnimationsModule,
    ToastrModule.forRoot({ positionClass: 'toast-top-right', timeOut: 3000 })
  ],
  providers: [
    {
      provide: LOCALE_ID, useValue: 'pt-BR'
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
