
# PornoRetro.it - Self-Hosted Sprint Retrospectives

Una webapp per retrospettive sprint completamente indipendente, senza dipendenze esterne.

## Caratteristiche

- Database SQLite locale (nessun servizio esterno)
- Server Node.js integrato
- Real-time con Socket.io
- Completamente self-hosted
- Zero dipendenze di terze parti

## Deployment

### Opzione 1: Docker (Raccomandato)

1. Costruisci il frontend:
```bash
npm install
npm run build
```

2. Avvia con Docker Compose:
```bash
docker-compose up -d
```

L'applicazione sarà disponibile su http://localhost

### Opzione 2: Deployment Manuale

1. Installa le dipendenze:
```bash
npm install
```

2. Costruisci il frontend:
```bash
npm run build
```

3. Avvia il server:
```bash
npm start
```

L'applicazione sarà disponibile su http://localhost:3001

### Opzione 3: Sviluppo

Per il development con hot reload:

```bash
npm install
npm run dev
```

Questo avvierà sia il frontend (porta 5173) che il backend (porta 3001).

## Configurazione

### Variabili d'ambiente

- `PORT`: Porta del server (default: 3001)
- `NODE_ENV`: Ambiente (development/production)

### Database

Il database SQLite viene creato automaticamente in `server/retrodb.sqlite`.
Per backup, è sufficiente copiare questo file.

## Struttura

```
├── server/           # Backend Node.js + SQLite
├── src/              # Frontend React
├── dist/             # Build del frontend
├── Dockerfile        # Configurazione Docker
├── docker-compose.yml # Orchestrazione Docker
└── nginx.conf        # Configurazione proxy (opzionale)
```

## API Endpoints

- `GET /api/retro/:id` - Ottieni dati retrospettiva
- `POST /api/retro` - Crea retrospettiva
- `GET /api/retro/:id/cards` - Ottieni cards
- `POST /api/retro/:id/cards` - Aggiungi card
- `POST /api/cards/:id/vote` - Vota card
- `GET /api/retro/:id/actions` - Ottieni azioni
- `POST /api/retro/:id/actions` - Crea azione

## Real-time

Il sistema usa Socket.io per aggiornamenti real-time:
- Nuove cards
- Voti
- Commenti
- Azioni

## Backup

Per fare backup del sistema:
1. Ferma il container: `docker-compose down`
2. Copia `./data/retrodb.sqlite`
3. Riavvia: `docker-compose up -d`

## Sicurezza

Per deployment in produzione:
- Usa HTTPS (configura SSL in nginx)
- Implementa autenticazione se necessario
- Configura firewall appropriato
- Fai backup regolari del database
