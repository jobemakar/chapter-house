import * as THREE from "three";
import { TOWN } from "./layout";
import { TownStream } from "./stream";

/** Lightweight flowing ribbon; its edges sample the exact navigation channel. */
export class TownWater {
  readonly root = new THREE.Group();
  private readonly shader: THREE.ShaderMaterial;
  private elapsed = 0;

  constructor() {
    this.root.name = "Curved flowing stream";
    const shore = new THREE.Mesh(
      this.ribbon(0.4, 0.026),
      new THREE.MeshStandardMaterial({ color: 0x728966, roughness: 1 }),
    );
    shore.receiveShadow = true;
    this.shader = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float time; varying vec2 vUv;
        void main(){
          float ripple=sin(vUv.x*320.0-time*1.6+sin(vUv.y*34.0+time*.4)*.4);
          float fleck=smoothstep(.5,.92,sin(vUv.y*53.0+vUv.x*71.0+time*.25));
          float glint=pow(max(0.0,ripple),24.0)*fleck*.045;
          float depth=sin(vUv.y*3.14159);
          vec3 color=mix(vec3(.30,.65,.67),vec3(.20,.49,.59),depth);
          float edge=1.0-smoothstep(.015,.07,min(vUv.y,1.0-vUv.y));
          float foam=edge*(.36+.12*sin(vUv.x*140.0-time*2.0));
          color=mix(color,vec3(.83,.97,.92),foam)+glint;
          gl_FragColor=vec4(color,.96);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.root.add(shore, new THREE.Mesh(this.ribbon(0, 0.075), this.shader));
  }

  update(dt: number, reduced: boolean) {
    if (!reduced) this.elapsed += Math.max(0, Math.min(dt, 0.1));
    this.shader.uniforms.time.value = this.elapsed;
  }

  private ribbon(extra: number, y: number) {
    const vertices: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    const samples = 240;
    for (let i = 0; i <= samples; i++) {
      const x = (i * TOWN.width) / samples;
      const bank = TownStream.bounds(x);
      vertices.push(x, y, bank.minZ - extra, x, y, bank.maxZ + extra);
      uv.push(i / samples, 0, i / samples, 1);
      if (i < samples) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}
