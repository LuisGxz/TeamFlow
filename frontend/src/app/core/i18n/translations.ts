export type Lang = 'en' | 'es';

/** Flat key → { en, es } dictionary. Keep keys namespaced by feature (e.g. "auth.signIn"). */
export const TRANSLATIONS: Record<string, { en: string; es: string }> = {
  // Common
  'common.appName': { en: 'TeamFlow', es: 'TeamFlow' },
  'common.email': { en: 'Email', es: 'Correo' },
  'common.password': { en: 'Password', es: 'Contraseña' },
  'common.cancel': { en: 'Cancel', es: 'Cancelar' },
  'common.save': { en: 'Save', es: 'Guardar' },
  'common.create': { en: 'Create', es: 'Crear' },
  'common.delete': { en: 'Delete', es: 'Eliminar' },
  'common.loading': { en: 'Loading…', es: 'Cargando…' },
  'common.retry': { en: 'Retry', es: 'Reintentar' },
  'common.search': { en: 'Search', es: 'Buscar' },
  'common.optional': { en: 'optional', es: 'opcional' },

  // Auth
  'auth.signIn': { en: 'Sign in', es: 'Iniciar sesión' },
  'auth.signUp': { en: 'Sign up', es: 'Crear cuenta' },
  'auth.signOut': { en: 'Sign out', es: 'Cerrar sesión' },
  'auth.welcomeBack': { en: 'Welcome back', es: 'Bienvenido de nuevo' },
  'auth.signInSubtitle': { en: 'Sign in to your workspaces.', es: 'Entra a tus espacios de trabajo.' },
  'auth.createAccount': { en: 'Create your account', es: 'Crea tu cuenta' },
  'auth.signUpSubtitle': { en: 'Start a workspace in seconds.', es: 'Crea un espacio en segundos.' },
  'auth.displayName': { en: 'Your name', es: 'Tu nombre' },
  'auth.workspaceName': { en: 'Workspace name', es: 'Nombre del espacio' },
  'auth.noAccount': { en: "Don't have an account?", es: '¿No tienes cuenta?' },
  'auth.haveAccount': { en: 'Already have an account?', es: '¿Ya tienes cuenta?' },
  'auth.demoAccounts': { en: 'Demo accounts', es: 'Cuentas demo' },
  'auth.demoHint': {
    en: 'Click a role to autofill. Each shows a different permission level.',
    es: 'Haz clic en un rol para autocompletar. Cada uno muestra un nivel de permisos distinto.',
  },
  'auth.signingIn': { en: 'Signing in…', es: 'Entrando…' },
  'auth.creatingAccount': { en: 'Creating account…', es: 'Creando cuenta…' },

  // Shell
  'shell.switchWorkspace': { en: 'Switch workspace', es: 'Cambiar espacio' },
  'shell.noWorkspaces': { en: 'No workspaces yet', es: 'Aún no hay espacios' },
  'shell.boards': { en: 'Boards', es: 'Tableros' },
  'shell.members': { en: 'Members', es: 'Miembros' },
  'shell.activity': { en: 'Activity', es: 'Actividad' },
  'shell.theme': { en: 'Theme', es: 'Tema' },
  'shell.language': { en: 'Language', es: 'Idioma' },
  'shell.yourRole': { en: 'Your role', es: 'Tu rol' },

  // Boards
  'boards.title': { en: 'Boards', es: 'Tableros' },
  'boards.subtitle': { en: 'Kanban boards in this workspace.', es: 'Tableros Kanban de este espacio.' },
  'boards.new': { en: 'New board', es: 'Nuevo tablero' },
  'boards.empty': { en: 'No boards yet', es: 'Aún no hay tableros' },
  'boards.emptyHint': {
    en: 'Create your first board to start tracking work.',
    es: 'Crea tu primer tablero para empezar a organizar el trabajo.',
  },
  'boards.cards': { en: 'cards', es: 'tarjetas' },
  'boards.open': { en: 'Open', es: 'Abrir' },

  // Board / Kanban
  'board.boardView': { en: 'Board', es: 'Tablero' },
  'board.listView': { en: 'List', es: 'Lista' },
  'board.newCard': { en: 'New card', es: 'Nueva tarjeta' },
  'board.addCard': { en: 'Add card', es: 'Añadir tarjeta' },
  'board.cardTitlePlaceholder': { en: 'Card title…', es: 'Título de la tarjeta…' },
  'board.emptyColumn': { en: 'No cards', es: 'Sin tarjetas' },
  'board.back': { en: 'Boards', es: 'Tableros' },
  'board.notFound': { en: 'Board not found', es: 'Tablero no encontrado' },
  'board.cardsCount': { en: 'cards', es: 'tarjetas' },
  'board.done': { en: 'Done', es: 'Hecho' },

  // Card panel
  'card.status': { en: 'Status', es: 'Estado' },
  'card.priority': { en: 'Priority', es: 'Prioridad' },
  'card.assignee': { en: 'Assignee', es: 'Responsable' },
  'card.dueDate': { en: 'Due date', es: 'Fecha límite' },
  'card.labels': { en: 'Labels', es: 'Etiquetas' },
  'card.description': { en: 'Description', es: 'Descripción' },
  'card.noDescription': { en: 'No description', es: 'Sin descripción' },
  'card.activity': { en: 'Activity', es: 'Actividad' },
  'card.comments': { en: 'Comments', es: 'Comentarios' },
  'card.addComment': { en: 'Leave a comment…', es: 'Escribe un comentario…' },
  'card.noComments': { en: 'No comments yet', es: 'Aún no hay comentarios' },
  'card.unassigned': { en: 'Unassigned', es: 'Sin asignar' },
  'card.none': { en: 'None', es: 'Ninguna' },
  'card.noDate': { en: 'No date', es: 'Sin fecha' },
  'card.delete': { en: 'Delete card', es: 'Eliminar tarjeta' },
  'card.deleteConfirm': { en: 'Delete this card? This cannot be undone.', es: '¿Eliminar esta tarjeta? No se puede deshacer.' },
  'card.send': { en: 'Comment', es: 'Comentar' },
  'card.readOnly': { en: 'Read-only — your role can view but not edit.', es: 'Solo lectura — tu rol puede ver pero no editar.' },

  // Priority labels
  'priority.None': { en: 'No priority', es: 'Sin prioridad' },
  'priority.Low': { en: 'Low', es: 'Baja' },
  'priority.Medium': { en: 'Medium', es: 'Media' },
  'priority.High': { en: 'High', es: 'Alta' },
  'priority.Urgent': { en: 'Urgent', es: 'Urgente' },

  // Demo layer
  'demo.help': { en: 'How to explore', es: 'Cómo explorar' },
  'demo.intro': {
    en: 'TeamFlow is a portfolio demo: a multi-tenant Kanban with real auth, roles and data. Here’s how to get the most out of it.',
    es: 'TeamFlow es una demo de portfolio: un Kanban multi-tenant con auth, roles y datos reales. Así le sacas el máximo.',
  },
  'demo.startTour': { en: 'Start guided tour', es: 'Iniciar tour guiado' },
  'demo.skip': { en: 'Skip', es: 'Saltar' },
  'demo.next': { en: 'Next', es: 'Siguiente' },
  'demo.back': { en: 'Back', es: 'Atrás' },
  'demo.finish': { en: 'Got it', es: 'Entendido' },
  'demo.signedInAs': { en: 'Signed in as', es: 'Sesión como' },
  'demo.tryAnother': {
    en: 'Sign out and sign in as another role to see permissions change live.',
    es: 'Cierra sesión y entra con otro rol para ver los permisos cambiar en vivo.',
  },
  'demo.capabilities': { en: 'What your role can do', es: 'Lo que tu rol puede hacer' },
  'demo.demoAccounts': { en: 'Demo accounts', es: 'Cuentas demo' },
  'demo.shortcuts': { en: 'Keyboard shortcuts', es: 'Atajos de teclado' },
  'demo.multiTenantTip': {
    en: 'The Owner account belongs to two workspaces — use the switcher to feel the isolation.',
    es: 'La cuenta Owner pertenece a dos espacios — usa el selector para sentir el aislamiento.',
  },
  'demo.readOnly': { en: 'Read-only role', es: 'Rol de solo lectura' },

  // Capabilities
  'cap.viewBoards': { en: 'View boards, cards & comments', es: 'Ver tableros, tarjetas y comentarios' },
  'cap.editCards': { en: 'Create, edit, move cards & comment', es: 'Crear, editar, mover tarjetas y comentar' },
  'cap.manageBoards': { en: 'Manage boards, columns & labels', es: 'Gestionar tableros, columnas y etiquetas' },
  'cap.manageMembers': { en: 'Invite & manage members', es: 'Invitar y gestionar miembros' },
  'cap.owner': { en: 'Transfer ownership & manage admins', es: 'Transferir propiedad y gestionar admins' },

  // Roles
  'role.Viewer': { en: 'Viewer', es: 'Lector' },
  'role.Member': { en: 'Member', es: 'Miembro' },
  'role.Admin': { en: 'Admin', es: 'Administrador' },
  'role.Owner': { en: 'Owner', es: 'Propietario' },

  // Errors
  'error.generic': { en: 'Something went wrong.', es: 'Algo salió mal.' },
  'error.network': { en: 'Cannot reach the server.', es: 'No se puede conectar con el servidor.' },
  'error.invalid_credentials': { en: 'Invalid email or password.', es: 'Correo o contraseña inválidos.' },
  'error.locked_out': { en: 'Account locked. Try again later.', es: 'Cuenta bloqueada. Inténtalo más tarde.' },
  'error.email_taken': { en: 'That email is already registered.', es: 'Ese correo ya está registrado.' },
};
