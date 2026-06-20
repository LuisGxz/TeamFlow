import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';

interface Feature { icon: string; en: [string, string]; es: [string, string]; }
interface Tier { layer: string; tech: string; }
interface RoleRow { cap: { en: string; es: string }; viewer: boolean; member: boolean; admin: boolean; owner: boolean; }

@Component({
  selector: 'tf-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <!-- Hero -->
      <div class="flex items-center gap-3 mb-4">
        <span class="w-11 h-11 rounded-xl bg-accent-600 grid place-items-center"><lucide-icon name="layers" class="w-6 h-6 text-white"></lucide-icon></span>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">TeamFlow</h1>
          <p class="text-sm text-ink-500 dark:text-ink-400">{{ es() ? 'Gestión de proyectos multi-tenant' : 'Multi-tenant project management' }}</p>
        </div>
      </div>
      <p class="text-base text-ink-600 dark:text-ink-300 leading-relaxed max-w-2xl">
        {{ es()
          ? 'Un Kanban tipo Linear/Height con organizaciones multi-tenant reales: una sola cuenta vive en varios espacios de trabajo, con datos aislados y un rol distinto en cada uno. Construido como pieza de portfolio con auth, RBAC, tests y una capa de demo guiada.'
          : 'A Linear/Height-style Kanban with real multi-tenant organizations: one account spans several workspaces, with isolated data and a distinct role in each. Built as a portfolio piece with auth, RBAC, tests and a guided demo layer.' }}
      </p>

      <!-- Features -->
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-400 mt-10 mb-4">{{ es() ? 'Lo destacado' : 'Highlights' }}</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        @for (f of features; track f.icon) {
          <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-4 flex gap-3">
            <span class="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-600/20 grid place-items-center shrink-0"><lucide-icon [name]="f.icon" class="w-5 h-5 text-accent-600 dark:text-accent-200"></lucide-icon></span>
            <div>
              <h3 class="text-sm font-semibold">{{ es() ? f.es[0] : f.en[0] }}</h3>
              <p class="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-snug">{{ es() ? f.es[1] : f.en[1] }}</p>
            </div>
          </div>
        }
      </div>

      <!-- RBAC matrix -->
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-400 mt-10 mb-4">{{ es() ? 'Permisos por rol' : 'Role permissions' }}</h2>
      <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-ink-200 dark:border-ink-700 text-left">
              <th class="font-semibold px-4 py-2.5">{{ es() ? 'Capacidad' : 'Capability' }}</th>
              <th class="font-semibold px-3 py-2.5 text-center">Viewer</th>
              <th class="font-semibold px-3 py-2.5 text-center">Member</th>
              <th class="font-semibold px-3 py-2.5 text-center">Admin</th>
              <th class="font-semibold px-3 py-2.5 text-center">Owner</th>
            </tr>
          </thead>
          <tbody>
            @for (r of roles; track r.cap.en) {
              <tr class="border-b border-ink-100 dark:border-ink-700/60 last:border-0">
                <td class="px-4 py-2.5">{{ es() ? r.cap.es : r.cap.en }}</td>
                <td class="px-3 py-2.5 text-center">{{ mark(r.viewer) }}</td>
                <td class="px-3 py-2.5 text-center">{{ mark(r.member) }}</td>
                <td class="px-3 py-2.5 text-center">{{ mark(r.admin) }}</td>
                <td class="px-3 py-2.5 text-center">{{ mark(r.owner) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Architecture -->
      <h2 class="text-xs font-semibold uppercase tracking-wide text-ink-400 mt-10 mb-4">{{ es() ? 'Arquitectura' : 'Architecture' }}</h2>
      <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 divide-y divide-ink-100 dark:divide-ink-700">
        @for (t of stack; track t.layer) {
          <div class="flex items-center gap-4 px-4 py-2.5">
            <span class="w-40 shrink-0 text-xs font-semibold text-ink-500">{{ t.layer }}</span>
            <span class="text-sm">{{ t.tech }}</span>
          </div>
        }
      </div>

      <p class="text-[13px] text-ink-500 dark:text-ink-400 mt-6 leading-relaxed">
        {{ es()
          ? 'El aislamiento multi-tenant se garantiza en la capa de datos con un filtro global de EF Core por workspace, resuelto por petición desde la membresía del usuario — imposible de olvidar en cada consulta.'
          : 'Multi-tenant isolation is enforced at the data layer with a global EF Core query filter per workspace, resolved per request from the user’s membership — impossible to forget at any call site.' }}
      </p>

      <div class="mt-8 flex flex-wrap gap-3">
        <a routerLink="/app/boards" class="rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold px-4 py-2 transition-colors">{{ es() ? 'Ir a los tableros' : 'Go to boards' }}</a>
      </div>

      <p class="text-[11px] text-ink-400 font-mono mt-10">TeamFlow · Luis Chiquito Vera · {{ es() ? 'demo de portfolio' : 'portfolio demo' }}</p>
    </div>
  `,
})
export class AboutComponent {
  private readonly i18n = inject(I18nService);
  readonly es = () => this.i18n.lang() === 'es';

  mark(v: boolean): string {
    return v ? '✓' : '—';
  }

  readonly features: Feature[] = [
    { icon: 'users', en: ['Multi-tenant workspaces', 'One account, many isolated workspaces — switch instantly.'], es: ['Espacios multi-tenant', 'Una cuenta, varios espacios aislados — cambia al instante.'] },
    { icon: 'lock', en: ['RBAC, 4 roles', 'Owner / Admin / Member / Viewer enforced front & back.'], es: ['RBAC, 4 roles', 'Owner / Admin / Member / Viewer aplicado en front y back.'] },
    { icon: 'layout-grid', en: ['Kanban drag & drop', 'Move cards across columns with auto-complete on done.'], es: ['Kanban drag & drop', 'Mueve tarjetas entre columnas con auto-completado en Done.'] },
    { icon: 'message-square', en: ['Card detail & comments', 'Priority, assignee, due date, labels and a comment thread.'], es: ['Detalle y comentarios', 'Prioridad, responsable, fecha, etiquetas e hilo de comentarios.'] },
    { icon: 'mail', en: ['Invitations', 'Invite teammates by email with hashed, expiring tokens.'], es: ['Invitaciones', 'Invita por email con tokens hasheados y con caducidad.'] },
    { icon: 'activity', en: ['Activity feed', 'Every move, edit and comment is recorded per workspace.'], es: ['Feed de actividad', 'Cada movimiento, edición y comentario queda registrado.'] },
    { icon: 'moon', en: ['First-class dark mode', 'Light & dark themes, plus EN/ES throughout.'], es: ['Modo oscuro de 1ª clase', 'Temas claro y oscuro, además de EN/ES en toda la app.'] },
    { icon: 'activity', en: ['Guided demo', 'A coach-mark tour and an explore panel that teach by role.'], es: ['Demo guiada', 'Tour de coach-marks y panel que enseñan según tu rol.'] },
  ];

  readonly roles: RoleRow[] = [
    { cap: { en: 'View boards, cards & comments', es: 'Ver tableros, tarjetas y comentarios' }, viewer: true, member: true, admin: true, owner: true },
    { cap: { en: 'Create / edit / move cards, comment', es: 'Crear / editar / mover tarjetas, comentar' }, viewer: false, member: true, admin: true, owner: true },
    { cap: { en: 'Manage boards, columns & labels', es: 'Gestionar tableros, columnas y etiquetas' }, viewer: false, member: false, admin: true, owner: true },
    { cap: { en: 'Invite & manage members', es: 'Invitar y gestionar miembros' }, viewer: false, member: false, admin: true, owner: true },
    { cap: { en: 'Manage admins & ownership', es: 'Gestionar admins y propiedad' }, viewer: false, member: false, admin: false, owner: true },
  ];

  readonly stack: Tier[] = [
    { layer: 'Frontend', tech: 'Angular 20 (standalone + signals), Tailwind v4, Angular CDK' },
    { layer: 'Backend', tech: '.NET 9 Web API, Clean Architecture, FluentValidation' },
    { layer: 'Database', tech: 'SQL Server 2022 + EF Core 9 (global tenant query filter)' },
    { layer: 'Auth', tech: 'JWT access + rotating refresh, lockout, per-workspace RBAC' },
    { layer: 'Testing', tech: '34 backend unit tests (xUnit) + Playwright E2E' },
  ];
}
