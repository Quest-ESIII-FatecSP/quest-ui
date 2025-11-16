import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Jogador {
  email: string;
  username: string;
  moeda: number;
  avatar: string;
};

export interface RankingJogador {
  username: string;
  pontuacao: number;
  avatar: string;
  posicao: number;
};

@Injectable({
  providedIn: 'root'
})
export class JogadorService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ObterDadosJogador(): Observable<Jogador> {
    const url = `${this.baseUrl}/api/jogador`;

    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };

    return this.http.get<Jogador>(url, { headers });
  }

  AtualizarAvatarJogador(idAvatar: number) {
    const url = `${this.baseUrl}/api/jogador/atualizar-avatar`;

    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };

    const payload = {
      "idAvatar": idAvatar
    }

    return this.http.post(url, payload, {
      headers,
      observe: 'response'
    });
  }

  ObterRanking(): Observable<RankingJogador[]> {
    const url = `${this.baseUrl}/api/jogador/ranking`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };

    return this.http.get<RankingJogador[]>(url, { headers });
  }
}
