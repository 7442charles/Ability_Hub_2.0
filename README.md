# Talanta Hub (prototype)
Static site: HTML + Tailwind (CDN) + vanilla JS. JSON files in `data/` simulate the backend; bookings, cart and registrations persist in the browser's localStorage.

## Run locally
Use any static server (fetch() needs http): `python3 -m http.server` then open http://localhost:8000

## GitHub Pages
Push this folder to a repo, then Settings > Pages > Deploy from branch > `main` / root.

## Photos
Add portraits to `images/` using the filenames in `data/talents.json` (wanjiru.jpg, otieno.jpg ...). Missing photos fall back to initials.
