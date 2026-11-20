# Calculus Visualizer

Calculus Visualizer is a small interactive web tool for seeing what calculus functions look like on a graph.

Enter a function such as `sin(x) + x^2 / 4`, choose the range for `x`, and use the buttons to add its related graphs.

## What it shows

- The original function, `f(x)`
- Its derivative, which shows how quickly the function is changing
- Its integral, which shows the accumulated area from the selected baseline

## How to run it

This project is made with plain HTML, CSS, and JavaScript. No build step is needed.

1. Open `index.html` in a browser.
2. Enter a function using `x` as the variable.
3. Set the `From`, `To`, and integral baseline values.
4. Click **Plot derivative** or **Plot integration**.

You can also run it from a local server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser.

## Built with
- HTML, CSS, and JavaScript
- Math.js for parsing functions and calculating derivatives
- Plotly.js for drawing the graphs

The libraries are loaded from their public CDNs in `index.html`.
