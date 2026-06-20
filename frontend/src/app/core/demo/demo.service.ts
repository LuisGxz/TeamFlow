import { Injectable, signal } from '@angular/core';

export interface TourStep {
  /** CSS selector of the element to spotlight; null for a centered, target-less step. */
  target: string | null;
  title: { en: string; es: string };
  body: { en: string; es: string };
  placement?: 'bottom' | 'top' | 'right' | 'left';
}

const SEEN_KEY = 'tf-tour-seen';

/** Coordinates the guided-demo layer: the "How to explore" panel and the coach-mark tour. */
@Injectable({ providedIn: 'root' })
export class DemoService {
  readonly helpOpen = signal(false);
  readonly tourActive = signal(false);
  readonly stepIndex = signal(0);

  readonly steps: TourStep[] = [
    {
      target: null,
      title: { en: 'Welcome to TeamFlow', es: 'Bienvenido a TeamFlow' },
      body: {
        en: 'A live, multi-tenant project tool. Everything here is real — backed by an API and database. Take the 30-second tour.',
        es: 'Una herramienta de proyectos multi-tenant en vivo. Todo es real — con API y base de datos. Haz el tour de 30 segundos.',
      },
    },
    {
      target: '[data-tour="workspace"]',
      title: { en: 'Switch workspaces', es: 'Cambia de espacio' },
      body: {
        en: 'Each account belongs to several workspaces (tenants). Data is fully isolated per workspace — and your role can differ in each.',
        es: 'Cada cuenta pertenece a varios espacios (tenants). Los datos están aislados por espacio — y tu rol puede cambiar en cada uno.',
      },
      placement: 'bottom',
    },
    {
      target: '[data-tour="user"]',
      title: { en: 'Your role decides what you can do', es: 'Tu rol decide lo que puedes hacer' },
      body: {
        en: 'Owner, Admin, Member or Viewer. Open “How to explore” to see exactly what your current role can and can’t do.',
        es: 'Owner, Admin, Member o Viewer. Abre “Cómo explorar” para ver qué puede y qué no puede tu rol actual.',
      },
      placement: 'left',
    },
    {
      target: '[data-tour="boards"]',
      title: { en: 'Open a board', es: 'Abre un tablero' },
      body: {
        en: 'Boards hold a Kanban you can drag, a detail panel, labels, assignees and comments. Switch to the list view too.',
        es: 'Los tableros tienen un Kanban arrastrable, panel de detalle, etiquetas, responsables y comentarios. Prueba también la vista lista.',
      },
      placement: 'right',
    },
    {
      target: '[data-tour="help"]',
      title: { en: 'Explore by role', es: 'Explora por rol' },
      body: {
        en: 'Reopen this guide anytime here. Best part: sign out and sign back in as a different role to feel the permission changes.',
        es: 'Reabre esta guía aquí cuando quieras. Lo mejor: cierra sesión y entra con otro rol para sentir los cambios de permisos.',
      },
      placement: 'bottom',
    },
  ];

  openHelp(): void {
    this.helpOpen.set(true);
  }
  closeHelp(): void {
    this.helpOpen.set(false);
  }

  startTour(): void {
    this.helpOpen.set(false);
    this.stepIndex.set(0);
    this.tourActive.set(true);
  }

  next(): void {
    if (this.stepIndex() >= this.steps.length - 1) {
      this.endTour();
    } else {
      this.stepIndex.update((i) => i + 1);
    }
  }
  prev(): void {
    this.stepIndex.update((i) => Math.max(0, i - 1));
  }

  endTour(): void {
    this.tourActive.set(false);
    this.markSeen();
  }

  /** Auto-start the tour once per browser, the first time the app loads. */
  maybeAutoStart(): void {
    if (!this.hasSeen()) {
      // Defer so the shell has rendered its targets.
      setTimeout(() => this.startTour(), 600);
    }
  }

  hasSeen(): boolean {
    try {
      return localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }
  private markSeen(): void {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }
}
