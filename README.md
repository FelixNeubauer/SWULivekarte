# SWU Live-Fahrzeuge

Die Anwendung benötigt keine Installation. Der Liniennetzplan ist als Base64-Daten direkt in `index.html` eingebettet, damit Pull Requests keine separate Binärdatei enthalten. Dauerhaft korrigierte Steigpositionen stehen als Text in `stoppoint-positionen.js`.

## Starten

`index.html` per Doppelklick im Browser öffnen. `index.html` und `stoppoint-positionen.js` müssen im selben Ordner liegen. Die Seite fragt die öffentliche SWU-Mobility-API direkt ab. Die Liste der aktiven Fahrten wird alle 60 Sekunden aktualisiert, die Detaildaten aktiver Fahrten alle 10 Sekunden.

Die Antwort wird entsprechend dem SWU-Format aus `VehicleTrip.TripData` gelesen. Angezeigt werden ausschließlich Einträge mit `IsActive: true`; Fahrzeugnummer, Linie und Fahrtziel stammen aus `VehicleNumber`, `JourneyData.RouteName` und `JourneyData.DepartureDirectionText` (`RouteNumber` bleibt ein Fallback, falls kein Routenname geliefert wird).

Für jedes aktive Fahrzeug wird alle 10 Sekunden `Passage?VehicleNumber=…&Range=upcoming` geladen. Als nächste Haltestelle gilt die Passage mit der frühesten gültigen `DepartureTimeActual`, die nicht vor der aktuellen Uhrzeit liegt.

Über den Reiter **Haltestellenkarte** steht der offizielle SWU-Liniennetzplan als schematische Karte bereit. Die vollständige Steigliste wird aus `stoppoint/attributes/BaseData` beziehungsweise `StopPointAttributes.StopPointData` geladen. Für 82 im Plan sichtbare Haltestellen sind prozentuale Ausgangspositionen hinterlegt. Beim Überfahren eines Rings erscheint der vollständige Steigname. Jeder Ring kann mit Maus oder Touch direkt an die passende Stelle gezogen werden. Mit **Positionen speichern** wird anschließend eine neue `stoppoint-positionen.js` geschrieben beziehungsweise heruntergeladen; diese Datei muss die gleichnamige Datei im Repository ersetzen. Beim nächsten Öffnen werden die dort hinterlegten Koordinaten automatisch verwendet. Es wird kein `localStorage` eingesetzt. Nicht im Plan hinterlegte Haltestellen beginnen an einer Sammelposition am rechten Rand und lassen sich von dort einzeln einsortieren. Sobald mindestens ein Fahrzeug einen Steig als nächste Passage meldet, wird der Ring als leuchtender Punkt ausgefüllt. Weil `StopPointCode` in BaseData und Passage unterschiedlich formatiert sein kann, erfolgt die Zuordnung über `ParentStop.StopNumber`/`StopNumber` zusammen mit `PlatformName`. Die Zahl im Lichtpunkt zeigt, wie viele Fahrzeuge denselben Steig als nächstes anfahren; ein Klick zeigt für jedes Fahrzeug Linie, Fahrzeugnummer und Fahrtziel sowie den ausgewählten Steig.

> **Hinweis:** Direkte Browser-Abfragen funktionieren nur, wenn die SWU-API Cross-Origin-Zugriffe erlaubt. Falls der Browser eine CORS-Fehlermeldung zeigt, kann eine lokale HTML-Datei diese Sicherheitssperre technisch nicht umgehen; dann muss die Datei über einen kleinen Webserver/Proxy bereitgestellt werden.
