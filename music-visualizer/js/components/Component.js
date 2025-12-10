import { makeElementDraggableAndResizeable } from "../helpers/dom.js";

export default class Component {
  constructor(x = 0, y = 0, w = 100, h = 100, context = null) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.context = context;

    this.container = this.makeContainer();
  }

  makeContainer() {
    let div = document.createElement("div");
    div.classList.add("highlight-on-hover");
    div.style.top = this.y + "px";
    div.style.left = this.x + "px";
    div.style.width = this.w + "px";
    div.style.height = this.h + "px";
    div.style.position = "absolute";
    document.body.appendChild(div);
    makeElementDraggableAndResizeable(div, ({ x, y, w, h }) => {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    });

    return div;
  }

  update() {}

  draw() {}
}
