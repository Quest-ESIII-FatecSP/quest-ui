import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";


@Component({
  selector: 'app-login-success',
  templateUrl: './login-success.component.html',
  styleUrl: './login-success.component.scss'
})
export class LoginSuccessComponent implements OnInit{

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log("fui chamado")
    const email = this.route.snapshot.queryParamMap.get('email');
    const name = this.route.snapshot.queryParamMap.get('name');
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const avatar = this.route.snapshot.queryParamMap.get('avatar');

    if (!email || !userId) {
      alert('Erro no login pelo Google.');
      return;
    }

    const userData = { email, name, userId, avatar };
    console.log(userData)
    // Primeiro tenta login
    this.authService.login(userData).subscribe({
      next: res => {
        if (res.isSuccess) {
          console.log('Login bem-sucedido');
          this.router.navigate(['/lobby']);
        } else {
          alert('Usuário não encontrado, criando conta...');

        }
      }, error: err => {
        console.log(err)
        console.log(err.error)
        if (err.error && !err.error.isSuccess) {
          this.authService.signUp(userData).subscribe({
            next: resp => {
              if (resp.isSuccess) {
                console.log('Cadastro e login bem-sucedido');
                this.router.navigate(['/lobby']);
              } else {
                alert('Erro ao criar conta.');
              }
            }
          });
        }
      }
    });
  }
}
