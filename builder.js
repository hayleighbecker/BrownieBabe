// Enable drag & drop, rotation, and canvas controls
const decorations = document.querySelectorAll('.decor-item');
const sprinkles = document.querySelectorAll('.sprinkle-item');
const canvas = document.getElementById('brownie-canvas');

let draggedItem = null;
let offsetX = 0;
let offsetY = 0;
let rotatingItem = null;
let isRotating = false;
let resizing = false;
let selectedZone = null;
let startX = 0;
let startY = 0;
let actionStack = [];
let redoStack = [];

function saveState() {
  const items = canvas.querySelectorAll('.on-canvas');
  const snapshot = [];
  items.forEach(item => {
    snapshot.push({
      html: item.outerHTML
    });
  });
  actionStack.push(snapshot);
  if (actionStack.length > 50) actionStack.shift();
  redoStack = [];
}

function restoreState(stack) {
  if (!stack.length) return;
  const snapshot = stack.pop();
  redoStack.push([...canvas.querySelectorAll('.on-canvas')].map(item => item.outerHTML));
  canvas.innerHTML = '';
  snapshot.forEach(obj => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = obj.html;
    const el = wrapper.firstChild;
    bindCanvasEvents(el);
    canvas.appendChild(el);
  });
}

function bindCanvasEvents(item) {
  item.addEventListener('dragstart', handleCanvasItemDragStart);
  item.addEventListener('mousedown', handleMouseDown);
  item.addEventListener('mousemove', handleHoverCursor);
  item.addEventListener('mouseleave', () => item.style.cursor = '');
  item.setAttribute('draggable', 'true');
  item.classList.add('on-canvas');
  item.style.position = 'absolute';
}

function handlePanelDragStart(e) {
  const item = e.target.closest('.decor-item, .sprinkle-item');
  if (!item) return;

  draggedItem = item.cloneNode(true);
  draggedItem.dataset.rotation = '0';
  bindCanvasEvents(draggedItem);
  draggedItem.style.left = '0px';
  draggedItem.style.top = '0px';
  if (item.classList.contains('sprinkle-item')) {
    draggedItem.classList.add('sprinkle-zone');
    draggedItem.style.width = '80px';
    draggedItem.style.height = '80px';
    draggedItem.style.backgroundSize = 'contain';
    draggedItem.style.resize = 'both';
    draggedItem.style.overflow = 'hidden';
  }
  e.dataTransfer.setData('text/plain', '');
}

[...decorations, ...sprinkles].forEach(item => {
  item.addEventListener('dragstart', handlePanelDragStart);
});

canvas.addEventListener('dragover', (e) => e.preventDefault());

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!draggedItem) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - offsetX;
  const y = e.clientY - rect.top - offsetY;
  draggedItem.style.left = `${x}px`;
  draggedItem.style.top = `${y}px`;
  if (!canvas.contains(draggedItem)) canvas.appendChild(draggedItem);
  saveState();
  draggedItem = null;
});

function handleCanvasItemDragStart(e) {
  draggedItem = e.target;
  const rect = draggedItem.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  e.dataTransfer.setData('text/plain', '');
}

function handleHoverCursor(e) {
  const item = e.currentTarget;
  const rect = item.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  const dy = e.clientY - (rect.top + rect.height / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  item.style.cursor = distance > rect.width * 0.4 ? 'grab' : 'move';
}

function handleMouseDown(e) {
  const item = e.currentTarget;
  const rect = item.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = e.clientX - centerX;
  const dy = e.clientY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > rect.width * 0.4) {
    isRotating = true;
    rotatingItem = item;
    function rotateMouseMove(ev) {
      const x = ev.clientX - centerX;
      const y = ev.clientY - centerY;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      rotatingItem.dataset.rotation = angle.toFixed(0);
      rotatingItem.style.transform = `rotate(${angle}deg)`;
    }
    function rotateMouseUp() {
      isRotating = false;
      rotatingItem = null;
      saveState();
      window.removeEventListener('mousemove', rotateMouseMove);
      window.removeEventListener('mouseup', rotateMouseUp);
    }
    window.addEventListener('mousemove', rotateMouseMove);
    window.addEventListener('mouseup', rotateMouseUp);
  }
}

// Clear
const clearBtn = document.getElementById('clearBtn');
clearBtn?.addEventListener('click', () => {
  if (confirm('Clear the canvas?')) {
    saveState();
    canvas.innerHTML = '';
  }
});

// Undo
const undoBtn = document.getElementById('undoBtn');
undoBtn?.addEventListener('click', () => {
  restoreState(actionStack);
});

// Redo
const redoBtn = document.getElementById('redoBtn');
redoBtn?.addEventListener('click', () => {
  if (!redoStack.length) return;
  const snapshot = redoStack.pop();
  actionStack.push([...canvas.querySelectorAll('.on-canvas')].map(item => item.outerHTML));
  canvas.innerHTML = '';
  snapshot.forEach(html => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const el = wrapper.firstChild;
    bindCanvasEvents(el);
    canvas.appendChild(el);
  });
});

// Submit
const submitBtn = document.getElementById('submitBtn');
submitBtn?.addEventListener('click', () => {
  html2canvas(canvas).then(canvasEl => {
    const link = document.createElement('a');
    link.download = 'brownie-design.png';
    link.href = canvasEl.toDataURL();
    link.click();
  });
});
