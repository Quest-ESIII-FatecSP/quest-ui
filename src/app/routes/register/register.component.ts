import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {
  model = { email: '', senha: '' };
  confirmar = '';
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

  onSubmit(): void {
    if (this.model.senha !== this.confirmar) {
      alert('As senhas não coincidem!');
      return;
    }
    alert('Cadastro realizado com sucesso!');
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
