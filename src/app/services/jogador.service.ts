import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum TipoJogadorEnum {
  CONVIDADO = 'CONVIDADO',
  CADASTRADO = 'CADASTRADO'
}

export interface Jogador {
  email: string;
  username: string;
  moeda: number;
  avatar: string;
  tipo: TipoJogadorEnum
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

  ObterDadosJogador(userId?: string): Observable<Jogador> {
    const url = `${this.baseUrl}/api/jogador`;

    const token = userId || localStorage.getItem('userToken') || '';
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

  AtualizarNomeJogador(novoNome: string) {
    const url = `${this.baseUrl}/api/jogador/atualizar-nome`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };
    const payload = {
      "novoNome": novoNome
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
