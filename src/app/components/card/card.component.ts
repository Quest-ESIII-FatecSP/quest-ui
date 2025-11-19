import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() value!: number | string;
  @Input() selected = false;
  @Input() disabled = false;

  @Output() pick = new EventEmitter<number | string>();

  onClick() {
    if (this.disabled) return;
    this.pick.emit(this.value);
  }

  onKey(e: KeyboardEvent) {
    if (this.disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.pick.emit(this.value);
    }
  }
}
