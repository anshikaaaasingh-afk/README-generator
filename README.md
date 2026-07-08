# Docket

*a README, drafted properly*

A small Flask app with a live-rendering frontend for generating polished, GitHub-ready README.md files. Fill in a form on the left; get styled Markdown on the right, ready to copy or download.

## Tech Stack
- Python (Flask)
- HTML / CSS / JavaScript
- marked.js (client-side Markdown rendering)

## Features
- Live preview that renders as you type (debounced calls to `/generate`)
- Dynamic tech stack & feature lists (add/remove rows)
- Shields.io badges, table of contents, and license section, all toggleable
- One-click copy to clipboard and README.md download

## Installation
```bash
git clone <your-repo-url>
cd readme-generator
python -m venv venv
source venv/bin/activate   # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Usage
```bash
python app.py
```
Then open `http://127.0.0.1:5000` in your browser.

## Deployment (Render)
1. Push this project to a GitHub repo.
2. On Render: New → Web Service → connect the repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Deploy — Render gives you a live URL.

## License
MIT
# README-generator
