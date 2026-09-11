# SWU Livekarte

Eine statische Live-Ansicht der aktuell von der öffentlichen SWU-Mobility-API gemeldeten Fahrzeuge.

## Starten

```bash
npm start
```

Danach `http://localhost:4173` öffnen. Die Liste der aktiven Fahrten wird alle 60 Sekunden über `https://api.swu.de/mobility/v1/vehicle/trip/Trip` geladen. Für jede aktive Fahrt fragt die Anwendung alle 10 Sekunden deren Detail-URL ab. Liefert die Listenantwort einen `self`-/`detailUrl`-Link, wird dieser verwendet; andernfalls wird die Fahrt-ID an den Listen-Endpunkt angehängt.

Da der Browser die API direkt abruft, muss `api.swu.de` Cross-Origin-Anfragen vom Ursprung der Seite erlauben. Bei einer lokalen Datei (`file://`) sollte stattdessen immer der oben genannte Webserver verwendet werden.

## Tests

```bash
npm test
```
