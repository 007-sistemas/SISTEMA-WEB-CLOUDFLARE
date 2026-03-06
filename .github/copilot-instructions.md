# Idev - Instrucoes para Agentes de IA

## Visao Geral

**Idev** e um sistema web de controle de producao e ponto para cooperativas medicas/hospitalares.

Stack atual:
- Frontend: **React 19 + TypeScript + Vite**
- Backend HTTP: **Cloudflare Pages Functions**
- Banco: **Turso (libSQL)**
- Persistencia local de apoio: **localStorage**
- Biometria: **fluxo desktop externo** (nao ha mais captura biometrica web ativa)

## Arquitetura

### Estrutura de Pastas (resumo)
```
api/           -> handlers HTTP e regras server-side
components/    -> componentes React reutilizaveis (layout e UI)
services/      -> logica de negocio (api, storage, normalizacao, exportacao)
views/         -> telas principais do sistema
public/        -> assets estaticos (favicon, templates, _redirects)
```

### Observacoes importantes de arquitetura
- A pasta `functions/` pode conter adaptadores de runtime e deve ser preservada se estiver no fluxo de deploy do Cloudflare.
- O sistema **nao depende** mais dos SDKs web do DigitalPersona (`es6-shim.js`, `websdk.client.bundle.min.js`, `fingerprint.sdk.min.js`).
- Trechos legados de biometria web foram removidos para evitar ruido de build/deploy.

## Padroes Principais

### 1. Autenticacao e permissoes
- Roles principais: gestores e usuarios de unidades.
- Permissoes centralizadas em `HospitalPermissions` em `types.ts`.
- Fluxo: login -> sessao em storage -> renderizacao condicionada por permissao.

### 2. Camada de dados (StorageService)
Arquivo: `services/storage.ts`

Responsabilidades comuns:
- sessao e autenticacao local
- cache local de entidades
- logs de auditoria
- sincronizacao defensiva com API quando aplicavel

### 3. API client
Arquivo: `services/api.ts`

Padrao:
```ts
apiGet<T>(path: string): Promise<T>
apiPost<T>(path: string, body: unknown): Promise<T>
```

## Fluxos de Negocio Criticos

### Registro e controle de producao
- entradas e saidas sao processadas pelo fluxo atual de tela e backend
- justificativas, aprovacoes e espelho usam os dados persistidos no Turso e/ou cache local

### Dashboard e relatorios
- usam agregacoes sobre dados de cooperados, pontos e justificativas
- graficos com Recharts

## Views Principais (estado atual)

| View | Arquivo | Funcao |
|------|---------|--------|
| Dashboard | `views/Dashboard.tsx` | Visao consolidada |
| Controle de Producao | `views/ControleDeProducao.tsx` | Operacao e acompanhamento |
| Relatorios | `views/Relatorios.tsx` | Filtros e exportacoes |
| Cooperados | `views/CooperadoRegister.tsx` | Cadastro e manutencao |
| Unidades | `views/HospitalRegister.tsx` | Cadastro de unidades |
| Setores | `views/Setores.tsx` | Gestao de setores |
| Solicitacoes | `views/SolicitacoesLiberacao.tsx` | Fluxo de liberacao |
| Turnos e Valores | `views/TurnosValores.tsx` | Regras de turno/valor |
| Perfil | `views/UserProfile.tsx` | Preferencias do usuario |
| Auditoria | `views/AuditLogViewer.tsx` | Historico de acoes |

## Tarefas Comuns

### Adicionar nova view
1. Criar arquivo em `views/`.
2. Registrar no switch de renderizacao em `App.tsx`.
3. Adicionar item de navegacao em `components/Layout.tsx` com `permissionKey`.
4. Incluir/ajustar permissao correspondente em `types.ts`.

### Adicionar endpoint
1. Criar handler em `api/novo-endpoint.ts`.
2. Usar Turso via `@libsql/client` quando necessario.
3. Consumir via `services/api.ts` no frontend.

### Adicionar auditoria
```ts
StorageService.logAudit('TIPO_ACAO', 'Descricao da acao');
```

## Configuracao e Build

### Desenvolvimento local
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Variaveis de ambiente
- `DATABASE_URL` - URL do Turso
- `DATABASE_AUTH_TOKEN` - token do Turso

## Pontos de Atencao

1. **Cloudflare + Turso**: manter handlers e client alinhados com o ambiente atual.
2. **Permissoes**: sempre validar permissao antes de renderizar recursos sensiveis.
3. **TypeScript**: manter tipagem explicita e interfaces em `types.ts`.
4. **Consistencia UI**: manter padroes de layout e cores existentes.

## Convencoes de Codigo

- Nomes em portugues quando fizer sentido de negocio.
- `types.ts` como fonte de verdade para contratos compartilhados.
- `services/` para logica sem JSX.
- `views/` para paginas completas.
- Preferir `export const`.

---

**Ultima atualizacao**: Marco 2026
**Contato**: Gabriel Gomes
**Repositorio**: GitHub/Sistema-Web
