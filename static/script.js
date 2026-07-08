(function () {
  const form = document.getElementById("readme-form");
  const preview = document.getElementById("preview-output");
  const copyBtn = document.getElementById("copy-btn");
  const downloadBtn = document.getElementById("download-btn");
  const templateSelect = document.getElementById("template-select");

  let latestMarkdown = "";
  let debounceTimer = null;

  // ---- Template presets ----
  const TEMPLATES = {
    blank: {
      project_name: "", tagline: "", description: "",
      tech_stack: [], features: [], installation: "", usage: "",
      contributing: "", license: "mit",
      include_badges: false, include_toc: false, include_screenshot: false,
    },
    minimal: {
      project_name: "My Project",
      tagline: "A short, one-line description",
      description: "A brief explanation of what this project does and who it's for.",
      tech_stack: [],
      features: [],
      installation: "npm install",
      usage: "npm start",
      contributing: "",
      license: "mit",
      include_badges: false,
      include_toc: false,
      include_screenshot: false,
    },
    standard: {
      project_name: "My Project",
      tagline: "A short, one-line description of what it does",
      description: "Explain the problem this project solves, who it's for, and what makes it worth using.",
      tech_stack: ["Python", "Flask", "JavaScript"],
      features: ["Feature one", "Feature two", "Feature three"],
      installation: "git clone https://github.com/you/project\ncd project\npip install -r requirements.txt",
      usage: "python app.py\n\nThen open http://127.0.0.1:5000 in your browser.",
      contributing: "",
      license: "mit",
      include_badges: true,
      include_toc: true,
      include_screenshot: false,
    },
    detailed: {
      project_name: "My Open Source Project",
      tagline: "A short, compelling one-liner",
      description: "A thorough description: the problem it solves, who it's for, and why it exists. Open source projects benefit from a bit more context up front.",
      tech_stack: ["Python", "Flask", "JavaScript", "Docker"],
      features: [
        "Core feature with a short explanation",
        "Second feature that sets this apart",
        "Third feature worth highlighting",
      ],
      installation: "git clone https://github.com/you/project\ncd project\npython -m venv venv\nsource venv/bin/activate\npip install -r requirements.txt",
      usage: "python app.py\n\nOpen http://127.0.0.1:5000 and start using the app.",
      contributing: "Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.",
      license: "mit",
      include_badges: true,
      include_toc: true,
      include_screenshot: true,
    },
  };

  function applyTemplate(key) {
    const data = TEMPLATES[key];
    if (!data) return;

    form.project_name.value = data.project_name;
    form.tagline.value = data.tagline;
    form.description.value = data.description;
    form.installation.value = data.installation;
    form.usage.value = data.usage;
    form.contributing.value = data.contributing;
    form.license.value = data.license;
    form.include_badges.checked = data.include_badges;
    form.include_toc.checked = data.include_toc;
    form.include_screenshot.checked = data.include_screenshot;

    rebuildRepeatable("tech-stack-list", "e.g. Flask", data.tech_stack);
    rebuildRepeatable("features-list", "e.g. Live Markdown preview", data.features);

    scheduleUpdate();
  }

  function rebuildRepeatable(containerId, placeholder, values) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    if (values.length === 0) {
      addRepeatableItem(container, placeholder);
    } else {
      values.forEach((v) => addRepeatableItem(container, placeholder, v));
    }
  }

  if (templateSelect) {
    templateSelect.addEventListener("change", () => applyTemplate(templateSelect.value));
  }

  // ---- Repeatable field lists (Tech Stack / Features) ----
  function addRepeatableItem(container, placeholder, value) {
    const row = document.createElement("div");
    row.className = "repeatable-item";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = value || "";
    input.addEventListener("input", scheduleUpdate);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-item";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      row.remove();
      scheduleUpdate();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);
    return input;
  }

  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const container = document.getElementById(btn.dataset.target);
      const input = addRepeatableItem(container, btn.dataset.placeholder);
      input.focus();
    });
  });

  // Load the default "Standard" template so the preview isn't empty on first visit
  applyTemplate("standard");

  // ---- Collect form data ----
  function collectData() {
    const formData = new FormData(form);
    const data = {
      project_name: formData.get("project_name") || "",
      tagline: formData.get("tagline") || "",
      description: formData.get("description") || "",
      installation: formData.get("installation") || "",
      usage: formData.get("usage") || "",
      contributing: formData.get("contributing") || "",
      license: formData.get("license") || "mit",
      include_badges: formData.get("include_badges") === "on",
      include_toc: formData.get("include_toc") === "on",
      include_screenshot: formData.get("include_screenshot") === "on",
      tech_stack: Array.from(
        document.querySelectorAll("#tech-stack-list input")
      ).map((i) => i.value),
      features: Array.from(
        document.querySelectorAll("#features-list input")
      ).map((i) => i.value),
    };
    return data;
  }

  // ---- Talk to Flask backend ----
  async function updatePreview() {
    const data = collectData();

    if (!data.project_name.trim()) {
      preview.innerHTML =
        '<p class="empty-state">Start filling in the form — your README builds itself here, in real time.</p>';
      latestMarkdown = "";
      return;
    }

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      latestMarkdown = result.markdown || "";
      preview.innerHTML = window.marked
        ? marked.parse(latestMarkdown)
        : `<pre>${latestMarkdown}</pre>`;
    } catch (err) {
      preview.innerHTML =
        '<p class="empty-state">Couldn\'t reach the server — check that Flask is running.</p>';
    }
  }

  function scheduleUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 300);
  }

  form.addEventListener("input", scheduleUpdate);
  form.addEventListener("change", scheduleUpdate);

  // ---- Copy to clipboard ----
  copyBtn.addEventListener("click", async () => {
    if (!latestMarkdown) return;
    try {
      await navigator.clipboard.writeText(latestMarkdown);
      copyBtn.textContent = "Copied ✓";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "Copy Markdown";
        copyBtn.classList.remove("copied");
      }, 1600);
    } catch (err) {
      alert("Couldn't copy automatically — select and copy the text manually.");
    }
  });

  // ---- Download README.md ----
  downloadBtn.addEventListener("click", () => {
    if (!latestMarkdown) return;
    const blob = new Blob([latestMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
})();
