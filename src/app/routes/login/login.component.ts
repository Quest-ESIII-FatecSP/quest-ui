import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  model = { email: '', senha: '', remember: false };
  showPassword = false;
  frases = [
    'Conhecimento é poder!',
    'Cada resposta é um passo rumo à vitória!',
    'Aprender nunca foi tão divertido!',
    'Mostre que você sabe mais!',
    'Desafie-se e vá além!'
  ];
  frase = '';
  clock = '';
  private fraseInterval?: any;
  private clockInterval?: any;
  categoryIcons = [
    'assets/quest/E.png',
    'assets/quest/CT.png',
    'assets/quest/EL.png',
    'assets/quest/M.png',
    'assets/quest/V.png',
    'assets/quest/S.png'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.trocarFrase();
    this.fraseInterval = setInterval(() => this.trocarFrase(), 5000);
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.fraseInterval);
    clearInterval(this.clockInterval);
  }

  togglePassword(){
    this.showPassword = !this.showPassword;
  }

  trocarFrase(){
    this.frase = this.frases[Math.floor(Math.random() * this.frases.length)];
  }

  updateClock(){
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    this.clock = `${h}:${m}:${s}`;
  }

  onSubmit(){
    // TODO: Integrar serviço de autenticação
    alert('Login enviado (simulação)');
    this.router.navigate(['/lobby']);
  }

  goLobbyGuest(){
    this.router.navigate(['/lobby']);
  }

  goTutorial(){
    // placeholder rota futura
    alert('Tutorial em desenvolvimento');
  }
}
