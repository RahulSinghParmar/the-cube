import {
  affected,
  geometry,
  transform,
  type CubeState,
  type Move,
  type RendererPort,
  type Vector,
} from "../../../packages/cube-core/src/index";

// Narrow boundary for the retained Three.js runtime; domain modules never import it.
interface XYZ {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): void;
}
interface Object3D {
  position: XYZ;
  rotation: XYZ;
  add(...objects: Object3D[]): void;
  remove(object: Object3D): void;
  children: Object3D[];
}
interface Disposable {
  dispose(): void;
}
interface Camera extends Object3D {
  aspect: number;
  lookAt(target: unknown): void;
  updateProjectionMatrix(): void;
}
interface WebGL {
  domElement: HTMLCanvasElement;
  setSize(w: number, h: number): void;
  setPixelRatio(ratio: number): void;
  render(scene: Object3D, camera: Camera): void;
  dispose(): void;
  forceContextLoss(): void;
}
interface ThreeAPI {
  Object3D: new () => Object3D;
  Scene: new () => Object3D;
  Vector3: new (x?: number, y?: number, z?: number) => unknown;
  PerspectiveCamera: new (
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ) => Camera;
  WebGLRenderer: new (options: { antialias: boolean; alpha: boolean }) => WebGL;
  BoxGeometry: new (x: number, y: number, z: number) => Disposable;
  PlaneGeometry: new (w: number, h: number) => Disposable;
  MeshBasicMaterial: new (options: {
    color?: string;
    map?: Disposable;
    transparent?: boolean;
  }) => Disposable;
  CanvasTexture: new (canvas: HTMLCanvasElement) => Disposable;
  Mesh: new (geometry: Disposable, material: Disposable) => Object3D;
}
const colors: Record<string, string> = {
  U: "#f5f6ef",
  R: "#ed5b45",
  F: "#43b88b",
  D: "#f4ce4b",
  L: "#ef953f",
  B: "#4d85dc",
};
export class ThreeRenderer implements RendererPort {
  private api: ThreeAPI;
  private scene: Object3D;
  private camera: Camera;
  private renderer: WebGL;
  private view: Object3D;
  private group: Object3D;
  private entries: { object: Object3D; position: Vector }[] = [];
  private resources: Disposable[] = [];
  private resizeObserver: ResizeObserver;
  private disposed = false;
  private frame = 0;
  private cancelAnimation: (() => void) | null = null;
  private state: CubeState | null = null;
  private drag: { id: number; x: number; y: number } | null = null;
  constructor(
    private host: HTMLElement,
    private options: { reducedMotion: boolean; labels: boolean },
  ) {
    this.api = (window as unknown as { THREE: ThreeAPI }).THREE;
    const T = this.api;
    this.scene = new T.Scene();
    this.view = new T.Object3D();
    this.group = new T.Object3D();
    this.scene.add(this.view);
    this.view.add(this.group);
    this.camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(6, 5, 7);
    this.camera.lookAt(new T.Vector3());
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(this.renderer.domElement);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    host.addEventListener("pointerdown", this.down);
    host.addEventListener("pointermove", this.move);
    host.addEventListener("pointerup", this.up);
    host.addEventListener("pointercancel", this.up);
  }
  private down = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    this.host.setPointerCapture(event.pointerId);
  };
  private move = (event: PointerEvent) => {
    if (this.drag?.id !== event.pointerId) return;
    this.view.rotation.y += (event.clientX - this.drag.x) * 0.007;
    this.view.rotation.x = Math.max(
      -1.4,
      Math.min(
        1.4,
        this.view.rotation.x + (event.clientY - this.drag.y) * 0.007,
      ),
    );
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    this.draw();
  };
  private up = () => {
    this.drag = null;
  };
  resetView(): void {
    this.view.rotation.set(0, 0, 0);
    this.draw();
  }
  configure(options: { reducedMotion: boolean; labels: boolean }): void {
    this.options = options;
    if (this.state) this.setState(this.state);
  }
  private draw(): void {
    if (!this.disposed) this.renderer.render(this.scene, this.camera);
  }
  private resize(): void {
    const w = Math.max(1, this.host.clientWidth),
      h = Math.max(1, this.host.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.draw();
  }
  setState(state: CubeState): void {
    if (this.disposed) return;
    this.state = state;
    this.view.remove(this.group);
    this.resources.forEach((r) => r.dispose());
    this.resources = [];
    const T = this.api;
    this.group = new T.Object3D();
    this.view.add(this.group);
    this.entries = [];
    const step = 3 / state.size,
      box = new T.BoxGeometry(step * 0.94, step * 0.94, step * 0.94),
      plane = new T.PlaneGeometry(step * 0.8, step * 0.8),
      dark = new T.MeshBasicMaterial({ color: "#182131" });
    this.resources.push(box, plane, dark);
    const materials: Record<string, Disposable> = {};
    for (const [face, color] of Object.entries(colors)) {
      if (this.options.labels) {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = "#122035";
        ctx.font = "bold 64px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(face, 64, 67);
        const texture = new T.CanvasTexture(canvas);
        this.resources.push(texture);
        materials[face] = new T.MeshBasicMaterial({ map: texture });
      } else materials[face] = new T.MeshBasicMaterial({ color });
      this.resources.push(materials[face]!);
    }
    const m = state.size - 1;
    for (let x = -m; x <= m; x += 2)
      for (let y = -m; y <= m; y += 2)
        for (let z = -m; z <= m; z += 2) {
          if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) !== m) continue;
          const object = new T.Mesh(box, dark);
          object.position.set((x * step) / 2, (y * step) / 2, (z * step) / 2);
          this.group.add(object);
          this.entries.push({ object, position: [x, y, z] });
        }
    geometry(state.size).forEach((sticker, i) => {
      const object = new T.Mesh(plane, materials[state.facelets[i]!]!);
      const [x, y, z] = sticker.position,
        [nx, ny, nz] = sticker.normal;
      object.position.set(
        (x * step) / 2 + nx * step * 0.48,
        (y * step) / 2 + ny * step * 0.48,
        (z * step) / 2 + nz * step * 0.48,
      );
      if (nx) object.rotation.y = (nx * Math.PI) / 2;
      else if (ny) object.rotation.x = (-ny * Math.PI) / 2;
      else if (nz < 0) object.rotation.y = Math.PI;
      this.group.add(object);
      this.entries.push({ object, position: sticker.position });
    });
    this.draw();
  }
  animate(before: CubeState, move: Move, after: CubeState): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("Renderer disposed"));
    if (this.options.reducedMotion) {
      this.setState(after);
      return Promise.resolve();
    }
    this.setState(before);
    const pivot = new this.api.Object3D();
    this.group.add(pivot);
    for (const entry of this.entries)
      if (affected(entry.position, move, before.size)) {
        this.group.remove(entry.object);
        pivot.add(entry.object);
      }
    const { axis, angle } = transform(move),
      name = (["x", "y", "z"] as const)[axis],
      start = performance.now();
    return new Promise((resolve, reject) => {
      this.cancelAnimation = () => reject(new Error("Animation cancelled"));
      const tick = (now: number) => {
        if (this.disposed) return;
        const t = Math.min(1, (now - start) / 170);
        pivot.rotation[name] = angle * (1 - Math.pow(1 - t, 3));
        this.draw();
        if (t < 1) this.frame = requestAnimationFrame(tick);
        else {
          this.cancelAnimation = null;
          this.frame = 0;
          this.setState(after);
          resolve();
        }
      };
      this.frame = requestAnimationFrame(tick);
    });
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.cancelAnimation?.();
    this.resources.forEach((r) => r.dispose());
    this.resizeObserver.disconnect();
    this.host.removeEventListener("pointerdown", this.down);
    this.host.removeEventListener("pointermove", this.move);
    this.host.removeEventListener("pointerup", this.up);
    this.host.removeEventListener("pointercancel", this.up);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
