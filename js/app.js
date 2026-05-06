/*
  RuralSense Debug Lab
  Semana 9: pruebas y depuración con herramientas del navegador.

  Este archivo está escrito en JavaScript puro para que puedas analizarlo
  con Console, Elements, Sources y breakpoints sin depender de frameworks.
*/

const STORAGE_KEY = "ruralsense_participants_v1";
const state = {
  participants: loadParticipants(),
  validationCount: 0,
};

const elements = {
  form: document.querySelector("#registrationForm"),
  fullName: document.querySelector("#fullName"),
  age: document.querySelector("#age"),
  phone: document.querySelector("#phone"),
  workshop: document.querySelector("#workshop"),
  notes: document.querySelector("#notes"),
  table: document.querySelector("#participantsTable"),
  searchInput: document.querySelector("#searchInput"),
  totalInscritos: document.querySelector("#totalInscritos"),
  promedioEdad: document.querySelector("#promedioEdad"),
  totalErrores: document.querySelector("#totalErrores"),
  chart: document.querySelector("#workshopChart"),
  toast: document.querySelector("#toast"),
  btnSeed: document.querySelector("#btnSeed"),
  btnClear: document.querySelector("#btnClear"),
  btnControlledError: document.querySelector("#btnControlledError"),
  btnTheme: document.querySelector("#btnTheme"),
};

console.group("RuralSense Debug Lab");
console.info("Proyecto cargado correctamente.");
console.info("Sugerencia: usa breakpoints en validateForm() y addParticipant().");
console.groupEnd();

init();

function init() {
  render();
  bindEvents();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.form.addEventListener("reset", () => clearAllErrors());
  elements.searchInput.addEventListener("input", () => renderTable());
  elements.btnSeed.addEventListener("click", seedParticipants);
  elements.btnClear.addEventListener("click", clearParticipants);
  elements.btnControlledError.addEventListener("click", generateControlledError);
  elements.btnTheme.addEventListener("click", toggleTheme);
}

function handleSubmit(event) {
  event.preventDefault();
  console.group("Prueba de formulario");
  console.log("Evento submit capturado.");

  const formData = getFormData();
  console.table(formData);

  const validation = validateForm(formData);
  state.validationCount += validation.errorCount;

  if (!validation.isValid) {
    showErrors(validation.errors);
    updateStats();
    console.warn("Formulario inválido. Revisa los mensajes visuales y la consola.", validation.errors);
    showToast("Hay datos por corregir. Revisa los campos marcados.");
    console.groupEnd();
    return;
  }

  addParticipant(formData);
  elements.form.reset();
  clearAllErrors();
  showToast("Participante registrado correctamente.");
  console.info("Registro guardado correctamente.");
  console.groupEnd();
}

function getFormData() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fullName: elements.fullName.value.trim(),
    age: Number(elements.age.value),
    phone: elements.phone.value.trim(),
    workshop: elements.workshop.value,
    notes: elements.notes.value.trim(),
    createdAt: new Date().toISOString(),
  };
}

function validateForm(data) {
  const errors = {};

  if (data.fullName.length < 4) {
    errors.fullName = "Escribe un nombre de al menos 4 caracteres.";
  }

  if (!Number.isInteger(data.age) || data.age < 14 || data.age > 90)
 {
    errors.age = "La edad debe estar entre 14 y 90 años.";
  }

  if (!/^\d{10}$/.test(data.phone)) {
    errors.phone = "El celular debe tener exactamente 10 dígitos.";
  }

  if (!data.workshop) {
    errors.workshop = "Selecciona un taller.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errorCount: Object.keys(errors).length,
    errors,
  };
}

function showErrors(errors) {
  clearAllErrors();

  Object.entries(errors).forEach(([field, message]) => {
    const input = document.querySelector(`#${field}`);
    const errorSlot = document.querySelector(`[data-error="${field}"]`);

    if (input) input.classList.add("field-invalid");
    if (errorSlot) errorSlot.textContent = message;
  });
}

function clearAllErrors() {
  document.querySelectorAll(".field-invalid").forEach((element) => element.classList.remove("field-invalid"));
  document.querySelectorAll("[data-error]").forEach((element) => {
    element.textContent = "";
  });
}

function addParticipant(participant) {
  console.log("Nuevo participante agregado:", participant.fullName);

  state.participants.unshift(participant);
  saveParticipants();
  render();
}

function render() {
  renderTable();
  updateStats();
  drawChart();
}

function renderTable() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = state.participants.filter((participant) => {
    return (
      participant.fullName.toLowerCase().includes(query) ||
      participant.workshop.toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    elements.table.innerHTML = `
      <tr>
        <td colspan="5">No hay registros para mostrar. Carga datos de ejemplo o registra un participante.</td>
      </tr>
    `;
    return;
  }

  elements.table.innerHTML = filtered
    .map(
      (participant) => `
        <tr>
          <td>${escapeHTML(participant.fullName)}</td>
          <td>${participant.age}</td>
          <td>${escapeHTML(participant.phone)}</td>
          <td>${escapeHTML(participant.workshop)}</td>
          <td><span class="status">Validado</span></td>
        </tr>
      `
    )
    .join("");
}

function updateStats() {
  const total = state.participants.length;
  const average = total === 0 ? 0 : Math.round(state.participants.reduce((sum, item) => sum + item.age, 0) / total);

  elements.totalInscritos.textContent = String(total);
  elements.promedioEdad.textContent = String(average);
  elements.totalErrores.textContent = String(state.validationCount);
}

function drawChart() {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  const counts = countByWorkshop();
  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const max = Math.max(...values, 1);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "16px system-ui, sans-serif";
  context.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");

  if (labels.length === 0) {
    context.fillText("Sin datos. Registra participantes o carga ejemplos.", 32, 56);
    return;
  }

  const barHeight = 34;
  const gap = 22;
  const labelX = 28;
  const barX = 230;
  const maxWidth = canvas.width - barX - 70;

  labels.forEach((label, index) => {
    const y = 38 + index * (barHeight + gap);
    const width = (counts[label] / max) * maxWidth;

    context.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
    context.fillText(label, labelX, y + 23);

    context.fillStyle = getComputedStyle(document.body).getPropertyValue("--primary");
    roundRect(context, barX, y, width, barHeight, 12);
    context.fill();

    context.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
    context.fillText(String(counts[label]), barX + width + 14, y + 23);
  });
}

function countByWorkshop() {
  return state.participants.reduce((accumulator, participant) => {
    accumulator[participant.workshop] = (accumulator[participant.workshop] || 0) + 1;
    return accumulator;
  }, {});
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function seedParticipants() {
  const examples = [
    { fullName: "Ana María Ríos", age: 16, phone: "3001234567", workshop: "Agricultura sostenible", notes: "Quiere apoyar el registro de cultivos." },
    { fullName: "Carlos Mejía", age: 18, phone: "3017654321", workshop: "Tecnología para la finca", notes: "Le interesa automatizar reportes." },
    { fullName: "Lucía Gómez", age: 15, phone: "3029876543", workshop: "Programación web básica", notes: "Desea aprender formularios." },
    { fullName: "Julián Torres", age: 17, phone: "3031112233", workshop: "Emprendimiento rural", notes: "Quiere crear catálogo digital." },
  ].map((item) => ({ ...item, id: String(Date.now() + Math.random()), createdAt: new Date().toISOString() }));

  console.info("Cargando datos de ejemplo", examples);
  state.participants = [...examples, ...state.participants];
  saveParticipants();
  render();
  showToast("Datos de ejemplo cargados.");
}

function clearParticipants() {
  state.participants = [];
  saveParticipants();
  render();
  showToast("Registros eliminados del navegador.");
  console.info("localStorage limpiado para este proyecto.");
}

function generateControlledError() {
  console.group("Error controlado para depuración");
  console.warn("Este botón genera un error intencional para practicar lectura de consola.");
  try {
  const missingElement = document.querySelector("#elementoQueNoExiste");

  if (missingElement) {
    missingElement.textContent = "Elemento encontrado.";
 } else {
   console.warn("El elemento no existe en el HTML.");
 }

  } catch (error) {
    console.error("Error controlado detectado:", error.message);
    console.info("Pista: document.querySelector devolvió null porque el elemento no existe.");
    showToast("Error controlado generado. Revisa la consola.");
  } finally {
    console.groupEnd();
  }
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = nextTheme;
  drawChart();
  console.info(`Tema cambiado a: ${nextTheme}`);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3200);
}

function saveParticipants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.participants));
}

function loadParticipants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("No se pudieron cargar los datos guardados.", error);
    return [];
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
