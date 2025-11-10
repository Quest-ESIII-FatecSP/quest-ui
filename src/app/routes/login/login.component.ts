import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  fraseMotivacional = '';
  clock = '';
  private frases = [
    'Conhecimento é poder!',
    'Cada resposta é um passo rumo à vitória!',
    'Aprender nunca foi tão divertido!',
    'Mostre que você sabe mais!',
    'Desafie-se e vá além!'
  ];
  private fraseTimer?: any;
  private clockTimer?: any;

  ngOnInit(): void {
    this.trocarFrase();
    this.fraseTimer = setInterval(() => this.trocarFrase(), 5000);
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.fraseTimer) clearInterval(this.fraseTimer);
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  enterAsGuest(): void {
    // Navega para o lobby
    window.location.href = '/lobby';
  }

  googleLogin(): void {
    // Placeholder de login Google
    alert('Login com Google ainda não implementado.');
  }

  private trocarFrase(): void {
    const idx = Math.floor(Math.random() * this.frases.length);
    this.fraseMotivacional = this.frases[idx];
  }

  private updateClock(): void {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    this.clock = `${h}:${m}:${s}`;
  }
}
