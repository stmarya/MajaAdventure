/** Keyboard + virtual-button actions. Edges are consumed by a simulation tick. */
export class InputManager {
  constructor(target = window) {
    this._target = target;
    this._ditekan = new Set();
    this._virtual = new Map();
    this._aksiAktif = new Set(); this._aksiBaru = new Set(); this._aksiDilepas = new Set();
    this._peta = { ArrowLeft:"kiri", ArrowRight:"kanan", ArrowUp:"lompat", ArrowDown:"jongkok",
      KeyZ:"serang", KeyX:"lompat", Space:"lompat", KeyA:"kiri", KeyD:"kanan", KeyW:"lompat",
      KeyS:"jongkok", Escape:"pause", Enter:"konfirmasi" };
    this._keydown = e => {
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target?.tagName ?? "") || e.target?.isContentEditable) return;
      if (!this._peta[e.code]) return;
      e.preventDefault();
      if (this._ditekan.has(e.code)) return;
      this._ditekan.add(e.code); this._sync();
    };
    this._keyup = e => { this._ditekan.delete(e.code); this._sync(); };
    this._blur = () => this.reset();
    target.addEventListener("keydown", this._keydown);
    target.addEventListener("keyup", this._keyup);
    target.addEventListener("blur", this._blur);
  }
  _sync() {
    const next = new Set([...this._ditekan].map(k=>this._peta[k]).filter(Boolean));
    for (const action of this._virtual.values()) next.add(action);
    for (const action of next) if (!this._aksiAktif.has(action)) this._aksiBaru.add(action);
    for (const action of this._aksiAktif) if (!next.has(action)) this._aksiDilepas.add(action);
    this._aksiAktif = next;
  }
  setVirtual(source, action, pressed) {
    if (pressed) this._virtual.set(source, action); else this._virtual.delete(source);
    this._sync();
  }
  aktif(action) { return this._aksiAktif.has(action); }
  baruDitekan(action) { return this._aksiBaru.has(action); }
  baruDilepas(action) { return this._aksiDilepas.has(action); }
  akhirFrame() { this._aksiBaru.clear(); this._aksiDilepas.clear(); }
  reset() { this._ditekan.clear(); this._virtual.clear(); this._aksiAktif.clear(); this.akhirFrame(); }
  destroy() {
    this._target.removeEventListener("keydown", this._keydown);
    this._target.removeEventListener("keyup", this._keyup);
    this._target.removeEventListener("blur", this._blur); this.reset();
  }
}
