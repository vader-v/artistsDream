const r = document.querySelector('#rectangleCanvas');
const l = document.querySelector('#lineCanvas');
const b = document.querySelector('#brushCanvas');
const t = document.querySelector('#triangleCanvas');
const c = document.querySelector('#circleCanvas');
const container = document.querySelector('.container')
const gridSizeInput = document.querySelector('#gridSize')
const brushSizeInput = document.querySelector('#brush-size')

const rectangleCtx = r.getContext('2d');
const lineCtx = l.getContext('2d');
const brushCtx = b.getContext('2d');
const triangleCtx = t.getContext('2d');
const circleCtx = c.getContext('2d');

const brushButton = document.querySelector('#brushButton');
const rectangleButton = document.querySelector('#rectangleSwitch');
const circleButton = document.querySelector('#circleSwitch');
const triangleButton = document.querySelector('#triangleSwitch');
const lineButton = document.querySelector('#lineSwitch');
const colorFields = document.querySelectorAll('.color-field');
const colorPicker = document.getElementById('color-picker');
const submitColorButton = document.getElementById('submit-color');
const squareTipCheckbox = document.getElementById('square-tip');
const roundTipCheckbox = document.getElementById('round-tip');

const brushSettings = document.querySelector('.brush-settings');
const hideBrushSettingsButton = document.querySelector('.hide-brush-settings');

const availableBrushTips = ['round', 'square'];
let selectedBrushTip = 'round';

let selectedColor = colorFields[0].style.background;

const clearButton = document.querySelector('#clearButton');

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

container.height = window.innerHeight;
container.width = window.innerWidth;

let painting = false;
let drawStyle = 'brush';
const shapesByCanvas = {
  rectangle: [],
  line: [],
  brush: [],
  triangle: [],
  circle: [],
};
let shapes = [];

let prevMouseX;
let prevMouseY;

let gridSize = parseInt(gridSizeInput.value);
let snapToGrid = true;

let activeCircleShapeIndex = -1;
let activeShapeIndex = -1;
let offsetX = 0;
let offsetY = 0;
let drawingRectangle = false;

let activeCanvas = b;

let circleStartX, circleStartY;

let triangleStartX, triangleStartY;

const canvasButtons = [brushButton, rectangleButton, circleButton, triangleButton, lineButton];

function drawGrid(context, gridSize) {
  const canvasWidth = context.canvas.width;
  const canvasHeight = context.canvas.height;
  
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  
  context.strokeStyle = "rgba(0, 0, 0, 0.1)";
  context.lineWidth = 0.5;
  
  for (let x = 0; x <= canvasWidth; x += gridSize) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvasHeight);
    context.stroke();
  }
  
  for (let y = 0; y <= canvasHeight; y += gridSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvasWidth, y);
    context.stroke();
  }
}

function deactivateAllCanvasButtons(clickedButton) {
  canvasButtons.forEach(button => {
    if (button !== clickedButton) {
      button.checked = false;
    }
  });
}

function deactivateAllBrushButtons(clickedButton) {
  brushSettings.forEach(button => {
    if (button !== clickedButton) {
      button.checked = false;
    }
  });
}

function setActiveCanvas(canvas, style) {
  activeCanvas.style.zIndex = 0;
  activeCanvas = canvas;
  activeCanvas.style.zIndex = 1;
  drawStyle = style;
  
  shapes = shapesByCanvas[drawStyle];
  activeShapeIndex = shapes.length - 1;
}

roundTipCheckbox.addEventListener('change', () => {
  if (roundTipCheckbox.checked) {
    squareTipCheckbox.checked = false;
    brushCtx.lineCap = 'round';
  }
});

squareTipCheckbox.addEventListener('change', () => {
  if (squareTipCheckbox.checked) {
    roundTipCheckbox.checked = false;
    brushCtx.lineCap = 'square';
  }
});

updateSelectedColor();
brushCtx.lineCap = 'round';

function start(e) {
  painting = true;
  const canvasRect = r.getBoundingClientRect();
  prevMouseX = e.clientX - canvasRect.left;
  prevMouseY = e.clientY - canvasRect.top;
  
  let ctx;
  if (drawStyle === 'rectangle') {
    const newShape = {
      type: 'rectangle',
      x: prevMouseX,
      y: prevMouseY,
      width: 0,
      height: 0,
      resizing: false,
      strokeStyle: selectedColor,
    };
    shapes.push(newShape);
    activeShapeIndex = shapes.length - 1;
    drawingRectangle = true;
  } else if (drawStyle === 'line') {
    ctx = lineCtx;
  } else if (drawStyle === 'brush') {
    ctx = brushCtx;
    ctx.lineCap = 'selectedBrushTip';
    ctx.lineWidth = parseInt(brushSizeInput.value);
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    strokeStyle = selectedColor;
  } else if (drawStyle === 'triangle') {
    ctx = triangleCtx;
  } else if (drawStyle === 'circle') {
    const newCircle = {
      type: 'circle',
      x: prevMouseX,
      y: prevMouseY,
      radius: 0,
      resizing: false,
      strokeStyle: selectedColor,
    };
    shapes.push(newCircle);
    activeCircleShapeIndex = shapes.length - 1;
  }
  draw(e);
}

function end() {
  painting = false;
  drawingRectangle = false;
  
  let ctx;
  if (drawStyle === 'rectangle') {
    ctx = rectangleCtx;
  } else if (drawStyle === 'line') {
    if (!drawingRectangle) {
      ctx = lineCtx;
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      redrawElements();
    }
  } else if (drawStyle === 'brush') {
    ctx = brushCtx;
    ctx.beginPath();
  } else if (drawStyle === 'triangle') {
    if (!drawingRectangle) {
      ctx = triangleCtx;
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      redrawElements();
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
  
  ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
  
  drawGrid(ctx, gridSize);
  for (const shape of shapes) {
    let shapeCtx;
    if (shape.type === 'rectangle') {
      shapeCtx = rectangleCtx;
      const x = snapToGridValue(shape.x);
      const y = snapToGridValue(shape.y);
      const width = snapToGridValue(shape.width);
      const height = snapToGridValue(shape.height);
      shapeCtx.strokeStyle = shape.strokeStyle; // Set stroke style with alpha
      shapeCtx.strokeRect(x, y, width, height);
    } else if (shape.type === 'circle') {
      shapeCtx = circleCtx;
      const x = snapToGridValue(shape.x);
      const y = snapToGridValue(shape.y);
      const radius = snapToGridValue(shape.radius);
      shapeCtx.strokeStyle = shape.strokeStyle; // Set stroke style with alpha
      shapeCtx.beginPath();
      shapeCtx.arc(x, y, radius, 0, 2 * Math.PI);
      shapeCtx.stroke();
    } else if (shape.type === 'triangle') {
      shapeCtx = triangleCtx;
      const x = snapToGridValue(shape.x);
      const y = snapToGridValue(shape.y);
      const width = snapToGridValue(shape.width);
      const height = snapToGridValue(shape.height);
      shapeCtx.strokeStyle = shape.strokeStyle; // Set stroke style with alpha
      shapeCtx.beginPath();
      shapeCtx.moveTo(x, y);
      shapeCtx.lineTo(x + width, y + height);
      shapeCtx.lineTo(x + width, y);
      shapeCtx.closePath();
      shapeCtx.stroke();
    } else if (shape.type === 'line') {
      shapeCtx = lineCtx;
      const x1 = snapToGridValue(shape.x1);
      const y1 = snapToGridValue(shape.y1);
      const x2 = snapToGridValue(shape.x2);
      const y2 = snapToGridValue(shape.y2);
      shapeCtx.strokeStyle = shape.strokeStyle; // Set stroke style with alpha
      shapeCtx.beginPath();
      shapeCtx.moveTo(x1, y1);
      shapeCtx.lineTo(x2, y2);
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
  const canvasRect = activeCanvas.getBoundingClientRect();
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;

  if (drawStyle === 'brush') {
    const distance = Math.sqrt((mouseX - prevMouseX) ** 2 + (mouseY - prevMouseY) ** 2);
    const step = 0.1; // Adjust this value to control the frequency of intermediate points

    for (let t = 0; t <= 1; t += step / distance) {
      const interpX = prevMouseX + t * (mouseX - prevMouseX);
      const interpY = prevMouseY + t * (mouseY - prevMouseY);

      brushCtx.lineTo(interpX, interpY);
      brushCtx.stroke();
    }

    // Update prevMouseX and prevMouseY
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    if (!drawingRectangle) {
      brushCtx.lineTo(mouseX, mouseY);
      brushCtx.stroke();
      brushCtx.beginPath();
      brushCtx.moveTo(mouseX, mouseY);
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
    if (activeCircleShapeIndex !== -1 && !drawingRectangle) {
      const shape = shapes[activeCircleShapeIndex];
      shape.radius = Math.sqrt((mouseX - shape.x) ** 2 + (mouseY - shape.y) ** 2);
      redrawCircle(shape);
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
        strokeStyle: selectedColor,
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
        strokeStyle: selectedColor,
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

function redrawCircle(circle) {
  const x = snapToGridValue(circle.x);
  const y = snapToGridValue(circle.y);
  const radius = snapToGridValue(circle.radius);

  circleCtx.clearRect(0, 0, c.width, c.height);
  redrawElements();

  circleCtx.beginPath();
  circleCtx.arc(x, y, radius, 0, 2 * Math.PI);
  circleCtx.stroke();
}

function clearCanvases() {
  rectangleCtx.clearRect(0, 0, r.width, r.height);
  lineCtx.clearRect(0, 0, l.width, l.height);
  brushCtx.clearRect(0, 0, b.width, b.height);
  triangleCtx.clearRect(0, 0, t.width, t.height);
  circleCtx.clearRect(0, 0, c.width, c.height);

  startX = undefined;
  startY = undefined;

  for (const style in shapesByCanvas) {
    shapesByCanvas[style] = [];
  }
  shapes = [];

  drawGrid(rectangleCtx, gridSize);
  drawGrid(lineCtx, gridSize);
  drawGrid(triangleCtx, gridSize);
  drawGrid(circleCtx, gridSize);
}

function snapToGridValue(value) {
  if (snapToGrid) {
    return Math.round(value / gridSize) * gridSize;
  }
  return value;
}

gridSizeInput.addEventListener('input', (e) => {
  gridSize = parseInt(e.target.value);
  drawGrid(rectangleCtx, gridSize); // Update the grid for all canvases
  drawGrid(lineCtx, gridSize);
  drawGrid(circleCtx, gridSize);
  drawGrid(triangleCtx, gridSize);
});

drawGrid(rectangleCtx, gridSize);
drawGrid(lineCtx, gridSize);
drawGrid(circleCtx, gridSize);
drawGrid(triangleCtx, gridSize);

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
  const canvasList = [r, l, b, t, c];
  
  // Update the dimensions of all canvases
  canvasList.forEach(canvas => {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
  });

  // Redraw all shapes on their corresponding canvas contexts
  for (const canvas of canvasList) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, gridSize); // Redraw grid
    redrawElements();
    updateSelectedColor();
  }
});

let toggleSwitchState = true;

const toggleSwitchesButton = document.querySelector('#toggleSwitchesButton');
const switches = document.querySelector('.switches');

toggleSwitchesButton.addEventListener('click', () => {
  toggleSwitchState = !toggleSwitchState;
  switches.classList.toggle('show');
  switches.classList.toggle('hide');

  toggleSwitchesButton.innerText = toggleSwitchState ? '>>' : '<<';
});

brushSizeInput.addEventListener('input', (e) => {
  const newBrushSize = parseInt(e.target.value);
  brushCtx.lineWidth = newBrushSize;
});

// Event listener for color fields
colorFields.forEach((field, index) => {
  field.addEventListener('click', () => {
    if (index === 0) {
      // Update the background color for the white color field using color picker
      selectedColor = colorPicker.value;
      field.style.background = selectedColor;
    } else {
      // Update the background color for the clicked color field
      field.style.background = field.dataset.color;
      selectedColor = field.dataset.color;
      updateSelectedColor();
    }
  });
});


submitColorButton.addEventListener('click', () => {
  selectedColor = colorPicker.value;
  updateSelectedColor();
});

function updateSelectedColor() {
  colorFields[0].style.background = selectedColor;
  rectangleCtx.strokeStyle = selectedColor;
  lineCtx.strokeStyle = selectedColor;
  brushCtx.strokeStyle = selectedColor;
  triangleCtx.strokeStyle = selectedColor;
  circleCtx.strokeStyle = selectedColor;
}

brushButton.addEventListener('change', () => {
  if (brushButton.checked) {
    brushSettings.style.display = 'flex';
  } else {
    brushSettings.style.display = 'none';
  }
});

hideBrushSettingsButton.addEventListener('click', () => {
  brushSettings.style.display = 'none';
});
