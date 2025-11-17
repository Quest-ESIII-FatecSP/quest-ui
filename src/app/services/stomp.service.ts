import { Injectable } from '@angular/core';
import { Client, IPublishParams, Message, StompSubscription } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class StompService {

  userID: string = ""; // TODO: acessar token gerado via login, e enviar nos cabeçalhos user-id

  subscribeRequests: {broker: string, callback: (message: Message) => void}[] = [];
  client: Client;

  constructor() {
    this.client = new Client({brokerURL: 'http://localhost:8080/conectar'});
    this.client.onConnect = () => {
      this.subscribeRequests.forEach(sub => this.client.subscribe(sub.broker, sub.callback));
    }

    this.client.activate();

    this.verifyTokenCache();
  }

  subscribe(broker: string, callback: (message: Message) => void) {
    if (this.client.connected) {
      this.client.subscribe(broker, callback);
    } else {
      this.subscribeRequests.push({broker, callback});
    }
  }

  verifyTokenCache() {
    const token = localStorage.getItem('userToken');

    if(token) {
      this.setUserId(token);
    }
  }

  // metodo chamado apos o login em auth-service
  setUserId(token: string) {
    this.userID = token;
    this.client.connectHeaders = { ...(this.client.connectHeaders || { }), "user-id": token };
  }

  publish(params: IPublishParams): void {
    console.log(params)
    if (params.headers) {
      params.headers["user-id"] = this.userID;
    } else {
      params.headers = { "user-id": this.userID }
    }

    if (this.client.connected) {
      console.log("publicando mensagem")
      this.client.publish(params);
    }
  }}
