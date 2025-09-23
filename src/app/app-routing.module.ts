import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LobbyComponent} from "./routes/lobby/lobby.component";
import {LoginComponent} from "./routes/login/login.component";

const routes: Routes = [
  {path: '', component: LobbyComponent},
  {path: 'login', component: LoginComponent},
  {path: '**', redirectTo: 'login'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
