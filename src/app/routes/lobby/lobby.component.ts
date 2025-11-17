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
import { Router } from "@angular/router";
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { switchMap } from 'rxjs';
import { JogadorService, RankingJogador } from '../../services/jogador.service';
import { ItemLoja, LojaService, Pacote, TipoItemEnum } from '../../services/loja.service';
import { StompService } from "../../services/stomp.service";
declare const bootstrap: any;



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
  isSalaEmCriacao: boolean = false;
  roomInfos = { roomCode: '', nomeSala: '' }
  EnterText = 'Entrar';

  player1 = {
    username: 'Jogador 1',
    avatar: 'assets/img/Variedades F.png',
    moeda: 0,
    status: 'Conectado',
    active: false,
    email: ""
  };

  player2 = {
    name: 'Jogador 2',
    avatar: 'assets/img/Mundo M.png', status: 'Aguardando...',
    active: false
  };

  @BlockUI() blockUI!: NgBlockUI;

  itensCompra: ItemLoja[] = [];
  pacotesMoeda: Pacote[] = [];
  playersRanking: RankingJogador[] = [];

  // salas / sistema local
  salas: Sala[] = [];
  salaSelecionada: Sala | null = null;
  senhaEntrada = '';
  novaSala = { nome: '', senha: '' };
  requestedRoomCode = '';

 
  currentSlide = 0;
  slides: string[] = [
    'assets/img/TUTORIAL.png',
    'assets/img/TUTORIAL2.png',
    'assets/img/TUTORIAL3.png',
    'assets/img/TUTORIAL4.png',
    'assets/img/TUTORIAL5.png',
    'assets/img/TUTORIAL6.png',
    'assets/img/TUTORIAL7.png',
    'assets/img/TUTORIAL8.png',
    'assets/img/TUTORIAL9.png',
  ];
  
  // função para ir para o próximo slide
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  // função para ir para o slide anterior
  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  // função para ir direto para um slide específico (usada pelos indicadores)
  goToSlide(index: number) {
    this.currentSlide = index;
  }

  avataresInventario: ItemLoja[] = [];
  poderesInventario: ItemLoja[] = [];

  // modal control / refs
  @ViewChild('avatarModal', { read: ElementRef }) avatarModalRef!: ElementRef;
  @ViewChild('lojaModal', { read: ElementRef }) lojaModalRef!: ElementRef;
  @ViewChild('tutorialModal', { read: ElementRef }) tutorialModalRef!: ElementRef;
  @ViewChild('rankingModal', { read: ElementRef }) rankingModalRef!: ElementRef;
  @ViewChild('premiumModal', { read: ElementRef }) premiumModalRef!: ElementRef;
  @ViewChild('criarSalaModal', { read: ElementRef }) criarSalaModalRef!: ElementRef;
  @ViewChild('entrarSalaModal', { read: ElementRef }) entrarSalaModalRef!: ElementRef;
  @ViewChild('senhaEntradaModal', { read: ElementRef }) senhaEntradaModalRef!: ElementRef;
  @ViewChild('inventarioModal', { read: ElementRef }) inventarioModalRef!: ElementRef;

  @ViewChild('playerCard1', { read: ElementRef }) playerCard1Ref!: ElementRef;
  @ViewChild('playerCard2', { read: ElementRef }) playerCard2Ref!: ElementRef;
  @ViewChildren('playerCard1, playerCard2') playerCards!: QueryList<ElementRef>;

  // instâncias bootstrap.Modal
  private modalInstances = new Map<string, any>();

  avatarTarget = 1; // 1 ou 2

  // timers / subscriptions
  private timeouts: any[] = [];

  constructor(
    private renderer: Renderer2,
    private stompService: StompService,
    private router: Router,
    private jogadorService: JogadorService,
    private lojaService: LojaService
  ) { }

  ngOnInit(): void {
    this.stompLobbySubscription();
    this.ObterDadosJogador();
    this.ObterInventarioJogador();
    this.ObterRanking();
    this.ObterPacotesMoeda();
    this.ObterItensLoja();


    // tenta restaurar avatares de localStorage
    try {
      // recuperar salas se existirem (apenas para demo local)
      const rawSalas = localStorage.getItem('salas');
      if (rawSalas) {
        try {
          this.salas = JSON.parse(rawSalas);
        } catch { }
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
    this.safeCreateModal('InventarioModal', this.inventarioModalRef);

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

  stompRoomSubscription(roomCode: string) {
    console.log('me inscrevi no room ' + roomCode)
    this.stompService.subscribe(`/room/${roomCode}`, (message) => {
      console.log(message)
      console.log(message.headers["event"])
      this.player2 = { ...this.player2, active: true, status: 'Conectado' }
      this.EnterText = 'Entrando na Sala...'
      setTimeout(() => {
        this.router.navigate(['/room/', this.roomInfos.roomCode])
      }, 5000)
    });
  }

  stompLobbySubscription() {
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

  changeProfilePic(avatarId: number) {
    this.blockUI.start('Atualizando avatar...');

    try {
      this.jogadorService.AtualizarAvatarJogador(avatarId).subscribe({
        next: (data) => {
          if (data.ok) {
            this.ObterDadosJogador();
          }
        }
      });
    } catch (e) {
      console.log(e);
    } finally {
      this.blockUI.stop();
      this.closeBootstrapModal('avatarModal');
    }
  }

  mudarNome() {
    // const novo = prompt('Digite o novo nome do jogador:', this.playerName);
    // if (novo && novo.trim().length > 0) {
    //   this.playerName = novo.trim();
    //   localStorage.setItem('playerName', this.playerName);
    // }
  }

  // ---------- SALAS (Criar / Entrar) ----------
  criarSala() {
    this.openModal('criarSalaModal');
  }

  accessRoom(): void {
    this.requestedRoomCode = this.requestedRoomCode.trim().toUpperCase();
    this.stompService.publish({ destination: `/room/${this.requestedRoomCode}/${this.stompService.userID}` });
  }

  confirmarCriacaoSala() {
    const nome = (this.novaSala.nome || '').trim();

    if (!nome) {
      alert('Por favor, preencha o nome e a senha da sala.');
      return;
    }

    this.stompService.publish({ destination: `/createRoom/${nome}` });
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
    this.salaSelecionada.jogador2 = this.player1.username;
    this.player2.status = `Conectado (${this.player1.username})`;


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
        if (this.player1.moeda >= p.cost) {
          this.player1.moeda -= p.cost;
          localStorage.setItem('moedas', String(this.player1.moeda));
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
          this.player1.moeda += add;
          localStorage.setItem('moedas', String(this.player1.moeda));
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
        } catch { }
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
        } catch { }
      }, 900);
      this.timeouts.push(t);
    } catch (e) {
      // fallback silencioso
    }
  }

  getMedalIcon(position: number): string {
    switch (position) {
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
    switch (position) {
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
    this.jogadorService.ObterRanking().subscribe({
      next: (data) => {
        this.playersRanking = data;

        this.playersRanking = this.playersRanking.map((player, index) => {
          player.posicao = index + 1;
          return player;
        });
      }
    })
  }

  ObterInventarioJogador(filtroTipo?: TipoItemEnum) {
    this.lojaService.ObterItensInventario(filtroTipo).subscribe({
      next: (data) => {
        this.avataresInventario = data.filter(item => item.tipo === TipoItemEnum.avatar);
        this.poderesInventario = data.filter(item => item.tipo === TipoItemEnum.poder);
      }
    });
  }

  ObterDadosJogador() {
    this.blockUI.start("Carregando dados do jogador...");

    this.jogadorService.ObterDadosJogador().subscribe({
      next: (data) => {
        const { avatar, email, moeda, username } = data;

        this.player1.username = username;
        this.player1.avatar = avatar;
        this.player1.moeda = moeda;
        this.player1.email = email;
      },
      complete: () => {
        this.blockUI.stop();
      }
    });
  }

  ObterPacotesMoeda() {
    this.blockUI.start("Carregando pacotes de moeda...");

    this.lojaService.ObterPacotesMoeda().subscribe({
      next: (data) => {
        this.pacotesMoeda = data;
        this.pacotesMoeda = this.pacotesMoeda.map(p => {
          switch (p.quantidade) {
            case 100:
              p.img = 'assets/img/pacote-moedas-pequeno.png';
              break;
            case 500:
              p.img = 'assets/img/pacote-moedas-medio.png';
              break;
            case 1000:
              p.img = 'assets/img/pacote-moedas-grande.png';
              break;
            default:
              p.img = 'assets/img/pacote-moedas-pequeno.png';
              break;
          }

          return p;
        });
      },
      complete: () => {
        this.blockUI.stop();
      }
    });
  }

  ComprarMoedas(pacote: Pacote) {
    this.lojaService.ComprarMoedas(pacote.quantidade).subscribe({
      next: (data) => {
        this.ObterDadosJogador();
      }
    });
  }

  ComprarItemLoja(item: ItemLoja) {
    this.blockUI.start();

    this.lojaService.ComprarItemLoja(item.tipo, item.id, 1).pipe(
      switchMap(() => this.lojaService.ObterItensInventario())
    ).subscribe({
      next: (data) => {

        this.avataresInventario = data.filter(item => item.tipo === TipoItemEnum.avatar);
        this.poderesInventario = data.filter(item => item.tipo === TipoItemEnum.poder);

        this.player1.moeda -= item.preco ?? 0;

        this.ObterItensLoja();
      },
      error: (err) => {
        console.error('Erro ao comprar item:', err);
        this.blockUI.stop();
      },
      complete: () => {
        this.blockUI.stop();
      }
    });
  }

  ObterItensLoja() {
    this.blockUI.start("Carregando itens da loja...");

    this.lojaService.ObterItensLoja().subscribe({
      next: (data) => {
        this.itensCompra = data.sort((a, b) => {
          const tipoCmp = (a.tipo || '').localeCompare(b.tipo || '');
          if (tipoCmp !== 0) return tipoCmp;
          const pa = (a.preco ?? 0);
          const pb = (b.preco ?? 0);
          return pa - pb;
        });

        this.itensCompra = this.itensCompra.filter(item => {
          if (item.tipo === TipoItemEnum.avatar) {
            return !this.avataresInventario.some(av => av.id === item.id);
          }

          return true;
        })
      },
      complete: () => {
        this.blockUI.stop();
      }
    });
  }
}
