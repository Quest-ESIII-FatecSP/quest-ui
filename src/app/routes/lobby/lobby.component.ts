import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {StompService} from "../../services/stomp.service";
import {Router} from "@angular/router";
import { LobbyService, RankingJogador } from '../../services/lobby.service';

declare const bootstrap: any; // bootstrap bundle (Modal) — incluído globalmente no index.html

interface Player {
  position: number;
  name: string;
  score: number;
  avatar: string;
}

interface Sala {
  nome: string;
  senha: string;
  jogador1: string;
  jogador2?: string | null;
}

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit, AfterViewInit, OnDestroy {
  // estado visível
  playerName = 'Jogador1';
  moedas = 100;
  isSalaEmCriacao: boolean = false;
  roomInfos = {roomCode: '', nomeSala: ''}
  EnterText = 'Entrar';
  player1 = {
    name: 'Jogador 1',
    avatar: 'assets/img/Variedades F.png',
    status: 'Conectado', active: false };
  player2 = {
    name: 'Jogador 2',
    avatar: 'assets/img/Mundo M.png', status: 'Aguardando...',
    active: false };

  playersRanking: RankingJogador[] = [];

  // salas / sistema local
  salas: Sala[] = [];
  salaSelecionada: Sala | null = null;
  senhaEntrada = '';
  novaSala = { nome: '', senha: '' };
  requestedRoomCode = '';

  // avatars e produtos (originais)
  avatars: string[] = [
    'assets/img/Artes F.png',
    'assets/img/Esportes F.png',
    'assets/img/Ciência M.png',
    'assets/img/Mundo M.png',
    'assets/img/Sociedade M.png',
    'assets/img/Variedades F.png',
    'assets/img/Musculoso.png',
    'assets/img/Raquel.png',
    'assets/img/Bruxa.png',
    'assets/img/Vampiro.png'
  ];

  produtos = [
    { img: 'assets/img/pacote-moedas-pequeno.png', title: '100 Moedas', priceText: 'R$ 5,00', cost: 5 },
    { img: 'assets/img/pacote-moedas-medio.png', title: '500 Moedas', priceText: 'R$ 45,00', cost: 45 },
    { img: 'assets/img/pacote-moedas-grande.png', title: '1000 Moedas', priceText: 'R$ 80,00', cost: 80 },
    { img: 'assets/img/Vampiro.png', title: 'Avatar Limitado Vampiro', priceText: '1000 moedas', cost: 1000 },
    { img: 'assets/img/Bruxa.png', title: 'Avatar Limitado Bruxa', priceText: '1000 moedas', cost: 1000 },
    { img: 'assets/img/congelar.png', title: 'Congelar', priceText: '100 moedas', cost: 100 },
    { img: 'assets/img/4cliques.png', title: 'Alternativas Fujonas', priceText: '100 moedas', cost: 100 },
    { img: 'assets/img/jumpscare.png', title: 'Susto', priceText: '100 moedas', cost: 100 },
    { img: 'assets/img/x.png', title: 'Poder X', priceText: '100 moedas', cost: 100 }
  ];

  // modal control / refs
  @ViewChild('avatarModal', { read: ElementRef }) avatarModalRef!: ElementRef;
  @ViewChild('lojaModal', { read: ElementRef }) lojaModalRef!: ElementRef;
  @ViewChild('tutorialModal', { read: ElementRef }) tutorialModalRef!: ElementRef;
  @ViewChild('rankingModal', { read: ElementRef }) rankingModalRef!: ElementRef;
  @ViewChild('premiumModal', { read: ElementRef }) premiumModalRef!: ElementRef;
  @ViewChild('criarSalaModal', { read: ElementRef }) criarSalaModalRef!: ElementRef;
  @ViewChild('entrarSalaModal', { read: ElementRef }) entrarSalaModalRef!: ElementRef;
  @ViewChild('senhaEntradaModal', { read: ElementRef }) senhaEntradaModalRef!: ElementRef;

  @ViewChild('playerCard1', { read: ElementRef }) playerCard1Ref!: ElementRef;
  @ViewChild('playerCard2', { read: ElementRef }) playerCard2Ref!: ElementRef;
  @ViewChildren('playerCard1, playerCard2') playerCards!: QueryList<ElementRef>;

  // instâncias bootstrap.Modal
  private modalInstances = new Map<string, any>();

  avatarTarget = 1; // 1 ou 2
  selectedAvatar: string | null = null;

  // timers / subscriptions
  private timeouts: any[] = [];

  constructor(
    private renderer: Renderer2,
    private stompService: StompService,
    private router: Router,
    private lobbyService: LobbyService
  ) {}

  ngOnInit(): void {
    this.stompLobbySubscription();
    this.ObterRanking();
    // tenta restaurar avatares de localStorage
    try {
      const sa = localStorage.getItem('selectedAvatar');
      const sa1 = localStorage.getItem('selectedAvatar1');
      const sa2 = localStorage.getItem('selectedAvatar2');

      if (sa1) this.player1.avatar = sa1;
      else if (sa) this.player1.avatar = sa;

      if (sa2) this.player2.avatar = sa2;

      const storedName = localStorage.getItem('playerName');
      if (storedName) this.playerName = storedName;

      const storedMoedas = localStorage.getItem('moedas');
      if (storedMoedas) this.moedas = Number(storedMoedas);

      // recuperar salas se existirem (apenas para demo local)
      const rawSalas = localStorage.getItem('salas');
      if (rawSalas) {
        try {
          this.salas = JSON.parse(rawSalas);
        } catch {}
      }
    } catch (e) {
      // storage indisponível — silencioso
    }
  }

  ngAfterViewInit(): void {
    // inicializa instâncias bootstrap.Modal para cada modal template ref (se existirem)
    this.safeCreateModal('avatarModal', this.avatarModalRef);
    this.safeCreateModal('lojaModal', this.lojaModalRef);
    this.safeCreateModal('TutorialModal', this.tutorialModalRef);
    this.safeCreateModal('RankingModal', this.rankingModalRef);
    this.safeCreateModal('premiumModal', this.premiumModalRef);
    this.safeCreateModal('criarSalaModal', this.criarSalaModalRef);
    this.safeCreateModal('entrarSalaModal', this.entrarSalaModalRef);
    this.safeCreateModal('senhaEntradaModal', this.senhaEntradaModalRef);

    // animação inicial dos cards
    this.revealPlayerCards();

    // demo visual: marca jogador2 como conectado após 2.5s (imitando original)
    const t = setTimeout(() => {
      this.player2.status = 'Conectado';
      this.pulseCard(this.playerCard2Ref);
    }, 2500);
    this.timeouts.push(t);
  }

  ngOnDestroy(): void {
    this.timeouts.forEach(t => clearTimeout(t));
    this.modalInstances.forEach(m => m?.dispose && m.dispose());
    this.modalInstances.clear();
  }

  stompRoomSubscription(roomCode: string){
    console.log('me inscrevi no room ' + roomCode)
    this.stompService.subscribe(`/room/${roomCode}`, (message) => {
      console.log(message)
      console.log(message.headers["event"])
      this.player2 = {...this.player2, active: true, status: 'Conectado'}
      this.EnterText = 'Entrando na Sala...'
      setTimeout(() => {
        this.router.navigate(['/room/', this.roomInfos.roomCode])
      }, 5000)
    });
  }

  stompLobbySubscription(){
    this.stompService.subscribe('/lobby', (message) => {
      const tipoEvento = message.headers["event"];
      console.log(tipoEvento)
      if (tipoEvento == "ROOM_CREATED") {
        this.roomInfos = JSON.parse(message.body);
        this.stompRoomSubscription(this.roomInfos.roomCode);

        const userID = message.headers["user-id"];

        console.log(this.roomInfos);
        console.log("User ID: " + userID);
        console.log("Id vindo do stomp: " + this.stompService.userID);

        if (this.isSalaEmCriacao && userID == this.stompService.userID) {
          console.log("navegando para sala")
          // this.router.navigate(['/sala', nomeSala])
        }
        // this.salas.push(nomeSala);
      } else if (tipoEvento == "ROOM_CLOSED") {
        console.log("Sala fechada!")
      }
    });
  }

  // ---------- MODAL HELPERS ----------
  private safeCreateModal(key: string, ref?: ElementRef | undefined) {
    try {
      if (!ref || !ref.nativeElement) return;
      const el = ref.nativeElement;
      const instance = new bootstrap.Modal(el, { backdrop: true });
      this.modalInstances.set(key, instance);
    } catch (e) {
      // bootstrap possivelmente não presente ou modal não renderizado ainda
    }
  }

  openModal(key: string) {
    const inst = this.modalInstances.get(key);
    if (inst) inst.show();
  }

  closeBootstrapModal(key: string) {
    const inst = this.modalInstances.get(key);
    if (inst) inst.hide();
  }

  // ---------- AVATAR / NOME ----------
  openAvatarModal(target: number) {
    this.avatarTarget = target === 2 ? 2 : 1;
    // atualiza label no modal (o template exibe avatarTarget diretamente)
    const inst = this.modalInstances.get('avatarModal');
    if (inst) inst.show();
  }

  changeProfilePic(src: string) {
    try {
      if (this.avatarTarget === 2) {
        this.player2.avatar = src;
        localStorage.setItem('selectedAvatar2', src);
      } else {
        this.player1.avatar = src;
        // header
        this.selectedAvatar = src;
        localStorage.setItem('selectedAvatar', src);
        localStorage.setItem('selectedAvatar1', src);
      }
    } catch (e) {
      // ignore
    } finally {
      // fecha modal se estiver aberto
      this.closeBootstrapModal('avatarModal');
    }
  }

  mudarNome() {
    const novo = prompt('Digite o novo nome do jogador:', this.playerName);
    if (novo && novo.trim().length > 0) {
      this.playerName = novo.trim();
      localStorage.setItem('playerName', this.playerName);
    }
  }

  // ---------- SALAS (Criar / Entrar) ----------
  criarSala() {
    this.openModal('criarSalaModal');
  }

  accessRoom(): void {
    this.requestedRoomCode = this.requestedRoomCode.trim().toUpperCase();
    this.stompService.publish({destination: `/room/${this.requestedRoomCode}/${this.stompService.userID}`});
  }

  confirmarCriacaoSala() {
    const nome = (this.novaSala.nome || '').trim();

    if (!nome) {
      alert('Por favor, preencha o nome e a senha da sala.');
      return;
    }

    this.stompService.publish({destination: `/createRoom/${nome}`});
    this.player1.active = true
    // fecha modal
    this.closeBootstrapModal('criarSalaModal');

    // feedback visual: atualiza status jogador2 e alerta
    this.player2.status = 'Aguardando Jogador 2...';

    // limpa campos
    this.novaSala = { nome: '', senha: '' };
  }

  entrarSala() {
    this.openModal('entrarSalaModal');
  }

  confirmarEntradaSala() {
    if (!this.salaSelecionada) {
      alert('Nenhuma sala selecionada.');
      return;
    }
    const senha = (this.senhaEntrada || '').trim();
    if (senha !== this.salaSelecionada.senha) {
      alert('Senha incorreta!');
      return;
    }

    // atualiza status jogador 2
    this.salaSelecionada.jogador2 = this.playerName;
    this.player2.status = `Conectado (${this.playerName})`;


    this.closeBootstrapModal('senhaEntradaModal');
    alert(`Você entrou na sala "${this.salaSelecionada.nome}"!`);

    this.salaSelecionada = null;
    this.senhaEntrada = '';
  }

  // ---------- PARTIDA / UTIL ----------
  // criarPartida() {
  //   // efeito visual: destacar card 1
  //   this.pulseCard(this.playerCard1Ref);
  //
  //   // persiste avatares
  //   try {
  //     localStorage.setItem('selectedAvatar1', this.player1.avatar);
  //     localStorage.setItem('selectedAvatar2', this.player2.avatar);
  //     localStorage.setItem('newMatch', String(Date.now()));
  //
  //     // limpa chaves antigas (compat com original)
  //     const keys = [
  //       'sync_roleta', 'sync_roleta_spin', 'sync_card', 'sync_question',
  //       'sync_answer', 'matchResult', 'goLobbyNow', 'rematchNow'
  //     ];
  //     keys.forEach(k => localStorage.removeItem(k));
  //   } catch (e) {}
  //   // abre nova aba para jogador 2 e navega atual para jogador 1
  //   try {
  //     const p2Url = 'partida.html?p=2';
  //     const p1Url = 'partida.html?p=1';
  //     const win2 = window.open(p2Url, '_blank');
  //     // mesmo que bloqueado, redireciona atual
  //     window.location.href = p1Url;
  //   } catch (e) {
  //     console.warn('Tentativa de abrir partida falhou', e);
  //   }
  // }

  entrarSalada() {
    this.pulseCard(this.playerCard2Ref);
  }

  comprarProduto(p: any) {
    // exemplo simples: se for pacote de moedas, incrementa moedas
    if (p.cost && p.cost <= 1000) {
      // aqui você pode integrar com pagamento — por enquanto demo local
      if (p.cost <= 100) {
        // itens "consumíveis" compráveis
        if (this.moedas >= p.cost) {
          this.moedas -= p.cost;
          localStorage.setItem('moedas', String(this.moedas));
          alert(`Comprado: ${p.title}`);
        } else {
          alert('Moedas insuficientes.');
        }
      } else {
        // pacotes monetários (simples demo: adicionar moedas)
        // supondo mapeamento: cost 5 -> +100, 45 -> +500, 80 -> +1000 (apenas exemplo)
        const mapping: any = { 5: 100, 45: 500, 80: 1000 };
        const add = mapping[p.cost] || 0;
        if (add > 0) {
          this.moedas += add;
          localStorage.setItem('moedas', String(this.moedas));
          alert(`Compra concluída: ${p.title}. Você recebeu ${add} moedas.`);
        } else {
          alert('Compra processada (demo).');
        }
      }
    } else {
      alert('Compra processada (demo).');
    }
  }

  adquirirPremium() {
    alert('Plano Premium: funcionalidade de pagamento não implementada (demo).');
    this.closeBootstrapModal('premiumModal');
  }

  // ---------- ANIMAÇÕES SIMPLES ----------
  revealPlayerCards() {
    // adiciona classe 'show' sequencialmente
    const cards = [this.playerCard1Ref, this.playerCard2Ref].filter(Boolean) as ElementRef[];
    cards.forEach((cardRef, idx) => {
      const t = setTimeout(() => {
        try {
          this.renderer.addClass(cardRef.nativeElement, 'show');
        } catch {}
      }, 120 * (idx + 1));
      this.timeouts.push(t);
    });
  }

  pulseCard(cardRef: ElementRef | undefined) {
    if (!cardRef || !cardRef.nativeElement) return;

    const el = cardRef.nativeElement;

    try {
      this.renderer.setStyle(el, 'transition', 'transform 0.25s ease, box-shadow 0.25s ease');
      this.renderer.setStyle(el, 'transform', 'scale(1.03)');
      this.renderer.setStyle(el, 'boxShadow', '0 26px 48px rgba(0,0,0,0.6)');

      const t = setTimeout(() => {
        try {
          this.renderer.removeStyle(el, 'transform');
          this.renderer.removeStyle(el, 'boxShadow');
          this.renderer.removeStyle(el, 'transition');
        } catch {}
      }, 900);
      this.timeouts.push(t);
    } catch (e) {
      // fallback silencioso
    }
  }

  getMedalIcon(position: number): string {
    switch(position) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  }

  getPositionClass(position: number): string {
    switch(position) {
      case 1:
        return 'position-1';
      case 2:
        return 'position-2';
      case 3:
        return 'position-3';
      default:
        return '';
    }
  }

  ObterRanking() {
    this.lobbyService.ObterRanking().subscribe({
      next: (data) => {
        this.playersRanking = data;

        this.playersRanking = this.playersRanking.map((player, index) => {
          player.posicao = index + 1;
          return player;
        });
      }
    })
  }
}
