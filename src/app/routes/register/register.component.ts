import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {
  model = { email: '', senha: '', confirmar: '' };
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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.trocarFrase();
    this.fraseInterval = setInterval(()=> this.trocarFrase(), 5000);
    this.updateClock();
    this.clockInterval = setInterval(()=> this.updateClock(), 1000);
  }
  ngOnDestroy(): void {
    clearInterval(this.fraseInterval); clearInterval(this.clockInterval);
  }

  trocarFrase(){
    this.frase = this.frases[Math.floor(Math.random()*this.frases.length)];
  }
  updateClock(){
    const now = new Date();
    this.clock = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  }

  onSubmit(){
    if(this.model.senha !== this.model.confirmar){
      alert('As senhas não coincidem!');
      return;
    }
    alert('Cadastro realizado com sucesso! (simulação)');
    this.router.navigate(['/login']);
  }
}
