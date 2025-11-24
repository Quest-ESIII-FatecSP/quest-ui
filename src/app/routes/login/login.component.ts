import { Component, HostListener, OnInit } from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {StompService} from "../../services/stomp.service";
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  tempoRestante = 5000
  fraseAtual = '';
  horaAtual = '';

  constructor(private authService: AuthService,
              private router: Router,
              private stompService: StompService) {
  }


  private frases = [
    "Conhecimento é poder!",
    "Cada resposta é um passo rumo à vitória!",
    "Aprender nunca foi tão divertido!",
    "Mostre que você sabe mais!",
    "Desafie-se e vá além!"
  ];

  ngOnInit(): void {
    this.iniciarFrasesMotivacionais();
    this.atualizarRelogio();
    setInterval(() => this.atualizarRelogio(), 1000);
    this.iniciarCanvasAnimado();
  }

  googleSignIn(): void {
    window.location.href = `${environment.apiUrl}/api/auth/oauth2/google`;
  }

  playAsGuest() {
    this.authService.loginAsGuest().subscribe(
      {next: resp => {
          if (resp.isSuccess) {
            localStorage.setItem('userToken', resp.token);
            this.stompService.setUserId(resp.token);
            this.router.navigate(['/lobby']);
          } else {
            alert('Usuário não encontrado, criando conta...');
          }
        }})
  }

  // --- FRASES ---
  iniciarFrasesMotivacionais() {
    this.trocarFrase();
    setInterval(() => this.trocarFrase(), 5000);
  }

  trocarFrase() {
    this.fraseAtual = this.frases[Math.floor(Math.random() * this.frases.length)];
  }

  // --- RELÓGIO ---
  atualizarRelogio() {
    if (this.tempoRestante > 0) {
      this.tempoRestante--;

      const h = String(Math.floor(this.tempoRestante / 3600)).padStart(2, '0');
      const m = String(Math.floor((this.tempoRestante % 3600) / 60)).padStart(2, '0');
      const s = String(this.tempoRestante % 60).padStart(2, '0');

      this.horaAtual = `${h}:${m}:${s}`;
    } else {
      this.horaAtual = "00:00:00";
    }
  }

  // --- CANVAS ANIMADO ---
  iniciarCanvasAnimado() {
    const canvas = document.getElementById('backgroundCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    const iconIds = [
      'icon-artes',
      'icon-ciencia',
      'icon-esportes',
      'icon-mundo',
      'icon-variedades',
      'icon-sociedade'
    ];

    const iconImages = iconIds.map(id => document.getElementById(id) as HTMLImageElement);

    const iconSize = 40;
    const spacing = 20;
    const icons: any[] = [];
    const speed = 0.2;

    const initIcons = () => {
      const cols = Math.ceil(canvas.width / (iconSize + spacing));
      const rows = Math.ceil(canvas.height / (iconSize + spacing));

      icons.length = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const iconIndex = (row + col) % iconImages.length;
          icons.push({
            img: iconImages[iconIndex],
            x: col * (iconSize + spacing) + spacing / 2,
            y: row * (iconSize + spacing) + spacing / 2
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      icons.forEach(icon => {
        icon.x += speed;
        if (icon.x > canvas.width) icon.x = -iconSize;

        try {
          ctx.drawImage(icon.img, icon.x, icon.y, iconSize, iconSize);
        } catch (_) {}
      });

      requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initIcons();
      animate();
    };

    Promise.all(iconImages.map(img =>
      new Promise(resolve => {
        if (img.complete) resolve(null);
        else {
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null);
        }
      })
    )).then(startAnimation);
  }

  @HostListener('window:resize')
  onResize() {
    this.iniciarCanvasAnimado();
  }
}
