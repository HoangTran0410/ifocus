export function makeElementDraggableAndResizeable(
  element,
  onChange = () => {},
  onChangeFinish = () => {}
) {
  element.style.position = "absolute";
  element.style.cursor = "grab";
  element.style.left = element.offsetLeft + "px";
  element.style.top = element.offsetTop + "px";

  let pos = {
    x: element.offsetLeft,
    y: element.offsetTop,
    w: element.offsetWidth,
    h: element.offsetHeight,
  };

  // ==================== draggable ====================
  element.addEventListener("mousedown", startDrag);

  let isDragged = false;

  function startDrag(e) {
    e.preventDefault();
    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialLeft = element.offsetLeft;
    const initialTop = element.offsetTop;

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);

    element.style.cursor = "grabbing";

    function doDrag(event) {
      event.preventDefault();
      if (isResizing) return;
      pos.x = initialLeft + event.clientX - initialX;
      pos.y = initialTop + event.clientY - initialY;
      isDragged = true;
      update();
    }

    function stopDrag(event) {
      event.preventDefault();
      if (isDragged) {
        onChangeFinish(pos, element);
        isDragged = false;
      }

      element.style.cursor = "grab";
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    }
  }

  // ==================== resizable ====================
  let isResizing = false,
    resizeStartPos,
    resizeDirection;

  const resizeHandles = document.createElement("div");
  resizeHandles.style.cssText = `
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
  `;
  element.appendChild(resizeHandles);

  let size = 15;
  const names = [
    // [name, cursor, w, h, offsetTop, offsetLeft, offsetBottom, offsetRight, translateX, translateY]
    // edges
    ["top", "100%", "", "n-resize", 0, "50%", "", "", "-50%", "-50%"],
    ["bottom", "100%", "", "s-resize", "", "50%", 0, "", "-50%", "50%"],
    ["left", "", "100%", "w-resize", "50%", 0, "", "", "-50%", "-50%"],
    ["right", "", "100%", "e-resize", "50%", "", "", 0, "50%", "-50%"],
    // corners
    ["top-left", "", "", "nw-resize", 0, 0, "", "", "-50%", "-50%"],
    ["top-right", "", "", "ne-resize", 0, "", "", 0, "50%", "-50%"],
    ["bottom-left", "", "", "sw-resize", "", 0, 0, "", "-50%", "50%"],
    ["bottom-right", "", "", "se-resize", "", "", 0, 0, "50%", "50%"],
  ];
  names.forEach(
    ([name, w, h, cursor, top, left, bottom, right, tranX, tranY]) => {
      const handler = document.createElement("div");
      // handler.classList.add("resize-handle", name);
      handler.style.cssText = `
        width: ${w || size + "px"};
        height: ${h || size + "px"};
        background-color: #eee5;
        position: absolute;
        cursor: ${cursor};
        top: ${top};
        left: ${left};
        bottom: ${bottom};
        right: ${right};
        transform: translate3d(${tranX}, ${tranY}, 0);
      `;
      resizeHandles.appendChild(handler);

      handler.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isResizing = true;
        resizeStartPos = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          x: pos.x,
          y: pos.y,
          w: pos.w,
          h: pos.h,
        };
        resizeDirection = name;
      });
    }
  );

  document.addEventListener("mousemove", mousemove);
  document.addEventListener("mouseup", mouseup);

  function update() {
    element.style.width = `${pos.w}px`;
    element.style.height = `${pos.h}px`;
    element.style.left = `${pos.x}px`;
    element.style.top = `${pos.y}px`;

    onChange(pos, element);
  }

  function mousemove(e) {
    if (isResizing) {
      const { x, y, w, h, mouseX, mouseY } = resizeStartPos;
      const deltaX = e.clientX - mouseX;
      const deltaY = e.clientY - mouseY;

      if (resizeDirection.includes("top")) {
        pos.y = y + deltaY;
        pos.h = h - deltaY;
      }
      if (resizeDirection.includes("left")) {
        pos.x = x + deltaX;
        pos.w = w - deltaX;
      }
      if (resizeDirection.includes("bottom")) {
        pos.h = h + deltaY;
      }
      if (resizeDirection.includes("right")) {
        pos.w = w + deltaX;
      }

      pos.w = Math.max(20, pos.w);
      pos.h = Math.max(20, pos.h);

      update();
    }
  }

  function mouseup() {
    if (isResizing) {
      isResizing = false;
      onChangeFinish(pos, element);
    }
  }

  return {
    rollback() {
      element.removeEventListener("mousedown", startDrag);
      resizeHandles.remove();
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    },
  };
}
