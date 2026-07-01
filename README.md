# Reliability Engineering Portfolio

Static site — no build step required. Files:

- `index.html` — page structure and content
- `style.css` — design system (dark HMI-inspired theme)
- `script.js` — career uptime counter + MTBF/MTTR and Weibull calculators

## Publish with GitHub Pages

1. Push these three files to the root of your repository (or into a `/docs` folder if you prefer).
2. In your GitHub repo: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the branch (usually `main`) and the folder (`/root` or `/docs`, matching where you put the files).
5. Save. GitHub gives you a URL like `https://<your-username>.github.io/<repo-name>/` — it usually goes live within a minute or two.

## Before publishing, personalize

- In `index.html`, update the LinkedIn and email links in the **Contact** section (currently placeholders).
- Double-check the career start date used for the uptime counter in `script.js` (`CAREER_START`) — currently set to `1999-01-01`.
- Swap in real project links/screenshots for the showcase cards if you want them to link out anywhere.

## Local preview

No server needed — just open `index.html` directly in a browser. If you want live-reload while editing, any static server works, e.g.:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
