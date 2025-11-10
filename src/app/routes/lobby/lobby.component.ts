import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {
  playerName = 'Jogador1';
  moedas = 100;
  avatarTarget = 1;
  player1Pic = this.asset('img/Variedades F.png');
  player2Pic = this.asset('img/Mundo M.png');

  get avatarModalTargetLabel(): string { return `Jogador ${this.avatarTarget}`; }

  ngOnInit(): void {
    // Hydrate avatar choices from localStorage
    try {
      const p1 = localStorage.getItem('selectedAvatar1') || localStorage.getItem('selectedAvatar');
      const p2 = localStorage.getItem('selectedAvatar2');
      if (p1) this.player1Pic = p1;
      if (p2) this.player2Pic = p2;
      // persist current pics for match page to read
      localStorage.setItem('selectedAvatar1', this.player1Pic);
      localStorage.setItem('selectedAvatar2', this.player2Pic);
    } catch {}
  }

  asset(rel: string): string { return `/assets/telas/${rel}`; }

  setAvatarTarget(n: number): void { this.avatarTarget = n === 2 ? 2 : 1; }

  openAvatarModal(target: number): void {
    this.setAvatarTarget(target);
    try {
      // Bootstrap Modal is globally available via scripts configured in angular.json
      // We trigger via data attributes; nothing else needed here.
      const el = document.getElementById('avatarModal');
      if ((window as any).bootstrap && el) {
        const m = new (window as any).bootstrap.Modal(el);
        m.show();
      }
    } catch {}
  }

  changeProfilePic(src: string): void {
    try {
      if (this.avatarTarget === 2) {
        this.player2Pic = src;
        localStorage.setItem('selectedAvatar2', src);
      } else {
        this.player1Pic = src;
        localStorage.setItem('selectedAvatar', src);
        localStorage.setItem('selectedAvatar1', src);
      }
    } catch {}
  }

  mudarNome(): void {
    const novo = prompt('Digite o novo nome do jogador:', this.playerName);
    if (novo) this.playerName = novo;
  }

  criarSala(): void {
    alert('Sistema de salas local - em breve dentro do Angular.');
  }

  entrarSala(): void {
    alert('Listagem de salas local - em breve dentro do Angular.');
  }

  criarPartida(): void {
    // Sinaliza nova partida e limpa estado antigo
    try {
      localStorage.setItem('newMatch', String(Date.now()));
      const keys = ['sync_roleta','sync_roleta_spin','sync_card','sync_question','sync_answer','matchResult','goLobbyNow','rematchNow'];
      keys.forEach(k => localStorage.removeItem(k));
      // garante avatares persistidos
      localStorage.setItem('selectedAvatar1', this.player1Pic);
      localStorage.setItem('selectedAvatar2', this.player2Pic);
    } catch {}

    // Abre uma nova aba (Jogador 2) e usa esta aba como Jogador 1, mantendo páginas estáticas por enquanto
    const p2Url = this.asset('partida.html') + '?p=2';
    window.open(p2Url, '_blank');
    const p1Url = this.asset('partida.html') + '?p=1';
    window.location.href = p1Url;
  }
}
