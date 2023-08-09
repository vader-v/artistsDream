const r = document.querySelector('#rectangleCanvas');
const l = document.querySelector('#lineCanvas');
const b = document.querySelector('#brushCanvas');
const t = document.querySelector('#triangleCanvas');
const c = document.querySelector('#circleCanvas');

const rectangleCtx = r.getContext('2d');
const lineCtx = l.getContext('2d');
const brushCtx = b.getContext('2d');
const triangleCtx = t.getContext('2d');
const circleCtx = c.getContext('2d');

// Button click event listeners
const brushButton = document.querySelector('#brushButton');
const rectangleButton = document.querySelector('#rectangleSwitch');
const circleButton = document.querySelector('#circleSwitch');
const triangleButton = document.querySelector('#triangleSwitch');
const lineButton = document.querySelector('#lineSwitch');

// Resizing 
r.height = window.innerHeight;
r.width = window.innerWidth;

l.height = window.innerHeight;
l.width = window.innerWidth;

b.height = window.innerHeight;
b.width = window.innerWidth;

t.height = window.innerHeight;
t.width = window.innerWidth;

c.height = window.innerHeight;
c.width = window.innerWidth;

// Variables
let painting = false;
let drawStyle = 'brush';
const shapesByCanvas = {
  rectangle: [],
  line: [],
  brush: [],
  triangle: [],
  circle: [],
};
let shapes = []

// Variables for circle drawing
let activeCircleShapeIndex = -1; // Index of the active circle being adjusted
let activeShapeIndex = -1; // Index of the active shape being adjusted
let offsetX = 0; // Offset between mouse and shape top-left corner
let offsetY = 0;
let drawingRectangle = false; // Flag to track if a rectangle is currently being drawn

let activeCanvas = b; // Set initial active canvas

// Variables for circle drawing
let circleStartX, circleStartY;

// Variables for triangle drawing
let triangleStartX, triangleStartY;

const canvasButtons = [brushButton, rectangleButton, circleButton, triangleButton, lineButton];

// Function to deactivate all canvas buttons except the clicked one
function deactivateAllCanvasButtons(clickedButton) {
  canvasButtons.forEach(button => {
    if (button !== clickedButton) {
      button.checked = false;
    }
  });
}

function setActiveCanvas(canvas, style) {
  activeCanvas.style.zIndex = 0; // Set z-index of the previous active canvas to 0
  activeCanvas = canvas;
  activeCanvas.style.zIndex = 1; // Set z-index of the new active canvas to 1

  // Set the draw style based on the selected shape button
  drawStyle = style;

  // Clear the shapes array for the previous canvas
  shapes = shapesByCanvas[drawStyle];
  activeShapeIndex = shapes.length - 1;
}

function start(e) {
  painting = true;
  const canvasRect = r.getBoundingClientRect(); // Adjust based on current canvas
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;

  // Determine the context based on the current draw style and canvas
  let ctx;
  if (drawStyle === 'rectangle') {
    const newShape = {
      type: 'rectangle',
      x: mouseX,
      y: mouseY,
      width: 0,
      height: 0,
      resizing: false,
    };
    shapes.push(newShape);
    activeShapeIndex = shapes.length - 1;
    drawingRectangle = true;
  } else if (drawStyle === 'line') {
    ctx = lineCtx;
  } else if (drawStyle === 'brush') {
    ctx = brushCtx;
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
  } else if (drawStyle === 'triangle') {
    ctx = triangleCtx;
  } else   if (drawStyle === 'circle') {
    const newCircle = {
      type: 'circle',
      x: mouseX,
      y: mouseY,
      radius: 0,
      resizing: false,
    };
    shapes.push(newCircle);
    activeCircleShapeIndex = shapes.length - 1; // Store the index of the active circle
  }
  draw(e);
}

function end() {
  painting = false;
  drawingRectangle = false;

  // Determine the context based on the current draw style
  let ctx;
  if (drawStyle === 'rectangle') {
    ctx = rectangleCtx;
  } else if (drawStyle === 'line') {
    if (!drawingRectangle) {
      ctx = lineCtx;
    }
  } else if (drawStyle === 'brush') {
    ctx = brushCtx;
    ctx.beginPath();
  } else if (drawStyle === 'triangle') {
    if (!drawingRectangle) {
      ctx = triangleCtx;
    }
  } else if (drawStyle === 'circle') {
    if (!drawingRectangle) {
      ctx = circleCtx;
    }
  }
  ctx.closePath();
}

function redrawElements() {
  const ctx = activeCanvas.getContext('2d');
  ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height); // Clear only the active canvas

  for (const shape of shapes) {
    let shapeCtx;
    if (shape.type === 'rectangle') {
      shapeCtx = rectangleCtx;
      shapeCtx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === 'circle') {
      shapeCtx = circleCtx;
      shapeCtx.beginPath();
      shapeCtx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
      shapeCtx.stroke();
    } else if (shape.type === 'triangle') {
      shapeCtx = triangleCtx;
      shapeCtx.beginPath();
      shapeCtx.moveTo(shape.x, shape.y);
      shapeCtx.lineTo(shape.x + shape.width, shape.y + shape.height);
      shapeCtx.lineTo(shape.x + shape.width, shape.y);
      shapeCtx.closePath();
      shapeCtx.stroke();
    } else if (shape.type === 'line') {
      shapeCtx = lineCtx;
      shapeCtx.beginPath();
      shapeCtx.moveTo(shape.x1, shape.y1);
      shapeCtx.lineTo(shape.x2, shape.y2);
      shapeCtx.stroke();
    }
  }
}


function findActiveShape(x, y) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (
      (shape.type === 'rectangle' && x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) ||
      (shape.type === 'circle' && Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2) <= shape.radius) ||
      (shape.type === 'triangle' && pointInTriangle(x, y, shape))
    ) {
      return i;
    }
  }
  return -1;
}

function pointInTriangle(x, y, triangle) {
  const x1 = triangle.x;
  const y1 = triangle.y;
  const x2 = triangle.x + triangle.width;
  const y2 = triangle.y + triangle.height;
  const x3 = x2;
  const y3 = triangle.y;

  const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
  const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
  const c = 1 - a - b;

  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}


let startX, startY;

function draw(e) {
  if (!painting || e.target.classList.contains('switch-label')) return;

  let ctx = activeCanvas.getContext('2d');
  const canvasRect = activeCanvas.getBoundingClientRect(); // Adjust based on current canvas
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;

  if (drawStyle === 'brush') {
    ctx = brushCtx;
    if (!drawingRectangle) {
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouseX, mouseY);
    }
  } else if (drawStyle === 'rectangle') {
    ctx = rectangleCtx;
    if (drawingRectangle) {
      const shape = shapes[activeShapeIndex];
      shape.width = mouseX - shape.x;
      shape.height = mouseY - shape.y;
      redrawElements();
    }
  } else if (drawStyle === 'circle') {
    if (activeCircleShapeIndex !== -1) {
      const shape = shapes[activeCircleShapeIndex];

      // Clear the canvas
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

      // Redraw existing shapes
      redrawElements();

      // Draw the circle
      shape.radius = Math.sqrt((mouseX - shape.x) ** 2 + (mouseY - shape.y) ** 2);
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();

    }
  } else if (drawStyle === 'triangle') {
    if (triangleStartX === undefined || triangleStartY === undefined) {
      triangleStartX = mouseX;
      triangleStartY = mouseY;
    }
    if (!drawingRectangle) {
      // Starting a new triangle
      const newTriangle = {
        type: 'triangle',
        x: mouseX,
        y: mouseY,
        width: 0,
        height: 0,
        resizing: false,
      };
      shapes.push(newTriangle);
      drawingRectangle = true;
      activeShapeIndex = shapes.length - 1;
    } else {
      // Resizing the triangle
      const shape = shapes[activeShapeIndex];
      shape.width = mouseX - shape.x;
      shape.height = mouseY - shape.y;
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      redrawElements();
      ctx.beginPath();
      ctx.moveTo(shape.x, shape.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.closePath();
      ctx.stroke();
    }
  } else if (drawStyle === 'line') {
    if (!drawingRectangle) {
      // Starting a new line
      const newLine = {
        type: 'line',
        x1: mouseX,
        y1: mouseY,
        x2: mouseX,
        y2: mouseY,
        resizing: false,
      };
      shapes.push(newLine);
      drawingRectangle = true;
      activeShapeIndex = shapes.length - 1;
    } else {
      // Resizing the line
      const shape = shapes[activeShapeIndex];
      shape.x2 = mouseX;
      shape.y2 = mouseY;
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      redrawElements();
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
    }
  }
}


function clearCanvases() {
  rectangleCtx.clearRect(0, 0, r.width, r.height);
  lineCtx.clearRect(0, 0, l.width, l.height);
  brushCtx.clearRect(0, 0, b.width, b.height);
  triangleCtx.clearRect(0, 0, t.width, t.height);
  circleCtx.clearRect(0, 0, c.width, c.height);

  for (const style in shapesByCanvas) {
    shapesByCanvas[style] = [];
  }
  shapes = [];
}

const clearButton = document.querySelector('#clearButton');

clearButton.addEventListener('click', () => {
  clearCanvases();
});

brushButton.addEventListener('click', () => {
  deactivateAllCanvasButtons(brushButton);
  setActiveCanvas(b, 'brush');
  drawStyle = 'brush';
});

rectangleButton.addEventListener('click', () => {
  deactivateAllCanvasButtons(rectangleButton);
  setActiveCanvas(r, 'rectangle');
  drawStyle = 'rectangle';
});

circleButton.addEventListener('click', () => {
  deactivateAllCanvasButtons(circleButton);
  setActiveCanvas(c, 'circle');
  drawStyle = 'circle';
});

triangleButton.addEventListener('click', () => {
  deactivateAllCanvasButtons(triangleButton);
  setActiveCanvas(t, 'triangle');
  drawStyle = 'triangle';
});

lineButton.addEventListener('click', () => {
  deactivateAllCanvasButtons(lineButton);
  setActiveCanvas(l, 'line');
  drawStyle = 'line';
});

// Event listeners
r.addEventListener('mousedown', (e) => {
  start(e);
  if (drawStyle === 'circle' || drawStyle === 'line') {
    startX = e.clientX;
    startY = e.clientY;
  }
});

r.addEventListener('mouseup', end);
r.addEventListener('mouseout', end);
r.addEventListener('mousemove', draw);

l.addEventListener('mousedown', start);
l.addEventListener('mouseup', end);
l.addEventListener('mouseout', end);
l.addEventListener('mousemove', draw);

b.addEventListener('mousedown', start);
b.addEventListener('mouseup', end);
b.addEventListener('mouseout', end);
b.addEventListener('mousemove', draw);

t.addEventListener('mousedown', start);
t.addEventListener('mouseup', end);
t.addEventListener('mouseout', end);
t.addEventListener('mousemove', draw);

c.addEventListener('mousedown', start);
c.addEventListener('mouseup', end);
c.addEventListener('mouseout', end);
c.addEventListener('mousemove', draw);

window.addEventListener('resize', () => {
  c.height = window.innerHeight;
  c.width = window.innerWidth;

  r.height = window.innerHeight;
  r.width = window.innerWidth;

  l.height = window.innerHeight;
  l.width = window.innerWidth;

  b.height = window.innerHeight;
  b.width = window.innerWidth;

  t.height = window.innerHeight;
  t.width = window.innerWidth;
});
