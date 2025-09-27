import { Component } from '@angular/core';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent {
  avatar = 'assets/quest/img/Artes M.png';
  avatarOptions = [
    'assets/quest/img/Artes F.png',
    'assets/quest/img/Artes M.png',
    'assets/quest/img/Ciência F.png',
    'assets/quest/img/Ciência M.png'
  ];
  playerName = 'Jogador1';
  moedas = 100;
  energia = 50;
  dropdownOpen = false;
  players = [
    { avatar: 'assets/quest/img/Artes M.png', nome: 'Jogador 1', status: 'Conectado' },
    { avatar: 'assets/quest/img/Mundo M.png', nome: 'Jogador 2', status: 'Aguardando...' }
  ];

  toggleDropdown(){ this.dropdownOpen = !this.dropdownOpen; }
  changeProfilePic(src: string){
    this.avatar = src; this.players[0].avatar = src; this.dropdownOpen = false;
  }
  mudarNome(){
    const novo = prompt('Digite o novo nome do jogador:', this.playerName);
    if(novo) { this.playerName = novo; this.players[0].nome = novo; }
  }
  criarSala(){ alert('Sala criada! (simulação)'); }
  entrarSala(){ alert('Você entrou na sala! (simulação)'); }
  abrirMissoes(){ alert('Abrindo Missões... (simulação)'); }
  abrirTutorial(){ alert('Abrindo Tutorial... (simulação)'); }
  abrirLoja(){ alert('Loja ainda não implementada'); }
  abrirPasse(){ alert('Passe de Batalha ainda não implementado'); }
}
