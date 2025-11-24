import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {interval, Subscription} from "rxjs";


@Component({
  selector: 'app-login-success',
  templateUrl: './login-success.component.html',
  styleUrl: './login-success.component.scss'
})
export class LoginSuccessComponent implements OnInit, OnDestroy{
  redirectSeconds = 3;
  remaining = this.redirectSeconds;
  progress = 0;
  errorMessage = '';

  timerSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}


  ngOnInit() {
    this.authenticateUser()
    const tick$ = interval(1000);
    this.timerSub = tick$.subscribe(i => {
      this.remaining = Math.max(0, this.redirectSeconds - (i + 1));
      this.progress = (100 * (this.redirectSeconds - this.remaining)) / this.redirectSeconds;
    });
  }

  authenticateUser(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const name = this.route.snapshot.queryParamMap.get('name');
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const avatar = this.route.snapshot.queryParamMap.get('avatar');

    if (!email || !userId) {
      this.errorMessage = 'Erro no login pelo Google.'
      this.goToPage('login');
      return;
    }

    const userData = { email, name, userId, avatar };
    this.authService.login(userData).subscribe({
      next: res => {
        if (res.isSuccess) {
          this.goToPage('lobby');
        }
      }, error: err => {
        if (err.error && !err.error.isSuccess) {
          this.authService.signUp(userData).subscribe({
            next: resp => {
              if (resp.isSuccess) {
                this.goToPage('lobby');
              } else {
                this.errorMessage = 'Erro ao criar conta.';
                this.goToPage('login');
              }
            }
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  goToPage(goTo: string): void {
    setTimeout(() => {
      this.remaining = 0;
      this.progress = 100
      this.router.navigate([`/${goTo}`]);

    }, 3000)
  }
}
