import { Injectable } from '@angular/core';
import {Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {StompService} from "./stomp.service";

export interface AuthResponse {
  token: string;
  isSuccess: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient, private stompService: StompService) {}

  login(payload: any): Observable<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/signin`;

    return this.http.post<AuthResponse>(url, payload).pipe(
      tap(res => {
        if (res && res.isSuccess) {
          localStorage.setItem('userToken', res.token);
          this.stompService.setUserId(res.token);
        }
      })
    );
  }

  loginAsGuest(): Observable<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/signin-guest`;

    return this.http.get<AuthResponse>(url).pipe(
      tap(res => {
        if (res && res.isSuccess) {
          localStorage.setItem('userToken', res.token);
          this.stompService.setUserId(res.token);
        }
      })
    );
  }

  signUp (payload: any): Observable<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/signup`;

    return this.http.post<AuthResponse>(url, payload).pipe(
      tap(res => {
        if (res && res.isSuccess) {
          localStorage.setItem('userToken', res.token);
          this.stompService.setUserId(res.token);
        }
      })
    );
  }
}
