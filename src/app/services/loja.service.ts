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
  quantidadeInventario: number;
  avatarImagem: string;
}

export enum TipoItemEnum {
  avatar = 'AVATAR',
  moeda = 'MOEDA',
  interface = 'INTERFACE' // nao tem interface
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
}
