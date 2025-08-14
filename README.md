# Pakistan Property Map (React + Leaflet)

## Run locally
1) Extract the zip
2) In the folder, run:
   ```bash
   npm install
   npm run dev
   ```
3) Open the printed local URL (default http://localhost:5173).

## Diagnostics tests
Run pure functional tests for filtering logic:
```bash
npm run test:diag
```

## Notes
- No path aliases or shadcn components are used.
- Leaflet marker icons are fixed via CDN URLs.
- Two ad slots are included (bottom banner + right skyscraper). Paste your AdSense snippet into those containers.
