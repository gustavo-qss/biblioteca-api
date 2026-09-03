# AGENTS.md

## Commands
- **Dev Server**: `npm run dev` (port 3000, configurable via `PORTA` env var).
- **Run Tests**: `npm test`
- **Run Single Test**: `node --test verificacoes/livros.spec.js`

## Architecture & Conventions
- **Zero Dependencies**: Pure Node.js ESM (`"type": "module"`, Node >= 20). Do not install external libraries (no Express, Jest, etc.). Use Node.js built-in modules (`node:http`, `node:test`, `node:assert`).
- **In-Memory Storage**: Data resides in memory and resets on server restart. Test suite uses `reiniciar()` in `beforeEach` to clear state.
- **Directory Structure**:
  - `src/servidor.js`: Server entrypoint and native HTTP request routing.
  - `src/rotas/`: URL pattern definitions and router mappings.
  - `src/controladores/`: HTTP request/response controllers.
  - `src/servicos/`: Business logic and validation.
  - `src/repositorios/`: In-memory data store.
  - `verificacoes/`: Built-in Node test runner specs (`*.spec.js`).
