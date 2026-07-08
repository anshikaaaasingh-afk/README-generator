from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

LICENSE_MAP = {
    "mit": ("MIT", "https://opensource.org/licenses/MIT"),
    "apache-2.0": ("Apache 2.0", "https://opensource.org/licenses/Apache-2.0"),
    "gpl-3.0": ("GPL v3.0", "https://www.gnu.org/licenses/gpl-3.0.en.html"),
    "bsd-3-clause": ("BSD 3-Clause", "https://opensource.org/licenses/BSD-3-Clause"),
    "unlicense": ("Unlicense", "https://unlicense.org/"),
    "none": (None, None),
}

BADGE_STYLE = "flat-square"


def slugify(text):
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[\s_-]+", "-", text)


def build_badges(project_name, tech_stack, license_key):
    badges = []
    if license_key and license_key != "none":
        label, _ = LICENSE_MAP.get(license_key, (None, None))
        if label:
            badge_label = label.replace(" ", "%20")
            badges.append(
                f"![License](https://img.shields.io/badge/license-{badge_label}-blue?style={BADGE_STYLE})"
            )
    for tech in tech_stack:
        clean = tech.strip()
        if not clean:
            continue
        encoded = clean.replace(" ", "%20")
        badges.append(
            f"![{clean}](https://img.shields.io/badge/-{encoded}-2b2b2b?style={BADGE_STYLE})"
        )
    return badges


def build_toc(sections):
    lines = []
    for title in sections:
        anchor = slugify(title)
        lines.append(f"- [{title}](#{anchor})")
    return "\n".join(lines)


def generate_readme(data):
    project_name = (data.get("project_name") or "Project Name").strip()
    tagline = (data.get("tagline") or "").strip()
    description = (data.get("description") or "").strip()
    tech_stack = [t.strip() for t in data.get("tech_stack", []) if t.strip()]
    features = [f.strip() for f in data.get("features", []) if f.strip()]
    installation = (data.get("installation") or "").strip()
    usage = (data.get("usage") or "").strip()
    license_key = data.get("license", "mit")
    include_badges = bool(data.get("include_badges"))
    include_toc = bool(data.get("include_toc"))
    include_screenshot = bool(data.get("include_screenshot"))
    contributing = (data.get("contributing") or "").strip()

    parts = []

    # Header
    parts.append(f"# {project_name}\n")
    if tagline:
        parts.append(f"*{tagline}*\n")

    if include_badges:
        badges = build_badges(project_name, tech_stack, license_key)
        if badges:
            parts.append(" ".join(badges) + "\n")

    if description:
        parts.append(description + "\n")

    if include_screenshot:
        parts.append("![Screenshot](docs/screenshot.png)\n")

    # Table of contents
    section_titles = []
    if tech_stack:
        section_titles.append("Tech Stack")
    if features:
        section_titles.append("Features")
    if installation:
        section_titles.append("Installation")
    if usage:
        section_titles.append("Usage")
    if contributing:
        section_titles.append("Contributing")
    if license_key != "none":
        section_titles.append("License")

    if include_toc and section_titles:
        parts.append("## Table of Contents\n")
        parts.append(build_toc(section_titles) + "\n")

    if tech_stack:
        parts.append("## Tech Stack\n")
        parts.append("\n".join(f"- {t}" for t in tech_stack) + "\n")

    if features:
        parts.append("## Features\n")
        parts.append("\n".join(f"- {f}" for f in features) + "\n")

    if installation:
        parts.append("## Installation\n")
        parts.append(f"```bash\n{installation}\n```\n")

    if usage:
        parts.append("## Usage\n")
        parts.append(usage + "\n")

    if contributing:
        parts.append("## Contributing\n")
        parts.append(contributing + "\n")

    if license_key != "none":
        label, url = LICENSE_MAP.get(license_key, (None, None))
        if label:
            parts.append("## License\n")
            parts.append(f"Distributed under the [{label}]({url}) license. See `LICENSE` for more information.\n")

    return "\n".join(parts).strip() + "\n"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(force=True, silent=True) or {}
    markdown = generate_readme(data)
    return jsonify({"markdown": markdown})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
