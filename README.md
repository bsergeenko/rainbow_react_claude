# Rainbow.design – Frontend (React)

Frontend für den Shop Rainbow.design auf Basis von React und Vite.
Die Anforderungen sind in `requirements.md` beschrieben.

## Voraussetzungen

- Node.js (aktuelle LTS-Version)
- Laufendes Backend unter `http://localhost:3000`

## Starten

```bash
npm install
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:5173` erreichbar.
Bitte `localhost` (nicht `127.0.0.1`) verwenden, damit die Session-Cookies des Backends mitgesendet werden.

## Weitere Befehle

| Befehl            | Beschreibung                   |
| ----------------- | ------------------------------ |
| `npm run build`   | Produktions-Build nach `dist/` |
| `npm run preview` | Vorschau des Produktions-Builds |
| `npm run lint`    | Statische Codeprüfung (ESLint) |

Die Backend-Adresse ist standardmäßig `http://localhost:3000` (`.env`, Variable `VITE_API_BASE`).

## Struktur

- `src/pages` – Seiten der Shop-Oberfläche
- `src/admin` – eigenständiger Adminbereich (`/admin`)
- `src/components` – wiederverwendbare Komponenten
- `src/context` – Login-Status, Warenkorb, Wunschliste, Statusmeldungen
- `src/api.js` – Zugriff auf die REST-API (mit `credentials: "include"`)
- `src/labels.js` – deutsche Bezeichnungen und Formatierung
