const GRID_SIZE = 20;

const draggables = document.querySelectorAll(".draggable");
const canvas = document.getElementById("canvas");
const editor = document.getElementById("editor");
const exportBtn = document.getElementById("exportHTML");
let selectedElement = null;

// DRAG AND DROP FUNCTIONALITY
draggables.forEach((el) => {
  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", el.dataset.type);
  });
});

canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData("text/plain");
  const newEl = createElement(type);

  const x = Math.round(e.offsetX / GRID_SIZE) * GRID_SIZE;
  const y = Math.round(e.offsetY / GRID_SIZE) * GRID_SIZE;

  newEl.style.position = "absolute";
  newEl.style.left = x + "px";
  newEl.style.top = y + "px";

  canvas.appendChild(newEl);
  removePlaceholder();
  extractCanvasWithCSS();
});

function makeDraggable(el) {
  el.addEventListener("mousedown", dragStart);
  el.addEventListener("touchstart", dragStart, { passive: false });

  function dragStart(e) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    e.preventDefault();

    const isTouch = e.type === "touchstart";
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = el.getBoundingClientRect();
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    function move(ev) {
      const clientX = isTouch ? ev.touches[0].clientX : ev.clientX;
      const clientY = isTouch ? ev.touches[0].clientY : ev.clientY;
      let x = clientX - canvas.offsetLeft - offsetX;
      let y = clientY - canvas.offsetTop - offsetY;

      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;

      el.style.left = x + "px";
      el.style.top = y + "px";
    }

    function stop() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", stop);
      extractCanvasWithCSS();
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchmove", move);
    document.addEventListener("touchend", stop);
  }
}

function extractCanvasWithCSS() {
  const elements = canvas.querySelectorAll(".dropped-element");
  let css = "";
  let html = "";
  let idCounter = 0;

  elements.forEach((el) => {
    const cloned = el.cloneNode(true);
    const id = `element-${idCounter++}`;
    cloned.id = id;

    const computed = window.getComputedStyle(el);
    const properties = [
      "position",
      "left",
      "top",
      "width",
      "height",
      "font-size",
      "color",
      "background-color",
      "font-weight",
      "border",
      "text-align",
      "resize",
      "overflow",
      "object-fit",
      "padding",
      "margin",
    ];

    let styleText = properties
      .map((prop) => `  ${prop}: ${computed.getPropertyValue(prop)};`)
      .join("\n");

    css += `#${id} {\n${styleText}\n}\n`;
    const formattedHTML = cloned.outerHTML.replace(
      /<(\w+)([^>]*)>/,
      (match, tag, attrs) => {
        const formattedAttrs = attrs
          .trim()
          .split(/\s+(?=\S+=)/g)
          .map((attr) => `  ${attr}`)
          .join("\n");
        return `<${tag}\n${formattedAttrs}>`;
      }
    );
    html += formattedHTML + "\n";
  });

  localStorage.setItem("canvas-html", html);
  localStorage.setItem("canvas-css", css);
  return { html, css };
}

function createElement(type) {
  const el = document.createElement("div");
  el.className = "dropped-element";
  el.setAttribute("data-type", type);
  el.style.position = "absolute";
  el.style.cursor = "move";
  el.style.resize = "both";
  el.style.overflow = "auto";
  el.style.height = "auto";
  el.style.minWidth = "50px";
  el.style.minHeight = "30px";
  el.style.textAlign = "center";

  switch (type) {
    case "text":
      el.textContent = "Sample Text";
      break;
    case "image":
      el.innerHTML = `<img src="https://via.placeholder.com/150" alt="Image" />`;
      break;
    case "button":
      el.innerHTML = `<button class="custom-button stretch">Click Me</button>`;
      break;
  }

  el.addEventListener("click", () => showProperties(el));
  showProperties(el);
  makeDraggable(el);
  return el;
}

function removePlaceholder() {
  const placeholder = canvas.querySelector(".placeholder");
  if (placeholder) placeholder.remove();
}

// TOGGLE DESIGN / CODE MODE
const designBtn = document.getElementById("designModeBtn");
const codeBtn = document.getElementById("codeModeBtn");
const codeView = document.getElementById("codeView");

designBtn.addEventListener("click", () => {
  designBtn.classList.remove("inactive");
  codeBtn.classList.add("inactive");
  codeView.classList.add("hidden");
  canvas.classList.remove("hidden");
  editor.classList.remove("hidden");
  designBtn.classList.add("active");
  codeBtn.classList.remove("active");
});

codeBtn.addEventListener("click", () => {
  codeBtn.classList.remove("inactive");
  codeBtn.classList.add("active");
  codeView.classList.remove("hidden");
  canvas.classList.add("hidden");
  editor.classList.add("hidden");
  designBtn.classList.remove("active");
  designBtn.classList.add("inactive");
  const { html, css } = extractCanvasWithCSS();

  const finalHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Design</title>
<style>\n${css}\n</style>
</head>
<body>\n${html}</body>
</html>`;

  codeView.innerHTML = `
    <h3>Generated Code:</h3>
    <pre><code id="htmlCodeBlock"></code></pre>
  `;
  document.getElementById("htmlCodeBlock").textContent = finalHTML;
});

// EXPORT HTML
exportBtn.addEventListener("click", () => {
  const { html, css } = extractCanvasWithCSS();
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Layout</title>
<style>\n${css}\n</style>
</head>
<body>\n${html}</body>
</html>`;

  const blob = new Blob([fullHTML], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "layout.html";
  a.click();
});

// CLEAR CANVAS
const clearBtn = document.getElementById("clearCanvas");
clearBtn.addEventListener("click", () => {
  canvas.innerHTML = '<div class="placeholder">Drop Elements here</div>';
  editor.innerHTML = "<h2 style='margin-0'>Properties</h2>";
  localStorage.removeItem("canvas-html");
  localStorage.removeItem("canvas-css");
});

// THEME SWITCH
const themeSwitch = document.getElementById("themeSwitch");
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeSwitch.checked = true;
  }

  const savedHTML = localStorage.getItem("canvas-html");
  if (savedHTML) {
    canvas.innerHTML = savedHTML;
    canvas.querySelectorAll(".dropped-element").forEach((el) => {
      makeDraggable(el);
      el.addEventListener("click", () => showProperties(el));
    });
  }
});

themeSwitch.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});

// PROPERTY PANEL
function showProperties(el) {
  selectedElement = el;
  const type = el.getAttribute("data-type");
  editor.innerHTML = `<h2>Properties: ${type}</h2>`;

  const computed = window.getComputedStyle(el);
  if (type === "text") {
    const textLabel = document.createElement("label");
    textLabel.textContent = "Text:";
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = el.textContent;
    textInput.addEventListener("input", (e) => {
      el.textContent = e.target.value;
      extractCanvasWithCSS();
    });

    const fontSizeLabel = document.createElement("label");
    fontSizeLabel.textContent = "Font Size:";
    const fontSizeInput = document.createElement("input");
    fontSizeInput.type = "number";
    fontSizeInput.value = parseInt(computed.fontSize);
    fontSizeInput.addEventListener("input", (e) => {
      el.style.fontSize = e.target.value + "px";
      extractCanvasWithCSS();
    });

    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Color:";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = rgbToHex(computed.color);
    colorInput.addEventListener("input", (e) => {
      el.style.color = e.target.value;
      extractCanvasWithCSS();
    });

    const weightLabel = document.createElement("label");
    weightLabel.textContent = "Font Weight:";
    const weightSelect = document.createElement("select");
    ["normal", "bold", "bolder", "lighter"].forEach((weight) => {
      const opt = document.createElement("option");
      opt.value = weight;
      opt.textContent = weight;
      if (computed.fontWeight === weight) opt.selected = true;
      weightSelect.appendChild(opt);
    });
    weightSelect.addEventListener("change", (e) => {
      el.style.fontWeight = e.target.value;
      extractCanvasWithCSS();
    });

    editor.append(
      textLabel,
      textInput,
      fontSizeLabel,
      fontSizeInput,
      colorLabel,
      colorInput,
      weightLabel,
      weightSelect
    );
  } else if (type === "image") {
    const img = el.querySelector("img");

    const urlLabel = document.createElement("label");
    urlLabel.textContent = "Image URL:";
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = img.src;
    urlInput.addEventListener("input", (e) => {
      img.src = e.target.value;
      extractCanvasWithCSS();
    });

    const widthLabel = document.createElement("label");
    widthLabel.textContent = "Width (px):";
    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.value = img.width;
    widthInput.addEventListener("input", (e) => {
      img.style.width = e.target.value + "px";
      extractCanvasWithCSS();
    });

    editor.append(urlLabel, urlInput, widthLabel, widthInput);
  } else if (type === "button") {
    const btn = el.querySelector("button");

    const labelLabel = document.createElement("label");
    labelLabel.textContent = "Button Label:";
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = btn.textContent;
    labelInput.addEventListener("input", (e) => {
      btn.textContent = e.target.value;
      extractCanvasWithCSS();
    });

    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Color:";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = rgbToHex(computed.color);
    colorInput.addEventListener("input", (e) => {
      el.style.color = e.target.value;
      extractCanvasWithCSS();
    });

    editor.append(labelLabel, labelInput, colorLabel, colorInput);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑 Delete";
  deleteBtn.addEventListener("click", deleteElement);
  editor.appendChild(deleteBtn);
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  return result
    ? "#" +
        result
          .slice(0, 3)
          .map((x) => (+x).toString(16).padStart(2, "0"))
          .join("")
    : "#000000";
}

function updateText(value) {
  if (selectedElement) selectedElement.textContent = value;
  extractCanvasWithCSS();
}

function updateImage(url) {
  if (selectedElement) selectedElement.querySelector("img").src = url;
  extractCanvasWithCSS();
}

function updateButton(value) {
  if (selectedElement)
    selectedElement.querySelector("button").textContent = value;
  extractCanvasWithCSS();
}

function deleteElement() {
  if (selectedElement) {
    selectedElement.remove();
    selectedElement = null;
    editor.innerHTML = "<h2>Properties</h2>";
    extractCanvasWithCSS();
  }
}
