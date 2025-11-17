import { Component } from '@angular/core';
import { AudioService } from './services/audio.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'quest-game';
  constructor(private audio: AudioService) {
    // ensure AudioService is instantiated so it can react to route changes
  }
}
