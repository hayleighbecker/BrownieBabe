//WHY IS IT RED????
const canvas = document.getElementById('brownie-canvas');
const decorations = document.querySelectorAll('.decor-item');
const sprinkles = document.querySelectorAll('.sprinkle-item');

let draggedItem = null;
let offsetX = 0, offsetY = 0;
let rotatingItem = null;
let isRotating = false;
let actionStack = [], redoStack = [];

function saveState() {
  const snapshot = [...canvas.querySelectorAll('.on-canvas')].map(el => ({ html: el.outerHTML }));
  actionStack.push(snapshot);
  if (actionStack.length > 50) actionStack.shift();
  redoStack = [];
}

function restoreState(stack) {
  if (!stack.length) return;
  const snapshot = stack.pop();
  redoStack.push([...canvas.querySelectorAll('.on-canvas')].map(el => el.outerHTML));
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
  item.setAttribute('draggable', 'true');
  item.classList.add('on-canvas');
  item.style.position = 'absolute';
  item.addEventListener('dragstart', onCanvasDragStart);
  item.addEventListener('mousedown', onMouseDown);
  item.addEventListener('mousemove', updateCursor);
  item.addEventListener('mouseleave', () => item.style.cursor = '');
}

function onPanelDragStart(e) {
  const item = e.target.closest('.decor-item, .sprinkle-item');
  if (!item) return;

  draggedItem = item.cloneNode(true);
  draggedItem.dataset.rotation = '0';
  draggedItem.setAttribute('draggable', 'true');
  bindCanvasEvents(draggedItem);

  // Initial style
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

  offsetX = 20; // center of decor
  offsetY = 20;
  e.dataTransfer.setData('text/plain', '');
}

decorations.forEach(item => item.addEventListener('dragstart', onPanelDragStart));
sprinkles.forEach(item => item.addEventListener('dragstart', onPanelDragStart));

canvas.addEventListener('dragover', e => e.preventDefault());
canvas.addEventListener('drop', e => {
  e.preventDefault();
  if (!draggedItem) return;
  const rect = canvas.getBoundingClientRect();
  draggedItem.style.left = `${e.clientX - rect.left - offsetX}px`;
  draggedItem.style.top = `${e.clientY - rect.top - offsetY}px`;
  canvas.appendChild(draggedItem);
  saveState();
  draggedItem = null;
});

function onCanvasDragStart(e) {
  draggedItem = e.target;
  const rect = draggedItem.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  e.dataTransfer.setData('text/plain', '');
}

function updateCursor(e) {
  const item = e.currentTarget;
  const rect = item.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width / 2);
  const dy = e.clientY - (rect.top + rect.height / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  item.style.cursor = distance > rect.width * 0.4 ? 'grab' : 'move';
}

function onMouseDown(e) {
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
    const onRotate = ev => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * (180 / Math.PI);
      rotatingItem.dataset.rotation = angle.toFixed(0);
      rotatingItem.style.transform = `rotate(${angle}deg)`;
    };
    const stopRotate = () => {
      isRotating = false;
      rotatingItem = null;
      saveState();
      window.removeEventListener('mousemove', onRotate);
      window.removeEventListener('mouseup', stopRotate);
    };
    window.addEventListener('mousemove', onRotate);
    window.addEventListener('mouseup', stopRotate);
  }
}


const clearBtn = document.getElementById('clearBtn');
clearBtn?.addEventListener('click', () => {
  if (confirm('Clear the canvas?')) {
    saveState();
    canvas.innerHTML = '';
  }
});


const undoBtn = document.getElementById('undoBtn');
undoBtn?.addEventListener('click', () => restoreState(actionStack));


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

// Reminder: Make popup menu for orders, send to owner's email, choose date
const submitBtn = document.getElementById('submitBtn');
submitBtn?.addEventListener('click', () => {
  html2canvas(canvas).then(canvasEl => {
    const link = document.createElement('a');
    link.download = 'brownie-design.png';
    link.href = canvasEl.toDataURL();
    link.click();
  });
});
