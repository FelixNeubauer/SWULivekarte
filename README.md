# SWU Live-Fahrzeuge

Die Anwendung besteht aus einer einzigen Datei und benötigt keine Installation.

## Starten

`index.html` per Doppelklick im Browser öffnen. Die Seite fragt die öffentliche SWU-Mobility-API direkt ab. Die Liste der aktiven Fahrten wird alle 60 Sekunden aktualisiert, die Detaildaten aktiver Fahrten alle 10 Sekunden.

> **Hinweis:** Direkte Browser-Abfragen funktionieren nur, wenn die SWU-API Cross-Origin-Zugriffe erlaubt. Falls der Browser eine CORS-Fehlermeldung zeigt, kann eine lokale HTML-Datei diese Sicherheitssperre technisch nicht umgehen; dann muss die Datei über einen kleinen Webserver/Proxy bereitgestellt werden.
