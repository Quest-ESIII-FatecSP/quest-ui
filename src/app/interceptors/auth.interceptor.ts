import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private baseUrl = environment.apiUrl;

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const authUrls = [
      `${this.baseUrl}/api/auth/signin`,
      `${this.baseUrl}/api/auth/signin-guest`,
      `${this.baseUrl}/api/auth/signup`
    ];

    // Verifica se a requisição é para o AuthService
    const isAuthRequest = authUrls.some(url => req.url.includes(url));

    // Se não for uma requisição de autenticação, verifica o token
    if (!isAuthRequest) {
      const token = localStorage.getItem('userToken');

      if (!token) {
        // Redireciona para login se não houver token
        this.router.navigate(['/login']);
        // Retorna um Observable vazio para cancelar a requisição
        return new Observable<HttpEvent<any>>(observer => {
          observer.complete();
        });
      }
    }

    return next.handle(req);
  }
}
