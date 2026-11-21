const colors = { function: "#4774d5", derivative: "#e48b48", integral: "#9162c5" };
const state = {
  traces: [],
  view: "combined",
  visible: { function: true, derivative: false, integral: false },
  plotted: { function: true, derivative: false, integral: false }
};

const $ = (id) => document.getElementById(id);
const formatExpression = (node) => math.simplify(node).toString({ parenthesis: "keep" });

function numericalIntegral(values, xs, baselineIndex) {
  const result = Array(values.length).fill(null);
  result[baselineIndex] = 0;
  for (let i = baselineIndex + 1; i < values.length; i++) {
    result[i] = result[i - 1] + ((values[i - 1] + values[i]) / 2) * (xs[i] - xs[i - 1]);
  }
  for (let i = baselineIndex - 1; i >= 0; i--) {
    result[i] = result[i + 1] - ((values[i + 1] + values[i]) / 2) * (xs[i + 1] - xs[i]);
  }
  return result;
}

function makeTrace(name, x, y, color, label) {
  return { name: label, x, y, mode: "lines", line: { color, width: 2.5 }, hovertemplate: `${name}: %{y:.4f}<extra></extra>` };
}

function chartLayout(title = "") {
  return {
    title: { text: title, font: { family: "Space Grotesk", size: 14, color: "#17231f" }, x: 0.02, xanchor: "left" },
    paper_bgcolor: "transparent", plot_bgcolor: "#ffffff", margin: { t: title ? 42 : 18, r: 20, b: 48, l: 58 },
    font: { family: "DM Mono", size: 10, color: "#718078" }, hovermode: "x unified",
    xaxis: { title: "x", gridcolor: "#edf1eb", zerolinecolor: "#cfdad0" },
    yaxis: { title: "value", gridcolor: "#edf1eb", zerolinecolor: "#cfdad0" }, showlegend: false
  };
}

function renderChart(element, traces, layout, seriesKeys = ["function", "derivative", "integral"]) {
  return Plotly.react(element, traces.filter((_, index) => state.visible[seriesKeys[index]]), layout, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] });
}

function calculate(event, operation) {
  event?.preventDefault();
  const error = $("error-message");
  error.textContent = "";
  try {
    operation = operation || "function";
    const source = $("function-input").value.trim();
    if (!source) throw new Error("Please enter a function.");
    const min = Number($("min-input").value), max = Number($("max-input").value), baseline = Number($("baseline-input").value);
    if (![min, max, baseline].every(Number.isFinite)) throw new Error("Use valid numbers for From, To, and the baseline.");
    if (min >= max) throw new Error("From must be smaller than To.");
    if (baseline < min || baseline > max) throw new Error("The integral baseline must sit inside the plotting range.");
    const node = math.parse(source);
    const compiled = node.compile();
    const derivative = math.derivative(node, "x");
    const derivativeCompiled = derivative.compile();
    const count = 701, step = (max - min) / (count - 1);
    const xs = Array.from({ length: count }, (_, i) => min + i * step);
    const values = xs.map((x) => compiled.evaluate({ x }));
    const derivativeValues = xs.map((x) => derivativeCompiled.evaluate({ x }));
    if (![...values, ...derivativeValues].every(Number.isFinite)) throw new Error("This function produces non-finite values in the selected range.");
    const baselineIndex = Math.round((baseline - min) / step);
    const integralValues = numericalIntegral(values, xs, baselineIndex);
    state.traces = [
      makeTrace("f(x)", xs, values, colors.function, "f(x)"),
      makeTrace("f′(x)", xs, derivativeValues, colors.derivative, "f′(x)"),
      makeTrace("∫f(x)dx", xs, integralValues, colors.integral, "∫f(x) dx")
    ];
    if (operation === "function") {
      state.visible = { function: true, derivative: false, integral: false };
      state.plotted = { function: true, derivative: false, integral: false };
    } else if (operation === "derivative") {
      state.visible.function = true;
      state.visible.derivative = true;
      state.plotted.derivative = true;
    } else if (operation === "integral") {
      state.visible.function = true;
      state.visible.integral = true;
      state.plotted.integral = true;
    }
    $("function-expression").textContent = source;
    $("derivative-expression").textContent = `= ${formatExpression(derivative)}`;
    const operationLabel = [
      state.visible.function && "f(x)",
      state.visible.derivative && "its derivative",
      state.visible.integral && "accumulated area"
    ].filter(Boolean).join(", ").replace(", accumulated area", " and accumulated area").replace(", its derivative", " and its derivative");
    $("status-text").textContent = `Showing ${operationLabel} from x₀ = ${xs[baselineIndex].toFixed(2)}`;
    document.querySelectorAll(".legend-item").forEach((button) => {
      const series = button.dataset.series;
      button.hidden = !state.plotted[series];
      button.classList.toggle("active", state.visible[series]);
    });
    renderAll();
  } catch (problem) {
    error.textContent = problem.message || "Could not understand that function.";
  }
}

async function renderAll() {
  $("combined-chart").hidden = true;
  $("separate-charts").hidden = true;
  await Promise.all([
    renderChart($("combined-chart"), state.traces, chartLayout()),
    renderChart($("function-chart"), [state.traces[0]], chartLayout("Function · f(x)"), ["function"]),
    renderChart($("derivative-chart"), [state.traces[1]], chartLayout("Derivative · f′(x)"), ["derivative"]),
    renderChart($("integral-chart"), [state.traces[2]], chartLayout("Integral · ∫f(x) dx"), ["integral"])
  ]);
  const showingSeparate = state.view === "separate";
  $("combined-chart").hidden = showingSeparate;
  $("separate-charts").hidden = !showingSeparate;
  $("function-chart").hidden = !showingSeparate || !state.visible.function;
  $("derivative-chart").hidden = !showingSeparate || !state.visible.derivative;
  $("integral-chart").hidden = !showingSeparate || !state.visible.integral;
}

document.querySelector("#calculator-form").addEventListener("submit", (event) => calculate(event, event.submitter?.dataset.operation));
document.querySelectorAll("[data-example]").forEach((button) => button.addEventListener("click", () => { $("function-input").value = button.dataset.example; calculate(); }));
document.querySelectorAll(".view-button").forEach((button) => button.addEventListener("click", () => {
  state.view = button.dataset.view;
  document.querySelectorAll(".view-button").forEach((item) => item.classList.toggle("active", item === button));
  renderAll();
}));
document.querySelectorAll(".legend-item").forEach((button) => button.addEventListener("click", () => {
  const series = button.dataset.series;
  state.visible[series] = !state.visible[series];
  button.classList.toggle("active", state.visible[series]);
  renderAll();
}));
calculate();
