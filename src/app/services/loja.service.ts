import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ItemLoja {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  tipo: string;
  nomeAvatar: string;
  nomeInterface: string;
  tema: string;
  nomePoder: string;
  descricaoPoder: string;
  avatarImagem: string;
  quantidadeInventario: number;
}

export enum TipoItemEnum {
  avatar = 'AVATAR',
  moeda = 'MOEDA',
  interface = 'INTERFACE' // nao tem interface
}

export interface Pacote {
  desconto: number;
  descricao: string;
  preco: number;
  quantidade: number;
  img: string;
}

@Injectable({
  providedIn: 'root'
})
export class LojaService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ObterItensInventario(filtroTipo?: TipoItemEnum): Observable<ItemLoja[]> {
    const url = `${this.baseUrl}/api/loja/inventario`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };

    const fullUrl = filtroTipo ? `${url}?tipoItem=${filtroTipo}` : url;

    return this.http.get<ItemLoja[]>(fullUrl, { headers } );
  }

  ObterPacotesMoeda(): Observable<Pacote[]> {
    const url = `${this.baseUrl}/api/loja/pacotes`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };

    return this.http.get<Pacote[]>(url, { headers } );
  }

  ObterItensLoja(): Observable<ItemLoja[]> {
    const url = `${this.baseUrl}/api/loja/itens`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };

    return this.http.get<ItemLoja[]>(url, { headers } );
  }

  ComprarMoedas(quantidade: number) {
    const url = `${this.baseUrl}/api/loja/comprar-moedas`;
    const token = localStorage.getItem('userToken') || '';
    const headers = { 'user-id': token };
    const payload = {
      quantidade: quantidade
    }

    return this.http.post(url, payload, { headers });
  }
}
