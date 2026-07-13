# MyEye – Kamera og billedplatform

MyEye er en responsiv webapp til kamera, billeder, video, galleri, album, steder, favoritter og sikker deling.

**Udviklet af Mohammed Warrad**  
**© 2026 MW Groupe**

## Funktioner

- Kamera via browserens kameraadgang
- Upload af billeder og videoer
- Lokalt galleri
- Favoritter
- Album
- Steder og kortvisning
- Delingsside
- Indstillinger
- Mobilnavigation
- Lokal browserlagring
- PWA-installation
- Offline-cache

## Upload til GitHub

Upload hele indholdet af denne mappe direkte til roden af repositoryet:

```text
myeye/
├── assets/
│   ├── app.css
│   └── app.js
├── data/
│   └── datamodel.json
├── index.html
├── manifest.webmanifest
├── service-worker.js
└── README.md
```

`index.html` skal ligge direkte i repositoryets rod.

## GitHub Pages

1. Åbn **Indstillinger**
2. Vælg **Pages**
3. Vælg **Deploy from a branch**
4. Vælg grenen **main**
5. Vælg mappen **/(root)**
6. Gem

Forventet adresse:

```text
https://mohammedwarrad.github.io/myeye/
```

## Kameraadgang

Kameraet kræver HTTPS eller localhost. GitHub Pages bruger HTTPS.

## Lokal afprøvning

Kør i projektmappen:

```bash
python -m http.server 8080
```

Åbn derefter:

```text
http://localhost:8080
```
