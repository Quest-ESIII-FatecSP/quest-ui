import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LobbyComponent} from './routes/lobby/lobby.component';
import {LoginComponent} from './routes/login/login.component';
import {LoginSuccessComponent} from "./routes/login-success/login-success.component";
import {RoomComponent} from "./routes/room/room.component";

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'auth/success', component: LoginSuccessComponent },
  { path: 'room/:id', component: RoomComponent },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
