import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LobbyComponent} from './routes/lobby/lobby.component';
import {LoginComponent} from './routes/login/login.component';
import {RegisterComponent} from './routes/register/register.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
