import { Injectable } from '@angular/core';
import { Client, IPublishParams, Message, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StompService {

  userID: string = ""; // TODO: acessar token gerado via login, e enviar nos cabeçalhos user-id

  subscribeRequests: {broker: string, callback: (message: Message) => void, subscription?: StompSubscription}[] = [];
  client: Client;

  constructor() {
    this.client = new Client({brokerURL: `${environment.apiUrl}/conectar`});
    this.client.onConnect = () => {
      this.subscribeRequests.forEach(sub => {
        sub.subscription = this.client.subscribe(sub.broker, sub.callback)
      });
    }

    this.client.activate();

    this.verifyTokenCache();
  }

  subscribe(broker: string, callback: (message: Message) => void): StompSubscription | null {
    if (this.client.connected) {
      console.log('foi no connected')
      const sub = this.client.subscribe(broker, callback);
      this.subscribeRequests.push({ broker, callback, subscription: sub });
      return sub;
    } else {
      console.log('foi no push')

      this.subscribeRequests.push({ broker, callback, subscription: undefined });
      return null;
    }
  }

  unsubscribe(subscription: StompSubscription) {
    if (!subscription) return;

    subscription.unsubscribe();
    this.subscribeRequests = this.subscribeRequests.filter(
      req => req.subscription !== subscription
    );
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
      this.client.publish(params);
    }
  }}
