import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RankingJogador {
  username: string;
  pontuacao: number;
  avatar: string;
  posicao: number;
};

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ObterRanking(): Observable<RankingJogador[]> {
    const url = `${this.baseUrl}/api/jogador/ranking`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };
    return this.http.get<RankingJogador[]>(url, { headers });
  }
}
