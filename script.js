// --- Utils ---
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// --- Simplex Noise Implementation ---
const SimplexNoise = (function() {
    function SimplexNoise(random) {
        if (!random) random = Math.random;
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for (let i = 0; i < 256; i++) this.p[i] = Math.floor(random() * 256);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    SimplexNoise.prototype = {
        grad3: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]),
        noise3D: function(xin, yin, zin) {
            let permMod12 = this.permMod12, perm = this.perm, grad3 = this.grad3;
            let n0, n1, n2, n3;
            const F3 = 1.0 / 3.0, G3 = 1.0 / 6.0;
            let s = (xin + yin + zin) * F3;
            let i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
            let t = (i + j + k) * G3;
            let X0 = i - t, Y0 = j - t, Z0 = k - t;
            let x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;
            let i1, j1, k1, i2, j2, k2;
            if (x0 >= y0) {
                if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } 
                else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } 
                else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } 
            } else {
                if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } 
                else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } 
                else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } 
            }
            let x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
            let x2 = x0 - i2 + 2.0 * G3, y2 = y0 - j2 + 2.0 * G3, z2 = z0 - k2 + 2.0 * G3;
            let x3 = x0 - 1.0 + 3.0 * G3, y3 = y0 - 1.0 + 3.0 * G3, z3 = z0 - 1.0 + 3.0 * G3;
            let ii = i & 255, jj = j & 255, kk = k & 255;
            let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if (t0 < 0) n0 = 0.0;
            else {
                let gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
                t0 *= t0;
                n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
            }
            let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if (t1 < 0) n1 = 0.0;
            else {
                let gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
                t1 *= t1;
                n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
            }
            let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if (t2 < 0) n2 = 0.0;
            else {
                let gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
                t2 *= t2;
                n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
            }
            let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if (t3 < 0) n3 = 0.0;
            else {
                let gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
                t3 *= t3;
                n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
            }
            return 32.0 * (n0 + n1 + n2 + n3);
        }
    };
    return SimplexNoise;
})();

const PerlinNoise = (function() {
    function PerlinNoise(random) {
        if (!random) random = Math.random;
        this.p = new Uint8Array(512);
        this.permutation = new Uint8Array(256);
        for (let i = 0; i < 256; i++) this.permutation[i] = Math.floor(random() * 256);
        for (let i = 0; i < 512; i++) this.p[i] = this.permutation[i & 255];
    }
    PerlinNoise.prototype = {
        lerp: function(a, b, t) { return a + t * (b - a); },
        fade: function(t) { return t * t * t * (t * (t * 6 - 15) + 10); },
        grad: function(hash, x, y, z) {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        },
        noise3D: function(x, y, z) {
            let X = Math.floor(x) & 255;
            let Y = Math.floor(y) & 255;
            let Z = Math.floor(z) & 255;
            x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
            let u = this.fade(x), v = this.fade(y), w = this.fade(z);
            let P = this.p;
            let A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
            return this.lerp(this.lerp(this.lerp(this.grad(P[AA], x, y, z), this.grad(P[BA], x - 1, y, z), u), this.lerp(this.grad(P[AB], x, y - 1, z), this.grad(P[BB], x - 1, y - 1, z), u), v), this.lerp(this.lerp(this.grad(P[AA + 1], x, y, z - 1), this.grad(P[BA + 1], x - 1, y, z - 1), u), this.lerp(this.grad(P[AB + 1], x, y - 1, z - 1), this.grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w) * 1.5;
        }
    };
    return PerlinNoise;
})();

const WorleyNoise = (function() {
    function WorleyNoise(random) {
        this.random = random;
        this.numFeatures = 100;
        this.features = [];
        for (let i = 0; i < this.numFeatures; i++) this.features.push(new THREE.Vector3(this.random() * 4 - 2, this.random() * 4 - 2, this.random() * 4 - 2));
    }
    WorleyNoise.prototype = {
        noise3D: function(x, y, z) {
            let minDst = Infinity; const p = new THREE.Vector3(x, y, z);
            for (let i = 0; i < this.numFeatures; i++) {
                const d = p.distanceTo(this.features[i]);
                if (d < minDst) minDst = d;
            }
            return minDst * 2 - 1;
        }
    };
    return WorleyNoise;
})();

const ValueNoise = (function() {
    function ValueNoise(random) {
        this.p = new Uint8Array(512);
        this.permutation = new Uint8Array(256);
        for (let i = 0; i < 256; i++) this.permutation[i] = Math.floor(random() * 256);
        for (let i = 0; i < 512; i++) this.p[i] = this.permutation[i & 255];
    }
    ValueNoise.prototype = {
        lerp: function(a, b, t) { return a + t * (b - a); },
        fade: function(t) { return t * t * t * (t * (t * 6 - 15) + 10); },
        hash: function(x, y, z) {
            let X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
            return this.p[this.p[this.p[X] + Y] + Z] / 255;
        },
        noise3D: function(x, y, z) {
            let X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
            x -= X; y -= Y; z -= Z;
            let u = this.fade(x), v = this.fade(y), w = this.fade(z);
            let c000 = this.hash(X, Y, Z), c100 = this.hash(X + 1, Y, Z), c010 = this.hash(X, Y + 1, Z), c110 = this.hash(X + 1, Y + 1, Z);
            let c001 = this.hash(X, Y, Z + 1), c101 = this.hash(X + 1, Y, Z + 1), c011 = this.hash(X, Y + 1, Z + 1), c111 = this.hash(X + 1, Y + 1, Z + 1);
            return this.lerp(this.lerp(this.lerp(c000, c100, u), this.lerp(c010, c110, u), v), this.lerp(this.lerp(c001, c101, u), this.lerp(c011, c111, u), v), w) * 2 - 1;
        }
    };
    return ValueNoise;
})();

const TurbulenceNoise = (function() {
    function TurbulenceNoise(noiseGenConstructor, random) { this.noiseGen = new noiseGenConstructor(random); }
    TurbulenceNoise.prototype = { noise3D: function(x, y, z) { return Math.abs(this.noiseGen.noise3D(x, y, z)); } };
    return TurbulenceNoise;
})();

const RidgedMultifractalNoise = (function() {
    function RidgedMultifractalNoise(noiseGenConstructor, random) { this.noiseGen = new noiseGenConstructor(random); }
    RidgedMultifractalNoise.prototype = { noise3D: function(x, y, z) { let n = this.noiseGen.noise3D(x, y, z); n = 1 - Math.abs(n); n *= n; return n * 2 - 1; } };
    return RidgedMultifractalNoise;
})();

document.addEventListener('DOMContentLoaded', () => {

    const mathPresets = [
        { name: 'Ripple (Sine/Cos)', formula: 'sin(x*a) * cos(z*b) * c', vars: {a:1, b:1, c:1} },
        { name: 'Waves (Radial)', formula: 'sin(sqrt(x*x + z*z) * a) * c', vars: {a:2, b:1, c:0.5} },
        { name: 'Saddle (Hyperbolic)', formula: '(x*x - z*z) * c * 0.2', vars: {a:1, b:1, c:1} },
        { name: 'Paraboloid', formula: '-(x*x + z*z) * c * 0.1', vars: {a:1, b:1, c:1} },
        { name: 'Pyramid', formula: '1 - max(abs(x), abs(z)) * c', vars: {a:1, b:1, c:0.5} }
    ];

    const paramPresets = [
        { name: 'Klein Bottle (Fig-8)', x: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * cos(u)', y: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * sin(u)', z: 'sin(u/2)*sin(v) + cos(u/2)*sin(2*v)', uMin: 0, uMax: 6.28, vMin: 0, vMax: 6.28 },
        { name: 'Torus', x: '(2 + 0.5*cos(v)) * cos(u)', y: '(2 + 0.5*cos(v)) * sin(u)', z: '0.5 * sin(v)', uMin: 0, uMax: 6.28, vMin: 0, vMax: 6.28 },
        { name: 'Mobius Strip', x: '(1 + (v/2)*cos(u/2)) * cos(u)', y: '(1 + (v/2)*cos(u/2)) * sin(u)', z: '(v/2) * sin(u/2)', uMin: 0, uMax: 6.28, vMin: -1, vMax: 1 },
        { name: 'Helicoid', x: 'v * cos(u)', y: 'v * sin(u)', z: 'u * 0.5', uMin: 0, uMax: 12, vMin: -2, vMax: 2 },
        { name: 'Sphere', x: 'cos(u) * sin(v)', y: 'sin(u) * sin(v)', z: 'cos(v)', uMin: 0, uMax: 6.28, vMin: 0, vMax: 3.14 },
        { name: 'Dini Surface', x: 'cos(u) * sin(v)', y: 'sin(u) * sin(v)', z: 'cos(v) + log(tan(v/2)) + 0.2*u', uMin: 0, uMax: 6.28, vMin: 0.1, vMax: 2 }
    ];

    const container = document.getElementById('canvas-container');
    let scene, camera, renderer, controls;
    let mainMeshGroup = null;
    let originalGeometry = null; 
    let simplex = new SimplexNoise();
    let matWireShader = null; 

    const presets = [null, null, null, null, null];
    const sphereTypes = ['sphere', 'sphere-circles', 'icosahedron', 'tetrahedron', 'octahedron', 'dodecahedron'];

    const shapeConfig = {
        icosahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        tetrahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        octahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        dodecahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        cube: { params: [{ name: 'Width', def: 2, min: 0.1, max: 5, type: 'float', step: 0.1 }, { name: 'Height', def: 2, min: 0.1, max: 5, type: 'float', step: 0.1 }, { name: 'Depth', def: 2, min: 0.1, max: 5, type: 'float', step: 0.1 }, { name: 'Segs X', def: 5, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Segs Y', def: 5, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Segs Z', def: 5, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Spline', def: 1, min: 0, max: 1, type: 'bool', step: 1 }] },
        sphere: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Width Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Height Segs', def: 20, min: 2, max: 64, type: 'int', step: 1 }] },
        'sphere-circles': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Resolution', def: 48, min: 8, max: 128, type: 'int', step: 2 }, { name: 'Loop Density', def: 8, min: 3, max: 20, type: 'int', step: 1 }] },
        torus: { params: [{ name: 'Radius', def: 1.5, min: 0.5, max: 3, type: 'float', step: 0.1 }, { name: 'Tube', def: 0.5, min: 0.1, max: 1, type: 'float', step: 0.1 }, { name: 'Radial Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Tubular Segs', def: 40, min: 3, max: 100, type: 'int', step: 1 }] },
        math: { params: [{ name: 'Range', def: 5, min: 1, max: 20, type: 'float', step: 1 }, { name: 'Segments', def: 30, min: 5, max: 100, type: 'int', step: 1 }] },
        parametric: { params: [{ name: 'U Min', def: 0, min: -10, max: 10, type: 'float', step: 0.1 }, { name: 'U Max', def: 6.28, min: -10, max: 20, type: 'float', step: 0.1 }, { name: 'V Min', def: 0, min: -10, max: 10, type: 'float', step: 0.1 }, { name: 'V Max', def: 6.28, min: -10, max: 20, type: 'float', step: 0.1 }, { name: 'Segments', def: 60, min: 10, max: 150, type: 'int', step: 1 }] },
        landscape: { params: [{ name: 'Width', def: 3, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Height', def: 3, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Width Segs', def: 60, min: 10, max: 200, type: 'int', step: 1 }, { name: 'Height Segs', def: 60, min: 10, max: 200, type: 'int', step: 1 }] },
        grid: { params: [{ name: 'Width', def: 5, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Height', def: 5, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Width Segs', def: 20, min: 2, max: 100, type: 'int', step: 1 }, { name: 'Height Segs', def: 20, min: 2, max: 100, type: 'int', step: 1 }, { name: 'Spline', def: 0, min: 0, max: 1, type: 'bool', step: 1 }] },
        custom: { params: [] }
    };
    
    // Geometry Defaults for Smart Rendering
    const geoDefaults = {
        cube: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        tetrahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        octahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        dodecahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        icosahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        grid: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        sphere: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-circles': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        torus: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        cylinder: { epsilon: 0.02, bias: 0, inflate: 0, splineRes: 4 },
        cone: { epsilon: 0, bias: 0, inflate: 0, splineRes: 4 },
        ring: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        landscape: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 3 },
        math: { epsilon: 0.01, bias: 0, inflate: 0.001, splineRes: 3 },
        parametric: { epsilon: 0.05, bias: 1.0, inflate: 0, splineRes: 3 },
        custom: { epsilon: 0.05, bias: 1.0, inflate: 0, splineRes: 2 }
    };

    const state = {
        geoType: 'cube', 
        geoParams: [],
        solidSubdiv: 2, 
        mathFormula: 'sin(x*a) * cos(z*b) * c',
        mathVars: { a: 1.0, b: 1.0, c: 1.0 },
        parametricFormulas: { x: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * cos(u)', y: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * sin(u)', z: 'sin(u/2)*sin(v) + cos(u/2)*sin(2*v)' },
        landscape: { seed: 68, noiseType: 'simplex', amplitude: 1.5, frequency: 0.05, octaves: 4, persistence: 0.5, lacunarity: 2.0, seaLevel: 0.0, noiseScale: 4.9 },
        objRot: { x: 0, y: 0, z: 0 },
        clip: { enabled: false, axis: 'x', pos: 0 },
        spline: { force: false, subdiv: 12 },
        gridUV: { u: true, v: true },
        noise: { enabled: false, noiseType: 'simplex', amp: 0.2, freq: 1.0, axis: 'all', seed: 1 },
        twist: { enabled: false, angle: 1.0, axis: 'y' },
        wave:  { enabled: false, int: 0.5, freq: 2.0, axis: 'z' },
        bulge: { enabled: false, str: 0.5, axis: 'all' },
        bend:  { enabled: false, amt: 0.5, axis: 'y' },
        taper: { enabled: false, amt: 0.5, axis: 'y' },
        ripple:{ enabled: false, amp: 0.2, freq: 5.0, axis: 'y' },
        spherify: { enabled: false, str: 0.5 },
        skew: { enabled: false, amt: 0.5, axis: 'y' },
        deformationOrder: ['noise', 'twist', 'wave', 'bulge', 'bend', 'taper', 'ripple', 'spherify', 'skew'],
        reorderMode: false,
        cam: { x: 4, y: 3, z: 5, rotX: 0, rotY: 0, fov: 45, target: {x: 0, y: 0, z: 0} },
        autoRotate: false,
        svgPreview: false,
        style: 'hidden-line', 
        hiddenSettings: { bias: 0, epsilon: 0.01, splineRes: 4, inflate: 0, minLen: 0 },
        occlusionMethod: 'gpu',
        gpuGridSize: 1,
        gpuDepthMap: null,
        legacyHiddenLine: false,
        properOrder: false,
        zDepth: { color: false, opacity: false, dof: false },
        gradMode: 'camera', 
        gradRot: { x: 0, y: 0 }, 
        baseColor: '#007aff', colorNear: '#ff00ff', colorFar: '#0000ff', gradStart: 0.0, gradEnd: 1.0,
        opGradStart: 0.0, opGradEnd: 1.0,
        strokeWidth: 1.0, dotSize: 6.0,
        dof: { focus: 0, intensity: 2.0, aperture: 5.0, ignoreNear: false, linkCurves: true, smoothCurve: true, opCurve: [{x:0,y:0}, {x:1,y:1}], sizeCurve: [{x:0,y:0}, {x:1,y:1}] }
    };

    function evaluateLinear(t, points) {
        if (t <= 0) return points[0].y;
        if (t >= 1) return points[points.length-1].y;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i], p2 = points[i+1];
            if (t >= p1.x && t <= p2.x) {
                const range = p2.x - p1.x;
                if (range < 0.0001) return p1.y;
                return p1.y + ((t - p1.x) / range) * (p2.y - p1.y);
            }
        }
        return points[points.length-1].y;
    }
    function createMonotoneInterpolator(points) {
        const n = points.length;
        if (n < 2) return () => points[0] ? points[0].y : 0;
        const d = [], m = [];
        for (let i = 0; i < n - 1; i++) d[i] = (points[i+1].y - points[i].y) / (points[i+1].x - points[i].x);
        m[0] = d[0]; m[n-1] = d[n-2];
        for (let i = 1; i < n - 1; i++) m[i] = (d[i-1] * d[i] <= 0) ? 0 : (d[i-1] + d[i]) * 0.5;
        return function(x) {
            if (x <= points[0].x) return points[0].y;
            if (x >= points[n-1].x) return points[n-1].y;
            let i = 0, j = n - 1;
            while (i < j - 1) { const k = (i + j) >> 1; if (points[k].x <= x) i = k; else j = k; }
            const h = points[i+1].x - points[i].x, t = (x - points[i].x) / h, t2 = t*t, t3 = t2*t;
            return (2*t3 - 3*t2 + 1)*points[i].y + (t3 - 2*t2 + t)*h*m[i] + (-2*t3 + 3*t2)*points[i+1].y + (t3 - t2)*h*m[i+1];
        };
    }
    function generateCurveTexture(points, smooth) {
        const size = 256; const data = new Uint8Array(size);
        const evalFunc = smooth ? createMonotoneInterpolator(points) : (t) => evaluateLinear(t, points);
        for (let i = 0; i < size; i++) data[i] = Math.floor(Math.max(0, Math.min(1, evalFunc(i / (size - 1)))) * 255);
        const tex = new THREE.DataTexture(data, size, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
        tex.needsUpdate = true; return tex;
    }
    function getGradientDirection() {
        const radX = THREE.MathUtils.degToRad(state.gradRot.x);
        const radY = THREE.MathUtils.degToRad(state.gradRot.y);
        const x = Math.sin(radY) * Math.cos(radX);
        const y = Math.sin(radX);
        const z = Math.cos(radY) * Math.cos(radX);
        return new THREE.Vector3(x, y, z).normalize();
    }
    function createShaderMaterial() {
        const dummyTex = new THREE.DataTexture(new Uint8Array([255]), 1, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
        dummyTex.needsUpdate = true;
        return new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(state.baseColor) },
                colorNear: { value: new THREE.Color(state.colorNear) },
                colorFar: { value: new THREE.Color(state.colorFar) },
                minZ: { value: 0.0 }, maxZ: { value: 10.0 },
                opMinZ: { value: 0.0 }, opMaxZ: { value: 10.0 },
                dofMinZ: { value: 0.0 }, dofMaxZ: { value: 10.0 },
                useColor: { value: 0 }, useOpacity: { value: 0 }, useDOF: { value: 0 },
                cameraPos: { value: new THREE.Vector3() },
                pointSize: { value: (state.dotSize || 6.0) * (window.devicePixelRatio || 1.0) },
                dofFocus: { value: 0.5 }, dofIntensity: { value: 5.0 }, dofIgnoreNear: { value: 0 }, dofOpTexture: { value: dummyTex },
                gradMode: { value: 0 }, 
                gradDir: { value: new THREE.Vector3(0,0,1) }
            },
            vertexShader: `
                uniform float pointSize; 
                uniform vec3 cameraPos; 
                uniform int gradMode;
                uniform vec3 gradDir;
                varying float vDist;
                varying float vProj;
                void main() { 
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0); 
                    if (gradMode == 1) {
                         vProj = dot(worldPosition.xyz, gradDir);
                         vDist = distance(worldPosition.xyz, cameraPos); 
                    } else {
                         vDist = distance(worldPosition.xyz, cameraPos);
                         vProj = vDist; 
                    }
                    vec4 mvPosition = viewMatrix * worldPosition; 
                    gl_Position = projectionMatrix * mvPosition; 
                    gl_PointSize = pointSize * (5.0 / -mvPosition.z); 
                }`,
            fragmentShader: `
                uniform vec3 color; 
                uniform vec3 colorNear; 
                uniform vec3 colorFar; 
                uniform float minZ; 
                uniform float maxZ; 
                uniform float opMinZ;
                uniform float opMaxZ;
                uniform float dofMinZ;
                uniform float dofMaxZ;
                uniform int useColor; 
                uniform int useOpacity; 
                uniform int useDOF; 
                uniform float dofFocus; 
                uniform float dofIntensity; 
                uniform int dofIgnoreNear; 
                uniform sampler2D dofOpTexture; 
                uniform int gradMode;
                varying float vDist; 
                varying float vProj;
                void main() { 
                    float metric = (gradMode == 1) ? vProj : vDist;
                    float range = maxZ - minZ; 
                    if (range < 0.001) range = 1.0; 
                    float t = clamp((metric - minZ) / range, 0.0, 1.0); 
                    vec4 finalColor = vec4(color, 1.0); 
                    if (useColor == 1) finalColor.rgb = mix(colorNear, colorFar, t); 
                    if (useOpacity == 1) { 
                        float opRange = opMaxZ - opMinZ; 
                        if (opRange < 0.001) opRange = 1.0; 
                        float opT = clamp((metric - opMinZ) / opRange, 0.0, 1.0); 
                        finalColor.a *= (1.0 - opT); 
                    } 
                    if (useDOF == 1) { 
                        float dofRange = dofMaxZ - dofMinZ; 
                        if (dofRange < 0.001) dofRange = 1.0; 
                        float depthT = clamp((vDist - dofMinZ) / dofRange, 0.0, 1.0);
                        float dist = (gradMode == 1) ? vDist : metric; 
                        float distT = (gradMode == 1) ? (vDist / 20.0) : depthT; 
                        float d = distT - dofFocus; 
                        if (dofIgnoreNear == 1 && d < 0.0) d = 0.0; 
                        float blurRaw = clamp(abs(d) * dofIntensity, 0.0, 1.0); 
                        float opFactor = texture2D(dofOpTexture, vec2(blurRaw, 0.5)).r; 
                        finalColor.a *= clamp(1.0 - opFactor, 0.0, 1.0); 
                    } 
                    gl_FragColor = finalColor; 
                }`,
            transparent: true, depthTest: true, depthWrite: false, 
        });
    }

    const history = {
        undoStack: [], redoStack: [], maxDepth: 50,
        push: function(currentState) {
            this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
            if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
            this.redoStack = [];
        },
        undo: function(currentState) {
            if (this.undoStack.length === 0) return null;
            const prev = this.undoStack.pop();
            this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
            return prev;
        },
        redo: function(currentState) {
            if (this.redoStack.length === 0) return null;
            const next = this.redoStack.pop();
            this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
            return next;
        }
    };
    function performUndo() { const newState = history.undo(state); if (newState) restoreState(newState); }
    function performRedo() { const newState = history.redo(state); if (newState) restoreState(newState); }
    function restoreState(newState) {
        Object.keys(state).forEach(key => {
            if (newState[key] !== undefined) {
                state[key] = newState[key];
            }
        });
        if (state.opGradStart === undefined) state.opGradStart = 0.0;
        if (state.opGradEnd === undefined) state.opGradEnd = 1.0;
        if (state.occlusionMethod === undefined) {
            state.occlusionMethod = state.legacyHiddenLine ? 'simple' : 'precise';
        }
        if (state.gpuGridSize === undefined) state.gpuGridSize = 1;
        updateUIFromState(); updateGeometry(); updateMaterialUniforms();
        camera.position.set(state.cam.x, state.cam.y, state.cam.z); 
        if (state.cam.target) {
            controls.target.set(state.cam.target.x, state.cam.target.y, state.cam.target.z);
        } else {
             controls.target.set(0, 0, 0); 
        }
        camera.fov = state.cam.fov; 
        camera.updateProjectionMatrix(); 
        controls.update();
    }
    let dragStartSnapshot = null;
    function recordDragStart() { dragStartSnapshot = JSON.parse(JSON.stringify(state)); }
    function recordDragEnd() { if (dragStartSnapshot) { history.undoStack.push(dragStartSnapshot); if (history.undoStack.length > history.maxDepth) history.undoStack.shift(); history.redoStack = []; dragStartSnapshot = null; } }
    function saveHistory() { history.push(state); }

    const curveEditor = {
        activeType: 'op', points: [], dragIdx: -1, canvas: null, ctx: null, width: 400, height: 250, margin: 20, localOp: undefined, localSize: undefined,
        init: function() {
            this.canvas = document.getElementById('curve-canvas'); this.ctx = this.canvas.getContext('2d');
            this.canvas.addEventListener('mousedown', this.onDown.bind(this)); window.addEventListener('mousemove', this.onMove.bind(this)); window.addEventListener('mouseup', this.onUp.bind(this)); this.canvas.addEventListener('dblclick', this.onDblClick.bind(this));
            document.getElementById('curve-tab-op').addEventListener('click', () => this.setType('op')); document.getElementById('curve-tab-size').addEventListener('click', () => this.setType('size'));
            document.getElementById('curve-link').addEventListener('change', (e) => {
                const linked = e.target.checked; const sizeTab = document.getElementById('curve-tab-size');
                if (linked) { sizeTab.style.opacity = '0.5'; sizeTab.style.pointerEvents = 'none'; if (this.activeType === 'size') this.setType('op'); } else { sizeTab.style.opacity = '1'; sizeTab.style.pointerEvents = 'auto'; }
            });
            document.getElementById('curve-smooth').addEventListener('change', () => this.render());
            document.getElementById('curve-reset').addEventListener('click', () => { this.points = [{x:0,y:0}, {x:1,y:1}]; this.render(); });
            document.getElementById('curve-apply').addEventListener('click', () => { this.saveToState(); document.getElementById('curve-modal').style.display = 'none'; updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
            document.getElementById('curve-close').addEventListener('click', () => document.getElementById('curve-modal').style.display = 'none');
            this.points = [...state.dof.opCurve]; this.render();
        },
        open: function() {
            document.getElementById('curve-modal').style.display = 'flex';
            document.getElementById('curve-link').checked = state.dof.linkCurves; document.getElementById('curve-smooth').checked = state.dof.smoothCurve; document.getElementById('curve-link').dispatchEvent(new Event('change'));
            this.localOp = JSON.parse(JSON.stringify(state.dof.opCurve)); this.localSize = JSON.parse(JSON.stringify(state.dof.sizeCurve));
            this.activeType = 'op'; this.points = [...this.localOp];
            document.getElementById('curve-tab-op').style.background = '#007aff'; document.getElementById('curve-tab-size').style.background = '#333';
            this.render();
        },
        setType: function(type) {
            if (this.activeType === 'op') this.localOp = [...this.points]; else this.localSize = [...this.points];
            this.activeType = type; this.points = (type === 'op') ? [...this.localOp] : [...this.localSize];
            document.getElementById('curve-tab-op').style.background = type==='op' ? '#007aff' : '#333'; document.getElementById('curve-tab-size').style.background = type==='size' ? '#007aff' : '#333';
            this.render();
        },
        saveToState: function() {
             if (this.activeType === 'op') this.localOp = [...this.points]; else this.localSize = [...this.points];
             state.dof.linkCurves = document.getElementById('curve-link').checked; state.dof.smoothCurve = document.getElementById('curve-smooth').checked;
             state.dof.opCurve = JSON.parse(JSON.stringify(this.localOp));
             state.dof.sizeCurve = state.dof.linkCurves ? JSON.parse(JSON.stringify(this.localOp)) : JSON.parse(JSON.stringify(this.localSize));
        },
        toScreen: function(pt) { return { x: this.margin + pt.x * (this.width - 2*this.margin), y: (this.height - this.margin) - pt.y * (this.height - 2*this.margin) }; },
        fromScreen: function(x, y) {
            const rect = this.canvas.getBoundingClientRect();
            const ex = (x - rect.left) * (this.width / rect.width), ey = (y - rect.top) * (this.height / rect.height);
            return { x: clamp((ex - this.margin) / (this.width - 2*this.margin), 0, 1), y: clamp(1 - ((ey - this.margin) / (this.height - 2*this.margin)), 0, 1) };
        },
        onDown: function(e) {
            const rect = this.canvas.getBoundingClientRect(); const ex = (e.clientX - rect.left) * (this.width / rect.width), ey = (e.clientY - rect.top) * (this.height / rect.height);
            for(let i=0; i<this.points.length; i++) { const s = this.toScreen(this.points[i]); if (Math.sqrt((s.x - ex)**2 + (s.y - ey)**2) < 10) { this.dragIdx = i; return; } }
        },
        onMove: function(e) {
            if (this.dragIdx === -1) return;
            const p = this.fromScreen(e.clientX, e.clientY);
            if (this.dragIdx === 0) p.x = 0; else if (this.dragIdx === this.points.length-1) p.x = 1;
            else { const prev = this.points[this.dragIdx-1].x, next = this.points[this.dragIdx+1].x; p.x = Math.max(prev + 0.01, Math.min(next - 0.01, p.x)); }
            this.points[this.dragIdx] = p; this.render();
        },
        onUp: function() { this.dragIdx = -1; },
        onDblClick: function(e) {
            const rect = this.canvas.getBoundingClientRect(); const ex = (e.clientX - rect.left) * (this.width / rect.width), ey = (e.clientY - rect.top) * (this.height / rect.height);
            for(let i=1; i<this.points.length-1; i++) { const s = this.toScreen(this.points[i]); if (Math.sqrt((s.x - ex)**2 + (s.y - ey)**2) < 10) { this.points.splice(i, 1); this.render(); return; } }
            const p = this.fromScreen(e.clientX, e.clientY);
            for(let i=0; i<this.points.length-1; i++) { if (p.x > this.points[i].x && p.x < this.points[i+1].x) { this.points.splice(i+1, 0, p); this.render(); return; } }
        },
        render: function() {
            const ctx = this.ctx; ctx.fillStyle = '#111'; ctx.fillRect(0,0,this.width,this.height);
            ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath();
            const tl = this.toScreen({x:0,y:1}), br = this.toScreen({x:1,y:0}); ctx.rect(tl.x, tl.y, br.x-tl.x, br.y-tl.y); ctx.stroke();
            ctx.strokeStyle = this.activeType === 'op' ? '#007aff' : '#aaa'; ctx.lineWidth = 2; ctx.beginPath();
            if (document.getElementById('curve-smooth').checked && this.points.length > 1) {
                const interpolator = createMonotoneInterpolator(this.points); const start = this.toScreen({x:0, y:interpolator(0)}); ctx.moveTo(start.x, start.y);
                for(let i=1; i<=100; i++) { const t = i/100, val = interpolator(t), pt = this.toScreen({x:t, y:val}); ctx.lineTo(pt.x, pt.y); }
            } else {
                const start = this.toScreen(this.points[0]); ctx.moveTo(start.x, start.y);
                for(let i=1; i<this.points.length; i++) { const pt = this.toScreen(this.points[i]); ctx.lineTo(pt.x, pt.y); }
            }
            ctx.stroke();
            ctx.fillStyle = '#fff'; this.points.forEach(p => { const s = this.toScreen(p); ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI*2); ctx.fill(); });
        }
    };

    initScene();
    setupUI();
    setupPresets();
    setupPresetButtons(); 
    rebuildUIParams();
    updateUIFromState();
    updateGeometry();
    animate();

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? performRedo() : performUndo(); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); performRedo(); }
        if (e.key === 'r' || e.key === 'R') { e.preventDefault(); state.autoRotate = !state.autoRotate; controls.autoRotate = state.autoRotate; }
    });

    function setupPresetButtons() {
        const btns = document.querySelectorAll('.preset-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slot = parseInt(btn.dataset.slot);
                if (e.shiftKey || presets[slot] === null) {
                    state.cam.x = camera.position.x;
                    state.cam.y = camera.position.y;
                    state.cam.z = camera.position.z;
                    const t = controls.target;
                    state.cam.target = {x: t.x, y: t.y, z: t.z};
                    presets[slot] = JSON.parse(JSON.stringify(state));
                    btn.classList.add('filled');
                } else {
                    saveHistory(); 
                    restoreState(presets[slot]);
                }
            });
            btn.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const slot = parseInt(btn.dataset.slot);
                presets[slot] = null;
                btn.classList.remove('filled');
            });
        });
    }

    function setupPresets() {
        const mathSel = document.getElementById('math-presets');
        if(mathSel) {
            mathPresets.forEach((p, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = p.name; mathSel.appendChild(opt); });
            mathSel.addEventListener('change', (e) => {
                const p = mathPresets[e.target.value]; if(!p) return;
                state.mathFormula = p.formula; document.getElementById('math-formula').value = p.formula;
                if(p.vars) { state.mathVars = { ...state.mathVars, ...p.vars }; ['a','b','c'].forEach(k => document.getElementById(`math-var-${k}`).value = state.mathVars[k]); }
                updateGeometry();
            });
        }
        const paramSel = document.getElementById('param-presets');
        if(paramSel) {
            paramPresets.forEach((p, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = p.name; paramSel.appendChild(opt); });
            paramSel.addEventListener('change', (e) => {
                const p = paramPresets[e.target.value]; if(!p) return;
                state.parametricFormulas.x = p.x; state.parametricFormulas.y = p.y; state.parametricFormulas.z = p.z;
                document.getElementById('param-x').value = p.x; document.getElementById('param-y').value = p.y; document.getElementById('param-z').value = p.z;
                if (state.geoType === 'parametric') { state.geoParams[0] = p.uMin; state.geoParams[1] = p.uMax; state.geoParams[2] = p.vMin; state.geoParams[3] = p.vMax; rebuildUIParams(); }
                updateGeometry();
            });
        }
    }

    function initScene() {
        scene = new THREE.Scene(); scene.background = new THREE.Color(0x111111);
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(state.cam.fov, aspect, 0.1, 1000); camera.position.set(state.cam.x, state.cam.y, state.cam.z);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(container.clientWidth, container.clientHeight); renderer.setPixelRatio(window.devicePixelRatio); renderer.localClippingEnabled = true; container.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.4; controls.autoRotate = state.autoRotate; controls.autoRotateSpeed = 2.0;
        
        if(state.cam.target) controls.target.set(state.cam.target.x, state.cam.target.y, state.cam.target.z);
        
        const ambient = new THREE.AmbientLight(0x404040); scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(5, 10, 7); scene.add(dirLight);
        matWireShader = createShaderMaterial();
        window.addEventListener('resize', onWindowResize);
    }

    function updateMaterialUniforms() {
        const updateShader = (mat) => {
            if (!mat || !mat.uniforms) return;
            mat.uniforms.useColor.value = state.zDepth.color ? 1 : 0; 
            mat.uniforms.useOpacity.value = state.zDepth.opacity ? 1 : 0; 
            mat.uniforms.useDOF.value = state.zDepth.dof ? 1 : 0;
            
            const activeColor = (state.svgPreview && !state.zDepth.color) ? '#f1c40f' : state.baseColor;
            mat.uniforms.color.value.set(activeColor); 
            mat.uniforms.colorNear.value.set(state.colorNear); 
            mat.uniforms.colorFar.value.set(state.colorFar);
            
            mat.uniforms.dofFocus.value = state.dof.focus; 
            mat.uniforms.dofIntensity.value = state.dof.intensity; 
            mat.uniforms.dofIgnoreNear.value = state.dof.ignoreNear ? 1 : 0;
            
            mat.uniforms.gradMode.value = (state.gradMode === 'directional') ? 1 : 0;
            if (state.gradMode === 'directional') {
                mat.uniforms.gradDir.value.copy(getGradientDirection());
            }

            if (state.zDepth.dof) { const tex = generateCurveTexture(state.dof.opCurve); if (mat.uniforms.dofOpTexture.value) mat.uniforms.dofOpTexture.value.dispose(); mat.uniforms.dofOpTexture.value = tex; }
            
            let minVal = Infinity, maxVal = -Infinity;
            if (mainMeshGroup) {
                const mesh = mainMeshGroup.userData.wire || mainMeshGroup.children[0];
                if (mesh && mesh.geometry) { 
                    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere(); 
                    if (state.gradMode === 'directional') {
                        const sphere = mesh.geometry.boundingSphere.clone(); 
                        sphere.applyMatrix4(mesh.matrixWorld);
                        const dir = getGradientDirection();
                        const cProj = sphere.center.dot(dir);
                        minVal = cProj - sphere.radius;
                        maxVal = cProj + sphere.radius;
                    } else {
                        const camPos = camera.position; 
                        const sphere = mesh.geometry.boundingSphere.clone(); 
                        sphere.applyMatrix4(mesh.matrixWorld); 
                        const dist = camPos.distanceTo(sphere.center); 
                        minVal = dist - sphere.radius; 
                        maxVal = dist + sphere.radius; 
                    }
                } else { minVal = 0; maxVal = 10; }
            } else { minVal = 0; maxVal = 10; }
            
            if (state.gradMode === 'camera' && minVal < 0.1) minVal = 0.1;
            
            const range = maxVal - minVal;
            const opStart = state.opGradStart !== undefined ? state.opGradStart : 0.0;
            const opEnd = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
            mat.uniforms.minZ.value = minVal + (range * state.gradStart); 
            mat.uniforms.maxZ.value = minVal + (range * state.gradEnd);
            
            mat.uniforms.opMinZ.value = minVal + (range * opStart);
            mat.uniforms.opMaxZ.value = minVal + (range * opEnd);
            
            mat.uniforms.dofMinZ.value = minVal;
            mat.uniforms.dofMaxZ.value = maxVal;
            
            mat.uniforms.cameraPos.value.copy(camera.position); 
            mat.uniforms.pointSize.value = state.dotSize * window.devicePixelRatio;
        };
        if (mainMeshGroup && mainMeshGroup.userData.wire) updateShader(mainMeshGroup.userData.wire.material);
        updateShader(matWireShader);
    }

    function setupUI() {
        const geoType = document.getElementById('geo-type');
        const polyContainer = document.getElementById('poly-type-container');
        const polyType = document.getElementById('poly-type');
        syncInput('hl-bias', 'val-hl-bias', (v) => { state.hiddenSettings.bias = parseFloat(v); updateGeometry(); });

        const applyGeoDefaults = (type) => {
            const defs = geoDefaults[type] || geoDefaults.custom;
            state.hiddenSettings.epsilon = defs.epsilon;
            state.hiddenSettings.bias = defs.bias;
            state.hiddenSettings.inflate = defs.inflate;
            state.hiddenSettings.splineRes = defs.splineRes;
            
            document.getElementById('hl-epsilon').value = defs.epsilon;
            document.getElementById('val-hl-epsilon').value = defs.epsilon;
            document.getElementById('hl-bias').value = defs.bias;
            document.getElementById('val-hl-bias').value = defs.bias;
            document.getElementById('hl-inflate').value = defs.inflate;
            document.getElementById('val-hl-inflate').value = defs.inflate;
            document.getElementById('hl-spline-res').value = defs.splineRes;
            document.getElementById('val-hl-spline-res').value = defs.splineRes;
        };

        geoType.addEventListener('change', (e) => {
            saveHistory();
            const val = e.target.value;
            if (val === 'sphere') {
                polyContainer.style.display = 'block';
                state.geoType = polyType.value;
            } else {
                polyContainer.style.display = 'none';
                state.geoType = val;
            }
            rebuildUIParams(false);
            applyGeoDefaults(state.geoType);
            updateUIFromState();
            updateGeometry();
        });

        polyType.addEventListener('change', (e) => {
            saveHistory();
            state.geoType = e.target.value;
            rebuildUIParams(false);
            applyGeoDefaults(state.geoType);
            updateUIFromState();
            updateGeometry();
        });

        document.getElementById('grid-show-u').addEventListener('change', (e) => { saveHistory(); if (!e.target.checked && !state.gridUV.v) { state.gridUV.v = true; document.getElementById('grid-show-v').checked = true; } state.gridUV.u = e.target.checked; updateGeometry(); });
        document.getElementById('grid-show-v').addEventListener('change', (e) => { saveHistory(); if (!e.target.checked && !state.gridUV.u) { state.gridUV.u = true; document.getElementById('grid-show-u').checked = true; } state.gridUV.v = e.target.checked; updateGeometry(); });
        
        const mathForm = document.getElementById('math-formula'); mathForm.addEventListener('focus', recordDragStart); mathForm.addEventListener('blur', recordDragEnd); mathForm.addEventListener('input', (e) => { state.mathFormula = e.target.value; updateGeometry(); });
        ['x', 'y', 'z'].forEach(axis => { const el = document.getElementById(`param-${axis}`); if (el) { el.addEventListener('focus', recordDragStart); el.addEventListener('blur', recordDragEnd); el.addEventListener('input', (e) => { state.parametricFormulas[axis] = e.target.value; updateGeometry(); }); } });
        ['a', 'b', 'c'].forEach(v => { document.getElementById(`math-var-${v}`).addEventListener('focus', recordDragStart); document.getElementById(`math-var-${v}`).addEventListener('blur', recordDragEnd); document.getElementById(`math-var-${v}`).addEventListener('input', (e) => { state.mathVars[v] = parseFloat(e.target.value); updateGeometry(); }); });
        document.getElementById('obj-input').addEventListener('change', (e) => { saveHistory(); const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (ev) => { const loader = new THREE.OBJLoader(); const obj = loader.parse(ev.target.result); const geos = []; obj.traverse(c => { if(c.isMesh) geos.push(c.geometry); }); if(geos.length) { originalGeometry = geos.length === 1 ? geos[0] : THREE.BufferGeometryUtils.mergeBufferGeometries(geos); originalGeometry = THREE.BufferGeometryUtils.mergeVertices(originalGeometry); originalGeometry.center(); originalGeometry.computeBoundingSphere(); const s = 3.0 / originalGeometry.boundingSphere.radius; originalGeometry.scale(s,s,s); updateGeometry(); } }; reader.readAsText(file); });

        const bindCheck = (id, key) => { const el = document.getElementById(id); const sub = document.getElementById(key + '-controls'); el.addEventListener('change', () => { saveHistory(); state[key].enabled = el.checked; if(sub) sub.style.display = el.checked ? 'block' : 'none'; updateGeometry(); }); };
        ['noise','twist','wave','bulge','bend','taper','ripple','spherify','skew'].forEach(k => bindCheck('use-'+k, k));

        syncInput('noise-amp', 'val-noise-amp', (v) => { state.noise.amp = parseFloat(v); updateGeometry(); });
        syncInput('noise-freq', 'val-noise-freq', (v) => { state.noise.freq = parseFloat(v); updateGeometry(); });
        syncInput('noise-seed', 'val-noise-seed', (v) => { state.noise.seed = parseInt(v); updateGeometry(); });
        syncInput('twist-angle', 'val-twist-angle', (v) => { state.twist.angle = parseFloat(v); updateGeometry(); });
        syncInput('wave-int', 'val-wave-int', (v) => { state.wave.int = parseFloat(v); updateGeometry(); });
        syncInput('wave-freq', 'val-wave-freq', (v) => { state.wave.freq = parseFloat(v); updateGeometry(); });
        syncInput('bulge-str', 'val-bulge-str', (v) => { state.bulge.str = parseFloat(v); updateGeometry(); });
        syncInput('bend-amt', 'val-bend-amt', (v) => { state.bend.amt = parseFloat(v); updateGeometry(); });
        syncInput('taper-amt', 'val-taper-amt', (v) => { state.taper.amt = parseFloat(v); updateGeometry(); });
        syncInput('ripple-amp', 'val-ripple-amp', (v) => { state.ripple.amp = parseFloat(v); updateGeometry(); });
        syncInput('ripple-freq', 'val-ripple-freq', (v) => { state.ripple.freq = parseFloat(v); updateGeometry(); });
        syncInput('spherify-str', 'val-spherify-str', (v) => { state.spherify.str = parseFloat(v); updateGeometry(); });
        syncInput('skew-amt', 'val-skew-amt', (v) => { state.skew.amt = parseFloat(v); updateGeometry(); });

        syncInput('landscape-seed', 'val-landscape-seed', (v) => { state.landscape.seed = parseInt(v); updateGeometry(); });
        document.getElementById('landscape-noise-type').addEventListener('change', (e) => { saveHistory(); state.landscape.noiseType = e.target.value; updateGeometry(); });
        syncInput('landscape-amp', 'val-landscape-amp', (v) => { state.landscape.amplitude = parseFloat(v); updateGeometry(); });
        syncInput('landscape-freq', 'val-landscape-freq', (v) => { state.landscape.frequency = parseFloat(v); updateGeometry(); });
        syncInput('landscape-octaves', 'val-landscape-octaves', (v) => { state.landscape.octaves = parseInt(v); updateGeometry(); });
        syncInput('landscape-persistence', 'val-landscape-persistence', (v) => { state.landscape.persistence = parseFloat(v); updateGeometry(); });
        syncInput('landscape-lacunarity', 'val-landscape-lacunarity', (v) => { state.landscape.lacunarity = parseFloat(v); updateGeometry(); });
        syncInput('landscape-sea-level', 'val-landscape-sea-level', (v) => { state.landscape.seaLevel = parseFloat(v); updateGeometry(); });
        syncInput('landscape-noise-scale', 'val-landscape-noise-scale', (v) => { state.landscape.noiseScale = parseFloat(v); updateGeometry(); });

        document.getElementById('noise-axis').addEventListener('change', (e) => { saveHistory(); state.noise.axis = e.target.value; updateGeometry(); });
        document.getElementById('noise-type').addEventListener('change', (e) => { saveHistory(); state.noise.noiseType = e.target.value; updateGeometry(); });
        ['twist','wave','bulge','bend','taper','ripple','skew'].forEach(k => document.getElementById(k+'-axis').addEventListener('change', (e) => { saveHistory(); state[k].axis = e.target.value; updateGeometry(); }));

        const updateCamPos = () => { state.cam.x = parseFloat(document.getElementById('cam-x').value); state.cam.y = parseFloat(document.getElementById('cam-y').value); state.cam.z = parseFloat(document.getElementById('cam-z').value); camera.position.set(state.cam.x, state.cam.y, state.cam.z); controls.update(); };
        ['x', 'y', 'z'].forEach(axis => { const el = document.getElementById(`cam-${axis}`); el.addEventListener('focus', recordDragStart); el.addEventListener('blur', recordDragEnd); el.addEventListener('change', updateCamPos); });
        
        const updateCamTarget = () => {
             const x = parseFloat(document.getElementById('cam-target-x').value);
             const y = parseFloat(document.getElementById('cam-target-y').value);
             const z = parseFloat(document.getElementById('cam-target-z').value);
             state.cam.target = {x, y, z};
             controls.target.set(x, y, z);
             controls.update();
        };
        ['x', 'y', 'z'].forEach(axis => { 
            const el = document.getElementById(`cam-target-${axis}`); 
            if(el) {
                el.addEventListener('focus', recordDragStart); 
                el.addEventListener('blur', recordDragEnd); 
                el.addEventListener('change', updateCamTarget);
            }
        });

        controls.addEventListener('change', () => {
             if(document.activeElement.tagName !== 'INPUT') {
                 document.getElementById('cam-x').value = camera.position.x.toFixed(1); document.getElementById('cam-y').value = camera.position.y.toFixed(1); document.getElementById('cam-z').value = camera.position.z.toFixed(1);
                 
                 const t = controls.target;
                 document.getElementById('cam-target-x').value = t.x.toFixed(1);
                 document.getElementById('cam-target-y').value = t.y.toFixed(1);
                 document.getElementById('cam-target-z').value = t.z.toFixed(1);
                 state.cam.target = {x: t.x, y: t.y, z: t.z};

                 const currentRotX = THREE.MathUtils.radToDeg(camera.rotation.x); const currentRotY = THREE.MathUtils.radToDeg(camera.rotation.y);
                 document.getElementById('cam-rot-x').value = currentRotX.toFixed(1); document.getElementById('cam-rot-y').value = currentRotY.toFixed(1);
                 state.cam.rotX = currentRotX; state.cam.rotY = currentRotY;
                 state.cam.x = camera.position.x; state.cam.y = camera.position.y; state.cam.z = camera.position.z;
             }
             if(state.svgPreview) disableSVGPreview();
        });
        controls.addEventListener('start', recordDragStart); controls.addEventListener('end', recordDragEnd);

        ['x', 'y', 'z'].forEach(axis => {
            const el = document.getElementById(`cam-rot-${axis}`);
            if(el) { el.addEventListener('focus', recordDragStart); el.addEventListener('blur', recordDragEnd); el.addEventListener('change', (e) => {
                    const val = parseFloat(e.target.value); const rad = THREE.MathUtils.degToRad(val); const dist = camera.position.distanceTo(controls.target); const target = controls.target.clone(); const dummy = new THREE.Object3D(); dummy.position.copy(target); dummy.rotation.set(axis === 'x' ? rad : camera.rotation.x, axis === 'y' ? rad : camera.rotation.y, 0); const offset = new THREE.Vector3(0, 0, dist); offset.applyEuler(dummy.rotation); const newPos = target.clone().add(offset); camera.position.copy(newPos); camera.lookAt(target); state.cam.x = newPos.x; state.cam.y = newPos.y; state.cam.z = newPos.z; state.cam.rotX = axis === 'x' ? val : state.cam.rotX; state.cam.rotY = axis === 'y' ? val : state.cam.rotY; document.getElementById('cam-x').value = newPos.x.toFixed(1); document.getElementById('cam-y').value = newPos.y.toFixed(1); document.getElementById('cam-z').value = newPos.z.toFixed(1); controls.update(); if(state.svgPreview) disableSVGPreview();
            }); }
        });
        document.querySelectorAll('.btn-view-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view; saveHistory(); const dist = camera.position.distanceTo(controls.target); const t = controls.target;
                switch(view) { case 'front': camera.position.set(t.x, t.y, t.z + dist); break; case 'back': camera.position.set(t.x, t.y, t.z - dist); break; case 'left': camera.position.set(t.x - dist, t.y, t.z); break; case 'right': camera.position.set(t.x + dist, t.y, t.z); break; case 'top': camera.position.set(t.x, t.y + dist, t.z); break; case 'bottom': camera.position.set(t.x, t.y - dist, t.z); break; case 'iso': const isoDist = dist / Math.sqrt(3); camera.position.set(t.x + isoDist, t.y + isoDist, t.z + isoDist); break; }
                controls.update(); updateCamPos(); if(state.svgPreview) disableSVGPreview();
            });
        });
        syncInput('cam-fov', 'val-cam-fov', (v) => { 
            const oldFov = camera.fov; state.cam.fov = parseFloat(v); const dist = camera.position.distanceTo(controls.target); const oldTan = Math.tan(THREE.MathUtils.degToRad(oldFov) / 2); const newTan = Math.tan(THREE.MathUtils.degToRad(state.cam.fov) / 2); const newDist = (dist * oldTan) / newTan; const dir = camera.position.clone().sub(controls.target).normalize(); camera.position.copy(controls.target).add(dir.multiplyScalar(newDist)); camera.fov = state.cam.fov; camera.updateProjectionMatrix(); controls.update();
        });

        document.getElementById('visual-style').addEventListener('change', (e) => { saveHistory(); state.style = e.target.value; updateUIFromState(); updateGeometry(); });
        document.getElementById('btn-preview-svg').addEventListener('click', () => { state.svgPreview ? disableSVGPreview() : enableSVGPreview(); });
        document.getElementById('btn-reorder-deform').addEventListener('click', toggleReorderMode);

        ['x', 'y', 'z'].forEach(axis => {
            const el = document.getElementById(`obj-rot-${axis}`); el.addEventListener('pointerdown', recordDragStart); el.addEventListener('focus', recordDragStart); el.addEventListener('change', recordDragEnd); el.addEventListener('input', (e) => { state.objRot[axis] = parseFloat(e.target.value); updateGeometry(); });
        });

        document.getElementById('use-clip').addEventListener('change', (e) => { saveHistory(); state.clip.enabled = e.target.checked; document.getElementById('clip-controls').style.display = e.target.checked ? 'block' : 'none'; updateGeometry(); });
        document.getElementById('clip-axis').addEventListener('change', (e) => { saveHistory(); state.clip.axis = e.target.value; updateGeometry(); });
        syncInput('clip-pos', 'val-clip-pos', (v) => { state.clip.pos = parseFloat(v); updateGeometry(); });

        syncInput('hl-epsilon', 'val-hl-epsilon', (v) => { state.hiddenSettings.epsilon = parseFloat(v); if(state.svgPreview) disableSVGPreview(); });
        syncInput('hl-spline-res', 'val-hl-spline-res', (v) => { state.hiddenSettings.splineRes = parseInt(v); });
        syncInput('solid-subdiv', 'val-solid-subdiv', (v) => { state.solidSubdiv = parseFloat(v); updateGeometry(); });

        syncInput('hl-inflate', 'val-hl-inflate', (v) => { state.hiddenSettings.inflate = parseFloat(v); updateGeometry(); });
        syncInput('hl-min-len', 'val-hl-min-len', (v) => { state.hiddenSettings.minLen = parseFloat(v); if(state.svgPreview) disableSVGPreview(); });


        const hlMethod = document.getElementById('hl-method');
        if (hlMethod) hlMethod.addEventListener('change', (e) => {
            saveHistory();
            state.occlusionMethod = e.target.value;
            state.legacyHiddenLine = (state.occlusionMethod === 'simple');
            updateUIFromState();
            if(state.svgPreview) disableSVGPreview();
        });

        const gpuGrid = document.getElementById('gpu-grid');
        if (gpuGrid) gpuGrid.addEventListener('change', (e) => {
            saveHistory();
            state.gpuGridSize = parseInt(e.target.value);
            if(state.svgPreview) disableSVGPreview();
        });
        
        const hlProperOrder = document.getElementById('hl-proper-order'); if (hlProperOrder) hlProperOrder.addEventListener('change', (e) => { saveHistory(); state.properOrder = e.target.checked; if(state.svgPreview) disableSVGPreview(); });

        const setupCollapsible = (headerId, contentId) => {
            const header = document.getElementById(headerId); const content = document.getElementById(contentId);
            if (header && content) { header.addEventListener('click', (e) => { if (e.target.closest('button')) return; const section = header.closest('.section'); section.classList.toggle('collapsed'); content.style.display = section.classList.contains('collapsed') ? 'none' : 'block'; saveHistory(); }); const section = header.closest('.section'); content.style.display = section.classList.contains('collapsed') ? 'none' : 'block'; }
        };
        setupCollapsible('deformation-header', 'deformation-content'); setupCollapsible('z-depth-header', 'z-depth-content'); setupCollapsible('transform-header', 'transform-content'); setupCollapsible('camera-header', 'camera-content'); setupCollapsible('geometry-header', 'geometry-content');

        const bindZToggle = (id, key) => { const el = document.getElementById(id); if (el) el.addEventListener('change', (e) => { saveHistory(); state.zDepth[key] = e.target.checked; updateUIFromState(); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); }); };
        bindZToggle('use-z-color', 'color'); bindZToggle('use-z-opacity', 'opacity'); bindZToggle('use-z-dof', 'dof');
        syncInput('dof-focus', 'val-dof-focus', (v) => { state.dof.focus = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        syncInput('dof-intensity', 'val-dof-intensity', (v) => { state.dof.intensity = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        syncInput('dof-aperture', 'val-dof-aperture', (v) => { state.dof.aperture = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        curveEditor.init(); document.getElementById('btn-curve-editor').addEventListener('click', () => curveEditor.open());
        document.getElementById('dof-ignore-near').addEventListener('change', (e) => { saveHistory(); state.dof.ignoreNear = e.target.checked; updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });

        const cNear = document.getElementById('color-near'); if(cNear) { cNear.addEventListener('change', () => saveHistory()); cNear.addEventListener('input', (e) => { state.colorNear = e.target.value; updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); }); }
        
        const gradBar = document.getElementById('grad-bar'); const stop1 = document.getElementById('stop-1'); const stop2 = document.getElementById('stop-2');
        const colInput1 = document.getElementById('input-col-near'); const colInput2 = document.getElementById('input-col-far');
        const updateGradientUI = () => {
            const p1 = state.gradStart * 100; const p2 = state.gradEnd * 100;
            stop1.style.left = `${p1}%`; stop2.style.left = `${p2}%`;
            gradBar.style.background = `linear-gradient(90deg, ${state.colorNear} 0%, ${state.colorNear} ${p1}%, ${state.colorFar} ${p2}%, ${state.colorFar} 100%)`;
            updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview();
        };
        if (stop1 && stop2) {
            colInput1.addEventListener('change', () => saveHistory()); colInput1.addEventListener('input', (e) => { state.colorNear = e.target.value; updateGradientUI(); });
            colInput2.addEventListener('change', () => saveHistory()); colInput2.addEventListener('input', (e) => { state.colorFar = e.target.value; updateGradientUI(); });
            const handleDrag = (handle, isStart) => {
                handle.addEventListener('mousedown', (e) => { e.preventDefault(); recordDragStart(); const onMove = (ev) => { const rect = gradBar.getBoundingClientRect(); let pct = (ev.clientX - rect.left) / rect.width; pct = clamp(pct, 0, 1); if (isStart) { if (pct > state.gradEnd - 0.05) pct = state.gradEnd - 0.05; state.gradStart = pct; } else { if (pct < state.gradStart + 0.05) pct = state.gradStart + 0.05; state.gradEnd = pct; } updateGradientUI(); }; const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); recordDragEnd(); }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); });
            };
            handleDrag(stop1, true); handleDrag(stop2, false); updateGradientUI();
        }

        document.getElementById('grad-mode').addEventListener('change', (e) => {
            saveHistory();
            state.gradMode = e.target.value;
            updateUIFromState();
            updateMaterialUniforms();
        });
        syncInput('grad-rot-x', 'val-grad-rot-x', (v) => { state.gradRot.x = parseFloat(v); updateMaterialUniforms(); });
        syncInput('grad-rot-y', 'val-grad-rot-y', (v) => { state.gradRot.y = parseFloat(v); updateMaterialUniforms(); });


        document.getElementById('btn-reset-transform').addEventListener('click', (e) => { e.stopPropagation(); saveHistory(); state.objRot = { x: 0, y: 0, z: 0 }; document.getElementById('obj-rot-x').value = 0; document.getElementById('obj-rot-y').value = 0; document.getElementById('obj-rot-z').value = 0; updateGeometry(); });
        document.getElementById('btn-reset-cam').addEventListener('click', (e) => { e.stopPropagation(); saveHistory(); state.cam = { x: 4, y: 3, z: 5, rotX: 0, rotY: 0, fov: 45, target: {x:0, y:0, z:0} }; document.getElementById('cam-x').value = 4; document.getElementById('cam-y').value = 3; document.getElementById('cam-z').value = 5; document.getElementById('cam-fov').value = 45; document.getElementById('val-cam-fov').value = 45; document.getElementById('cam-rot-x').value = 0; document.getElementById('cam-rot-y').value = 0; camera.position.set(4, 3, 5); controls.target.set(0,0,0); camera.fov = 45; camera.updateProjectionMatrix(); controls.update(); if(state.svgPreview) disableSVGPreview(); });
        document.getElementById('btn-reset-hl').addEventListener('click', (e) => {
            e.stopPropagation();
            saveHistory();
            state.hiddenSettings = { bias: 1.0, epsilon: 0.1, splineRes: 16, inflate: 0, minLen: 0 };
            state.occlusionMethod = 'gpu';
            state.legacyHiddenLine = false;
            state.properOrder = false;
            document.getElementById('hl-epsilon').value = 0.1;
            document.getElementById('val-hl-epsilon').value = 0.1;
            document.getElementById('hl-spline-res').value = 16;
            document.getElementById('val-hl-spline-res').value = 16;
            document.getElementById('hl-method').value = 'gpu';
            document.getElementById('hl-proper-order').checked = false;
            document.getElementById('hl-inflate').value = 0;
            document.getElementById('val-hl-inflate').value = 0;
            document.getElementById('hl-min-len').value = 0.5;
            document.getElementById('val-hl-min-len').value = 0.5;
            if (mainMeshGroup && mainMeshGroup.userData.solid) { mainMeshGroup.userData.solid.material.polygonOffsetFactor = 1.0; mainMeshGroup.userData.solid.material.polygonOffsetUnits = 1.0; }
            if(state.svgPreview) disableSVGPreview();
            updateUIFromState();
        });

        syncInput('style-dot-size', 'val-style-dot-size', (v) => { const val = parseFloat(v); state.dotSize = val; state.strokeWidth = val; updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        const btnExport = document.getElementById('btn-export'); btnExport.addEventListener('click', () => { state.autoRotate = false; controls.autoRotate = false; btnExport.classList.add('btn-active-yellow'); exportSVG(); });

        document.getElementById('btn-save').addEventListener('click', saveSettings);
        const flinesInput = document.getElementById('flines-input');
        document.getElementById('btn-load').addEventListener('click', () => flinesInput.click());
        flinesInput.addEventListener('change', (e) => { const file = e.target.files[0]; if(file) loadSettings(file); e.target.value = ''; });
        const closeLoader = () => { document.getElementById('loader').style.display = 'none'; document.getElementById('btn-export').classList.remove('btn-active-yellow'); disableSVGPreview(); };
        document.getElementById('loader-btn-ok').addEventListener('click', closeLoader);
        document.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const loader = document.getElementById('loader'); const result = document.getElementById('loader-result'); if (loader.style.display !== 'none' && result.style.display !== 'none') { e.preventDefault(); closeLoader(); } } });

        const opBar = document.getElementById('op-grad-bar'); const opStop1 = document.getElementById('op-stop-1'); const opStop2 = document.getElementById('op-stop-2');
        const updateOpGradientUI = () => { 
            const opStart = state.opGradStart !== undefined ? state.opGradStart : 0.0;
            const opEnd = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
            const p1 = opStart * 100; const p2 = opEnd * 100; 
            if(opStop1) opStop1.style.left = `${p1}%`; 
            if(opStop2) opStop2.style.left = `${p2}%`; 
            if(opBar) opBar.style.background = `linear-gradient(90deg, #000 0%, #000 ${p1}%, #fff ${p2}%, #fff 100%)`; 
            updateMaterialUniforms(); 
            if(state.svgPreview) disableSVGPreview(); 
        };
        if(opStop1 && opStop2) { const handleDrag = (handle, isStart) => { handle.addEventListener('mousedown', (e) => { e.preventDefault(); recordDragStart(); const onMove = (ev) => { 
            const rect = opBar.getBoundingClientRect(); 
            const curStart = state.opGradStart !== undefined ? state.opGradStart : 0.0;
            const curEnd = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
            let pct = clamp((ev.clientX - rect.left) / rect.width, 0, 1); 
            if (isStart) { if (pct > curEnd - 0.05) pct = curEnd - 0.05; state.opGradStart = pct; } 
            else { if (pct < curStart + 0.05) pct = curStart + 0.05; state.opGradEnd = pct; } 
            updateOpGradientUI(); 
        }; const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); recordDragEnd(); }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); }); }; handleDrag(opStop1, true); handleDrag(opStop2, false); updateOpGradientUI(); }
        updateMaterialUniforms();
    }

    function rebuildUIParams(preserveState = false) {
        const type = state.geoType;
        const config = shapeConfig[type];
        const container = document.getElementById('geo-params');
        container.innerHTML = '';
        if (!config || !config.params) return;

        if (!preserveState) state.geoParams = [];

        config.params.forEach((p, idx) => {
            if (!preserveState) state.geoParams.push(p.def);
            const group = document.createElement('div'); group.className = 'control';
            if (p.type === 'bool') {
                 const label = document.createElement('label'); label.style.display = 'flex'; label.style.alignItems = 'center'; label.style.gap = '8px';
                 const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!state.geoParams[idx];
                 cb.addEventListener('change', () => { saveHistory(); state.geoParams[idx] = cb.checked ? 1 : 0; if (p.name === 'Spline') updateUIFromState(); updateGeometry(); });
                 label.appendChild(cb); label.appendChild(document.createTextNode(p.name)); group.appendChild(label);
            } else {
                const label = document.createElement('label'); label.textContent = p.name; group.appendChild(label);
                const row = document.createElement('div'); row.className = 'range-row';
                const slider = document.createElement('input'); slider.type = 'range'; slider.min = p.min; slider.max = p.max; slider.step = p.step; slider.value = state.geoParams[idx];
                const number = document.createElement('input'); number.type = 'number'; number.className = 'val-input'; number.step = p.step; number.value = state.geoParams[idx];
                const updateVal = (val) => { let v = parseFloat(val); if (p.type === 'int') v = Math.round(v); state.geoParams[idx] = v; updateGeometry(); };
                slider.addEventListener('pointerdown', recordDragStart); slider.addEventListener('change', recordDragEnd);
                slider.addEventListener('input', () => { number.value = slider.value; updateVal(slider.value); });
                number.addEventListener('change', () => { saveHistory(); slider.value = number.value; updateVal(number.value); });
                row.appendChild(slider); row.appendChild(number); group.appendChild(row);
            }
            container.appendChild(group);
        });
    }

    function updateUIFromState() {
        const geoSelect = document.getElementById('geo-type');
        const polyContainer = document.getElementById('poly-type-container');
        const polySelect = document.getElementById('poly-type');

        if (sphereTypes.includes(state.geoType)) {
            geoSelect.value = 'sphere';
            polyContainer.style.display = 'block';
            polySelect.value = state.geoType;
        } else {
            geoSelect.value = state.geoType;
            polyContainer.style.display = 'none';
        }
        
        document.getElementById('grid-show-u').checked = state.gridUV.u; document.getElementById('grid-show-v').checked = state.gridUV.v;

        const isCustom = state.geoType === 'custom'; const isMath = state.geoType === 'math'; const isParametric = state.geoType === 'parametric'; const isLandscape = state.geoType === 'landscape';
        document.getElementById('obj-upload-container').style.display = isCustom ? 'block' : 'none';
        document.getElementById('math-settings-container').style.display = isMath ? 'block' : 'none';
        document.getElementById('parametric-settings-container').style.display = isParametric ? 'block' : 'none';
        document.getElementById('landscape-settings-container').style.display = isLandscape ? 'block' : 'none';

        const list = document.getElementById('deformation-list');
        if (state.deformationOrder && list) { state.deformationOrder.forEach(type => { const el = list.querySelector(`.control-group[data-type="${type}"]`); if (el) list.appendChild(el); }); }
        const btnReorder = document.getElementById('btn-reorder-deform'); if (btnReorder) { btnReorder.classList.toggle('active', state.reorderMode); }

        rebuildUIParams(true);

        document.getElementById('obj-rot-x').value = state.objRot.x; document.getElementById('obj-rot-y').value = state.objRot.y; document.getElementById('obj-rot-z').value = state.objRot.z;

        const setCheck = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
        const setDisplay = (id, show) => { const el = document.getElementById(id); if(el) el.style.display = show ? 'block' : 'none'; };

        setCheck('use-noise', state.noise.enabled); setDisplay('noise-controls', state.noise.enabled); setVal('noise-type', state.noise.noiseType); setVal('noise-axis', state.noise.axis); setVal('noise-amp', state.noise.amp); setVal('val-noise-amp', state.noise.amp); setVal('noise-freq', state.noise.freq); setVal('val-noise-freq', state.noise.freq); setVal('noise-seed', state.noise.seed); setVal('val-noise-seed', state.noise.seed);
        setCheck('use-twist', state.twist.enabled); setDisplay('twist-controls', state.twist.enabled); setVal('twist-axis', state.twist.axis); setVal('twist-angle', state.twist.angle); setVal('val-twist-angle', state.twist.angle);
        setCheck('use-wave', state.wave.enabled); setDisplay('wave-controls', state.wave.enabled); setVal('wave-axis', state.wave.axis); setVal('wave-int', state.wave.int); setVal('val-wave-int', state.wave.int); setVal('wave-freq', state.wave.freq); setVal('val-wave-freq', state.wave.freq);
        setCheck('use-bulge', state.bulge.enabled); setDisplay('bulge-controls', state.bulge.enabled); setVal('bulge-axis', state.bulge.axis); setVal('bulge-str', state.bulge.str); setVal('val-bulge-str', state.bulge.str);
        setCheck('use-bend', state.bend.enabled); setDisplay('bend-controls', state.bend.enabled); setVal('bend-axis', state.bend.axis); setVal('bend-amt', state.bend.amt); setVal('val-bend-amt', state.bend.amt);
        setCheck('use-taper', state.taper.enabled); setDisplay('taper-controls', state.taper.enabled); setVal('taper-axis', state.taper.axis); setVal('taper-amt', state.taper.amt); setVal('val-taper-amt', state.taper.amt);
        setCheck('use-ripple', state.ripple.enabled); setDisplay('ripple-controls', state.ripple.enabled); setVal('ripple-axis', state.ripple.axis); setVal('ripple-amp', state.ripple.amp); setVal('val-ripple-amp', state.ripple.amp); setVal('ripple-freq', state.ripple.freq); setVal('val-ripple-freq', state.ripple.freq);
        setCheck('use-spherify', state.spherify.enabled); setDisplay('spherify-controls', state.spherify.enabled); setVal('spherify-str', state.spherify.str); setVal('val-spherify-str', state.spherify.str);
        setCheck('use-skew', state.skew.enabled); setDisplay('skew-controls', state.skew.enabled); setVal('skew-axis', state.skew.axis); setVal('skew-amt', state.skew.amt); setVal('val-skew-amt', state.skew.amt);

        setVal('cam-x', state.cam.x); setVal('cam-y', state.cam.y); setVal('cam-z', state.cam.z); setVal('cam-fov', state.cam.fov); setVal('val-cam-fov', state.cam.fov);
        if(state.cam.target) {
            setVal('cam-target-x', state.cam.target.x); setVal('cam-target-y', state.cam.target.y); setVal('cam-target-z', state.cam.target.z);
        }

        setVal('visual-style', state.style);
        const showHl = true; setDisplay('hidden-line-settings', showHl);
        let isSpline = ['math', 'sphere', 'cylinder', 'cone', 'torus', 'knot', 'ring', 'parametric'].includes(state.geoType);
        if (state.geoType === 'grid' && state.geoParams[4]) isSpline = true;
        if (state.geoType === 'cube' && state.geoParams[6]) isSpline = true;
        if (state.geoType === 'landscape') isSpline = true;

        const isHiddenLine = state.style === 'hidden-line'; const isWireframe = state.style === 'wireframe';
        setDisplay('grid-uv-controls', isSpline && state.geoType !== 'cone' && state.geoType !== 'cylinder');
        const isPrecise = state.occlusionMethod === 'precise' || state.occlusionMethod === 'precise-fast' || state.occlusionMethod === 'gpu';
        setDisplay('ctrl-hl-epsilon', isHiddenLine && isPrecise);
        setDisplay('ctrl-hl-spline-res', (isHiddenLine || isWireframe) && isSpline && isPrecise);
        
        setDisplay('ctrl-solid-subdiv', isHiddenLine && isSpline);
        setVal('solid-subdiv', state.solidSubdiv); setVal('val-solid-subdiv', state.solidSubdiv);

        setDisplay('ctrl-hl-method', isHiddenLine || isWireframe); setDisplay('ctrl-hl-proper-order', true);
        setDisplay('ctrl-gpu-grid', (isHiddenLine || isWireframe) && state.occlusionMethod === 'gpu');

        setVal('hl-epsilon', state.hiddenSettings.epsilon); setVal('val-hl-epsilon', state.hiddenSettings.epsilon); setVal('hl-spline-res', state.hiddenSettings.splineRes); setVal('val-hl-spline-res', state.hiddenSettings.splineRes);
        setVal('hl-method', state.occlusionMethod); setVal('gpu-grid', state.gpuGridSize); setCheck('hl-proper-order', state.properOrder);        setVal('hl-bias', state.hiddenSettings.bias); setVal('val-hl-bias', state.hiddenSettings.bias);

        setVal('hl-inflate', state.hiddenSettings.inflate); setVal('val-hl-inflate', state.hiddenSettings.inflate);
        setVal('hl-min-len', state.hiddenSettings.minLen); setVal('val-hl-min-len', state.hiddenSettings.minLen);

        setCheck('use-z-color', state.zDepth.color); setDisplay('z-color-controls', state.zDepth.color);
        setCheck('use-z-opacity', state.zDepth.opacity); setDisplay('z-opacity-controls', state.zDepth.opacity);
        setCheck('use-z-dof', state.zDepth.dof); setDisplay('z-dof-controls', state.zDepth.dof);
        setVal('dof-focus', state.dof.focus); setVal('val-dof-focus', state.dof.focus); setVal('dof-intensity', state.dof.intensity); setVal('val-dof-intensity', state.dof.intensity); setVal('dof-aperture', state.dof.aperture); setVal('val-dof-aperture', state.dof.aperture);
        if (typeof curveEditor !== 'undefined') { curveEditor.localOp = undefined; curveEditor.localSize = undefined; }
        setCheck('dof-ignore-near', state.dof.ignoreNear); setVal('input-col-near', state.colorNear); setVal('input-col-far', state.colorFar);
        
        const stop1 = document.getElementById('stop-1'), stop2 = document.getElementById('stop-2'), gradBar = document.getElementById('grad-bar');
        if (stop1 && stop2 && gradBar) { const p1 = state.gradStart * 100, p2 = state.gradEnd * 100; stop1.style.left = `${p1}%`; stop2.style.left = `${p2}%`; gradBar.style.background = `linear-gradient(90deg, ${state.colorNear} 0%, ${state.colorNear} ${p1}%, ${state.colorFar} ${p2}%, ${state.colorFar} 100%)`; }
        const opStop1 = document.getElementById('op-stop-1'), opStop2 = document.getElementById('op-stop-2'), opBar = document.getElementById('op-grad-bar');
        const opGradStartVal = state.opGradStart !== undefined ? state.opGradStart : 0.0;
        const opGradEndVal = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
        if (opStop1 && opStop2 && opBar) { const p1 = opGradStartVal * 100, p2 = opGradEndVal * 100; opStop1.style.left = `${p1}%`; opStop2.style.left = `${p2}%`; opBar.style.background = `linear-gradient(90deg, #000 0%, #000 ${p1}%, #fff ${p2}%, #fff 100%)`; }
        setVal('style-dot-size', state.dotSize); setVal('val-style-dot-size', state.dotSize);
        setCheck('use-clip', state.clip.enabled); setDisplay('clip-controls', state.clip.enabled); setVal('clip-axis', state.clip.axis); setVal('clip-pos', state.clip.pos); setVal('val-clip-pos', state.clip.pos);
        setVal('math-formula', state.mathFormula); setVal('math-var-a', state.mathVars.a); setVal('math-var-b', state.mathVars.b); setVal('math-var-c', state.mathVars.c);
        setVal('param-x', state.parametricFormulas.x); setVal('param-y', state.parametricFormulas.y); setVal('param-z', state.parametricFormulas.z);
        setVal('landscape-seed', state.landscape.seed); setVal('val-landscape-seed', state.landscape.seed); setVal('landscape-noise-type', state.landscape.noiseType); setVal('landscape-amp', state.landscape.amplitude); setVal('val-landscape-amp', state.landscape.amplitude); setVal('landscape-freq', state.landscape.frequency); setVal('val-landscape-freq', state.landscape.frequency); setVal('landscape-octaves', state.landscape.octaves); setVal('val-landscape-octaves', state.landscape.octaves); setVal('landscape-persistence', state.landscape.persistence); setVal('val-landscape-persistence', state.landscape.persistence); setVal('landscape-lacunarity', state.landscape.lacunarity); setVal('val-landscape-lacunarity', state.landscape.lacunarity); setVal('landscape-sea-level', state.landscape.seaLevel); setVal('val-landscape-sea-level', state.landscape.seaLevel); setVal('landscape-noise-scale', state.landscape.noiseScale); setVal('val-landscape-noise-scale', state.landscape.noiseScale);
        setVal('cam-rot-x', state.cam.rotX); setVal('cam-rot-y', state.cam.rotY);

        document.querySelectorAll('.preset-btn').forEach((btn, idx) => {
            if (presets[idx]) btn.classList.add('filled');
            else btn.classList.remove('filled');
        });

        setVal('grad-mode', state.gradMode);
        setDisplay('grad-rot-controls', state.gradMode === 'directional');
        setVal('grad-rot-x', state.gradRot.x); setVal('val-grad-rot-x', state.gradRot.x);
        setVal('grad-rot-y', state.gradRot.y); setVal('val-grad-rot-y', state.gradRot.y);
    }

    function syncInput(rangeId, numId, callback) {
        const r = document.getElementById(rangeId), n = document.getElementById(numId);
        if (!r || !n) return;
        r.addEventListener('pointerdown', recordDragStart); r.addEventListener('change', recordDragEnd);
        r.addEventListener('input', () => { n.value = r.value; callback(r.value); });
        n.addEventListener('change', () => { saveHistory(); r.value = n.value; callback(n.value); });
    }

    function generateLandscapeGeometry(detailMultiplier = 1) {
        const p = state.geoParams; const landscapeState = state.landscape;
        const width = p[0]; const height = p[1];
        const widthSegs = Math.round(p[2] * detailMultiplier); 
        const heightSegs = Math.round(p[3] * detailMultiplier);

        const geo = new THREE.PlaneGeometry(width, height, widthSegs, heightSegs);
        const pos = geo.attributes.position;
        const rng = mulberry32(landscapeState.seed);
        let noiseGenerator;
        switch (landscapeState.noiseType) {
            case 'perlin': noiseGenerator = new PerlinNoise(rng); break;
            case 'worley': noiseGenerator = new WorleyNoise(rng); break;
            case 'value': noiseGenerator = new ValueNoise(rng); break;
            case 'turbulence': noiseGenerator = new TurbulenceNoise(SimplexNoise, rng); break;
            case 'ridged': noiseGenerator = new RidgedMultifractalNoise(SimplexNoise, rng); break;
            case 'simplex': default: noiseGenerator = new SimplexNoise(rng); break;
        }
        const amplitude = landscapeState.amplitude, octaves = landscapeState.octaves, persistence = landscapeState.persistence, lacunarity = landscapeState.lacunarity, seaLevel = landscapeState.seaLevel, noiseScale = landscapeState.noiseScale;
        const offsetX = rng() * 10000, offsetZ = rng() * 10000;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), z = pos.getY(i);
            let y = 0, currentAmplitude = amplitude, currentFrequency = landscapeState.frequency;
            for (let j = 0; j < octaves; j++) {
                y += noiseGenerator.noise3D((x * currentFrequency * noiseScale) + offsetX, (z * currentFrequency * noiseScale) + offsetZ, 0) * currentAmplitude;
                currentAmplitude *= persistence; currentFrequency *= lacunarity;
            }
            if (y < seaLevel) y = seaLevel;
            pos.setXYZ(i, x, y, z);
        }
        geo.computeVertexNormals(); geo.center(); return geo;
        geo.computeBoundingSphere();
    }

    function generateBaseGeometry(detailMultiplier = 1) {
        const type = state.geoType; const p = state.geoParams;
        let geo;
        const mult = (val) => Math.round(val * detailMultiplier);
        const addDetail = (val) => { const levels = Math.floor(detailMultiplier - 1); return val + Math.max(0, levels); };
        switch (type) {
            case 'icosahedron': geo = new THREE.IcosahedronGeometry(p[0], addDetail(p[1])); break;
            case 'tetrahedron': geo = new THREE.TetrahedronGeometry(p[0], addDetail(p[1])); break;
            case 'octahedron': geo = new THREE.OctahedronGeometry(p[0], addDetail(p[1])); break;
            case 'dodecahedron': geo = new THREE.DodecahedronGeometry(p[0], addDetail(p[1])); break;
            case 'cube': geo = new THREE.BoxGeometry(p[0], p[1], p[2], mult(p[3]), mult(p[4]), mult(p[5])); break;
            case 'sphere': geo = new THREE.SphereGeometry(p[0], mult(p[1]), mult(p[2])); break;
            case 'sphere-circles': {
                const circleSegs = Math.max(8, mult(p[1]));
                geo = new THREE.SphereGeometry(p[0], circleSegs, circleSegs);
                break;
            }
            case 'landscape': geo = generateLandscapeGeometry(detailMultiplier); break;
            case 'torus': geo = new THREE.TorusGeometry(p[0], p[1], mult(p[2]), mult(p[3])); break;
            case 'ring': geo = new THREE.RingGeometry(p[0], p[1], mult(p[2]), mult(p[3])); break;
            case 'grid': geo = new THREE.PlaneGeometry(p[0], p[1], mult(p[2]), mult(p[3])); break;
            case 'math': {
                const range = p[0], segs = mult(p[1]);
                const mathContext = `const sin = Math.sin; const cos = Math.cos; const tan = Math.tan; const asin = Math.asin; const acos = Math.acos; const atan = Math.atan; const abs = Math.abs; const sqrt = Math.sqrt; const cbrt = Math.cbrt; const pow = Math.pow; const exp = Math.exp; const log = Math.log; const max = Math.max; const min = Math.min; const PI = Math.PI; const E = Math.E; const ceil = Math.ceil; const floor = Math.floor; const round = Math.round; const random = Math.random; const a = ${state.mathVars.a}; const b = ${state.mathVars.b}; const c = ${state.mathVars.c};`;
                let func; try { func = new Function('x', 'z', mathContext + 'return ' + state.mathFormula + ';'); } catch(e) { return new THREE.PlaneGeometry(range*2, range*2, segs, segs); }
                geo = new THREE.PlaneGeometry(range * 2, range * 2, segs, segs);
                const pos = geo.attributes.position; for(let i=0; i<pos.count; i++){ const x = pos.getX(i), z = pos.getY(i); let y = 0; try { y = func(x, z); } catch(e) { y = 0; } pos.setXYZ(i, x, y, z); }
                geo.computeVertexNormals();
                break;
            }
            case 'parametric': {
                const uMin = p[0], uMax = p[1], vMin = p[2], vMax = p[3], pSegs = mult(p[4]);
                const pMathContext = `const sin = Math.sin; const cos = Math.cos; const tan = Math.tan; const asin = Math.asin; const acos = Math.acos; const atan = Math.atan; const abs = Math.abs; const sqrt = Math.sqrt; const cbrt = Math.cbrt; const pow = Math.pow; const exp = Math.exp; const log = Math.log; const max = Math.max; const min = Math.min; const PI = Math.PI; const E = Math.E; const ceil = Math.ceil; const floor = Math.floor; const round = Math.round; const random = Math.random;`;
                let funcX, funcY, funcZ; try { funcX = new Function('u', 'v', pMathContext + 'return ' + state.parametricFormulas.x + ';'); funcY = new Function('u', 'v', pMathContext + 'return ' + state.parametricFormulas.y + ';'); funcZ = new Function('u', 'v', pMathContext + 'return ' + state.parametricFormulas.z + ';'); } catch(e) { return new THREE.PlaneGeometry(5, 5, pSegs, pSegs); }
                geo = new THREE.PlaneGeometry(1, 1, pSegs, pSegs);
                const posP = geo.attributes.position; for(let i=0; i<posP.count; i++){ const rawU = posP.getX(i), rawV = posP.getY(i); const normU = rawU + 0.5, normV = rawV + 0.5; const u = uMin + (normU * (uMax - uMin)), v = vMin + (normV * (vMax - vMin)); let valX=0, valY=0, valZ=0; try { valX = funcX(u, v); valY = funcY(u, v); valZ = funcZ(u, v); } catch(e) { } posP.setXYZ(i, valX, valY, valZ); }
                geo.computeVertexNormals();
                break;
            }
            case 'custom': geo = originalGeometry ? originalGeometry.clone() : new THREE.BoxGeometry(1,1,1); break;
            default: geo = new THREE.BoxGeometry(1,1,1);
        }
        return geo;
    }

    function mulberry32(a) { return function() { var t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }

    function createQuadWireframe(geometry) {
        const nonQuadTypes = ['icosahedron', 'tetrahedron', 'octahedron', 'dodecahedron', 'circle'];
        if (nonQuadTypes.includes(state.geoType) || !geometry.index) return new THREE.WireframeGeometry(geometry);
        const pos = geometry.attributes.position, index = geometry.index, edges = [];
        for (let i = 0; i < index.count; i += 6) {
            if (i + 5 >= index.count) { for (let j = i; j < index.count; j += 3) { const a = index.getX(j), b = index.getX(j+1), c = index.getX(j+2); edges.push(a, b, b, c, c, a); } break; }
            const t1 = [index.getX(i), index.getX(i+1), index.getX(i+2)], t2 = [index.getX(i+3), index.getX(i+4), index.getX(i+5)];
            const shared = t1.filter(v => t2.includes(v));
            if (shared.length === 2) {
                const addUniqueEdges = (tri) => { if (!(shared.includes(tri[0]) && shared.includes(tri[1]))) edges.push(tri[0], tri[1]); if (!(shared.includes(tri[1]) && shared.includes(tri[2]))) edges.push(tri[1], tri[2]); if (!(shared.includes(tri[2]) && shared.includes(tri[0]))) edges.push(tri[2], tri[0]); };
                addUniqueEdges(t1); addUniqueEdges(t2);
            } else { edges.push(t1[0], t1[1], t1[1], t1[2], t1[2], t1[0]); edges.push(t2[0], t2[1], t2[1], t2[2], t2[2], t2[0]); }
        }
        const geo = new THREE.BufferGeometry(), vertArray = []; for(let j=0; j<edges.length; j++) vertArray.push(pos.getX(edges[j]), pos.getY(edges[j]), pos.getZ(edges[j]));
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertArray, 3)); return geo;
    }

    function createSplineWireframe(geometry, params, type, subdivision = 12) {
        let wSegs, hSegs, closedU = false, closedV = false;
        switch(type) {
            case 'grid': wSegs = params[2]; hSegs = params[3]; break;
            case 'cube': break;
            case 'math': wSegs = params[1]; hSegs = params[1]; break;
            case 'parametric': wSegs = params[4]; hSegs = params[4]; break;
            case 'landscape': wSegs = params[2]; hSegs = params[3]; break;
            case 'sphere': wSegs = params[1]; hSegs = params[2]; closedU = true; break;
            case 'cylinder': wSegs = params[3]; hSegs = params[4]; closedU = true; break;
            case 'cone': wSegs = params[2]; hSegs = params[3]; closedU = true; break;
            case 'torus': wSegs = params[3]; hSegs = params[2]; closedU = true; closedV = true; break;
            case 'knot': wSegs = params[3]; hSegs = params[2]; closedU = true; closedV = true; break;
            case 'ring': wSegs = params[2]; hSegs = params[3]; closedU = true; break;
            default: if (params.length >= 2) { wSegs = params[params.length-2]; hSegs = params[params.length-1]; } else { wSegs = 10; hSegs = 10; } break;
        }
        const pos = geometry.attributes.position, vertArray = [], rawSplineGroups = [];
        const pushSegments = (pts) => { for(let i=0; i<pts.length-1; i++) { vertArray.push(pts[i].x, pts[i].y, pts[i].z); vertArray.push(pts[i+1].x, pts[i+1].y, pts[i+1].z); } };

        if (type === 'cube') {
            const sx = params[3], sy = params[4], sz = params[5];
            const faces = [{ name: 'Right', u: sz, v: sy }, { name: 'Left',  u: sz, v: sy }, { name: 'Top',   u: sx, v: sz }, { name: 'Bottom',u: sx, v: sz }, { name: 'Front', u: sx, v: sy }, { name: 'Back',  u: sx, v: sy }];
            let offset = 0;
            faces.forEach((f, i) => {
                const uSegs = f.u, vSegs = f.v, groupSplines = [];
                if (state.gridUV.u) { for (let y = 0; y <= vSegs; y++) { const pts = []; for (let x = 0; x <= uSegs; x++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints(uSegs * subdivision); pushSegments(sp); groupSplines.push({ points: pts, closed: false, direction: 'u' }); } }
                if (state.gridUV.v) { for (let x = 0; x <= uSegs; x++) { const pts = []; for (let y = 0; y <= vSegs; y++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints(vSegs * subdivision); pushSegments(sp); groupSplines.push({ points: pts, closed: false, direction: 'v' }); } }
                rawSplineGroups.push({ name: `Face_${i}_${f.name}`, splines: groupSplines }); offset += (uSegs + 1) * (vSegs + 1);
            });
        } else {
            const expected = (wSegs + 1) * (hSegs + 1);
            if (type !== 'landscape' && !state.spline.force && pos.count !== expected) { console.warn('Spline generation skipped: Vertex count mismatch.', type, pos.count, expected); return createQuadWireframe(geometry); }
            const groupSplines = [];
            if (state.gridUV.u) { for (let y = 0; y <= hSegs; y++) { const points = []; for (let x = 0; x <= wSegs; x++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } let isClosed = closedU; if (isClosed) { if (points.length > 1 && points[0].distanceTo(points[points.length-1]) < 0.0001) points.pop(); } if(points.length < 2) continue; const curve = new THREE.CatmullRomCurve3(points); curve.closed = isClosed; const splinePoints = curve.getPoints(wSegs * subdivision); pushSegments(splinePoints); groupSplines.push({ points: [...points], closed: isClosed, direction: 'u' }); } }
            if (state.gridUV.v) { for (let x = 0; x <= wSegs; x++) { const points = []; for (let y = 0; y <= hSegs; y++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } let isClosed = closedV; if (isClosed) { if (points.length > 1 && points[0].distanceTo(points[points.length-1]) < 0.0001) points.pop(); } if(points.length < 2) continue; const curve = new THREE.CatmullRomCurve3(points); curve.closed = isClosed; const splinePoints = curve.getPoints(hSegs * subdivision); pushSegments(splinePoints); groupSplines.push({ points: [...points], closed: isClosed, direction: 'v' }); } }
            rawSplineGroups.push({ name: 'Main', splines: groupSplines });
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertArray, 3)); geo.userData.splineGroups = rawSplineGroups; return geo;
    }

    function createOverlappingCirclesWireframe(params) {
        const radius = params[0] || 1;
        const resolution = Math.max(8, Math.round(params[1] || 48));
        const density = Math.max(3, Math.round(params[2] || 6));
        const segments = Math.min(128, Math.max(48, Math.round(resolution * 1.25)));
        const positions = [];
        const axisNormals = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-0.5, 0, Math.sqrt(3) / 2),
            new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2)
        ];
        const horizontalNormal = new THREE.Vector3(0, 1, 0);
        const getPlaneBasis = (normal) => {
            const anchor = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
            const tangent = new THREE.Vector3().crossVectors(anchor, normal).normalize();
            if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0).cross(normal).normalize();
            const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
            return [tangent, bitangent];
        };
        const addLoops = (normal, count) => {
            const ringCount = Math.max(3, count);
            const [tangent, bitangent] = getPlaneBasis(normal);
            for (let i = 0; i < ringCount; i++) {
                const t = ringCount === 1 ? 0.5 : i / (ringCount - 1);
                const offset = THREE.MathUtils.lerp(-radius, radius, t);
                const safeOffset = Math.max(-radius + 0.001, Math.min(radius - 0.001, offset));
                const circleRadius = Math.sqrt(Math.max(0, radius * radius - safeOffset * safeOffset));
                if (circleRadius < 0.01) continue;
                const center = normal.clone().multiplyScalar(safeOffset);
                const loopPts = [];
                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    const cos = Math.cos(theta);
                    const sin = Math.sin(theta);
                    const pt = center.clone()
                        .add(tangent.clone().multiplyScalar(cos * circleRadius))
                        .add(bitangent.clone().multiplyScalar(sin * circleRadius));
                    loopPts.push(pt);
                }
                for (let j = 0; j < loopPts.length; j++) {
                    const next = loopPts[(j + 1) % loopPts.length];
                    positions.push(loopPts[j].x, loopPts[j].y, loopPts[j].z);
                    positions.push(next.x, next.y, next.z);
                }
            }
        };
        axisNormals.forEach(normal => addLoops(normal, density));
        addLoops(horizontalNormal, Math.max(3, Math.round(density * 0.5)));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return geo;
    }

    function updateGeometry() {
        if (mainMeshGroup) { scene.remove(mainMeshGroup); if (mainMeshGroup.userData.dispose) mainMeshGroup.userData.dispose(); }

        const geoWire = generateBaseGeometry(1);
        
        const isHiddenLine = state.style === 'hidden-line' || state.style === 'dots-solid';
        let isSpline = ['math', 'sphere', 'cylinder', 'cone', 'torus', 'knot', 'ring', 'parametric'].includes(state.geoType);
        if (state.geoType === 'grid' && state.geoParams[4]) isSpline = true;
        if (state.geoType === 'cube' && state.geoParams[6]) isSpline = true;
        if (state.geoType === 'landscape') isSpline = true;

        let geoSolid;
        if (isHiddenLine && isSpline && state.solidSubdiv > 1) {
             geoSolid = generateBaseGeometry(state.solidSubdiv);
        } else {
             geoSolid = generateBaseGeometry(1); 
        }

        const applyDeformations = (geometry, options = {}) => {
            const { skipNormals = false } = options;
            const rng = mulberry32(state.noise.seed);
            let noiseGenerator;
            switch (state.noise.noiseType) {
                case 'perlin': noiseGenerator = new PerlinNoise(rng); break;
                case 'worley': noiseGenerator = new WorleyNoise(rng); break;
                case 'value': noiseGenerator = new ValueNoise(rng); break;
                case 'turbulence': noiseGenerator = new TurbulenceNoise(SimplexNoise, rng); break;
                case 'ridged': noiseGenerator = new RidgedMultifractalNoise(SimplexNoise, rng); break;
                case 'simplex': default: noiseGenerator = new SimplexNoise(rng); break;
            }
            simplex = noiseGenerator;
            const pos = geometry.attributes.position;
            const v = new THREE.Vector3(); const axMap = { x: 0, y: 1, z: 2 }; const vDir = new THREE.Vector3();
            const deformations = {
                twist: (v, p) => { const axisIdx = axMap[p.axis], angle = v.getComponent(axisIdx) * p.angle, c = Math.cos(angle), s = Math.sin(angle), uIdx = (axisIdx + 1) % 3, wIdx = (axisIdx + 2) % 3, u = v.getComponent(uIdx), w = v.getComponent(wIdx); v.setComponent(uIdx, u * c - w * s); v.setComponent(wIdx, u * s + w * c); },
                wave: (v, p) => { const axisIdx = axMap[p.axis], u = v.getComponent((axisIdx + 1) % 3), w = v.getComponent((axisIdx + 2) % 3), val = v.getComponent(axisIdx); v.setComponent(axisIdx, val + Math.sin(u * p.freq + w * p.freq) * p.int); },
                noise: (v, p) => { const n = simplex.noise3D(v.x * p.freq, v.y * p.freq, v.z * p.freq) * p.amp; if (p.axis === 'all') { vDir.copy(v).normalize(); v.addScaledVector(vDir, n); } else if (p.axis === 'center') { vDir.copy(v); v.addScaledVector(vDir, n); } else { const idx = axMap[p.axis]; v.setComponent(idx, v.getComponent(idx) + n); } },
                bulge: (v, p) => { const dist = v.length(), factor = 1 + (Math.sin(dist * 3.0) * p.str * 0.5); if (p.axis === 'all') v.multiplyScalar(factor); else { const idx = axMap[p.axis]; v.setComponent(idx, v.getComponent(idx) * factor); } },
                bend: (v, p) => { const axisIdx = axMap[p.axis], mainVal = v.getComponent(axisIdx), targetIdx = (axisIdx + 1) % 3, current = v.getComponent(targetIdx); v.setComponent(targetIdx, current + (mainVal * mainVal) * p.amt); },
                taper: (v, p) => { const axisIdx = axMap[p.axis], mainVal = v.getComponent(axisIdx), scale = Math.max(0, 1 + (mainVal * p.amt)), uIdx = (axisIdx + 1) % 3, wIdx = (axisIdx + 2) % 3; v.setComponent(uIdx, v.getComponent(uIdx) * scale); v.setComponent(wIdx, v.getComponent(wIdx) * scale); },
                ripple: (v, p) => { const axisIdx = axMap[p.axis], u = v.getComponent((axisIdx + 1) % 3), w = v.getComponent((axisIdx + 2) % 3), d = Math.sqrt(u*u + w*w), val = v.getComponent(axisIdx); v.setComponent(axisIdx, val + Math.sin(d * p.freq) * p.amp); },
                spherify: (v, p) => { const str = p.str; if (str > 0.001) { const len = v.length(); if (len > 0.0001) { const target = v.clone().normalize().multiplyScalar(1.5); v.lerp(target, str); } } },
                skew: (v, p) => { const amt = p.amt, axis = p.axis; if (axis === 'x') { v.y += v.x * amt; v.z += v.x * amt; } else if (axis === 'y') { v.x += v.y * amt; v.z += v.y * amt; } else { v.x += v.z * amt; v.y += v.z * amt; } }
            };
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                state.deformationOrder.forEach(type => { if (state[type] && state[type].enabled) deformations[type](v, state[type]); });
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            if (!skipNormals) geometry.computeVertexNormals();
        };

        applyDeformations(geoWire);
        if (geoSolid !== geoWire) applyDeformations(geoSolid);

        mainMeshGroup = new THREE.Group();
        mainMeshGroup.rotation.set(THREE.MathUtils.degToRad(state.objRot.x), THREE.MathUtils.degToRad(state.objRot.y), THREE.MathUtils.degToRad(state.objRot.z));

        let clipPlanes = [];
        if (state.clip.enabled) {
            const normal = new THREE.Vector3();
            if (state.clip.axis === 'x') normal.set(-1, 0, 0); else if (state.clip.axis === 'y') normal.set(0, -1, 0); else normal.set(0, 0, -1);
            clipPlanes.push(new THREE.Plane(normal, state.clip.pos));
        }

        const style = state.style; let meshWire; let meshSolid;
        if (style === 'hidden-line' || style === 'dots-solid') {
            
            let solidGeoToUse = geoSolid;
            if (state.hiddenSettings.inflate > 0.0001) {
                solidGeoToUse = geoSolid.clone();
                const pos = solidGeoToUse.attributes.position;
                const norm = solidGeoToUse.attributes.normal;
                const v = new THREE.Vector3();
                const n = new THREE.Vector3();
                
                for(let i=0; i<pos.count; i++){
                    v.fromBufferAttribute(pos, i);
                    n.fromBufferAttribute(norm, i);
                    v.add(n.multiplyScalar(state.hiddenSettings.inflate));
                    pos.setXYZ(i, v.x, v.y, v.z);
                }
            }

            const matSolid = new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x000000, polygonOffset: true, polygonOffsetFactor: state.hiddenSettings.bias, polygonOffsetUnits: state.hiddenSettings.bias, flatShading: true, side: THREE.DoubleSide, clippingPlanes: clipPlanes, clipShadows: true });
            meshSolid = new THREE.Mesh(solidGeoToUse, matSolid);
            mainMeshGroup.add(meshSolid);
        }

        if (style === 'dots' || style === 'dots-solid') {
            const m = matWireShader.clone(); m.clipping = true; m.clippingPlanes = clipPlanes;
            meshWire = new THREE.Points(geoWire, m);
        } else {
            let useSpline = ['math', 'sphere', 'cylinder', 'cone', 'torus', 'knot', 'ring', 'parametric'].includes(state.geoType);
            if (state.geoType === 'grid' && state.geoParams[4]) useSpline = true;
            if (state.geoType === 'cube' && state.geoParams[6]) useSpline = true;
            if (state.geoType === 'landscape') useSpline = true;
            if (sphereTypes.includes(state.geoType) && state.geoType !== 'sphere') useSpline = false; 
            if (state.geoType === 'sphere') useSpline = true; 

            let wireGeo;
            if (state.geoType === 'sphere-circles') {
                wireGeo = createOverlappingCirclesWireframe(state.geoParams);
                applyDeformations(wireGeo, { skipNormals: true });
            } else if (useSpline) {
                wireGeo = createSplineWireframe(geoWire, state.geoParams, state.geoType, state.spline.subdiv);
            } else {
                wireGeo = createQuadWireframe(geoWire);
            }
            
            const m = matWireShader.clone(); m.clipping = true; m.clippingPlanes = clipPlanes;
            meshWire = new THREE.LineSegments(wireGeo, m);
        }
        mainMeshGroup.add(meshWire);
        mainMeshGroup.userData.solid = meshSolid; mainMeshGroup.userData.wire = meshWire; mainMeshGroup.userData.clipPlane = clipPlanes.length > 0 ? clipPlanes[0] : null;
        mainMeshGroup.userData.dispose = () => { geoWire.dispose(); if(geoSolid && geoSolid !== geoWire) geoSolid.dispose(); if(meshSolid) meshSolid.material.dispose(); if(meshWire.geometry) meshWire.geometry.dispose(); if(meshWire.material) meshWire.material.dispose(); };
        scene.add(mainMeshGroup);

        const isSplineCount = mainMeshGroup.userData.wire && mainMeshGroup.userData.wire.geometry && mainMeshGroup.userData.wire.geometry.userData && mainMeshGroup.userData.wire.geometry.userData.splineGroups;
        document.getElementById('poly-count').textContent = `${geoWire.attributes.position.count / 3 | 0} tris${isSplineCount ? ' (splines)' : ''}`;
        if(state.svgPreview) disableSVGPreview();
    }

    function onWindowResize() { const w = container.clientWidth, h = container.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
    function animate() { requestAnimationFrame(animate); controls.update(); updateMaterialUniforms(); renderer.render(scene, camera); }

    let previewAbortController = null; let cachedSVGContent = null;
    function disableSVGPreview() {
        if (!state.svgPreview) return; state.svgPreview = false;
        const btn = document.getElementById('btn-preview-svg'); if(btn) btn.classList.remove('btn-active-yellow');
        cachedSVGContent = null; if (previewAbortController) { previewAbortController.abort(); previewAbortController = null; }
        const cont = document.getElementById('svg-container'); const canv = document.getElementById('canvas-container'); const info = document.getElementById('info-export-match'); const loader = document.getElementById('preview-loader');
        if(cont) { cont.style.display = 'none'; cont.innerHTML = ''; } if(canv) canv.style.opacity = '1'; if(info) info.textContent = "Export doesn't match the preview exactly."; if(loader) loader.style.display = 'none'; updateMaterialUniforms();
    }
    async function enableSVGPreview() {
        if (state.svgPreview) return; if (previewAbortController) previewAbortController.abort(); previewAbortController = new AbortController(); const signal = previewAbortController.signal;
        state.svgPreview = true; cachedSVGContent = null;
        const cont = document.getElementById('svg-container'); const canv = document.getElementById('canvas-container'); const info = document.getElementById('info-export-match'); const pLoader = document.getElementById('preview-loader'); const pBar = document.getElementById('preview-bar');
        const pMessage = document.getElementById('preview-message'); const pStats = document.getElementById('preview-stats');
        if(pMessage) pMessage.textContent = 'Generating Preview...'; if(pStats) pStats.textContent = 'Lines: 0 Dots: 0';
        if(cont) { cont.style.display = 'block'; cont.innerHTML = ''; } if(canv) canv.style.opacity = '0'; if(info) info.textContent = "Export matches the preview exactly."; if(pLoader) pLoader.style.display = 'flex'; if(pBar) pBar.style.width = '0%';
        const cancelHandler = (e) => { if (e.key === 'Escape') { disableSVGPreview(); document.removeEventListener('keydown', cancelHandler); } }; document.addEventListener('keydown', cancelHandler);
        try {
            const width = container.clientWidth, height = container.clientHeight, bg = state.style.includes('hidden') ? '#111' : 'transparent';
            cont.innerHTML = `<svg id="preview-svg-root" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bg}"></svg>`; const svgRoot = document.getElementById('preview-svg-root');
            await new Promise(r => setTimeout(r, 50)); updateMaterialUniforms();
            const finalSVG = await computeSVG({
                onProgress: (pct, message, payload) => {
                    if(pBar) pBar.style.width = `${pct}%`; 
                    if(message && pMessage) pMessage.textContent = message;
                    const stats = payload?.stats;
                    if(stats && pStats) {
                        const lineText = `Lines: ${stats.lines ?? 0}/${stats.totalLines ?? 0}`;
                        const dotText = `Dots: ${stats.dots ?? 0}/${stats.totalDots ?? 0}`;
                        pStats.textContent = `${lineText} | ${dotText}`;
                    }
                },
                onChunk: (chunk, meta) => { if (meta?.final) return; if (svgRoot) svgRoot.insertAdjacentHTML('beforeend', chunk); },
                signal
            });
            cachedSVGContent = finalSVG; if(cont) cont.innerHTML = finalSVG;
        } catch (err) { if (err.name !== 'AbortError') { console.error("Preview failed", err); if(cont) cont.innerHTML = '<div style="color:red; padding:20px; text-align:center;">Preview Failed<br><small>'+err.message+'</small></div>'; } } finally { if(pLoader) pLoader.style.display = 'none'; previewAbortController = null; document.removeEventListener('keydown', cancelHandler); }
    }
    async function exportSVG() {
        if (!mainMeshGroup) return;
        if (state.svgPreview && cachedSVGContent) { downloadSVG(cachedSVGContent); return; }
        const loader = document.getElementById('loader'), loaderBar = document.getElementById('loader-bar'), loaderDetails = document.getElementById('loader-details'), loaderProc = document.getElementById('loader-processing'), loaderRes = document.getElementById('loader-result'), resultMsg = document.getElementById('loader-result-msg'), loaderStats = document.getElementById('loader-stats');
        loader.style.display = 'flex'; loaderProc.style.display = 'block'; loaderRes.style.display = 'none'; loaderBar.style.width = '0%'; loaderDetails.textContent = 'Initializing...'; if(loaderStats) loaderStats.textContent = 'Lines: 0/0 | Dots: 0/0';
        if (!state.svgPreview) { state.svgPreview = true; cachedSVGContent = null; document.getElementById('svg-container').style.display = 'block'; document.getElementById('canvas-container').style.opacity = '0'; }
        const width = container.clientWidth, height = container.clientHeight, bg = state.style.includes('hidden') ? '#111' : 'transparent';
        document.getElementById('svg-container').innerHTML = `<svg id="export-svg-root" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bg}"></svg>`;
        await new Promise(r => setTimeout(r, 50));
        try {
            const svgContent = await computeSVG({
                onProgress: (progress, message, payload) => {
                    loaderBar.style.width = `${progress}%`;
                    if(message) loaderDetails.textContent = message;
                    const stats = payload?.stats;
                    if(stats && loaderStats) {
                        const lineText = `Lines: ${stats.lines ?? 0}/${stats.totalLines ?? 0}`;
                        const dotText = `Dots: ${stats.dots ?? 0}/${stats.totalDots ?? 0}`;
                        loaderStats.textContent = `${lineText} | ${dotText}`;
                    }
                },
                onChunk: (chunk, meta) => {
                    const r = document.getElementById('export-svg-root'); if(!r) return;
                    if (meta?.final) r.innerHTML = chunk; else r.insertAdjacentHTML('beforeend', chunk);
                }
            });
            cachedSVGContent = svgContent; loaderDetails.textContent = 'Downloading...'; await new Promise(r => setTimeout(r, 200)); downloadSVG(svgContent);
            loaderProc.style.display = 'none'; loaderRes.style.display = 'flex'; resultMsg.textContent = 'Export Successful'; resultMsg.style.color = '#28a745';
        } catch (err) { loaderProc.style.display = 'none'; loaderRes.style.display = 'flex'; resultMsg.textContent = 'Error: ' + err.message; resultMsg.style.color = '#f44336'; }
    }
    
    async function computeSVG({ onProgress, onChunk, signal } = {}) {
        await new Promise(r => setTimeout(r, 0));
        const width = container.clientWidth, height = container.clientHeight;
        const bg = state.style.includes('hidden') ? '#111' : 'transparent';
        
        // Only create interpolators if DOF is enabled (for performance)
        const useDOF = state.zDepth.dof;
        const opEval = useDOF ? (state.dof.smoothCurve ? createMonotoneInterpolator(state.dof.opCurve) : (t) => evaluateLinear(t, state.dof.opCurve)) : null;
        const sizeEval = useDOF ? (state.dof.smoothCurve ? createMonotoneInterpolator(state.dof.sizeCurve) : (t) => evaluateLinear(t, state.dof.sizeCurve)) : null;
        
        const meshWire = mainMeshGroup.userData.wire; 
        const meshSolid = mainMeshGroup.userData.solid; 
        const isDots = (state.style === 'dots' || state.style === 'dots-solid'); 
        const isHiddenLine = (state.style === 'hidden-line' || state.style === 'dots-solid');
        
        const splineGroups = meshWire.geometry.userData.splineGroups;
        camera.updateMatrixWorld(); 
        const matWorld = meshWire.matrixWorld; 
        const matView = camera.matrixWorldInverse; 
        const matProj = camera.projectionMatrix; 
        const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
        const halfW = width / 2, halfH = height / 2, near = camera.near; 
        
        const raycaster = new THREE.Raycaster(); 
        const rayDir = new THREE.Vector3();
        
        if (meshSolid && meshSolid.geometry && !meshSolid.geometry.boundingSphere) { 
            meshSolid.geometry.computeBoundingSphere(); 
            meshSolid.geometry.computeBoundingBox(); 
        }
        
        const clipPlaneLocal = mainMeshGroup.userData.clipPlane; 
        let clipPlane = null; 
        if (clipPlaneLocal) clipPlane = clipPlaneLocal.clone().applyMatrix4(matWorld);
        
        const stats = { renderedLines: 0, totalLines: 0, renderedDots: 0, totalDots: 0 };
        const progressConfig = { start: 10, end: 90 };
        const progressState = { processed: 0, lastPercent: 0, total: 0 };
        const getStatsSnapshot = () => ({
            lines: stats.renderedLines,
            totalLines: stats.totalLines,
            dots: stats.renderedDots,
            totalDots: stats.totalDots
        });
        const pushProgress = (percent, message) => {
            if (!onProgress) return;
            const clamped = Math.max(0, Math.min(100, percent));
            progressState.lastPercent = Math.max(progressState.lastPercent, clamped);
            onProgress(clamped, message, { stats: getStatsSnapshot() });
        };
        const updateStreamingProgress = (message) => {
            if (!onProgress) return;
            const ratio = progressState.total > 0 ? Math.min(1, progressState.processed / progressState.total) : 0;
            const rawPercent = progressConfig.start + ratio * (progressConfig.end - progressConfig.start);
            const rounded = Math.round(rawPercent);
            const percent = Math.min(progressConfig.end, Math.max(progressState.lastPercent, rounded));
            if (!message && percent === progressState.lastPercent) return;
            progressState.lastPercent = Math.max(progressState.lastPercent, percent);
            onProgress(percent, message, { stats: getStatsSnapshot() });
        };
        const tickProgress = (amount = 1, message) => {
            if (amount > 0) progressState.processed += amount;
            updateStreamingProgress(message);
        };
        const reportLineSegment = (lineStr) => {
            if (onChunk) onChunk(lineStr, { type: 'line', final: false });
        };
        const reportDotSegment = (circleStr) => {
            if (onChunk) onChunk(circleStr, { type: 'dot', final: false });
        };
        const countSplines = () => {
            if (!splineGroups) return 0;
            return splineGroups.reduce((acc, group) => acc + ((Array.isArray(group.splines)) ? group.splines.length : 0), 0);
        };
        const setTotals = () => {
            const splineTotal = countSplines();
            const edgeCount = Math.floor(meshWire.geometry.attributes.position.count / 2);
            stats.totalLines = !isDots ? Math.max(0, splineTotal || edgeCount) : 0;
            stats.totalDots = isDots ? meshWire.geometry.attributes.position.count : 0;
            progressState.total = Math.max(1, stats.totalLines + stats.totalDots);
        };
        const markLineRendered = (message) => {
            if (stats.totalLines === 0) return;
            stats.renderedLines = Math.min(stats.renderedLines + 1, stats.totalLines);
            tickProgress(1, message || 'Processing lines...');
        };
        const markDotRendered = (message) => {
            if (stats.totalDots === 0) return;
            stats.renderedDots = Math.min(stats.renderedDots + 1, stats.totalDots);
            tickProgress(1, message || 'Processing dots...');
        };
        setTotals();

        const checkSignal = () => { if (signal && signal.aborted) throw new Error('Cancelled'); };
        let lastYield = performance.now(); const YIELD_MS = 30;

        // --- GPU DEPTH CAPTURE ---
        let gpuDepthData = null;
        const depthResW = Math.floor(width * 2.0), depthResH = Math.floor(height * 2.0);
        if (state.occlusionMethod === 'gpu' && isHiddenLine && meshSolid) {
            pushProgress(5, 'GPU: Capturing Depth Map...');
            const depthTarget = new THREE.WebGLRenderTarget(depthResW, depthResH);
            const depthMaterial = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                vertexShader: `varying float vDepth; void main() { vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition; vDepth = -mvPosition.z; }`,
                fragmentShader: `varying float vDepth; uniform float far; vec4 packDepth(float depth) { const vec4 bitShift = vec4(16777216.0, 65536.0, 256.0, 1.0); const vec4 bitMask = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); vec4 res = fract(depth * bitShift); res -= res.xxyz * bitMask; return res; } void main() { gl_FragColor = packDepth(vDepth / far); }`,
                uniforms: { far: { value: camera.far } }
            });
            const originalMat = meshSolid.material; meshSolid.material = depthMaterial;
            const originalBg = scene.background; scene.background = new THREE.Color(0xffffff);
            const originalVisible = meshWire.visible; meshWire.visible = false;
            
            renderer.setRenderTarget(depthTarget);
            renderer.render(scene, camera);
            
            const pixelBuffer = new Uint8Array(depthResW * depthResH * 4);
            renderer.readRenderTargetPixels(depthTarget, 0, 0, depthResW, depthResH, pixelBuffer);
            renderer.setRenderTarget(null);
            
            gpuDepthData = new Float32Array(depthResW * depthResH);
            for (let i = 0; i < gpuDepthData.length; i++) {
                const r = pixelBuffer[i * 4 + 0] / 255.0, g = pixelBuffer[i * 4 + 1] / 255.0, b = pixelBuffer[i * 4 + 2] / 255.0, a = pixelBuffer[i * 4 + 3] / 255.0;
                gpuDepthData[i] = r * (1.0/16777216.0) + g * (1.0/65536.0) + b * (1.0/256.0) + a;
            }
            
            meshSolid.material = originalMat; scene.background = originalBg; meshWire.visible = originalVisible;
            depthTarget.dispose(); depthMaterial.dispose();
            pushProgress(10, 'GPU: Depth Map Ready');
        }

        function checkOcclusion(targetPoint, maxDist) {
            if (!isHiddenLine || !meshSolid) return false;

            if (state.occlusionMethod === 'gpu' && gpuDepthData) {
                _c1.copy(targetPoint).applyMatrix4(matView);
                _vProj.copy(_c1).applyMatrix4(matProj);
                const tx = (_vProj.x * 0.5 + 0.5), ty = (_vProj.y * 0.5 + 0.5);
                if (tx < 0 || tx > 1 || ty < 0 || ty > 1) return false;
                
                const ix = Math.floor(tx * (depthResW - 1)), iy = Math.floor(ty * (depthResH - 1));
                
                // Neighborhood Min-Filter for precision
                let minDepthNormalized = 1.0;
                const gridSize = state.gpuGridSize || 3;
                const halfSize = Math.floor(gridSize / 2);
                for (let dy = -halfSize; dy < -halfSize + gridSize; dy++) {
                    for (let dx = -halfSize; dx < -halfSize + gridSize; dx++) {
                        const nx = ix + dx, ny = iy + dy;
                        if (nx >= 0 && nx < depthResW && ny >= 0 && ny < depthResH) {
                            const d = gpuDepthData[ny * depthResW + nx];
                            if (d < minDepthNormalized) minDepthNormalized = d;
                        }
                    }
                }
                
                const storedDepth = minDepthNormalized * camera.far;
                const currentDepth = -_c1.z;
                const bias = (state.hiddenSettings.bias * 0.1) + state.hiddenSettings.epsilon;
                return currentDepth > storedDepth + bias;
            }

            rayDir.subVectors(targetPoint, camPos).normalize();
            
            // Pull back slightly to avoid self-intersection
            const origin = camPos;
            
            raycaster.set(origin, rayDir);
            
            // Apply bias and epsilon (only subtract if > 0 for performance)
            const exportBias = state.hiddenSettings.bias * 0.1;
            const epsilon = state.hiddenSettings.epsilon;
            if (exportBias > 0 && epsilon > 0) {
                raycaster.far = maxDist - epsilon - exportBias;
            } else if (exportBias > 0) {
                raycaster.far = maxDist - exportBias;
            } else if (epsilon > 0) {
                raycaster.far = maxDist - epsilon;
            } else {
                raycaster.far = maxDist;
            }
            
            const hits = raycaster.intersectObject(meshSolid);
            return hits.length > 0;
        }

        async function smartYield() { 
            if (performance.now() - lastYield > YIELD_MS) { 
                await new Promise(r => setTimeout(r, 0)); 
                lastYield = performance.now(); 
                checkSignal(); 
                return true; 
            } 
            return false; 
        }

        // --- DEPTH ANALYSIS (skip if no zDepth features are enabled for performance) ---
        let minVal = Infinity, maxVal = -Infinity, safeRange = 1.0, minZ = 0, maxZ = 1, safeZRange = 1.0, gradDir = null;
        let opMinZ = 0, opMaxZ = 1, safeOpZRange = 1.0;
        const useZDepth = state.zDepth.color || state.zDepth.opacity || state.zDepth.dof;
        
        if (useZDepth) {
            const pos = meshWire.geometry.attributes.position; 
            const vTemp = new THREE.Vector3(); 
            const step = Math.max(1, Math.floor(pos.count / 200));
            gradDir = getGradientDirection();

            for (let i=0; i<pos.count; i+=step) { 
                vTemp.fromBufferAttribute(pos, i).applyMatrix4(matWorld); 
                const val = (state.gradMode === 'directional') ? vTemp.dot(gradDir) : vTemp.distanceTo(camPos);
                if (val < minVal) minVal = val; if (val > maxVal) maxVal = val; 
            }
            const range = maxVal - minVal; 
            safeRange = range < 0.01 ? 1.0 : range; 
            const opStart = state.opGradStart !== undefined ? state.opGradStart : 0.0;
            const opEnd = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
            minZ = minVal + (range * state.gradStart); 
            maxZ = minVal + (range * state.gradEnd); 
            safeZRange = Math.abs(maxZ - minZ) < 0.001 ? 0.001 : (maxZ - minZ);
            
            opMinZ = minVal + (range * opStart);
            opMaxZ = minVal + (range * opEnd);
            safeOpZRange = Math.abs(opMaxZ - opMinZ) < 0.001 ? 0.001 : (opMaxZ - opMinZ);
            
            pushProgress(5, 'Depth analysis complete.');
        } 

        // Style Helper
        const getStyle = (dist, worldPt) => {
            let col = (state.svgPreview && !state.zDepth.color) ? '#f1c40f' : state.baseColor; 
            let op = 1.0; let scale = 1.0;
            
            // Only calculate zDepth values if at least one zDepth feature is enabled (for performance)
            if (useZDepth) {
                const metric = (state.gradMode === 'directional') ? worldPt.dot(gradDir) : dist;
                const t = Math.max(0.0, Math.min(1.0, (metric - minZ) / safeZRange));
                
                if (state.zDepth.color) col = '#' + new THREE.Color(state.colorNear).lerp(new THREE.Color(state.colorFar), t).getHexString();
                if (state.zDepth.opacity) {
                    const opT = Math.max(0.0, Math.min(1.0, (metric - opMinZ) / safeOpZRange));
                    op *= (1.0 - opT);
                }
                
                if (useDOF) { 
                    let distDOF = (dist - minVal) / safeRange;
                    distDOF -= state.dof.focus; 
                    if (state.dof.ignoreNear && distDOF < 0) distDOF = 0; 
                    const blurRaw = Math.min(1.0, Math.abs(distDOF) * state.dof.intensity); 
                    op *= Math.max(0.0, 1.0 - opEval(blurRaw)); 
                    scale *= (1.0 + (sizeEval(blurRaw) * state.dof.aperture)); 
                }
            }
            if (op < 0) op = 0; return { col, op, scale };
        };

        function project(vCam) { 
            _vProj.copy(vCam).applyMatrix4(matProj); 
            return { x: (_vProj.x * halfW) + halfW, y: -(_vProj.y * halfH) + halfH, w: _vProj.w }; 
        }

        function getBezierCommand(p0, p1, p2, p3, tension = 0.15) { const t1x = (p2.x - p0.x) * tension, t1y = (p2.y - p0.y) * tension, t2x = (p3.x - p1.x) * tension, t2y = (p3.y - p1.y) * tension; return `C ${(p1.x + t1x).toFixed(1)},${(p1.y + t1y).toFixed(1)} ${(p2.x - t2x).toFixed(1)},${(p2.y - t2y).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`; }

        // --- SEGMENT BUFFERING ---
        const rawSegments = [];
        const allSegments = [];

        const collectLine = (pA, pB, dist, worldMid, isSpline = false) => {
            // 1. Min Length Check (skip if minLen is 0 for performance)
            const minLen = state.hiddenSettings.minLen || 0;
            if (minLen > 0) {
                const dx = pA.x - pB.x, dy = pA.y - pB.y;
                const lenSq = dx*dx + dy*dy;
                if (lenSq < minLen * minLen) return;
            }

            // 2. Style Calculation
            const style = getStyle(dist, worldMid);
            if (style.op <= 0.001) return;

            rawSegments.push({ p1: pA, p2: pB, z: dist, style: style, isSpline: isSpline });
            if (state.properOrder) allSegments.push({ p1: pA, p2: pB, z: dist, style: style, isSpline: isSpline });
        };

        // --- RECURSIVE SUBDIVISION ---
        function traceSegmentRecursive(pStart, pEnd, depth) {
            const wStart = pStart.clone().applyMatrix4(matWorld);
            const wEnd = pEnd.clone().applyMatrix4(matWorld);
            const dStart = camPos.distanceTo(wStart);
            const dEnd = camPos.distanceTo(wEnd);
            
            const visStart = !checkOcclusion(wStart, dStart);
            const visEnd = !checkOcclusion(wEnd, dEnd);
            
            if (visStart === visEnd) {
                // If both are visible, we promote to collection
                if (visStart) {
                     const c1 = wStart.clone().applyMatrix4(matView);
                     const c2 = wEnd.clone().applyMatrix4(matView);
                     const scr1 = project(c1);
                     const scr2 = project(c2);
                     if (Math.max(scr1.x, scr2.x) >= 0 && Math.min(scr1.x, scr2.x) <= width &&
                         Math.max(scr1.y, scr2.y) >= 0 && Math.min(scr1.y, scr2.y) <= height && 
                         c1.z < -near && c2.z < -near) {
                         
                         const wMid = wStart.clone().lerp(wEnd, 0.5);
                         collectLine(scr1, scr2, (dStart+dEnd)/2, wMid);
                     }
                } else if (depth < 2) {
                     // Both hidden, but might be tunneling? Check mid
                     const mid = pStart.clone().lerp(pEnd, 0.5);
                     const wMid = mid.clone().applyMatrix4(matWorld);
                     const dMid = camPos.distanceTo(wMid);
                     const visMid = !checkOcclusion(wMid, dMid);
                     if (visMid) {
                         traceSegmentRecursive(pStart, mid, depth + 1);
                         traceSegmentRecursive(mid, pEnd, depth + 1);
                     }
                }
                return;
            }
            
            if (depth > 4) { 
                if (visStart) {
                    const mid = pStart.clone().lerp(pEnd, 0.5);
                    const wMid = mid.clone().applyMatrix4(matWorld);
                    const c1 = wStart.clone().applyMatrix4(matView);
                    const c2 = wMid.clone().applyMatrix4(matView); 
                    collectLine(project(c1), project(c2), dStart, wMid);
                } else if (visEnd) {
                    const mid = pStart.clone().lerp(pEnd, 0.5);
                    const wMid = mid.clone().applyMatrix4(matWorld);
                    const c1 = wMid.clone().applyMatrix4(matView);
                    const c2 = wEnd.clone().applyMatrix4(matView);
                    collectLine(project(c1), project(c2), dEnd, wMid);
                }
                return;
            }
            
            const mid = pStart.clone().lerp(pEnd, 0.5);
            traceSegmentRecursive(pStart, mid, depth + 1);
            traceSegmentRecursive(mid, pEnd, depth + 1);
        }

        let output = '';

        // --- PROCESSING LOOPS ---
        const _p1 = new THREE.Vector3();
        const _p2 = new THREE.Vector3();
        const _w1 = new THREE.Vector3();
        const _w2 = new THREE.Vector3();
        const _c1 = new THREE.Vector3();
        const _c2 = new THREE.Vector3();
        const _mid = new THREE.Vector3();
        const _vProj = new THREE.Vector3();

        if (splineGroups && !isDots) {
            const totalGroups = splineGroups.length;
            const shouldSeparateUV = !state.properOrder && !state.zDepth.color && !state.zDepth.opacity && !state.zDepth.dof;
            for (let g = 0; g < totalGroups; g++) {
                checkSignal(); const group = splineGroups[g], splines = group.splines; let groupOutput = '', groupOutputU = '', groupOutputV = '';
                tickProgress(0, `Processing Group ${group.name}...`);
                await new Promise(r => setTimeout(r, 0)); // Ensure non-blocking
                
                // --- OCCLUSION METHOD CHECK ---
                const useFastLegacy = state.occlusionMethod === 'simple';

                if (useFastLegacy) {
                    // === OLD FAST PATH (Bezier Control Points) ===
                    for (let i = 0; i < splines.length; i++) {
                        await smartYield(); 
                        const splineData = splines[i], rawPoints = [...splineData.points];
                        if (splineData.closed && rawPoints.length > 2) rawPoints.push(rawPoints[0].clone());
                        
                        const worldPoints = rawPoints.map(p => p.clone().applyMatrix4(matWorld)); 
                        const precalc = []; 
                        let hasVisibleVert = false, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                        
                        for (let j = 0; j < worldPoints.length; j++) {
                            const vWorld = worldPoints[j], vCam = vWorld.clone().applyMatrix4(matView);
                            if (vCam.z <= -near) { 
                                const p = project(vCam); 
                                if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; 
                                if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; 
                                hasVisibleVert = true; 
                                precalc.push({ vWorld, vCam, p, dist: camPos.distanceTo(vWorld), inFrustum: true }); 
                            } else { 
                                precalc.push({ vWorld, vCam, inFrustum: false }); 
                            }
                        }
                        
                        if (!hasVisibleVert || maxX < 0 || minX > width || maxY < 0 || minY > height) { markLineRendered('Processing lines...'); continue; }
                        
                        const screenPoints = [];
                        for (let j = 0; j < precalc.length; j++) { 
                            const pt = precalc[j]; 
                            let visible = pt.inFrustum; 
                            if (!visible) { screenPoints.push({ visible: false }); continue; } 
                            if (isHiddenLine && meshSolid && checkOcclusion(pt.vWorld, pt.dist)) visible = false; 
                            screenPoints.push(visible ? { x: pt.p.x, y: pt.p.y, dist: pt.dist, vWorld: pt.vWorld, visible: true } : { visible: false }); 
                        }
                        
                        let currentPath = [];
                        const flushPath = () => {
                            if (currentPath.length < 2) { currentPath = []; return; }
                            const avgDist = currentPath.reduce((acc, p) => acc + p.dist, 0) / currentPath.length; 
                            const centerIdx = Math.floor(currentPath.length / 2);
                            const { col, op, scale } = getStyle(avgDist, currentPath[centerIdx].vWorld); 
                            
                            const sw = state.strokeWidth * scale;
                            if (op <= 0.001) { currentPath = []; return; }
                            let d = `M ${currentPath[0].x.toFixed(1)},${currentPath[0].y.toFixed(1)}`;
                            for (let k = 0; k < currentPath.length - 1; k++) d += ' ' + getBezierCommand(currentPath[Math.max(0, k - 1)], currentPath[k], currentPath[k + 1], currentPath[Math.min(currentPath.length - 1, k + 2)]);
                            
                            const pathStr = `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw.toFixed(2)}" stroke-opacity="${op.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
                            if (!state.properOrder) {
                                if (shouldSeparateUV) {
                                    if (splineData.direction === 'u') groupOutputU += pathStr;
                                    else if (splineData.direction === 'v') groupOutputV += pathStr;
                                    else groupOutput += pathStr;
                                } else {
                                    groupOutput += pathStr;
                                }
                            } 
                            reportLineSegment(pathStr);
                            currentPath = [];
                        };
                        for (let j = 0; j < screenPoints.length; j++) { if (screenPoints[j].visible) currentPath.push(screenPoints[j]); else flushPath(); } flushPath();
                    }
                    markLineRendered('Processing lines...');

                } else {
                    // === DENSE / RECURSIVE PATH ===
                    const isPreciseFast = state.occlusionMethod === 'precise-fast';
                    
                    for (let i = 0; i < splines.length; i++) {
                         await smartYield(); 
                         const splineData = splines[i], rawPoints = splineData.points;
                         if(rawPoints.length < 2) { markLineRendered('Processing lines...'); continue; }

                         const curve = new THREE.CatmullRomCurve3(rawPoints); 
                         curve.closed = splineData.closed;
                         const densePoints = curve.getPoints(rawPoints.length * state.hiddenSettings.splineRes);

                         if (isPreciseFast) {
                             // --- HIGHLY OPTIMIZED FAST PRECISE PATH (Stride Sampling) ---
                             const processed = [];
                             for (let j = 0; j < densePoints.length; j++) {
                                 const p = densePoints[j];
                                 const w = new THREE.Vector3().copy(p).applyMatrix4(matWorld);
                                 const c = new THREE.Vector3().copy(w).applyMatrix4(matView);
                                 const scr = project(c);
                                 const dist = camPos.distanceTo(w);
                                 processed.push({ w, scr, dist, behind: c.z > -near, out: (scr.x < 0 || scr.x > width || scr.y < 0 || scr.y > height), vis: null });
                             }

                             const STRIDE = 4;
                             for (let j = 0; j < processed.length - 1; j += STRIDE) {
                                 const endIdx = Math.min(j + STRIDE, processed.length - 1);
                                 const pStart = processed[j], pEnd = processed[endIdx];

                                 if (pStart.vis === null) pStart.vis = isHiddenLine ? !checkOcclusion(pStart.w, pStart.dist) : true;
                                 if (pEnd.vis === null) pEnd.vis = isHiddenLine ? !checkOcclusion(pEnd.w, pEnd.dist) : true;

                                 if (pStart.vis && pEnd.vis) {
                                     // Entire block is visible
                                     for (let k = j; k < endIdx; k++) {
                                         const s1 = processed[k], s2 = processed[k+1];
                                         if (clipPlane && (clipPlane.distanceToPoint(s1.w) > 0 || clipPlane.distanceToPoint(s2.w) > 0)) continue;
                                         if (s1.out && s2.out) continue;
                                         collectLine(s1.scr, s2.scr, (s1.dist + s2.dist) / 2, _mid.copy(s1.w).lerp(s2.w, 0.5), true);
                                     }
                                 } else if (!pStart.vis && !pEnd.vis) {
                                     // Block might be hidden or tunneling
                                     const midIdx = Math.floor((j + endIdx) / 2);
                                     const pMid = processed[midIdx];
                                     if (pMid.vis === null) pMid.vis = isHiddenLine ? !checkOcclusion(pMid.w, pMid.dist) : true;
                                     
                                     if (pMid.vis) { // Tunneling detected, re-process with smaller steps
                                         for (let k = j; k < endIdx; k++) {
                                             const s1 = processed[k], s2 = processed[k+1];
                                             if (s1.vis === null) s1.vis = isHiddenLine ? !checkOcclusion(s1.w, s1.dist) : true;
                                             if (s2.vis === null) s2.vis = isHiddenLine ? !checkOcclusion(s2.w, s2.dist) : true;
                                             if (s1.vis || s2.vis) {
                                                 const wM = _mid.copy(s1.w).lerp(s2.w, 0.5);
                                                 const dM = (s1.dist + s2.dist) / 2;
                                                 if (s1.vis && s2.vis) collectLine(s1.scr, s2.scr, dM, wM, true);
                                                 else if (!checkOcclusion(wM, dM)) collectLine(s1.scr, s2.scr, dM, wM, true);
                                             }
                                         }
                                     }
                                 } else {
                                     // Mixed visibility - transition zone
                                     for (let k = j; k < endIdx; k++) {
                                         const s1 = processed[k], s2 = processed[k+1];
                                         if (s1.vis === null) s1.vis = isHiddenLine ? !checkOcclusion(s1.w, s1.dist) : true;
                                         if (s2.vis === null) s2.vis = isHiddenLine ? !checkOcclusion(s2.w, s2.dist) : true;
                                         if (s1.vis || s2.vis) {
                                             const wM = _mid.copy(s1.w).lerp(s2.w, 0.5);
                                             const dM = (s1.dist + s2.dist) / 2;
                                             if (s1.vis && s2.vis) collectLine(s1.scr, s2.scr, dM, wM, true);
                                             else if (!checkOcclusion(wM, dM)) collectLine(s1.scr, s2.scr, dM, wM, true);
                                         }
                                     }
                                 }
                             }
                         } else {
                             // --- STANDARD DENSE PATH ---
                             for(let j=0; j < densePoints.length - 1; j++) {
                                 const p1 = densePoints[j], p2 = densePoints[j+1];
                                 const w1 = p1.clone().applyMatrix4(matWorld);
                                 const w2 = p2.clone().applyMatrix4(matWorld);

                                 if (clipPlane && (clipPlane.distanceToPoint(w1) > 0 || clipPlane.distanceToPoint(w2) > 0)) continue;

                                 const c1 = w1.clone().applyMatrix4(matView), c2 = w2.clone().applyMatrix4(matView);
                                 if (c1.z > -near && c2.z > -near) continue;

                                 const scr1 = project(c1), scr2 = project(c2);
                                 if (Math.max(scr1.x, scr2.x) < 0 || Math.min(scr1.x, scr2.x) > width ||
                                     Math.max(scr1.y, scr2.y) < 0 || Math.min(scr1.y, scr2.y) > height) continue;

                                 const wMid = _mid.copy(w1).lerp(w2, 0.5);
                                 const dist = camPos.distanceTo(wMid);
                                 let isVisible = true;
                                 if (isHiddenLine) isVisible = !checkOcclusion(wMid, dist);

                                 if (isVisible) {
                                     collectLine(scr1, scr2, dist, wMid, true);
                                 }
                             }
                         }

                        if (!state.properOrder) {
                          const batchSVG = optimizeAndRenderPaths(rawSegments);
                          if (batchSVG) {
                              if (shouldSeparateUV) {
                                  const direction = splines[i] && splines[i].direction;
                                  if (direction === 'u') groupOutputU += batchSVG;
                                  else if (direction === 'v') groupOutputV += batchSVG;
                                  else groupOutput += batchSVG;
                              } else {
                                  output += batchSVG;
                              }
                          }
                      }
                      rawSegments.length = 0;
                      markLineRendered('Processing lines...');
                      }

   

                  }
                  if (!state.properOrder) {
                      if (shouldSeparateUV && groupOutputU.length > 0) output += `<g id="${group.name}_U_lines">${groupOutputU}</g>`;
                      if (shouldSeparateUV && groupOutputV.length > 0) output += `<g id="${group.name}_V_lines">${groupOutputV}</g>`;
                      if (!shouldSeparateUV && groupOutput.length > 0) output += `<g id="${group.name}">${groupOutput}</g>`;
                  }
              }

              if (state.properOrder && allSegments.length > 0) {
                  const sortedSVG = optimizeAndRenderPaths(allSegments);
                  if (sortedSVG) output += `<g id="proper_order_lines">${sortedSVG}</g>`;
              }

        } else if (isDots) {
              const pos = meshWire.geometry.attributes.position, total = pos.count, v1 = new THREE.Vector3();
               const rnd = (n) => Math.round(n * 1000); const processed = new Set();
               const dotsArray = [];
               tickProgress(0, 'Processing Dots...');
               for (let i = 0; i < total; i++) {
                  await smartYield();
                  v1.fromBufferAttribute(pos, i).applyMatrix4(matWorld);
                  if (clipPlane && clipPlane.distanceToPoint(v1) > 0) continue;
                  const s = `${rnd(v1.x)},${rnd(v1.y)},${rnd(v1.z)}`; if (processed.has(s)) continue; processed.add(s);
                  const c1 = v1.clone().applyMatrix4(matView); if (c1.z > -near) continue;
                  const p = project(c1); 
                  // Early viewport check BEFORE expensive occlusion check
                  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) continue;
                  const dist = camPos.distanceTo(v1);
                  if (!checkOcclusion(v1, dist)) {
                      const { col, op, scale } = getStyle(dist, v1);
                      const r = (state.dotSize * scale) / 2;
                      if(op > 0.001 && r > 0.1) {
                          dotsArray.push({ dist, p, r, col, op });
                          markDotRendered('Processing dots...');
                      }
                  }
               }

                if (state.properOrder) {
                    dotsArray.sort((a, b) => b.dist - a.dist);
                }

               let dotsBuffer = '';
               for (const dot of dotsArray) {
                   const circleStr = `<circle cx="${dot.p.x.toFixed(1)}" cy="${dot.p.y.toFixed(1)}" r="${dot.r.toFixed(1)}" fill="${dot.col}" fill-opacity="${dot.op.toFixed(2)}"/>`;
                   dotsBuffer += circleStr;
                   reportDotSegment(circleStr);
               }

               output += dotsBuffer;
        } else {
             // RAW LINES
             const pos = meshWire.geometry.attributes.position;
             const total = pos.count / 2;
             
             tickProgress(0, 'Processing Lines...');
               for (let i = 0; i < total; i++) {
                  await smartYield();

                 
                 const idx = i * 2; 

                 _p1.fromBufferAttribute(pos, idx);
                 _p2.fromBufferAttribute(pos, idx+1);


                 const w1 = _p1.clone().applyMatrix4(matWorld);
                  const w2 = _p2.clone().applyMatrix4(matWorld);
                  if (clipPlane && (clipPlane.distanceToPoint(w1) > 0 || clipPlane.distanceToPoint(w2) > 0)) { markLineRendered('Processing lines...'); continue; }

                  // Early viewport culling - transform to camera space and check bounds BEFORE expensive occlusion check
                  const c1 = w1.clone().applyMatrix4(matView);
                  const c2 = w2.clone().applyMatrix4(matView);
                  
                  // Skip if both points are behind camera
                  if (c1.z > -near && c2.z > -near) { markLineRendered('Processing lines...'); continue; }
                  
                  // Skip if both points are clearly outside viewport bounds
                  const scr1 = project(c1);
                  const scr2 = project(c2);
                  if (Math.max(scr1.x, scr2.x) < 0 || Math.min(scr1.x, scr2.x) > width ||
                      Math.max(scr1.y, scr2.y) < 0 || Math.min(scr1.y, scr2.y) > height) { markLineRendered('Processing lines...'); continue; }

                  // Midpoint Check
                  const wMid = w1.clone().lerp(w2, 0.5);
                  const dist = camPos.distanceTo(wMid);

                 let isVisible = true;
                 if (isHiddenLine) isVisible = !checkOcclusion(wMid, dist);

                     if (isVisible) {
                          collectLine(scr1, scr2, dist, wMid);
                     }
                    markLineRendered('Processing lines...');

             }
        }

        // --- PATH OPTIMIZATION (Only runs if rawSegments has content) ---
        function optimizeAndRenderPaths(segments) {
            if (segments.length === 0) return '';

            if (state.properOrder) {
                segments.sort((a, b) => b.z - a.z);
            }

            let finalSVG = '';
            const precision = 1;

            if (state.properOrder) {
                for (const seg of segments) {
                    const col = seg.style.col;
                    const op = seg.style.op.toFixed(2);
                    const width = (state.strokeWidth * seg.style.scale).toFixed(2);
                    const isSpline = seg.isSpline;

                    let pathD = `M ${seg.p1.x.toFixed(1)},${seg.p1.y.toFixed(1)} L ${seg.p2.x.toFixed(1)},${seg.p2.y.toFixed(1)}`;
                    const pathStr = `<path d="${pathD}" fill="none" stroke="${col}" stroke-width="${width}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
                    finalSVG += pathStr;
                    reportLineSegment(pathStr);
                }
                return finalSVG;
            }

            const groups = {};
            segments.forEach(seg => {
                const sig = `${seg.style.col}|${seg.style.op.toFixed(2)}|${(state.strokeWidth * seg.style.scale).toFixed(2)}|${seg.isSpline || false}`;
                if (!groups[sig]) groups[sig] = [];
                groups[sig].push(seg);
            });

            for (const sig in groups) {
                const groupSegs = groups[sig];
                const [col, op, width, isSplineStr] = sig.split('|');
                const isSpline = isSplineStr === 'true';
                const map = new Map();

                groupSegs.forEach(seg => {
                    const key = `${seg.p1.x.toFixed(precision)},${seg.p1.y.toFixed(precision)}`;
                    if(!map.has(key)) map.set(key, []);
                    map.get(key).push(seg);
                });

                const visited = new Set();

                for (const seg of groupSegs) {
                    if (visited.has(seg)) continue;
                    const pathPoints = [seg.p1, seg.p2];
                    visited.add(seg);
                    let currentTail = seg.p2;

                    while(true) {
                        const tailKey = `${currentTail.x.toFixed(precision)},${currentTail.y.toFixed(precision)}`;
                        const candidates = map.get(tailKey);
                        let nextSeg = null;
                        if (candidates) {
                            for (let c of candidates) {
                                if (!visited.has(c)) {
                                    nextSeg = c;
                                    break;
                                }
                            }
                        }
                        if (nextSeg) {
                            pathPoints.push(nextSeg.p2);
                            visited.add(nextSeg);
                            currentTail = nextSeg.p2;
                        } else {
                            break;
                        }
                    }
                    
                    let pathD = `M ${pathPoints[0].x.toFixed(1)},${pathPoints[0].y.toFixed(1)}`;
                    if (isSpline && pathPoints.length > 2) {
                        for (let k = 0; k < pathPoints.length - 1; k++) {
                            pathD += ' ' + getBezierCommand(pathPoints[Math.max(0, k - 1)], pathPoints[k], pathPoints[k + 1], pathPoints[Math.min(pathPoints.length - 1, k + 2)]);
                        }
                    } else {
                        for (let k = 1; k < pathPoints.length; k++) {
                            pathD += ` L ${pathPoints[k].x.toFixed(1)},${pathPoints[k].y.toFixed(1)}`;
                        }
                    }
                    const pathStr = `<path d="${pathD}" fill="none" stroke="${col}" stroke-width="${width}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
                    finalSVG += pathStr;
                    reportLineSegment(pathStr);
                }
            }
            return finalSVG;
        }

        pushProgress(90, 'Optimizing paths...');
        
        output += optimizeAndRenderPaths(rawSegments);
        

        pushProgress(100, 'Finalizing SVG...');
        
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bg}">${output}</svg>`;
    }
    
    function toggleReorderMode() {
        saveHistory();
        state.reorderMode = !state.reorderMode;
        const list = document.getElementById('deformation-list');
        const btn = document.getElementById('btn-reorder-deform');
        
        if (state.reorderMode) {
            list.classList.add('reorder-mode');
            btn.classList.add('active');
            setupDragAndDrop(); 
        } else {
            list.classList.remove('reorder-mode');
            btn.classList.remove('active');
            const items = list.querySelectorAll('.control-group');
            items.forEach(item => item.setAttribute('draggable', 'false'));
        }
    }

    function setupDragAndDrop() {
        const list = document.getElementById('deformation-list');
        const items = list.querySelectorAll('.control-group');
        
        items.forEach(item => {
            if(state.reorderMode) item.setAttribute('draggable', 'true');
            if (item.dataset.dndInit) return;
            item.dataset.dndInit = "true";
            item.addEventListener('dragstart', (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.dataset.type); item.classList.add('dragging'); recordDragStart(); });
            item.addEventListener('dragend', (e) => { item.classList.remove('dragging'); items.forEach(i => i.classList.remove('drag-over')); recordDragEnd(); });
            item.addEventListener('dragenter', (e) => { e.preventDefault(); if (item !== document.querySelector('.dragging')) item.classList.add('drag-over'); });
            item.addEventListener('dragleave', (e) => { item.classList.remove('drag-over'); });
            item.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; });
            item.addEventListener('drop', (e) => {
                e.stopPropagation(); e.preventDefault();
                const srcType = e.dataTransfer.getData('text/plain'); const srcEl = list.querySelector(`.control-group[data-type="${srcType}"]`);
                if (srcEl && srcEl !== item) {
                    const rect = item.getBoundingClientRect(); const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    if (next) list.insertBefore(srcEl, item.nextSibling); else list.insertBefore(srcEl, item);
                    const newOrder = []; list.querySelectorAll('.control-group').forEach(el => { if (el.dataset.type) newOrder.push(el.dataset.type); });
                    state.deformationOrder = newOrder; updateGeometry();
                }
                return false;
            });
        });
    }

    function downloadSVG(content) {
        const blob = new Blob([content], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vector-gen-v0.5-${state.style}-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function saveSettings() {
        const saveData = {
            state: state,
            presets: presets
        };
        const settings = JSON.stringify(saveData, null, 2);
        const blob = new Blob([settings], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settings-${Date.now()}.flines`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadSettings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (loadedData.state) restoreState(loadedData.state);
                if (loadedData.presets) {
                    for (let i = 0; i < Math.min(presets.length, loadedData.presets.length); i++) {
                        presets[i] = loadedData.presets[i];
                    }
                    document.querySelectorAll('.preset-btn').forEach((btn, idx) => {
                        if (presets[idx]) btn.classList.add('filled');
                        else btn.classList.remove('filled');
                    });
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
                alert('Failed to load settings file. Make sure it\'s a valid .flines file.');
            }
        };
        reader.readAsText(file);
    }
});