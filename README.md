# QuestGame

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.2.

teste

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Migração de Páginas Estáticas
As páginas originais em `inicio/teste` foram migradas para componentes Angular:

- Login -> `src/app/routes/login`
- Cadastro -> `src/app/routes/register`
- Lobby -> `src/app/routes/lobby`

Rotas configuradas em `app-routing.module.ts`:

| Caminho | Componente |
|---------|------------|
| `/` (redirect) | `/login` |
| `/login` | LoginComponent |
| `/register` | RegisterComponent |
| `/lobby` | LobbyComponent |

Imagens expostas via build em `assets/quest/` (configuração adicionada em `angular.json`).

## Scripts Temporários
Algumas funcionalidades (login, cadastro, criação de sala) ainda são simulações (alerts) aguardando integração real.

## Instalação
Devido a incompatibilidades de peer dependencies (Tailwind v4), usar:
```
npm install --legacy-peer-deps
```

## Próximos Passos Sugeridos
- Implementar serviço de autenticação real.
- Refatorar animações de background em diretiva ou serviço.
- Criar módulo dedicado para páginas (se crescimento continuar).
- Adicionar testes para relógio / frases motivacionais.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
