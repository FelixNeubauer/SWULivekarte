# SWU Live-Fahrzeuge

Die Anwendung besteht aus einer einzigen Datei und benötigt keine Installation. Auch der Liniennetzplan ist als Base64-Daten direkt in `index.html` eingebettet, damit Pull Requests keine separate Binärdatei enthalten.

## Starten

`index.html` per Doppelklick im Browser öffnen. Die Seite fragt die öffentliche SWU-Mobility-API direkt ab. Die Liste der aktiven Fahrten wird alle 60 Sekunden aktualisiert, die Detaildaten aktiver Fahrten alle 10 Sekunden.

Die Antwort wird entsprechend dem SWU-Format aus `VehicleTrip.TripData` gelesen. Angezeigt werden ausschließlich Einträge mit `IsActive: true`; Fahrzeugnummer, Linie und Fahrtziel stammen aus `VehicleNumber`, `JourneyData.RouteName` und `JourneyData.DepartureDirectionText` (`RouteNumber` bleibt ein Fallback, falls kein Routenname geliefert wird).

Für jedes aktive Fahrzeug wird alle 10 Sekunden `Passage?VehicleNumber=…&Range=upcoming` geladen. Als nächste Haltestelle gilt die Passage mit der frühesten gültigen `DepartureTimeActual`, die nicht vor der aktuellen Uhrzeit liegt.

Über den Reiter **Haltestellenkarte** steht der offizielle SWU-Liniennetzplan als schematische Karte bereit. Die vollständige Steigliste wird aus `stoppoint/attributes/BaseData` beziehungsweise `StopPointAttributes.StopPointData` geladen. Jeder bekannte Steig erscheint ohne Beschriftung als leerer Ring; die Steige einer Haltestelle werden leicht um deren manuell hinterlegte Planposition verteilt. Nicht im Plan hinterlegte Haltestellen teilen sich eine Sammelposition am rechten Rand. Sobald mindestens ein Fahrzeug einen Steig als nächste Passage meldet, wird der Ring als leuchtender Punkt ausgefüllt. Weil `StopPointCode` in BaseData und Passage unterschiedlich formatiert sein kann, erfolgt die Zuordnung über `ParentStop.StopNumber`/`StopNumber` zusammen mit `PlatformName`. Die Zahl im Lichtpunkt zeigt, wie viele Fahrzeuge denselben Steig als nächstes anfahren; ein Klick zeigt Linie und Fahrzeugnummer.

> **Hinweis:** Direkte Browser-Abfragen funktionieren nur, wenn die SWU-API Cross-Origin-Zugriffe erlaubt. Falls der Browser eine CORS-Fehlermeldung zeigt, kann eine lokale HTML-Datei diese Sicherheitssperre technisch nicht umgehen; dann muss die Datei über einen kleinen Webserver/Proxy bereitgestellt werden.
