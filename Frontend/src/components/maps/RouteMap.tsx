import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FlightTrackPoint, LiveFlight, RouteNode } from '../../types/domain';

interface RouteMapProps {
  nodes: RouteNode[];
  activeFlights?: LiveFlight[];
  selectedFlight?: LiveFlight;
  trackPoints?: FlightTrackPoint[];
}

interface GlobePoint {
  id: string;
  label: string;
  lat: number;
  lon: number;
  kind: 'airport' | 'waypoint' | 'traffic' | 'selected';
}

const globeRadius = 1.9;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const dayLightDirection = new THREE.Vector3(0.8, 0.35, 1).normalize();

export function RouteMap({ nodes, activeFlights = [], selectedFlight, trackPoints = [] }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const routePoints = useMemo(
    () =>
      nodes.map<GlobePoint>((node) => ({
        id: node.ident,
        label: node.ident,
        lat: node.lat,
        lon: node.lon,
        kind: node.type === 'waypoint' ? 'waypoint' : 'airport',
      })),
    [nodes],
  );
  const trackGlobePoints = useMemo(
    () =>
      trackPoints.map<GlobePoint>((point, index) => ({
        id: `${point.timestamp}-${index}`,
        label: `T${index + 1}`,
        lat: point.latitude,
        lon: point.longitude,
        kind: 'traffic',
      })),
    [trackPoints],
  );
  const trafficPoints = useMemo(
    () =>
      activeFlights.map<GlobePoint>((flight) => ({
        id: flight.id,
        label: flight.callsign ?? flight.id,
        lat: flight.latitude,
        lon: flight.longitude,
        kind: selectedFlight?.id === flight.id ? 'selected' : 'traffic',
      })),
    [activeFlights, selectedFlight?.id],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.2, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'globe-canvas';
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    const dataGroup = new THREE.Group();
    globeGroup.add(dataGroup);
    scene.add(globeGroup);

    const earthMaps = createEarthMaps();
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius, 144, 96),
      new THREE.MeshStandardMaterial({
        map: earthMaps.color,
        bumpMap: earthMaps.bump,
        bumpScale: 0.045,
        roughnessMap: earthMaps.roughness,
        roughness: 0.92,
        metalness: 0.0,
      }),
    );
    globeGroup.add(earth);

    const cloudLayer = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius * 1.013, 120, 84),
      new THREE.MeshStandardMaterial({
        map: earthMaps.clouds,
        transparent: true,
        opacity: 0.42,
        roughness: 0.95,
        depthWrite: false,
      }),
    );
    globeGroup.add(cloudLayer);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius * 1.04, 120, 84),
      new THREE.MeshBasicMaterial({
        color: 0x75d2ff,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    globeGroup.add(atmosphere);

    const ambient = new THREE.AmbientLight(0x8fa6bd, 0.52);
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.copy(dayLightDirection.clone().multiplyScalar(7));
    const fill = new THREE.DirectionalLight(0x7ab8ff, 0.5);
    fill.position.set(-3, -2, -4);
    scene.add(ambient, sun, fill);
    scene.add(createStars());

    const viewpoint = getViewpoint(nodes, selectedFlight);
    globeGroup.rotation.x = toRadians(viewpoint.lat * 0.32);
    globeGroup.rotation.y = -toRadians(viewpoint.lon);

    addArc(dataGroup, routePoints, 0x77d8ff, 0.018, 0.2);
    addArc(dataGroup, trackGlobePoints, 0xc4b5fd, 0.008, 0.09);
    routePoints.forEach((point, index) => {
      if (point.kind === 'waypoint' && index !== 0 && index !== routePoints.length - 1) return;
      addMarker(dataGroup, point);
    });
    trafficPoints.forEach((point) => addMarker(dataGroup, point));
    if (selectedFlight) {
      addMarker(dataGroup, {
        id: `selected-${selectedFlight.id}`,
        label: selectedFlight.callsign ?? selectedFlight.id,
        lat: selectedFlight.latitude,
        lon: selectedFlight.longitude,
        kind: 'selected',
      });
    }

    let frame = 0;
    let cameraDistance = 6;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const handlePointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.004;
      globeGroup.rotation.x = THREE.MathUtils.clamp(globeGroup.rotation.x, -1.2, 1.2);
    };
    const handlePointerUp = (event: PointerEvent) => {
      dragging = false;
      renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.004, 4.2, 8.5);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointercancel', handlePointerUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (!dragging) globeGroup.rotation.y += 0.00058;
      cloudLayer.rotation.y += 0.00042;
      camera.position.z += (cameraDistance - camera.position.z) * 0.08;
      dataGroup.children.forEach((child) => {
        if (child.userData.faceCamera) child.quaternion.copy(camera.quaternion);
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointercancel', handlePointerUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      container.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [nodes, routePoints, selectedFlight, trackGlobePoints, trafficPoints]);

  return (
    <div className="route-map globe-map" aria-label="Interactive 3D route globe">
      <div ref={containerRef} className="globe-stage" />
      <div className="globe-overlay">
        <span>3D Globe</span>
        <strong>{nodes[0]?.ident ?? 'Route'} to {nodes[nodes.length - 1]?.ident ?? 'Destination'}</strong>
      </div>
    </div>
  );
}

function addArc(group: THREE.Group, points: GlobePoint[], color: number, width: number, lift: number) {
  if (points.length < 2) return;

  const positions: THREE.Vector3[] = [];
  points.slice(0, -1).forEach((point, index) => {
    const start = latLonToVector(point.lat, point.lon, globeRadius + 0.02).normalize();
    const endPoint = points[index + 1];
    const end = latLonToVector(endPoint.lat, endPoint.lon, globeRadius + 0.02).normalize();
    const steps = 28;

    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      const curveLift = Math.sin(progress * Math.PI) * lift;
      positions.push(slerpUnitVectors(start, end, progress).multiplyScalar(globeRadius + 0.04 + curveLift));
    }
  });

  const curve = new THREE.CatmullRomCurve3(positions, false, 'catmullrom', 0.15);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(positions.length * 2, 80), width, 12, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
  );
  group.add(tube);
}

function addMarker(group: THREE.Group, point: GlobePoint) {
  const color = point.kind === 'selected' ? 0xff8f3f : point.kind === 'traffic' ? 0x8ee56d : point.kind === 'waypoint' ? 0xf5bd42 : 0xffffff;
  const size = point.kind === 'selected' ? 0.08 : point.kind === 'traffic' ? 0.036 : 0.05;
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(size, 18, 12),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: point.kind === 'selected' ? 0.62 : point.kind === 'traffic' ? 0.25 : 0.12,
      roughness: 0.45,
    }),
  );
  marker.position.copy(latLonToVector(point.lat, point.lon, globeRadius + 0.08));
  group.add(marker);

  if (point.kind === 'traffic' || point.kind === 'waypoint') return;

  const label = makeLabel(point.label, point.kind === 'selected' ? '#ffae6f' : '#edf6ff');
  label.position.copy(latLonToVector(point.lat, point.lon, globeRadius + 0.28));
  label.userData.faceCamera = true;
  group.add(label);
}

function makeLabel(text: string, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (context) {
    context.font = '700 34px Inter, Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 8;
    context.strokeStyle = 'rgba(3, 12, 21, 0.72)';
    context.fillStyle = color;
    context.strokeText(text, 128, 48);
    context.fillText(text, 128, 48);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(0.62, 0.23, 1);

  return sprite;
}

function latLonToVector(lat: number, lon: number, radius: number) {
  const latitude = toRadians(lat);
  const longitude = toRadians(lon);

  return new THREE.Vector3(
    radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * Math.cos(latitude) * Math.cos(longitude),
  );
}

function slerpUnitVectors(start: THREE.Vector3, end: THREE.Vector3, progress: number) {
  const dot = THREE.MathUtils.clamp(start.dot(end), -1, 1);
  const theta = Math.acos(dot) * progress;
  const relative = end.clone().sub(start.clone().multiplyScalar(dot)).normalize();

  if (!Number.isFinite(relative.x)) return start.clone().lerp(end, progress).normalize();

  return start.clone().multiplyScalar(Math.cos(theta)).add(relative.multiplyScalar(Math.sin(theta))).normalize();
}

function getViewpoint(nodes: RouteNode[], selectedFlight?: LiveFlight) {
  const focusPoints = selectedFlight ? [...nodes, { lat: selectedFlight.latitude, lon: selectedFlight.longitude }] : nodes;
  const fallback = nodes[0] ?? { lat: 20, lon: 0 };
  const lat = focusPoints.length ? average(focusPoints.map((point) => point.lat)) : fallback.lat;
  const lon = focusPoints.length ? averageLongitude(focusPoints.map((point) => point.lon)) : fallback.lon;

  return { lat, lon };
}

function createEarthMaps() {
  const width = 2048;
  const height = 1024;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  const cloudCanvas = document.createElement('canvas');
  colorCanvas.width = bumpCanvas.width = roughnessCanvas.width = cloudCanvas.width = width;
  colorCanvas.height = bumpCanvas.height = roughnessCanvas.height = cloudCanvas.height = height;

  const colorCtx = colorCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');
  const roughCtx = roughnessCanvas.getContext('2d');
  const cloudCtx = cloudCanvas.getContext('2d');
  if (!colorCtx || !bumpCtx || !roughCtx || !cloudCtx) {
    const fallback = new THREE.CanvasTexture(colorCanvas);
    return { color: fallback, bump: fallback, roughness: fallback, clouds: fallback };
  }

  const color = colorCtx.createImageData(width, height);
  const bump = bumpCtx.createImageData(width, height);
  const rough = roughCtx.createImageData(width, height);
  const clouds = cloudCtx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    const latitude = 90 - (y / height) * 180;
    const latFactor = Math.cos(toRadians(latitude));
    const ice = Math.max(0, (Math.abs(latitude) - 62) / 20);

    for (let x = 0; x < width; x += 1) {
      const longitude = (x / width) * 360 - 180;
      const index = (y * width + x) * 4;

      const continents = fbm(longitude * 0.012, latitude * 0.018, 5, 2.1, 0.55);
      const ridges = ridgeNoise(longitude * 0.03, latitude * 0.03, 4);
      const climate = fbm(longitude * 0.02 + 50, latitude * 0.022 - 100, 3, 2, 0.6);
      const isLand = continents + ridges * 0.12 > 0.48;
      const coastlineBlend = THREE.MathUtils.clamp((continents - 0.45) / 0.1, 0, 1);

      let r = 14;
      let g = 68;
      let b = 128;
      if (isLand) {
        const elevation = THREE.MathUtils.clamp((continents - 0.48) * 2.7 + ridges * 0.35, 0, 1);
        const dryness = THREE.MathUtils.clamp((1 - Math.abs(latFactor - 0.65) * 1.25) * (0.45 + climate * 0.6), 0, 1);
        const green = THREE.MathUtils.clamp(0.78 - dryness * 0.7, 0.12, 0.85);
        r = Math.round(70 + elevation * 75 + dryness * 45);
        g = Math.round(95 + green * 90 + elevation * 24);
        b = Math.round(50 + elevation * 35 + dryness * 18);
      } else {
        const depth = THREE.MathUtils.clamp((0.47 - continents) * 2, 0, 1);
        r = Math.round(7 + depth * 12);
        g = Math.round(45 + depth * 28);
        b = Math.round(98 + depth * 70);
      }

      if (!isLand) {
        r = Math.round(r + coastlineBlend * 8);
        g = Math.round(g + coastlineBlend * 16);
        b = Math.round(b + coastlineBlend * 18);
      }

      if (ice > 0) {
        const blend = THREE.MathUtils.clamp(ice * (0.7 + (isLand ? 0.2 : 0.1)), 0, 0.9);
        r = Math.round(r * (1 - blend) + 232 * blend);
        g = Math.round(g * (1 - blend) + 240 * blend);
        b = Math.round(b * (1 - blend) + 248 * blend);
      }

      const cloudNoise = fbm(longitude * 0.03 + 220, latitude * 0.03 - 90, 6, 2, 0.5);
      const cloudMask = THREE.MathUtils.clamp((cloudNoise - 0.58) * 2.7, 0, 1);

      color.data[index] = r;
      color.data[index + 1] = g;
      color.data[index + 2] = b;
      color.data[index + 3] = 255;

      const elevationForBump = isLand ? 145 + Math.round(ridges * 95) : 84 + Math.round(coastlineBlend * 22);
      bump.data[index] = elevationForBump;
      bump.data[index + 1] = elevationForBump;
      bump.data[index + 2] = elevationForBump;
      bump.data[index + 3] = 255;

      const roughnessValue = isLand ? 180 - Math.round(ridges * 58) : 62 + Math.round(coastlineBlend * 12);
      rough.data[index] = roughnessValue;
      rough.data[index + 1] = roughnessValue;
      rough.data[index + 2] = roughnessValue;
      rough.data[index + 3] = 255;

      const cloudValue = Math.round(230 + cloudMask * 25);
      const alpha = Math.round(cloudMask * 186);
      clouds.data[index] = cloudValue;
      clouds.data[index + 1] = cloudValue;
      clouds.data[index + 2] = cloudValue;
      clouds.data[index + 3] = alpha;
    }
  }

  colorCtx.putImageData(color, 0, 0);
  bumpCtx.putImageData(bump, 0, 0);
  roughCtx.putImageData(rough, 0, 0);
  cloudCtx.putImageData(clouds, 0, 0);

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  const roughTexture = new THREE.CanvasTexture(roughnessCanvas);
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  [colorTexture, bumpTexture, roughTexture, cloudTexture].forEach((texture) => {
    texture.anisotropy = 8;
  });

  return { color: colorTexture, bump: bumpTexture, roughness: roughTexture, clouds: cloudTexture };
}

function createStars() {
  const points = Array.from({ length: 420 }, () => {
    const vector = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(18),
      THREE.MathUtils.randFloatSpread(12),
      THREE.MathUtils.randFloatSpread(10) - 6,
    );

    return vector;
  });

  return new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.018, transparent: true, opacity: 0.55 }),
  );
}

function fbm(x: number, y: number, octaves: number, lacunarity: number, gain: number) {
  let amplitude = 0.5;
  let frequency = 1;
  let value = 0;
  for (let index = 0; index < octaves; index += 1) {
    value += amplitude * valueNoise(x * frequency, y * frequency);
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return value;
}

function ridgeNoise(x: number, y: number, octaves: number) {
  let amplitude = 0.58;
  let frequency = 1;
  let value = 0;
  for (let index = 0; index < octaves; index += 1) {
    const n = 1 - Math.abs(valueNoise(x * frequency, y * frequency) * 2 - 1);
    value += n * amplitude;
    frequency *= 2.12;
    amplitude *= 0.45;
  }
  return value;
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);
  const n0 = random2d(x0, y0);
  const n1 = random2d(x1, y0);
  const ix0 = lerp(n0, n1, sx);
  const n2 = random2d(x0, y1);
  const n3 = random2d(x1, y1);
  const ix1 = lerp(n2, n3, sx);
  return lerp(ix0, ix1, sy);
}

function random2d(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageLongitude(longitudes: number[]) {
  const vectors = longitudes.map((longitude) => toRadians(longitude));
  const x = vectors.reduce((sum, longitude) => sum + Math.cos(longitude), 0) / vectors.length;
  const y = vectors.reduce((sum, longitude) => sum + Math.sin(longitude), 0) / vectors.length;

  return (Math.atan2(y, x) * 180) / Math.PI;
}
