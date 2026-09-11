# SWU Livekarte

Eine statische Live-Ansicht der aktuell von der öffentlichen SWU-Mobility-API gemeldeten Fahrzeuge.

## Starten

```bash
npm start
```

Danach `http://localhost:4173` öffnen. Die Liste der aktiven Fahrten wird alle 60 Sekunden über `https://api.swu.de/mobility/v1/vehicle/trip/Trip` geladen. Für jede aktive Fahrt fragt die Anwendung alle 10 Sekunden deren Detail-URL ab. Liefert die Listenantwort einen `self`-/`detailUrl`-Link, wird dieser verwendet; andernfalls wird die Fahrt-ID an den Listen-Endpunkt angehängt.

Der mitgelieferte Node-Webserver leitet `/api/trips` serverseitig an die SWU weiter. Dadurch ist die Ansicht nicht von der CORS-Konfiguration der SWU-API abhängig. Die HTML-Datei daher nicht direkt als `file://` öffnen, sondern immer mit `npm start` starten.

## Tests

```bash
npm test
```
