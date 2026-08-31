// --- Utils ---
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function isValidFormula(str) {
    if (typeof str !== 'string') return false;
    let p = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') p++;
        else if (str[i] === ')') p--;
        if (p < 0) return false;
    }
    if (p !== 0) return false;
    if (/[\+\-\*\/\,\^]\s*$/.test(str)) return false;
    return true;
}

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

var VoronoiNoise = (function() {
    function _VoronoiNoise(random) {
        this.random = random;
        this.numFeatures = 200;
        this.features = [];
        this.values = [];
        for (let i = 0; i < this.numFeatures; i++) {
            this.features.push(new THREE.Vector3(this.random() * 8 - 4, this.random() * 8 - 4, this.random() * 8 - 4));
            this.values.push(this.random() * 2 - 1);
        }
    }
    _VoronoiNoise.prototype = {
        noise3D: function(x, y, z) {
            let minDst = Infinity; let closestVal = 0;
            const p = new THREE.Vector3(x, y, z);
            for (let i = 0; i < this.numFeatures; i++) {
                const d = p.distanceToSquared(this.features[i]);
                if (d < minDst) { minDst = d; closestVal = this.values[i]; }
            }
            return closestVal;
        }
    };
    return _VoronoiNoise;
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
    let transformControl, transformParent, transformProxy;
    let mainMeshGroup = null;
    let originalGeometry = null; 
    let simplex = new SimplexNoise();
    let matWireShader = null; 
    let sceneGridHelper = null;

    const presets = [null, null, null, null, null];
    const sphereTypes = ['sphere', 'sphere-circles', 'sphere-geodesic', 'sphere-spiral', 'sphere-hexagonal', 'sphere-lissajous', 'sphere-voronoi', 'sphere-hopf', 'sphere-diagonal', 'sphere-loxodrome', 'icosahedron', 'tetrahedron', 'octahedron', 'dodecahedron'];
    const torusTypes = ['torus', 'torus-knot', 'torus-mobius', 'torus-twisted'];

    function generateMatcapTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createRadialGradient(size*0.4, size*0.4, 0, size*0.5, size*0.5, size*0.5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#888888');
        grad.addColorStop(1, '#000000');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.center.set(0.5, 0.5);
        texture.needsUpdate = true;
        return texture;
    }
    const matcapTexture = generateMatcapTexture();

    const shapeConfig = {
        icosahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        tetrahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        octahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        dodecahedron: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 5, min: 1, max: 50, type: 'int', step: 1 }] },
        cube: { params: [{ name: 'Width', def: 2, min: 0.1, max: 5, type: 'float', step: 0.1 }, { name: 'Height', def: 2, min: 0.1, max: 5, type: 'float', step: 0.1 }, { name: 'Depth', def: 2, min: 0.1, max: 5, type: 'float', step: 0.1 }, { name: 'Segs X', def: 5, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Segs Y', def: 5, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Segs Z', def: 5, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Spline', def: 1, min: 0, max: 1, type: 'bool', step: 1 }] },
        sphere: { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Width Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Height Segs', def: 20, min: 2, max: 64, type: 'int', step: 1 }] },
        'sphere-circles': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Resolution', def: 48, min: 8, max: 128, type: 'int', step: 2 }, { name: 'Loop Density', def: 8, min: 3, max: 20, type: 'int', step: 1 }] },
        'sphere-geodesic': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 2, min: 0, max: 8, type: 'int', step: 1 }] },
        'sphere-spiral': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Points', def: 400, min: 10, max: 2000, type: 'int', step: 10 }, { name: 'Turns', def: 10, min: 1, max: 50, type: 'float', step: 1 }] },
        'sphere-hexagonal': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 1, min: 1, max: 5, type: 'int', step: 1 }] },
        'sphere-lissajous': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Resolution', def: 1000, min: 100, max: 3000, type: 'int', step: 50 }, { name: 'Freq U', def: 7, min: 1, max: 50, type: 'float', step: 1 }, { name: 'Freq V', def: 5, min: 1, max: 50, type: 'float', step: 1 }, { name: 'Phase', def: 0, min: 0, max: 6.28, type: 'float', step: 0.1 }] },
        'sphere-voronoi': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Detail', def: 3, min: 1, max: 8, type: 'int', step: 1 }, { name: 'Distortion', def: 0.6, min: 0, max: 1.5, type: 'float', step: 0.05 }] },
        'sphere-hopf': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Loops', def: 12, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Tilt', def: 0.5, min: 0, max: 3.14, type: 'float', step: 0.05 }] },
        'sphere-diagonal': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Segs X', def: 24, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Segs Y', def: 16, min: 2, max: 64, type: 'int', step: 1 }] },
        'sphere-loxodrome': { params: [{ name: 'Radius', def: 1.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Points', def: 600, min: 50, max: 2000, type: 'int', step: 10 }, { name: 'Slope', def: 0.1, min: 0.01, max: 0.5, type: 'float', step: 0.01 }] },
        torus: { params: [{ name: 'Radius', def: 1.5, min: 0.5, max: 3, type: 'float', step: 0.1 }, { name: 'Tube', def: 0.5, min: 0.1, max: 1, type: 'float', step: 0.1 }, { name: 'Radial Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Tubular Segs', def: 40, min: 3, max: 100, type: 'int', step: 1 }] },
        'torus-knot': { params: [{ name: 'Radius', def: 1.5, min: 0.5, max: 3, type: 'float', step: 0.1 }, { name: 'Tube', def: 0.4, min: 0.1, max: 1, type: 'float', step: 0.1 }, { name: 'Tubular Segs', def: 64, min: 3, max: 300, type: 'int', step: 1 }, { name: 'Radial Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'P', def: 2, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Q', def: 3, min: 1, max: 20, type: 'int', step: 1 }] },
        'torus-mobius': { params: [{ name: 'Radius', def: 1.5, min: 0.5, max: 3, type: 'float', step: 0.1 }, { name: 'Width', def: 0.5, min: 0.1, max: 2, type: 'float', step: 0.1 }, { name: 'Radial Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Tubular Segs', def: 64, min: 3, max: 300, type: 'int', step: 1 }] },
        'torus-twisted': { params: [{ name: 'Radius', def: 1.5, min: 0.5, max: 3, type: 'float', step: 0.1 }, { name: 'Tube', def: 0.4, min: 0.1, max: 1, type: 'float', step: 0.1 }, { name: 'Radial Segs', def: 20, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Tubular Segs', def: 64, min: 3, max: 300, type: 'int', step: 1 }, { name: 'Twists', def: 2, min: 0, max: 20, type: 'float', step: 0.1 }] },
        ring: { params: [{ name: 'Inner Radius', def: 0.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Outer Radius', def: 1.5, min: 0.2, max: 5, type: 'float', step: 0.1 }, { name: 'Theta Segs', def: 32, min: 3, max: 128, type: 'int', step: 1 }, { name: 'Phi Segs', def: 1, min: 1, max: 32, type: 'int', step: 1 }] },
        'ring-gear': { params: [{ name: 'Inner Radius', def: 0.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Outer Radius', def: 1.5, min: 0.2, max: 5, type: 'float', step: 0.1 }, { name: 'Teeth', def: 12, min: 3, max: 64, type: 'int', step: 1 }, { name: 'Tooth Depth', def: 0.3, min: 0.05, max: 2, type: 'float', step: 0.05 }, { name: 'Theta Segs', def: 128, min: 16, max: 512, type: 'int', step: 1 }, { name: 'Phi Segs', def: 1, min: 1, max: 32, type: 'int', step: 1 }] },
        'ring-spiral': { params: [{ name: 'Inner Radius', def: 0.1, min: 0.0, max: 3, type: 'float', step: 0.1 }, { name: 'Outer Radius', def: 3.0, min: 0.2, max: 10, type: 'float', step: 0.1 }, { name: 'Turns', def: 3, min: 1, max: 20, type: 'int', step: 1 }, { name: 'Theta Segs', def: 128, min: 16, max: 1024, type: 'int', step: 1 }, { name: 'Phi Segs', def: 1, min: 1, max: 32, type: 'int', step: 1 }] },
        'ring-wave': { params: [{ name: 'Inner Radius', def: 0.5, min: 0.1, max: 3, type: 'float', step: 0.1 }, { name: 'Outer Radius', def: 1.5, min: 0.2, max: 5, type: 'float', step: 0.1 }, { name: 'Waves', def: 8, min: 1, max: 32, type: 'int', step: 1 }, { name: 'Amplitude', def: 0.3, min: 0.05, max: 2, type: 'float', step: 0.05 }, { name: 'Theta Segs', def: 128, min: 16, max: 512, type: 'int', step: 1 }, { name: 'Phi Segs', def: 1, min: 1, max: 32, type: 'int', step: 1 }] },
        math: { params: [{ name: 'Range', def: 5, min: 1, max: 20, type: 'float', step: 1 }, { name: 'Segments', def: 30, min: 5, max: 100, type: 'int', step: 1 }] },
        parametric: { params: [{ name: 'U Min', def: 0, min: -10, max: 10, type: 'float', step: 0.1 }, { name: 'U Max', def: 6.28, min: -10, max: 20, type: 'float', step: 0.1 }, { name: 'V Min', def: 0, min: -10, max: 10, type: 'float', step: 0.1 }, { name: 'V Max', def: 6.28, min: -10, max: 20, type: 'float', step: 0.1 }, { name: 'Segments', def: 60, min: 10, max: 150, type: 'int', step: 1 }] },
        landscape: { params: [{ name: 'Width', def: 3, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Height', def: 3, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Width Segs', def: 60, min: 10, max: 200, type: 'int', step: 1 }, { name: 'Height Segs', def: 60, min: 10, max: 200, type: 'int', step: 1 }] },
        grid: { params: [{ name: 'Width', def: 5, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Height', def: 5, min: 1, max: 10, type: 'float', step: 0.1 }, { name: 'Width Segs', def: 20, min: 2, max: 100, type: 'int', step: 1 }, { name: 'Height Segs', def: 20, min: 2, max: 100, type: 'int', step: 1 }, { name: 'Spline', def: 0, min: 0, max: 1, type: 'bool', step: 1 }] },
        custom: { params: [] }
    };
    
    // Geometry Defaults for Smart Rendering
    const geoDefaults = {
        cube: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4, minLen: 2 },
        tetrahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        octahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        dodecahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        icosahedron: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 1 },
        grid: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        sphere: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-circles': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        'sphere-geodesic': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-spiral': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-hexagonal': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-lissajous': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-voronoi': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-hopf': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-diagonal': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'sphere-loxodrome': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        torus: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        'torus-knot': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        'torus-mobius': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        'torus-twisted': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 8 },
        cylinder: { epsilon: 0.02, bias: 0, inflate: 0, splineRes: 4 },
        cone: { epsilon: 0, bias: 0, inflate: 0, splineRes: 4 },
        ring: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'ring-gear': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'ring-spiral': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        'ring-wave': { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 4 },
        landscape: { epsilon: 0.01, bias: 0, inflate: 0, splineRes: 3 },
        math: { epsilon: 0.01, bias: 0, inflate: 0.001, splineRes: 3 },
        parametric: { epsilon: 0.05, bias: 1.0, inflate: 0, splineRes: 3 },
        custom: { epsilon: 0.05, bias: 1.0, inflate: 0, splineRes: 2 }
    };

    const state = {
        geometries: [{
            id: 'geo-' + Math.random().toString(36).substr(2, 9),
            type: 'cube',
            params: [2, 2, 2, 5, 5, 5, 1],
            pos: { x:0, y:0, z:0 },
            rot: { x:0, y:0, z:0 },
            scl: { x:1, y:1, z:1 },
            mathFormula: 'sin(x*a) * cos(z*b) * c',
            mathVars: { a: 1.0, b: 1.0, c: 1.0 },
            parametricFormulas: { x: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * cos(u)', y: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * sin(u)', z: 'sin(u/2)*sin(v) + cos(u/2)*sin(2*v)' },
            landscape: { seed: 68, noiseType: 'simplex', amplitude: 1.5, frequency: 0.05, octaves: 4, persistence: 0.5, lacunarity: 2.0, seaLevel: 0.0, noiseScale: 4.9, useFade: false, fadeRadius: 0.5 }
        }],
        activeGeoId: null,
        geoType: 'cube', 
        geoParams: [],
        geoPos: { x:0, y:0, z:0 },
        geoRot: { x:0, y:0, z:0 },
        geoScl: { x:1, y:1, z:1 },
        solidSubdiv: 2, 
        mathFormula: 'sin(x*a) * cos(z*b) * c',
        mathVars: { a: 1.0, b: 1.0, c: 1.0 },
        parametricFormulas: { x: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * cos(u)', y: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * sin(u)', z: 'sin(u/2)*sin(v) + cos(u/2)*sin(2*v)' },
        landscape: { seed: 68, noiseType: 'simplex', amplitude: 1.5, frequency: 0.05, octaves: 4, persistence: 0.5, lacunarity: 2.0, seaLevel: 0.0, noiseScale: 4.9, useFade: false, fadeRadius: 0.5 },
        objRot: { x: 0, y: 0, z: 0 },
        clip: { enabled: false, axis: 'x', pos: 0 },
        spline: { force: false, subdiv: 12 },
        gridUV: { u: true, v: true, d1: false, d2: false },
        noise: { enabled: false, noiseType: 'simplex', amp: 0.2, freq: 1.0, axis: 'all', seed: 1 },
        twist: { enabled: false, angle: 1.0, axis: 'y' },
        wave:  { enabled: false, int: 0.5, freq: 2.0, axis: 'z' },
        bulge: { enabled: false, str: 0.5, axis: 'all' },
        bend:  { enabled: false, amt: 0.5, axis: 'y' },
        taper: { enabled: false, amt: 0.5, axis: 'y' },
        ripple:{ enabled: false, amp: 0.2, freq: 5.0, axis: 'y' },
        spherify: { enabled: false, str: 0.5 },
        skew: { enabled: false, amt: 0.5, axis: 'y' },
        pinch: { enabled: false, str: 0.5, axis: 'all' },
        stretch: { enabled: false, amt: 0.5, axis: 'y' },
        swirl: { enabled: false, str: 0.5, axis: 'y' },
        quantize: { enabled: false, steps: 10, axis: 'all' },
        zigzag: { enabled: false, amp: 0.2, freq: 5.0, axis: 'y' },
        smooth: { enabled: false, str: 0.5, iters: 3 },
        deformationOrder: ['noise', 'smooth', 'twist', 'wave', 'bulge', 'bend', 'taper', 'ripple', 'spherify', 'skew', 'pinch', 'stretch', 'swirl', 'quantize', 'zigzag'],
        reorderMode: false,
        cam: { x: 4, y: 3, z: 5, rotX: 0, rotY: 0, fov: 45, target: {x: 0, y: 0, z: 0} },
        autoRotate: false,
        svgPreview: false,
        style: 'hidden-line', 
        hiddenSettings: { bias: 0, epsilon: 0.01, splineRes: 4, cutPrecision: 6, inflate: 0, minLen: 2, invert: false, silhouette: false, silhouetteWidth: 3 },
        occlusionMethod: 'gpu',
        gpuGridSize: 1,
        gpuDepthMap: null,
        legacyHiddenLine: false,
        properOrder: true,
        zDepth: { color: false, opacity: false, dof: false, size: false },
        lineGradient: { enabled: false, axis: 'both', stops: [{ c: '#0000ff', p: 0.0 }, { c: '#ff0000', p: 1.0 }] },
        zSize: { near: 5, far: 1 },
        halftone: { grid: 10, size: 8, angle: 45, invert: true },
        checkerboard: { col1: '#ffffff', col2: '#000000', invert: false },
        matcapRotation: { x: 0, y: 0 },
        gradMode: 'camera', 
        gradRot: { x: 0, y: 0 }, 
        baseColor: '#007aff', colorNear: '#ff00ff', colorFar: '#0000ff', gradStart: 0.0, gradEnd: 1.0, colorStops: [{ c: '#0000ff', p: 0.0 }, { c: '#ff0000', p: 1.0 }],
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
                colorMap: { value: null },
                minZ: { value: 0.0 }, maxZ: { value: 10.0 },
                opMinZ: { value: 0.0 }, opMaxZ: { value: 10.0 },
                dofMinZ: { value: 0.0 }, dofMaxZ: { value: 10.0 },
                useColor: { value: 0 }, useOpacity: { value: 0 }, useDOF: { value: 0 },
                useZSize: { value: 0 }, zSizeNear: { value: 5.0 }, zSizeFar: { value: 1.0 },
                cameraPos: { value: new THREE.Vector3() },
                pointSize: { value: (state.dotSize || 6.0) * (window.devicePixelRatio || 1.0) },
                dofFocus: { value: 0.5 }, dofIntensity: { value: 5.0 }, dofIgnoreNear: { value: 0 }, dofOpTexture: { value: dummyTex },
                gradMode: { value: 0 }, 
                gradDir: { value: new THREE.Vector3(0,0,1) },
                useLineGradient: { value: 0 },
                lineColorMap: { value: null }
            },
            clipping: true,
            vertexShader: `
                #include <clipping_planes_pars_vertex>
                uniform float pointSize; 
                uniform vec3 cameraPos; 
                uniform int gradMode;
                uniform vec3 gradDir;
                uniform int useZSize;
                uniform float zSizeNear;
                uniform float zSizeFar;
                uniform int useLineGradient;
                attribute float lineValue;
                varying float vDist;
                varying float vProj;
                varying float vLineValue;
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
                    if (useLineGradient == 1 && lineValue >= 0.0) {
                        mvPosition.z += 0.001;
                    }
                    #include <clipping_planes_vertex>
                    gl_Position = projectionMatrix * mvPosition; 
                    if (useZSize == 1) {
                        float t = clamp((vDist - 0.0) / 20.0, 0.0, 1.0);
                        gl_PointSize = mix(zSizeNear, zSizeFar, t) * (5.0 / -mvPosition.z);
                    } else {
                        gl_PointSize = pointSize * (5.0 / -mvPosition.z); 
                    }
                    vLineValue = lineValue;
                }`,
            fragmentShader: `
                #include <clipping_planes_pars_fragment>
                uniform vec3 color; 
                uniform sampler2D colorMap;
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
                uniform int useLineGradient;
                uniform sampler2D lineColorMap;
                varying float vDist; 
                varying float vProj;
                varying float vLineValue;
                void main() { 
                    #include <clipping_planes_fragment>
                    float metric = (gradMode == 1) ? vProj : vDist;
                    float range = maxZ - minZ; 
                    if (range < 0.001) range = 1.0; 
                    float t = clamp((metric - minZ) / range, 0.0, 1.0); 
                    vec4 finalColor = vec4(color, 1.0); 
                    if (useColor == 1) finalColor.rgb = texture2D(colorMap, vec2(t, 0.5)).rgb; 
                    if (useLineGradient == 1 && vLineValue >= 0.0) finalColor.rgb = texture2D(lineColorMap, vec2(vLineValue, 0.5)).rgb;
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
                        float d = depthT - dofFocus; 
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
        if (!state.colorStops) {
            state.colorStops = [
                { c: state.colorNear || '#0000ff', p: state.gradStart !== undefined ? state.gradStart : 0.0 },
                { c: state.colorFar || '#ff0000', p: state.gradEnd !== undefined ? state.gradEnd : 1.0 }
            ];
        }
        if (state.deformationOrder) {
            const allDeformations = ['noise', 'smooth', 'twist', 'wave', 'bulge', 'bend', 'taper', 'ripple', 'spherify', 'skew', 'pinch', 'stretch', 'swirl', 'quantize', 'zigzag'];
            const missing = allDeformations.filter(d => !state.deformationOrder.includes(d));
            state.deformationOrder.push(...missing);
        }
        if (state.opGradStart === undefined) state.opGradStart = 0.0;
        if (state.opGradEnd === undefined) state.opGradEnd = 1.0;
        if (state.occlusionMethod === undefined) {
            state.occlusionMethod = 'gpu';
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

    function setupChangelog() {
        const badge = document.getElementById('version-badge');
        const modal = document.getElementById('changelog-modal');
        const content = document.getElementById('changelog-content');
        const closeBtn = document.getElementById('changelog-close');

        if (!badge || !modal || !content || !closeBtn) return;

        const changelogText = `█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█   VERSION 0.110   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
└── [FIX] UI Improvements


█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█      
█   VERSION 0.109   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
└── [NEW] Checkerboard Visual Style
    ├── Mesh-based polygon patterning
    ├── UV-aware (seamless on spheres/wraps)
    └── Integrated with GPU depth-capture



█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█   VERSION 0.108   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [NEW] GPU hidden line processing (way faster now)
│ 
└── [UI] Added Occlusion Method selector


█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█   VERSION 0.107   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [FIX] Z effects now works together better
│   └── Gradient color positions dont affect DoF anymore
│ 
└── [NEW] Noise Axis (Displacement) type ==> from center

█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█   VERSION 0.106   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [NEW] Settings recall system
│   └── Added UI elements to: export/load from file
│
├── [NEW] Min Line Length Filtering
│   └── Filter out line segments shorter than threshold
│
├── [NEW] Occluder Inflation
│   └── Inflates solid occluder geometry
│
├── [NEW] Sphere Circles Geometry
│
├── [NEW] Geo Defaults System
│   └── Per-geometry smart defaults (epsilon, bias, inflate, splineRes)
│
├── [MOD] Improved Occlusion Handling
│   └── Bias slider moved to main Hidden Line settings
│
└── [FIX] UI Cleanup
    └── Removed experimental overlay silhouette toggle (too noisy)

█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█   VERSION 0.103   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [NEW] Preset System
│   ├── 5 save/recall slots (◆ ◆ ◆ ◆ ◆ buttons)
│   ├── Click to load saved state
│   ├── Shift-Click to overwrite slot
│   └── Double-Click to clear slot
│
├── [NEW] Camera Target Position
│   ├── X, Y, Z target controls
│   └── Independent from camera position
│
├── [NEW] View Presets
│   ├── Front, Back, Left, Right views
│   ├── Top, Bottom views
│   └── Isometric view
│
├── [NEW] Directional Gradient Mode
│   ├── Camera mode (default) - distance from camera
│   ├── Directional mode - projection on vector
│   ├── Gradient direction rotation (X, Y)
│   └── Color gradient rotates with direction
│

└── [MOD] State Management
    ├── Preset slots saved to state
    └── Target position tracked in state


█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█  VERSION 0.10   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [NEW] Landscape Generator
│   ├── Procedural terrain generation
│   ├── Multiple segment settings (width, height, segs)
│   └── Noise-based height displacement
│
├── [NEW] Multiple Noise Types
│   ├── Simplex (default)
│   ├── Perlin
│   ├── Worley (Cellular)
│   ├── Value Noise
│   ├── Turbulence (abs noise)
│   └── Ridged Multifractal
│
├── [NEW] Depth of Field (DOF)
│   ├── Focus distance control
│   ├── Blur intensity
│   ├── Aperture size
│   ├── Ignore near option
│   └── Curve Editor w/ separate opacity and size curves
│
├── [NEW] Deformation Reordering
│   └── Drag & drop to change deformation execution order
│
├── [MOD] Refactored Depth Effects
│   └── zEffect → zDepth (color, opacity, dof as separate toggles)
│
├── [MOD] Simplified Export
│   └── Removed legacy/proper order toggles (simplified export path)
│
├── [MOD] Expanded Geometry Parameters
│   ├── Separate width/height/depth for cube
│   ├── Separate radial/tubular segments for torus
│   └── Individual segment controls for grid
│
└── [MOD] Enhanced Noise Controls
    ├── Noise type selection
    ├── Amplitude, frequency, seed
    └── Octaves, persistence, lacunarity (landscape only)


█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█  VERSION 0.09   █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [NEW] Clipping Plane System
│   ├── X, Y, Z axis selection
│   └── Adjustable clip position
│
├── [NEW] Spherify Deformation
│   └── Pushes vertices toward sphere shape
│
├── [NEW] Skew Deformation
│   └── Skews geometry along selected axis
│
├── [NEW] Noise Seed Control
│   └── Reproducible noise patterns
│
├── [NEW] Axis Control for All Deformations
│   └── X, Y, Z axis selection for each deformation type
│
├── [MOD] Export Options
│   ├── Legacy Hidden Line toggle
│   └── Proper Order toggle (depth-sorted SVG output)
│
└── [MOD] Enhanced Parameter Controls
    └── Individual segment parameters for cube (segs X, Y, Z)

█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█   VERSION 0.03    █
█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
│
├── [GEOMETRY] Basic Shapes
│   ├── Cube, Sphere, Icosahedron, Tetrahedron
│   ├── Octahedron, Dodecahedron
│   ├── Cone, Cylinder, Torus, Torus Knot
│   └── Ring, Grid/Plane
│
├── [SURFACES] Math & Parametric Surfaces
│   ├── 5 Math Presets (Ripple, Waves, Saddle, Paraboloid, Pyramid)
│   ├── 6 Parametric Presets (Klein Bottle, Torus, Mobius, Helicoid, Sphere, Dini)
│   └── Custom OBJ Upload
│
├── [DEFORMATIONS] 7 Geometry Modifiers
│   ├── Twist, Wave, Bulge, Bend, Taper, Ripple
│   └── Simplex Noise displacement
│
├── [STYLES] Visual Styles
│   ├── Hidden Line (Solid)
│   ├── Wireframe (X-Ray)
│   ├── Dots (X-Ray)
│   └── Dots (Solid)
│

├── [EFFECTS] Depth-Based Effects
│   ├── Color Gradient (Blue → Red)
│   └── Opacity Fade
│
├── [EXPORT] SVG Export
│   ├── Full resolution export
│   └── Preview mode
│
└── [CAMERA] Basic Orbit Controls`;

        content.textContent = changelogText;

        badge.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    initScene();
    setupUI();
    setupMultipleGeometriesUI();
    setupPresets();
    setupPresetButtons(); 
    rebuildUIParams();
    updateUIFromState();
    updateGeometry();
    setupChangelog();
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
                saveHistory();
                state.mathFormula = p.formula; document.getElementById('math-formula').value = p.formula;
                if(p.vars) { state.mathVars = { ...state.mathVars, ...p.vars }; ['a','b','c'].forEach(k => document.getElementById(`math-var-${k}`).value = state.mathVars[k]); }
                updateGeometry();
                e.target.value = "";
            });
        }
        const paramSel = document.getElementById('param-presets');
        if(paramSel) {
            paramPresets.forEach((p, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = p.name; paramSel.appendChild(opt); });
            paramSel.addEventListener('change', (e) => {
                const p = paramPresets[e.target.value]; if(!p) return;
                saveHistory();
                state.parametricFormulas.x = p.x; state.parametricFormulas.y = p.y; state.parametricFormulas.z = p.z;
                document.getElementById('param-x').value = p.x; document.getElementById('param-y').value = p.y; document.getElementById('param-z').value = p.z;
                if (state.geoType === 'parametric') { 
                    state.geoParams[0] = p.uMin; state.geoParams[1] = p.uMax; 
                    state.geoParams[2] = p.vMin; state.geoParams[3] = p.vMax; 
                    rebuildUIParams(true);
        if (typeof renderGeoList === 'function') renderGeoList(); 
                }
                updateGeometry();
                e.target.value = "";
            });
        }
    }

    
    function syncStateToActiveGeometry() {
        if (!state.activeGeoId) return;
        const geo = state.geometries.find(g => g.id === state.activeGeoId);
        if (geo) {
            geo.type = state.geoType;
            geo.params = [...state.geoParams];
            geo.pos = { ...state.geoPos };
            geo.rot = { ...state.geoRot };
            geo.scl = { ...state.geoScl };
            geo.mathFormula = state.mathFormula;
            geo.mathVars = { ...state.mathVars };
            geo.parametricFormulas = { ...state.parametricFormulas };
            geo.landscape = { ...state.landscape };
        }
    }

    function syncActiveGeometryToState(geoId) {
        state.activeGeoId = geoId;
        const geo = state.geometries.find(g => g.id === geoId);
        if (geo) {
            state.geoType = geo.type;
            state.geoParams = [...geo.params];
            state.geoPos = { ...geo.pos };
            state.geoRot = { ...geo.rot };
            state.geoScl = { ...geo.scl };
            state.mathFormula = geo.mathFormula;
            state.mathVars = { ...geo.mathVars };
            state.parametricFormulas = { ...geo.parametricFormulas };
            state.landscape = { ...geo.landscape };
            
            document.getElementById('geo-pos-x').value = state.geoPos.x;
            document.getElementById('geo-pos-y').value = state.geoPos.y;
            document.getElementById('geo-pos-z').value = state.geoPos.z;
            document.getElementById('geo-rot-x').value = state.geoRot.x;
            document.getElementById('geo-rot-y').value = state.geoRot.y;
            document.getElementById('geo-rot-z').value = state.geoRot.z;
            document.getElementById('geo-scl-x').value = state.geoScl.x;
            document.getElementById('geo-scl-y').value = state.geoScl.y;
            document.getElementById('geo-scl-z').value = state.geoScl.z;
            
            rebuildUIParams(true);
        if (typeof renderGeoList === 'function') renderGeoList();
            updateUIFromState();
            renderGeoList();
            updateGeometry();
        }
    }

    function renderGeoList() {
        const list = document.getElementById('geo-list');
        if (!list) return;
        list.innerHTML = '';
        state.geometries.forEach((geo, index) => {
            const li = document.createElement('li');
            li.style.padding = '8px 10px';
            li.style.borderBottom = '1px solid #333';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.cursor = 'pointer';
            li.style.background = state.activeGeoId === geo.id ? '#007aff44' : 'transparent';
            li.draggable = true;
            
            li.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                li.style.opacity = '0.5';
            });
            li.addEventListener('dragend', () => { li.style.opacity = '1'; });
            li.addEventListener('dragover', (e) => { e.preventDefault(); });
            li.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
                if (draggedIdx !== index) {
                    const moved = state.geometries.splice(draggedIdx, 1)[0];
                    state.geometries.splice(index, 0, moved);
                    saveHistory();
                    renderGeoList();
                    updateGeometry();
                }
            });
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = geo.type.charAt(0).toUpperCase() + geo.type.slice(1);
            nameSpan.style.fontSize = '12px';
            nameSpan.style.pointerEvents = 'none';
            
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '5px';
            
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '×';
            delBtn.style.background = 'transparent';
            delBtn.style.border = 'none';
            delBtn.style.color = '#ff4444';
            delBtn.style.cursor = 'pointer';
            delBtn.style.padding = '0 5px';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (state.geometries.length > 1) {
                    saveHistory();
                    state.geometries = state.geometries.filter(g => g.id !== geo.id);
                    if (state.activeGeoId === geo.id) syncActiveGeometryToState(state.geometries[0].id);
                    else { renderGeoList(); updateGeometry(); }
                }
            };
            
            btnGroup.appendChild(delBtn);
            
            li.appendChild(nameSpan);
            li.appendChild(btnGroup);
            
            li.onclick = () => syncActiveGeometryToState(geo.id);
            list.appendChild(li);
        });
    }

    function setupMultipleGeometriesUI() {
        if(!state.activeGeoId && state.geometries.length > 0) state.activeGeoId = state.geometries[0].id;
        
        const btnAdd = document.getElementById('btn-add-geometry');
        if(btnAdd) {
            btnAdd.addEventListener('click', () => {
                saveHistory();
                const newGeo = {
                    id: 'geo-' + Math.random().toString(36).substr(2, 9),
                    type: 'cube',
                    params: [2, 2, 2, 5, 5, 5, 1],
                    pos: { x:0, y:0, z:0 },
                    rot: { x:0, y:0, z:0 },
                    scl: { x:1, y:1, z:1 },
                    mathFormula: 'sin(x*a) * cos(z*b) * c',
                    mathVars: { a: 1.0, b: 1.0, c: 1.0 },
                    parametricFormulas: { x: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * cos(u)', y: '(2 + cos(u/2)*sin(v) - sin(u/2)*sin(2*v)) * sin(u)', z: 'sin(u/2)*sin(v) + cos(u/2)*sin(2*v)' },
                    landscape: { seed: 68, noiseType: 'simplex', amplitude: 1.5, frequency: 0.05, octaves: 4, persistence: 0.5, lacunarity: 2.0, seaLevel: 0.0, noiseScale: 4.9, useFade: false, fadeRadius: 0.5 }
                };
                state.geometries.push(newGeo);
                syncActiveGeometryToState(newGeo.id);
            });
        }
        
        ['pos','rot','scl'].forEach(prop => {
            ['x','y','z'].forEach(axis => {
                const el = document.getElementById(`geo-${prop}-${axis}`);
                if(el) {
                    el.addEventListener('input', (e) => {
                        let val = parseFloat(e.target.value);
                        if(isNaN(val)) val = prop === 'scl' ? 1 : 0;
                        if(prop === 'pos') state.geoPos[axis] = val;
                        if(prop === 'rot') state.geoRot[axis] = val;
                        if(prop === 'scl') state.geoScl[axis] = val;
                        updateGeometry();
                    });
                    el.addEventListener('change', () => saveHistory());
                }
            });
        });
        
        renderGeoList();
    }

    function initScene() {
        scene = new THREE.Scene(); 
        scene.background = new THREE.Color(0x111111);
        scene.fog = new THREE.FogExp2(0x111111, 0.03);
        sceneGridHelper = new THREE.GridHelper(100, 100, 0x333333, 0x333333);
        sceneGridHelper.position.y = -5;
        sceneGridHelper.material.opacity = 0.5;
        sceneGridHelper.material.transparent = true;
        scene.add(sceneGridHelper);
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(state.cam.fov, aspect, 0.1, 1000); camera.position.set(state.cam.x, state.cam.y, state.cam.z);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); renderer.setSize(container.clientWidth, container.clientHeight); renderer.setPixelRatio(window.devicePixelRatio); renderer.localClippingEnabled = true; container.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.4; controls.autoRotate = state.autoRotate; controls.autoRotateSpeed = 2.0;
        
        if(state.cam.target) controls.target.set(state.cam.target.x, state.cam.target.y, state.cam.target.z);

        transformParent = new THREE.Group();
        scene.add(transformParent);
        transformProxy = new THREE.Group();
        transformParent.add(transformProxy);
        transformControl = new THREE.TransformControls(camera, renderer.domElement);
        transformControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
        });
        transformControl.addEventListener('change', function () {
            if (transformControl.dragging) {
                state.geoPos.x = transformProxy.position.x;
                state.geoPos.y = transformProxy.position.y;
                state.geoPos.z = transformProxy.position.z;
                state.geoRot.x = THREE.MathUtils.radToDeg(transformProxy.rotation.x);
                state.geoRot.y = THREE.MathUtils.radToDeg(transformProxy.rotation.y);
                state.geoRot.z = THREE.MathUtils.radToDeg(transformProxy.rotation.z);
                state.geoScl.x = transformProxy.scale.x;
                state.geoScl.y = transformProxy.scale.y;
                state.geoScl.z = transformProxy.scale.z;
                
                document.getElementById('geo-pos-x').value = state.geoPos.x.toFixed(2);
                document.getElementById('geo-pos-y').value = state.geoPos.y.toFixed(2);
                document.getElementById('geo-pos-z').value = state.geoPos.z.toFixed(2);
                document.getElementById('geo-rot-x').value = state.geoRot.x.toFixed(2);
                document.getElementById('geo-rot-y').value = state.geoRot.y.toFixed(2);
                document.getElementById('geo-rot-z').value = state.geoRot.z.toFixed(2);
                document.getElementById('geo-scl-x').value = state.geoScl.x.toFixed(2);
                document.getElementById('geo-scl-y').value = state.geoScl.y.toFixed(2);
                document.getElementById('geo-scl-z').value = state.geoScl.z.toFixed(2);
                
                updateGeometry(true);
            }
        });
        scene.add(transformControl);
        transformControl.attach(transformProxy);
        transformControl.enabled = false;
        transformControl.visible = false;
        
        document.getElementById('btn-gizmo-off').addEventListener('click', () => {
            transformControl.enabled = false; transformControl.visible = false;
        });
        document.getElementById('btn-gizmo-translate').addEventListener('click', () => {
            transformControl.setMode('translate'); transformControl.enabled = true; transformControl.visible = true;
        });
        document.getElementById('btn-gizmo-rotate').addEventListener('click', () => {
            transformControl.setMode('rotate'); transformControl.enabled = true; transformControl.visible = true;
        });
        document.getElementById('btn-gizmo-scale').addEventListener('click', () => {
            transformControl.setMode('scale'); transformControl.enabled = true; transformControl.visible = true;
        });
        
        const ambient = new THREE.AmbientLight(0x404040); scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(5, 10, 7); scene.add(dirLight);
        matWireShader = createShaderMaterial();
        
        let isRotatingMatcap = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        const onPointerDown = (e) => {
            if (e.altKey || e.metaKey) {
                isRotatingMatcap = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                controls.enabled = false;
                recordDragStart();
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        };

        const onPointerMove = (e) => {
            if (isRotatingMatcap) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                
                state.matcapRotation.y += deltaX * 0.01;
                state.matcapRotation.x -= deltaY * 0.01;
                
                // Wrap rotation between -PI and PI for slider consistency
                if (state.matcapRotation.y > Math.PI) state.matcapRotation.y -= Math.PI * 2;
                if (state.matcapRotation.y < -Math.PI) state.matcapRotation.y += Math.PI * 2;
                if (state.matcapRotation.x > Math.PI) state.matcapRotation.x -= Math.PI * 2;
                if (state.matcapRotation.x < -Math.PI) state.matcapRotation.x += Math.PI * 2;
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                updateMaterialUniforms();
                
                // Sync UI sliders
                const sliderX = document.getElementById('ht-light-rot-x');
                const valX = document.getElementById('val-ht-light-rot-x');
                const sliderY = document.getElementById('ht-light-rot-y');
                const valY = document.getElementById('val-ht-light-rot-y');
                
                if (sliderX) sliderX.value = state.matcapRotation.x;
                if (valX) valX.value = state.matcapRotation.x.toFixed(2);
                if (sliderY) sliderY.value = state.matcapRotation.y;
                if (valY) valY.value = state.matcapRotation.y.toFixed(2);
                
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        };

        const onPointerUp = (e) => {
            if (isRotatingMatcap) {
                isRotatingMatcap = false;
                controls.enabled = true;
                recordDragEnd();
                e.stopImmediatePropagation();
            }
        };

        renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('pointermove', onPointerMove, true);
        window.addEventListener('pointerup', onPointerUp, true);

        // Also block standard mouse events to be sure
        renderer.domElement.addEventListener('mousedown', (e) => { if (e.altKey || e.metaKey) e.stopImmediatePropagation(); }, true);

        window.addEventListener('resize', onWindowResize);
    }

    function updateMaterialUniforms() {
        if (mainMeshGroup && mainMeshGroup.userData.solid) {
            const mat = mainMeshGroup.userData.solid.material;
            if (mat && mat.userData && mat.userData.shader) {
                mat.userData.shader.uniforms.matcapRotation.value = state.matcapRotation;
            }
        }
        const updateShader = (mat) => {
            if (!mat || !mat.uniforms) return;
            if (window.gradTex) mat.uniforms.colorMap.value = window.gradTex;
            mat.uniforms.useColor.value = state.zDepth.color ? 1 : 0; 
            mat.uniforms.useLineGradient.value = state.lineGradient.enabled ? 1 : 0;
            if (window.lineGradTex) mat.uniforms.lineColorMap.value = window.lineGradTex;
            mat.uniforms.useOpacity.value = state.zDepth.opacity ? 1 : 0; 
            mat.uniforms.useDOF.value = state.zDepth.dof ? 1 : 0;
            mat.uniforms.useZSize.value = state.zDepth.size ? 1 : 0;
            mat.uniforms.zSizeNear.value = state.zSize.near;
            mat.uniforms.zSizeFar.value = state.zSize.far;
            
            const activeColor = (state.svgPreview && !state.zDepth.color) ? '#f1c40f' : state.baseColor;
            mat.uniforms.color.value.set(activeColor); 
            
            mat.uniforms.dofFocus.value = state.dof.focus; 
            mat.uniforms.dofIntensity.value = state.dof.intensity; 
            mat.uniforms.dofIgnoreNear.value = state.dof.ignoreNear ? 1 : 0;
            
            mat.uniforms.gradMode.value = (state.gradMode === 'directional') ? 1 : 0;
            if (state.gradMode === 'directional') {
                mat.uniforms.gradDir.value.copy(getGradientDirection());
            }

            if (state.zDepth.dof) { const tex = generateCurveTexture(state.dof.opCurve); if (mat.uniforms.dofOpTexture.value) mat.uniforms.dofOpTexture.value.dispose(); mat.uniforms.dofOpTexture.value = tex; }
            
            let minVal = Infinity, maxVal = -Infinity;
            let dofMinVal = 0, dofMaxVal = 10;
            if (mainMeshGroup) {
                const mesh = mainMeshGroup.userData.wire || mainMeshGroup.children[0];
                if (mesh && mesh.geometry) { 
                    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere(); 
                    const sphere = mesh.geometry.boundingSphere.clone(); 
                    sphere.applyMatrix4(mesh.matrixWorld);
                    const camPos = camera.position; 
                    const dist = camPos.distanceTo(sphere.center); 
                    dofMinVal = dist - sphere.radius; 
                    dofMaxVal = dist + sphere.radius; 
                    
                    if (state.gradMode === 'directional') {
                        const dir = getGradientDirection();
                        const cProj = sphere.center.dot(dir);
                        minVal = cProj - sphere.radius;
                        maxVal = cProj + sphere.radius;
                    } else {
                        minVal = dofMinVal; 
                        maxVal = dofMaxVal; 
                    }
                } else { minVal = 0; maxVal = 10; dofMinVal = 0; dofMaxVal = 10; }
            } else { minVal = 0; maxVal = 10; dofMinVal = 0; dofMaxVal = 10; }
            
            if (state.gradMode === 'camera' && minVal < 0.1) minVal = 0.1;
            if (state.gradMode === 'camera' && dofMinVal < 0.1) dofMinVal = 0.1;
            
            const range = maxVal - minVal;
            const opStart = state.opGradStart !== undefined ? state.opGradStart : 0.0;
            const opEnd = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
            mat.uniforms.minZ.value = minVal; 
            mat.uniforms.maxZ.value = minVal + range;
            
            mat.uniforms.opMinZ.value = minVal + (range * opStart);
            mat.uniforms.opMaxZ.value = minVal + (range * opEnd);
            
            mat.uniforms.dofMinZ.value = dofMinVal;
            mat.uniforms.dofMaxZ.value = dofMaxVal;
            
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
        document.getElementById('hl-silhouette').addEventListener('change', (e) => { saveHistory(); state.hiddenSettings.silhouette = e.target.checked; if(state.svgPreview) disableSVGPreview(); updateGeometry(); });
        syncInput('hl-silhouette-width', 'val-hl-silhouette-width', (v) => { state.hiddenSettings.silhouetteWidth = parseFloat(v); if(state.svgPreview) disableSVGPreview(); updateGeometry(); });
        document.getElementById('hl-invert').addEventListener('change', (e) => { saveHistory(); state.hiddenSettings.invert = e.target.checked; if(state.svgPreview) disableSVGPreview(); updateGeometry(); });

        const applyGeoDefaults = (type) => {
            const defs = geoDefaults[type] || geoDefaults.custom;
            state.hiddenSettings.epsilon = defs.epsilon;
            state.hiddenSettings.bias = defs.bias;
            state.hiddenSettings.inflate = defs.inflate;
            state.hiddenSettings.splineRes = defs.splineRes;
            state.hiddenSettings.silhouette = defs.silhouette !== undefined ? defs.silhouette : (type !== 'cube');
            state.hiddenSettings.minLen = defs.minLen || 0;
            
            document.getElementById('hl-epsilon').value = defs.epsilon;
            document.getElementById('val-hl-epsilon').value = defs.epsilon;
            document.getElementById('hl-bias').value = defs.bias;
            document.getElementById('val-hl-bias').value = defs.bias;
            document.getElementById('hl-inflate').value = defs.inflate;
            document.getElementById('val-hl-inflate').value = defs.inflate;
            document.getElementById('hl-spline-res').value = defs.splineRes;
            document.getElementById('val-hl-spline-res').value = defs.splineRes;
            document.getElementById('hl-silhouette').checked = state.hiddenSettings.silhouette;
            
            const minLenEl = document.getElementById('hl-min-len');
            if (minLenEl) {
                minLenEl.value = state.hiddenSettings.minLen;
                document.getElementById('val-hl-min-len').value = state.hiddenSettings.minLen;
            }
        };

        geoType.addEventListener('change', (e) => {
            saveHistory();
            const val = e.target.value;
            if (val === 'sphere') {
                polyContainer.style.display = 'block';
                document.getElementById('torus-type-container').style.display = 'none';
                state.geoType = polyType.value;
            } else if (val === 'torus') {
                polyContainer.style.display = 'none';
                document.getElementById('torus-type-container').style.display = 'block';
                state.geoType = document.getElementById('torus-type').value;
            } else {
                polyContainer.style.display = 'none';
                document.getElementById('torus-type-container').style.display = 'none';
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

        document.getElementById('torus-type').addEventListener('change', (e) => {
            saveHistory();
            state.geoType = e.target.value;
            rebuildUIParams(false);
            applyGeoDefaults(state.geoType);
            updateUIFromState();
            updateGeometry();
        });

        document.getElementById('grid-show-u').addEventListener('change', (e) => { saveHistory(); if (!e.target.checked && !state.gridUV.v && !state.gridUV.d1 && !state.gridUV.d2) { state.gridUV.v = true; document.getElementById('grid-show-v').checked = true; } state.gridUV.u = e.target.checked; updateGeometry(); });
        document.getElementById('grid-show-v').addEventListener('change', (e) => { saveHistory(); if (!e.target.checked && !state.gridUV.u && !state.gridUV.d1 && !state.gridUV.d2) { state.gridUV.u = true; document.getElementById('grid-show-u').checked = true; } state.gridUV.v = e.target.checked; updateGeometry(); });
        if(document.getElementById('grid-show-d1')) document.getElementById('grid-show-d1').addEventListener('change', (e) => { saveHistory(); state.gridUV.d1 = e.target.checked; updateGeometry(); });
        if(document.getElementById('grid-show-d2')) document.getElementById('grid-show-d2').addEventListener('change', (e) => { saveHistory(); state.gridUV.d2 = e.target.checked; updateGeometry(); });
        
        const mathForm = document.getElementById('math-formula'); mathForm.addEventListener('focus', recordDragStart); mathForm.addEventListener('blur', recordDragEnd); mathForm.addEventListener('input', (e) => { state.mathFormula = e.target.value; updateGeometry(); });
        ['x', 'y', 'z'].forEach(axis => { const el = document.getElementById(`param-${axis}`); if (el) { el.addEventListener('focus', recordDragStart); el.addEventListener('blur', recordDragEnd); el.addEventListener('input', (e) => { state.parametricFormulas[axis] = e.target.value; updateGeometry(); }); } });
        ['a', 'b', 'c'].forEach(v => { document.getElementById(`math-var-${v}`).addEventListener('focus', recordDragStart); document.getElementById(`math-var-${v}`).addEventListener('blur', recordDragEnd); document.getElementById(`math-var-${v}`).addEventListener('input', (e) => { state.mathVars[v] = parseFloat(e.target.value); updateGeometry(); }); });
        document.getElementById('obj-input').addEventListener('change', (e) => { saveHistory(); const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (ev) => { const loader = new THREE.OBJLoader(); const obj = loader.parse(ev.target.result); const geos = []; obj.traverse(c => { if(c.isMesh) geos.push(c.geometry); }); if(geos.length) { originalGeometry = geos.length === 1 ? geos[0] : THREE.BufferGeometryUtils.mergeBufferGeometries(geos); originalGeometry = THREE.BufferGeometryUtils.mergeVertices(originalGeometry); originalGeometry.center(); originalGeometry.computeBoundingSphere(); const s = 3.0 / originalGeometry.boundingSphere.radius; originalGeometry.scale(s,s,s); updateGeometry(); } }; reader.readAsText(file); });

        const bindCheck = (id, key) => { const el = document.getElementById(id); const sub = document.getElementById(key + '-controls'); el.addEventListener('change', () => { saveHistory(); state[key].enabled = el.checked; if(sub) sub.style.display = el.checked ? 'block' : 'none'; updateGeometry(); }); };
        ['noise','smooth','twist','wave','bulge','bend','taper','ripple','spherify','skew','pinch','stretch','swirl','quantize','zigzag'].forEach(k => bindCheck('use-'+k, k));

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
        syncInput('pinch-str', 'val-pinch-str', (v) => { state.pinch.str = parseFloat(v); updateGeometry(); });
        syncInput('stretch-amt', 'val-stretch-amt', (v) => { state.stretch.amt = parseFloat(v); updateGeometry(); });
        syncInput('swirl-str', 'val-swirl-str', (v) => { state.swirl.str = parseFloat(v); updateGeometry(); });
        syncInput('quantize-steps', 'val-quantize-steps', (v) => { state.quantize.steps = parseInt(v); updateGeometry(); });
        syncInput('zigzag-amp', 'val-zigzag-amp', (v) => { state.zigzag.amp = parseFloat(v); updateGeometry(); });
        syncInput('zigzag-freq', 'val-zigzag-freq', (v) => { state.zigzag.freq = parseFloat(v); updateGeometry(); });
        syncInput('smooth-str', 'val-smooth-str', (v) => { state.smooth.str = parseFloat(v); updateGeometry(); });
        syncInput('smooth-iters', 'val-smooth-iters', (v) => { state.smooth.iters = parseInt(v, 10); updateGeometry(); });

        syncInput('landscape-seed', 'val-landscape-seed', (v) => { state.landscape.seed = parseInt(v); updateGeometry(); });
        document.getElementById('landscape-noise-type').addEventListener('change', (e) => { saveHistory(); state.landscape.noiseType = e.target.value; updateGeometry(); });
        document.getElementById('landscape-use-fade').addEventListener('change', (e) => { saveHistory(); state.landscape.useFade = e.target.checked; setDisplay('landscape-fade-radius-container', e.target.checked); updateGeometry(); });
        syncInput('landscape-amp', 'val-landscape-amp', (v) => { state.landscape.amplitude = parseFloat(v); updateGeometry(); });
        syncInput('landscape-freq', 'val-landscape-freq', (v) => { state.landscape.frequency = parseFloat(v); updateGeometry(); });
        syncInput('landscape-octaves', 'val-landscape-octaves', (v) => { state.landscape.octaves = parseInt(v); updateGeometry(); });
        syncInput('landscape-persistence', 'val-landscape-persistence', (v) => { state.landscape.persistence = parseFloat(v); updateGeometry(); });
        syncInput('landscape-lacunarity', 'val-landscape-lacunarity', (v) => { state.landscape.lacunarity = parseFloat(v); updateGeometry(); });
        syncInput('landscape-sea-level', 'val-landscape-sea-level', (v) => { state.landscape.seaLevel = parseFloat(v); updateGeometry(); });
        syncInput('landscape-noise-scale', 'val-landscape-noise-scale', (v) => { state.landscape.noiseScale = parseFloat(v); updateGeometry(); });
        syncInput('landscape-fade-radius', 'val-landscape-fade-radius', (v) => { state.landscape.fadeRadius = parseFloat(v); updateGeometry(); });

        document.getElementById('noise-axis').addEventListener('change', (e) => { saveHistory(); state.noise.axis = e.target.value; updateGeometry(); });
        document.getElementById('noise-type').addEventListener('change', (e) => { saveHistory(); state.noise.noiseType = e.target.value; updateGeometry(); });
        ['twist','wave','bulge','bend','taper','ripple','skew','pinch','stretch','swirl','quantize','zigzag'].forEach(k => document.getElementById(k+'-axis').addEventListener('change', (e) => { saveHistory(); state[k].axis = e.target.value; updateGeometry(); }));

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
        
        syncInput('ht-grid', 'val-ht-grid', (v) => { state.halftone.grid = parseInt(v); if(state.style === 'halftone') { if(state.svgPreview) disableSVGPreview(); updateGeometry(); } });
        syncInput('ht-size', 'val-ht-size', (v) => { state.halftone.size = parseFloat(v); if(state.style === 'halftone') { if(state.svgPreview) disableSVGPreview(); updateGeometry(); } });
        syncInput('ht-angle', 'val-ht-angle', (v) => { state.halftone.angle = parseFloat(v); if(state.style === 'halftone') { if(state.svgPreview) disableSVGPreview(); updateGeometry(); } });
        syncInput('ht-light-rot-x', 'val-ht-light-rot-x', (v) => { state.matcapRotation.x = parseFloat(v); updateMaterialUniforms(); });
        syncInput('ht-light-rot-y', 'val-ht-light-rot-y', (v) => { state.matcapRotation.y = parseFloat(v); updateMaterialUniforms(); });
        document.getElementById('ht-invert').addEventListener('change', (e) => { saveHistory(); state.halftone.invert = e.target.checked; if(state.style === 'halftone') { if(state.svgPreview) disableSVGPreview(); updateGeometry(); } });

        const bindCbCol = (id, key) => { const el = document.getElementById(id); if (el) { el.addEventListener('change', () => saveHistory()); el.addEventListener('input', (e) => { state.checkerboard[key] = e.target.value; if(state.style === 'checkerboard' && state.svgPreview) { state.svgPreview = false; enableSVGPreview(); } else if(state.svgPreview) { disableSVGPreview(); } }); } };
        bindCbCol('cb-col1', 'col1'); bindCbCol('cb-col2', 'col2');
        document.getElementById('cb-invert').addEventListener('change', (e) => { 
            saveHistory(); state.checkerboard.invert = e.target.checked; 
            if(state.style === 'checkerboard' && state.svgPreview) { state.svgPreview = false; enableSVGPreview(); }
            else if(state.svgPreview) disableSVGPreview(); 
        });
        document.getElementById('cb-delete-hidden').addEventListener('change', (e) => { 
            saveHistory(); state.checkerboard.deleteHidden = e.target.checked; 
            if(state.style === 'checkerboard' && state.svgPreview) { state.svgPreview = false; enableSVGPreview(); }
            else if(state.svgPreview) disableSVGPreview(); 
        });


        const gpuGrid = document.getElementById('gpu-grid');
        if (gpuGrid) gpuGrid.addEventListener('change', (e) => {
            saveHistory();
            state.gpuGridSize = parseInt(e.target.value);
            if(state.svgPreview) disableSVGPreview();
        });

        const setupCollapsible = (headerId, contentId) => {
            const header = document.getElementById(headerId); const content = document.getElementById(contentId);
            if (header && content) { header.addEventListener('click', (e) => { if (e.target.closest('button')) return; const section = header.closest('.section'); section.classList.toggle('collapsed'); content.style.display = section.classList.contains('collapsed') ? 'none' : 'block'; saveHistory(); }); const section = header.closest('.section'); content.style.display = section.classList.contains('collapsed') ? 'none' : 'block'; }
        };
        setupCollapsible('deformation-header', 'deformation-content'); setupCollapsible('z-depth-header', 'z-depth-content'); setupCollapsible('transform-header', 'transform-content'); setupCollapsible('camera-header', 'camera-content'); setupCollapsible('geometry-header', 'geometry-content'); setupCollapsible('hl-advanced-header', 'hl-advanced-content');

        const bindZToggle = (id, key) => { const el = document.getElementById(id); if (el) el.addEventListener('change', (e) => { saveHistory(); state.zDepth[key] = e.target.checked; updateUIFromState(); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); }); };
        bindZToggle('use-z-color', 'color'); bindZToggle('use-z-opacity', 'opacity'); bindZToggle('use-z-dof', 'dof'); bindZToggle('use-z-size', 'size');
        const elLineGrad = document.getElementById('use-line-gradient');
        if (elLineGrad) elLineGrad.addEventListener('change', (e) => { saveHistory(); state.lineGradient.enabled = e.target.checked; updateUIFromState(); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        
        syncInput('z-size-near', 'val-z-size-near', (v) => { state.zSize.near = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        syncInput('z-size-far', 'val-z-size-far', (v) => { state.zSize.far = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        syncInput('dof-focus', 'val-dof-focus', (v) => { state.dof.focus = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        syncInput('dof-intensity', 'val-dof-intensity', (v) => { state.dof.intensity = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        syncInput('dof-aperture', 'val-dof-aperture', (v) => { state.dof.aperture = parseFloat(v); updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });
        curveEditor.init(); document.getElementById('btn-curve-editor').addEventListener('click', () => curveEditor.open());
        document.getElementById('dof-ignore-near').addEventListener('change', (e) => { saveHistory(); state.dof.ignoreNear = e.target.checked; updateMaterialUniforms(); if(state.svgPreview) disableSVGPreview(); });

        const colorPresets = {
            custom: null,
            heatmap: [ { c: '#0000ff', p: 0.0 }, { c: '#00ffff', p: 0.25 }, { c: '#00ff00', p: 0.5 }, { c: '#ffff00', p: 0.75 }, { c: '#ff0000', p: 1.0 } ],
            rainbow: [ { c: '#ff0000', p: 0.0 }, { c: '#ff7f00', p: 0.16 }, { c: '#ffff00', p: 0.33 }, { c: '#00ff00', p: 0.5 }, { c: '#0000ff', p: 0.66 }, { c: '#4b0082', p: 0.83 }, { c: '#9400d3', p: 1.0 } ],
            hotcold: [ { c: '#0000ff', p: 0.0 }, { c: '#ffffff', p: 0.5 }, { c: '#ff0000', p: 1.0 } ],
            magma: [ { c: '#000000', p: 0.0 }, { c: '#3b0f70', p: 0.25 }, { c: '#8c2981', p: 0.5 }, { c: '#de4968', p: 0.75 }, { c: '#fe9f6d', p: 1.0 } ],
            ocean: [ { c: '#000033', p: 0.0 }, { c: '#003399', p: 0.33 }, { c: '#0099ff', p: 0.66 }, { c: '#ffffff', p: 1.0 } ],
            cyberpunk: [ { c: '#711c91', p: 0.0 }, { c: '#ea00d9', p: 0.33 }, { c: '#0abdc6', p: 0.66 }, { c: '#133e7c', p: 1.0 } ],
            sunset: [ { c: '#2c1445', p: 0.0 }, { c: '#cc444b', p: 0.33 }, { c: '#f07444', p: 0.66 }, { c: '#f9d276', p: 1.0 } ],
            forest: [ { c: '#1b4332', p: 0.0 }, { c: '#2d6a4f', p: 0.33 }, { c: '#52b788', p: 0.66 }, { c: '#d8f3dc', p: 1.0 } ],
            synthwave: [ { c: '#2b00ff', p: 0.0 }, { c: '#ff0055', p: 0.5 }, { c: '#ffbd00', p: 1.0 } ],
            fireice: [ { c: '#00f2fe', p: 0.0 }, { c: '#4facfe', p: 0.33 }, { c: '#f093fb', p: 0.66 }, { c: '#f5576c', p: 1.0 } ],
            gold: [ { c: '#332300', p: 0.0 }, { c: '#a67c00', p: 0.33 }, { c: '#bf953f', p: 0.66 }, { c: '#fbf5b7', p: 1.0 } ],
            pastel: [ { c: '#ffb3ba', p: 0.0 }, { c: '#ffdfba', p: 0.25 }, { c: '#ffffba', p: 0.5 }, { c: '#baffc9', p: 0.75 }, { c: '#bae1ff', p: 1.0 } ],
            monochrome: [ { c: '#000000', p: 0.0 }, { c: '#555555', p: 0.33 }, { c: '#aaaaaa', p: 0.66 }, { c: '#ffffff', p: 1.0 } ],
            neon: [ { c: '#00ffff', p: 0.0 }, { c: '#ff00ff', p: 0.5 }, { c: '#00ff00', p: 1.0 } ],
            emerald: [ { c: '#022b3a', p: 0.0 }, { c: '#1f7a8c', p: 0.33 }, { c: '#bfdbf7', p: 0.66 }, { c: '#e1e5f2', p: 1.0 } ],
            twilight: [ { c: '#140f2d', p: 0.0 }, { c: '#322a60', p: 0.33 }, { c: '#9a3c75', p: 0.66 }, { c: '#f08b65', p: 1.0 } ],
            candy: [ { c: '#ff9a9e', p: 0.0 }, { c: '#fecfef', p: 0.5 }, { c: '#a1c4fd', p: 1.0 } ]
        };

        const gradPresets = document.getElementById('gradient-presets');
        if (gradPresets) {
            gradPresets.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val !== 'custom' && colorPresets[val]) {
                    saveHistory();
                    state.colorStops = JSON.parse(JSON.stringify(colorPresets[val]));
                    if (window.updateGradientEditorUI) window.updateGradientEditorUI();
                }
            });
        }

        const gradReverse = document.getElementById('gradient-reverse');
        if (gradReverse) {
            gradReverse.addEventListener('click', () => {
                if (!state.colorStops) return;
                saveHistory();
                state.colorStops.forEach(s => s.p = 1.0 - s.p);
                state.colorStops.sort((a, b) => a.p - b.p);
                if (window.updateGradientEditorUI) window.updateGradientEditorUI();
            });
        }

        const gradStopsArea = document.getElementById('grad-stops-area');
        const gradCanvas = document.getElementById('grad-canvas');
        const gradCtx = gradCanvas ? gradCanvas.getContext('2d', { willReadFrequently: true }) : null;

        function updateGradientTexture() {
            if (!gradCtx || !state.colorStops || state.colorStops.length === 0) return;
            const w = gradCanvas.width;
            gradCtx.clearRect(0, 0, w, 1);
            const grad = gradCtx.createLinearGradient(0, 0, w, 0);
            state.colorStops.forEach(stop => grad.addColorStop(stop.p, stop.c));
            gradCtx.fillStyle = grad;
            gradCtx.fillRect(0, 0, w, 1);
            
            if (!window.gradTex) {
                window.gradTex = new THREE.CanvasTexture(gradCanvas);
            } else {
                window.gradTex.needsUpdate = true;
            }
            updateMaterialUniforms();
            if (state.svgPreview) disableSVGPreview();
        }

        window.updateGradientEditorUI = function() {
            if (!state.colorStops) {
                state.colorStops = [ { c: state.colorNear || '#0000ff', p: state.gradStart !== undefined ? state.gradStart : 0.0 }, { c: state.colorFar || '#ff0000', p: state.gradEnd !== undefined ? state.gradEnd : 1.0 } ];
            }
            if (gradStopsArea) {
                gradStopsArea.innerHTML = '';
                state.colorStops.forEach((stop, i) => {
                    const el = document.createElement('div');
                    el.className = 'grad-stop';
                    el.style.left = `${stop.p * 100}%`;
                    el.style.backgroundColor = stop.c;
                    
                    const inp = document.createElement('input');
                    inp.type = 'color';
                    inp.value = stop.c;
                    inp.addEventListener('input', (e) => {
                        stop.c = e.target.value;
                        el.style.backgroundColor = stop.c;
                        if (gradPresets) gradPresets.value = 'custom';
                        updateGradientTexture();
                    });
                    inp.addEventListener('change', () => saveHistory());
                    el.appendChild(inp);

                    el.addEventListener('mousedown', (e) => {
                        if (e.target !== inp) e.preventDefault();
                        if (e.target !== el && e.target !== inp) return;

                        if (e.altKey && state.colorStops.length > 2) {
                            state.colorStops.splice(i, 1);
                            if (gradPresets) gradPresets.value = 'custom';
                            saveHistory();
                            window.updateGradientEditorUI();
                            return;
                        }

                        let startX = e.clientX;
                        let startY = e.clientY;
                        let dragged = false;
                        recordDragStart();
                        const onMove = (ev) => {
                            if (Math.abs(ev.clientX - startX) > 2 || Math.abs(ev.clientY - startY) > 2) dragged = true;
                            const rect = gradStopsArea.getBoundingClientRect();
                            let pct = (ev.clientX - rect.left) / rect.width;
                            stop.p = Math.max(0, Math.min(1, pct));
                            state.colorStops.sort((a,b) => a.p - b.p);
                            el.style.left = `${stop.p * 100}%`;
                            if (gradPresets) gradPresets.value = 'custom';
                            updateGradientTexture();
                        };
                        const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                            recordDragEnd();
                            if (dragged) window.updateGradientEditorUI();
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                    });
                    gradStopsArea.appendChild(el);
                });
            }
            updateGradientTexture();
        };

        const gradEditor = document.getElementById('grad-editor');
        if (gradEditor) {
            gradEditor.addEventListener('click', (e) => {
                if (e.target.closest('.grad-stop')) return;
                const rect = gradStopsArea.getBoundingClientRect();
                let pct = (e.clientX - rect.left) / rect.width;
                pct = Math.max(0, Math.min(1, pct));
                const px = Math.floor(pct * 255);
                const data = gradCtx.getImageData(px, 0, 1, 1).data;
                const hex = '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('');
                
                saveHistory();
                state.colorStops.push({ c: hex, p: pct });
                state.colorStops.sort((a,b) => a.p - b.p);
                if (gradPresets) gradPresets.value = 'custom';
                window.updateGradientEditorUI();
            });
        }
        
        // Ensure UI generates initial texture on load
        if (window.updateGradientEditorUI) window.updateGradientEditorUI();

        document.getElementById('grad-mode').addEventListener('change', (e) => {
            saveHistory();
            state.gradMode = e.target.value;
            updateUIFromState();
            updateMaterialUniforms();
        });
        syncInput('grad-rot-x', 'val-grad-rot-x', (v) => { state.gradRot.x = parseFloat(v); updateMaterialUniforms(); });
        syncInput('grad-rot-y', 'val-grad-rot-y', (v) => { state.gradRot.y = parseFloat(v); updateMaterialUniforms(); });


        // --- Line Gradient UI ---
        const lineGradPresets = document.getElementById('line-gradient-presets');
        if (lineGradPresets) {
            lineGradPresets.addEventListener('change', (e) => {
                const val = e.target.value;
                if (colorPresets[val]) {
                    saveHistory();
                    state.lineGradient.stops = JSON.parse(JSON.stringify(colorPresets[val]));
                    if (window.updateLineGradientEditorUI) window.updateLineGradientEditorUI();
                }
            });
        }

        const lineGradReverse = document.getElementById('line-gradient-reverse');
        if (lineGradReverse) {
            lineGradReverse.addEventListener('click', () => {
                if (!state.lineGradient.stops) return;
                saveHistory();
                state.lineGradient.stops.forEach(s => s.p = 1.0 - s.p);
                state.lineGradient.stops.sort((a, b) => a.p - b.p);
                if (window.updateLineGradientEditorUI) window.updateLineGradientEditorUI();
            });
        }

        const lineGradStopsArea = document.getElementById('line-grad-stops-area');
        const lineGradCanvas = document.getElementById('line-grad-canvas');
        const lineGradCtx = lineGradCanvas ? lineGradCanvas.getContext('2d', { willReadFrequently: true }) : null;

        function updateLineGradientTexture() {
            if (!lineGradCtx || !state.lineGradient.stops || state.lineGradient.stops.length === 0) return;
            const w = lineGradCanvas.width;
            lineGradCtx.clearRect(0, 0, w, 1);
            const grad = lineGradCtx.createLinearGradient(0, 0, w, 0);
            state.lineGradient.stops.forEach(stop => grad.addColorStop(stop.p, stop.c));
            lineGradCtx.fillStyle = grad;
            lineGradCtx.fillRect(0, 0, w, 1);
            
            if (!window.lineGradTex) {
                window.lineGradTex = new THREE.CanvasTexture(lineGradCanvas);
            } else {
                window.lineGradTex.needsUpdate = true;
            }
            updateMaterialUniforms();
            if (state.svgPreview) disableSVGPreview();
        }

        window.updateLineGradientEditorUI = function() {
            if (!state.lineGradient.stops || state.lineGradient.stops.length === 0) {
                state.lineGradient.stops = [ { c: '#0000ff', p: 0.0 }, { c: '#ff0000', p: 1.0 } ];
            }
            if (lineGradStopsArea) {
                lineGradStopsArea.innerHTML = '';
                state.lineGradient.stops.forEach((stop, i) => {
                    const el = document.createElement('div');
                    el.className = 'grad-stop';
                    el.style.left = `${stop.p * 100}%`;
                    el.style.backgroundColor = stop.c;
                    
                    const inp = document.createElement('input');
                    inp.type = 'color';
                    inp.value = stop.c;
                    inp.addEventListener('input', (e) => {
                        stop.c = e.target.value;
                        el.style.backgroundColor = stop.c;
                        if (lineGradPresets) lineGradPresets.value = 'custom';
                        updateLineGradientTexture();
                    });
                    inp.addEventListener('change', () => saveHistory());
                    el.appendChild(inp);

                    el.addEventListener('mousedown', (e) => {
                        if (e.target !== inp) e.preventDefault();
                        if (e.target !== el && e.target !== inp) return;

                        if (e.altKey && state.lineGradient.stops.length > 2) {
                            state.lineGradient.stops.splice(i, 1);
                            if (lineGradPresets) lineGradPresets.value = 'custom';
                            saveHistory();
                            window.updateLineGradientEditorUI();
                            return;
                        }

                        let startX = e.clientX;
                        let startY = e.clientY;
                        let dragged = false;
                        recordDragStart();
                        const onMove = (ev) => {
                            if (Math.abs(ev.clientX - startX) > 2 || Math.abs(ev.clientY - startY) > 2) dragged = true;
                            const rect = lineGradStopsArea.getBoundingClientRect();
                            let pct = (ev.clientX - rect.left) / rect.width;
                            stop.p = Math.max(0, Math.min(1, pct));
                            state.lineGradient.stops.sort((a,b) => a.p - b.p);
                            el.style.left = `${stop.p * 100}%`;
                            if (lineGradPresets) lineGradPresets.value = 'custom';
                            updateLineGradientTexture();
                        };
                        const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                            recordDragEnd();
                            if (dragged) window.updateLineGradientEditorUI();
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                    });
                    lineGradStopsArea.appendChild(el);
                });
            }
            updateLineGradientTexture();
        };

        const lineGradEditor = document.getElementById('line-grad-editor');
        if (lineGradEditor) {
            lineGradEditor.addEventListener('click', (e) => {
                if (e.target.closest('.grad-stop')) return;
                const rect = lineGradStopsArea.getBoundingClientRect();
                let pct = (e.clientX - rect.left) / rect.width;
                pct = Math.max(0, Math.min(1, pct));
                const px = Math.floor(pct * 255);
                const data = lineGradCtx.getImageData(px, 0, 1, 1).data;
                const hex = '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('');
                
                saveHistory();
                state.lineGradient.stops.push({ c: hex, p: pct });
                state.lineGradient.stops.sort((a,b) => a.p - b.p);
                if (lineGradPresets) lineGradPresets.value = 'custom';
                window.updateLineGradientEditorUI();
            });
        }
        if (window.updateLineGradientEditorUI) window.updateLineGradientEditorUI();
        
        document.getElementById('line-gradient-axis').addEventListener('change', (e) => {
            saveHistory();
            state.lineGradient.axis = e.target.value;
            updateGeometry();
            if(state.svgPreview) disableSVGPreview();
        });


        document.getElementById('btn-reset-transform').addEventListener('click', (e) => { e.stopPropagation(); saveHistory(); state.objRot = { x: 0, y: 0, z: 0 }; document.getElementById('obj-rot-x').value = 0; document.getElementById('obj-rot-y').value = 0; document.getElementById('obj-rot-z').value = 0; updateGeometry(); });
        document.getElementById('btn-reset-cam').addEventListener('click', (e) => { e.stopPropagation(); saveHistory(); state.cam = { x: 4, y: 3, z: 5, rotX: 0, rotY: 0, fov: 45, target: {x:0, y:0, z:0} }; document.getElementById('cam-x').value = 4; document.getElementById('cam-y').value = 3; document.getElementById('cam-z').value = 5; document.getElementById('cam-fov').value = 45; document.getElementById('val-cam-fov').value = 45; document.getElementById('cam-rot-x').value = 0; document.getElementById('cam-rot-y').value = 0; camera.position.set(4, 3, 5); controls.target.set(0,0,0); camera.fov = 45; camera.updateProjectionMatrix(); controls.update(); if(state.svgPreview) disableSVGPreview(); });

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

        if (!preserveState) {
            state.geoParams = [];
            if(state.activeGeoId) {
                const geo = state.geometries.find(g => g.id === state.activeGeoId);
                if(geo) geo.params = [];
            }
        }

        config.params.forEach((p, idx) => {
            if (!preserveState) {
                state.geoParams.push(p.def);
                if(state.activeGeoId) {
                    const geo = state.geometries.find(g => g.id === state.activeGeoId);
                    if(geo) geo.params.push(p.def);
                }
            }
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
        const torusContainer = document.getElementById('torus-type-container');
        const torusSelect = document.getElementById('torus-type');

        if (sphereTypes.includes(state.geoType)) {
            geoSelect.value = 'sphere';
            polyContainer.style.display = 'block';
            torusContainer.style.display = 'none';
            polySelect.value = state.geoType;
        } else if (torusTypes.includes(state.geoType)) {
            geoSelect.value = 'torus';
            torusContainer.style.display = 'block';
            polyContainer.style.display = 'none';
            torusSelect.value = state.geoType;
        } else {
            geoSelect.value = state.geoType;
            polyContainer.style.display = 'none';
            torusContainer.style.display = 'none';
        }
        
        document.getElementById('grid-show-u').checked = state.gridUV.u; document.getElementById('grid-show-v').checked = state.gridUV.v;
        if(document.getElementById('grid-show-d1')) document.getElementById('grid-show-d1').checked = state.gridUV.d1 || false;
        if(document.getElementById('grid-show-d2')) document.getElementById('grid-show-d2').checked = state.gridUV.d2 || false;

        const isCustom = state.geoType === 'custom'; const isMath = state.geoType === 'math'; const isParametric = state.geoType === 'parametric'; const isLandscape = state.geoType === 'landscape';
        document.getElementById('obj-upload-container').style.display = isCustom ? 'block' : 'none';
        document.getElementById('math-settings-container').style.display = isMath ? 'block' : 'none';
        document.getElementById('parametric-settings-container').style.display = isParametric ? 'block' : 'none';
        document.getElementById('landscape-settings-container').style.display = isLandscape ? 'block' : 'none';

        const list = document.getElementById('deformation-list');
        if (state.deformationOrder && list) { state.deformationOrder.forEach(type => { const el = list.querySelector(`.control-group[data-type="${type}"]`); if (el) list.appendChild(el); }); }
        const btnReorder = document.getElementById('btn-reorder-deform'); if (btnReorder) { btnReorder.classList.toggle('active', state.reorderMode); }

        rebuildUIParams(true);
        if (typeof renderGeoList === 'function') renderGeoList();

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
        setCheck('use-pinch', state.pinch.enabled); setDisplay('pinch-controls', state.pinch.enabled); setVal('pinch-axis', state.pinch.axis); setVal('pinch-str', state.pinch.str); setVal('val-pinch-str', state.pinch.str);
        setCheck('use-stretch', state.stretch.enabled); setDisplay('stretch-controls', state.stretch.enabled); setVal('stretch-axis', state.stretch.axis); setVal('stretch-amt', state.stretch.amt); setVal('val-stretch-amt', state.stretch.amt);
        setCheck('use-swirl', state.swirl.enabled); setDisplay('swirl-controls', state.swirl.enabled); setVal('swirl-axis', state.swirl.axis); setVal('swirl-str', state.swirl.str); setVal('val-swirl-str', state.swirl.str);
        setCheck('use-quantize', state.quantize.enabled); setDisplay('quantize-controls', state.quantize.enabled); setVal('quantize-axis', state.quantize.axis); setVal('quantize-steps', state.quantize.steps); setVal('val-quantize-steps', state.quantize.steps);
        setCheck('use-zigzag', state.zigzag.enabled); setDisplay('zigzag-controls', state.zigzag.enabled); setVal('zigzag-axis', state.zigzag.axis); setVal('zigzag-amp', state.zigzag.amp); setVal('val-zigzag-amp', state.zigzag.amp); setVal('zigzag-freq', state.zigzag.freq); setVal('val-zigzag-freq', state.zigzag.freq);
        setCheck('use-smooth', state.smooth.enabled); setDisplay('smooth-controls', state.smooth.enabled); setVal('smooth-str', state.smooth.str); setVal('val-smooth-str', state.smooth.str); setVal('smooth-iters', state.smooth.iters); setVal('val-smooth-iters', state.smooth.iters);

        setVal('cam-x', state.cam.x); setVal('cam-y', state.cam.y); setVal('cam-z', state.cam.z); setVal('cam-fov', state.cam.fov); setVal('val-cam-fov', state.cam.fov);
        if(state.cam.target) {
            setVal('cam-target-x', state.cam.target.x); setVal('cam-target-y', state.cam.target.y); setVal('cam-target-z', state.cam.target.z);
        }

        setVal('visual-style', state.style);
        const showHl = ['hidden-line', 'triangles', 'wireframe'].includes(state.style); setDisplay('hidden-line-settings', showHl);
        const isHalftone = state.style === 'halftone'; setDisplay('halftone-settings', isHalftone);
        if (sceneGridHelper) sceneGridHelper.visible = !isHalftone;
        const isCheckerboard = state.style === 'checkerboard'; setDisplay('checkerboard-settings', isCheckerboard);

        setVal('ht-grid', state.halftone.grid); setVal('val-ht-grid', state.halftone.grid);
        setVal('ht-size', state.halftone.size); setVal('val-ht-size', state.halftone.size);
        setVal('ht-angle', state.halftone.angle); setVal('val-ht-angle', state.halftone.angle);
        setVal('ht-light-rot-x', state.matcapRotation.x); setVal('val-ht-light-rot-x', state.matcapRotation.x);
        setVal('ht-light-rot-y', state.matcapRotation.y); setVal('val-ht-light-rot-y', state.matcapRotation.y);
        setCheck('ht-invert', state.halftone.invert);

        setVal('cb-col1', state.checkerboard.col1); setVal('cb-col2', state.checkerboard.col2);
        setCheck('cb-invert', state.checkerboard.invert);
        setCheck('cb-delete-hidden', state.checkerboard.deleteHidden);

        let isSpline = ['math', 'sphere', 'cylinder', 'cone', 'torus', 'knot', 'ring', 'parametric'].includes(state.geoType);
        if (state.geoType === 'grid' && state.geoParams[4]) isSpline = true;
        if (state.geoType === 'cube' && state.geoParams[6]) isSpline = true;
        if (state.geoType === 'landscape') isSpline = true;

        const isHiddenLine = state.style === 'hidden-line'; 
        const isTriangles = state.style === 'triangles';
        const isWireframe = state.style === 'wireframe';

        setDisplay('grid-uv-controls', isSpline && state.geoType !== 'cone' && state.geoType !== 'cylinder');
        setDisplay('ctrl-hl-epsilon', (isHiddenLine || isTriangles));
        setDisplay('ctrl-hl-spline-res', (isHiddenLine || isWireframe) && isSpline);
        
        setDisplay('ctrl-solid-subdiv', (isHiddenLine || isTriangles) && isSpline);
        setVal('solid-subdiv', state.solidSubdiv); setVal('val-solid-subdiv', state.solidSubdiv);


        setDisplay('ctrl-gpu-grid', (isHiddenLine || isTriangles || isWireframe));
        
        setDisplay('ctrl-hl-silhouette', isHiddenLine || isTriangles);
        setDisplay('ctrl-hl-silhouette-width', (isHiddenLine || isTriangles) && state.hiddenSettings.silhouette);
        setDisplay('ctrl-hl-invert', isHiddenLine || isTriangles);
        setDisplay('ctrl-hl-advanced', isHiddenLine || isTriangles);

        setVal('hl-epsilon', state.hiddenSettings.epsilon); setVal('val-hl-epsilon', state.hiddenSettings.epsilon); setVal('hl-spline-res', state.hiddenSettings.splineRes); setVal('val-hl-spline-res', state.hiddenSettings.splineRes);
        setVal('gpu-grid', state.gpuGridSize); setVal('hl-bias', state.hiddenSettings.bias); setVal('val-hl-bias', state.hiddenSettings.bias);

        setVal('hl-inflate', state.hiddenSettings.inflate); setVal('val-hl-inflate', state.hiddenSettings.inflate);
        setVal('hl-min-len', state.hiddenSettings.minLen); setVal('val-hl-min-len', state.hiddenSettings.minLen);
        setCheck('hl-silhouette', state.hiddenSettings.silhouette);
        setVal('hl-silhouette-width', state.hiddenSettings.silhouetteWidth); setVal('val-hl-silhouette-width', state.hiddenSettings.silhouetteWidth);
        setCheck('hl-invert', state.hiddenSettings.invert);

        setCheck('use-z-color', state.zDepth.color); setDisplay('z-color-controls', state.zDepth.color);
        setCheck('use-line-gradient', state.lineGradient.enabled); setDisplay('line-gradient-controls', state.lineGradient.enabled);
        setCheck('use-z-opacity', state.zDepth.opacity); setDisplay('z-opacity-controls', state.zDepth.opacity);
        setCheck('use-z-dof', state.zDepth.dof); setDisplay('z-dof-controls', state.zDepth.dof);
        setCheck('use-z-size', state.zDepth.size); setDisplay('z-size-controls', state.zDepth.size);
        
        setVal('z-size-near', state.zSize.near); setVal('val-z-size-near', state.zSize.near);
        setVal('z-size-far', state.zSize.far); setVal('val-z-size-far', state.zSize.far);
        setVal('dof-focus', state.dof.focus); setVal('val-dof-focus', state.dof.focus); setVal('dof-intensity', state.dof.intensity); setVal('val-dof-intensity', state.dof.intensity); setVal('dof-aperture', state.dof.aperture); setVal('val-dof-aperture', state.dof.aperture);
        if (typeof curveEditor !== 'undefined') { curveEditor.localOp = undefined; curveEditor.localSize = undefined; }
        setCheck('dof-ignore-near', state.dof.ignoreNear); 
        if (window.updateGradientEditorUI) window.updateGradientEditorUI();
        const opStop1 = document.getElementById('op-stop-1'), opStop2 = document.getElementById('op-stop-2'), opBar = document.getElementById('op-grad-bar');
        const opGradStartVal = state.opGradStart !== undefined ? state.opGradStart : 0.0;
        const opGradEndVal = state.opGradEnd !== undefined ? state.opGradEnd : 1.0;
        if (opStop1 && opStop2 && opBar) { const p1 = opGradStartVal * 100, p2 = opGradEndVal * 100; opStop1.style.left = `${p1}%`; opStop2.style.left = `${p2}%`; opBar.style.background = `linear-gradient(90deg, #000 0%, #000 ${p1}%, #fff ${p2}%, #fff 100%)`; }
        setVal('style-dot-size', state.dotSize); setVal('val-style-dot-size', state.dotSize);
        setCheck('use-clip', state.clip.enabled); setDisplay('clip-controls', state.clip.enabled); setVal('clip-axis', state.clip.axis); setVal('clip-pos', state.clip.pos); setVal('val-clip-pos', state.clip.pos);
        setVal('math-formula', state.mathFormula); setVal('math-var-a', state.mathVars.a); setVal('math-var-b', state.mathVars.b); setVal('math-var-c', state.mathVars.c);
        setVal('param-x', state.parametricFormulas.x); setVal('param-y', state.parametricFormulas.y); setVal('param-z', state.parametricFormulas.z);
        const useFade = state.landscape.useFade !== undefined ? state.landscape.useFade : (state.landscape.noiseType === 'island-simplex');
        const landscapeNoiseType = state.landscape.noiseType === 'island-simplex' ? 'simplex' : state.landscape.noiseType;
        setVal('landscape-seed', state.landscape.seed); setVal('val-landscape-seed', state.landscape.seed); setVal('landscape-noise-type', landscapeNoiseType); setVal('landscape-amp', state.landscape.amplitude); setVal('val-landscape-amp', state.landscape.amplitude); setVal('landscape-freq', state.landscape.frequency); setVal('val-landscape-freq', state.landscape.frequency); setVal('landscape-octaves', state.landscape.octaves); setVal('val-landscape-octaves', state.landscape.octaves); setVal('landscape-persistence', state.landscape.persistence); setVal('val-landscape-persistence', state.landscape.persistence); setVal('landscape-lacunarity', state.landscape.lacunarity); setVal('val-landscape-lacunarity', state.landscape.lacunarity); setVal('landscape-sea-level', state.landscape.seaLevel); setVal('val-landscape-sea-level', state.landscape.seaLevel); setVal('landscape-noise-scale', state.landscape.noiseScale); setVal('val-landscape-noise-scale', state.landscape.noiseScale); setCheck('landscape-use-fade', useFade); setDisplay('landscape-fade-radius-container', useFade); setVal('landscape-fade-radius', state.landscape.fadeRadius !== undefined ? state.landscape.fadeRadius : 0.5); setVal('val-landscape-fade-radius', state.landscape.fadeRadius !== undefined ? state.landscape.fadeRadius : 0.5);
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
            case 'voronoi': noiseGenerator = new VoronoiNoise(rng); break;
            case 'value': noiseGenerator = new ValueNoise(rng); break;
            case 'turbulence': noiseGenerator = new TurbulenceNoise(SimplexNoise, rng); break;
            case 'ridged': noiseGenerator = new RidgedMultifractalNoise(SimplexNoise, rng); break;
            case 'island-simplex':
            case 'simplex': default: noiseGenerator = new SimplexNoise(rng); break;
        }
        const amplitude = landscapeState.amplitude, octaves = landscapeState.octaves, persistence = landscapeState.persistence, lacunarity = landscapeState.lacunarity, seaLevel = landscapeState.seaLevel, noiseScale = landscapeState.noiseScale;
        const offsetX = rng() * 10000, offsetZ = rng() * 10000;
        const useFade = landscapeState.useFade !== undefined ? landscapeState.useFade : (landscapeState.noiseType === 'island-simplex');
        const fadeRadius = landscapeState.fadeRadius !== undefined ? landscapeState.fadeRadius : 0.5;
        const maxDist = Math.min(width/2, height/2);
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), z = pos.getY(i);
            let y = 0, currentAmplitude = amplitude, currentFrequency = landscapeState.frequency;
            for (let j = 0; j < octaves; j++) {
                y += noiseGenerator.noise3D((x * currentFrequency * noiseScale) + offsetX, (z * currentFrequency * noiseScale) + offsetZ, 0) * currentAmplitude;
                currentAmplitude *= persistence; currentFrequency *= lacunarity;
            }
            if (useFade) {
                const dist = Math.sqrt(x*x + z*z);
                const fadeStart = maxDist * fadeRadius;
                if (dist > fadeStart) {
                    const fadeRange = Math.max(0.0001, maxDist - fadeStart);
                    const t = Math.max(0, Math.min(1, (dist - fadeStart) / fadeRange));
                    const smoothstep = t * t * (3 - 2 * t);
                    y = y * (1 - smoothstep);
                }
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
            case 'cube': 
                geo = new THREE.BoxGeometry(p[0], p[1], p[2], mult(p[3]), mult(p[4]), mult(p[5])); 
                geo.userData.wSegs = mult(p[3]); geo.userData.hSegs = mult(p[4]); geo.userData.dSegs = mult(p[5]);
                break;
            case 'sphere': 
                geo = new THREE.SphereGeometry(p[0], mult(p[1]), mult(p[2])); 
                geo.userData.wSegs = mult(p[1]); geo.userData.hSegs = mult(p[2]);
                break;
            case 'sphere-circles': {
                const circleSegs = Math.max(8, mult(p[1]));
                geo = new THREE.SphereGeometry(p[0], circleSegs, circleSegs);
                geo.userData.wSegs = circleSegs; geo.userData.hSegs = circleSegs;
                break;
            }
            case 'sphere-geodesic':
                geo = new THREE.IcosahedronGeometry(p[0], addDetail(p[1] || 2));
                break;
            case 'sphere-hexagonal':
                geo = new THREE.DodecahedronGeometry(p[0], addDetail(p[1] || 1));
                break;
            case 'sphere-spiral':
            case 'sphere-lissajous':
            case 'sphere-loxodrome':
            case 'sphere-hopf':
            case 'sphere-diagonal':
            case 'sphere-voronoi':
                geo = new THREE.SphereGeometry(p[0], 32, 32);
                break;
            case 'landscape': 
                geo = generateLandscapeGeometry(detailMultiplier); 
                geo.userData.wSegs = Math.round(p[2] * detailMultiplier); geo.userData.hSegs = Math.round(p[3] * detailMultiplier);
                break;
            case 'torus': 
                geo = new THREE.TorusGeometry(p[0], p[1], mult(p[2]), mult(p[3])); 
                geo.userData.wSegs = mult(p[3]); geo.userData.hSegs = mult(p[2]);
                break;
            case 'torus-knot':
                geo = new THREE.TorusKnotGeometry(p[0], p[1], mult(p[2]), mult(p[3]), p[4], p[5]);
                geo.userData.wSegs = mult(p[2]); geo.userData.hSegs = mult(p[3]);
                break;
            case 'torus-mobius': {
                const uSegs = mult(p[3]), vSegs = mult(p[2]);
                geo = new THREE.PlaneGeometry(1, 1, uSegs, vSegs);
                geo.userData.wSegs = uSegs; geo.userData.hSegs = vSegs;
                const radius = p[0], width = p[1];
                const posA = geo.attributes.position;
                for(let i=0; i<posA.count; i++) {
                    const u = (posA.getX(i) + 0.5) * Math.PI * 2;
                    const v = (posA.getY(i) + 0.5) * 2 - 1; 
                    const x = (radius + (v * width / 2) * Math.cos(u / 2)) * Math.cos(u);
                    const y = (radius + (v * width / 2) * Math.cos(u / 2)) * Math.sin(u);
                    const z = (v * width / 2) * Math.sin(u / 2);
                    posA.setXYZ(i, x, y, z);
                }
                geo.computeVertexNormals();
                break;
            }
            case 'torus-twisted': {
                const radius = p[0], tube = p[1], vSegs = mult(p[2]), uSegs = mult(p[3]), twists = p[4];
                geo = new THREE.PlaneGeometry(1, 1, uSegs, vSegs);
                geo.userData.wSegs = uSegs; geo.userData.hSegs = vSegs;
                const posA = geo.attributes.position;
                for(let i=0; i<posA.count; i++) {
                    const u = (posA.getX(i) + 0.5) * Math.PI * 2;
                    const v = (posA.getY(i) + 0.5) * Math.PI * 2;
                    const twistV = v + u * twists;
                    const x = (radius + tube * Math.cos(twistV)) * Math.cos(u);
                    const y = (radius + tube * Math.cos(twistV)) * Math.sin(u);
                    const z = tube * Math.sin(twistV);
                    posA.setXYZ(i, x, y, z);
                }
                geo.computeVertexNormals();
                break;
            }
            case 'ring': 
                geo = new THREE.RingGeometry(p[0], p[1], mult(p[2]), mult(p[3])); 
                geo.userData.wSegs = mult(p[2]); geo.userData.hSegs = mult(p[3]);
                break;
            case 'ring-gear': {
                const inner = p[0], outer = p[1], teeth = p[2], depth = p[3], tSegs = mult(p[4]), pSegs = mult(p[5]);
                geo = new THREE.RingGeometry(inner, outer, tSegs, pSegs);
                geo.userData.wSegs = tSegs; geo.userData.hSegs = pSegs;
                const posA = geo.attributes.position;
                for (let i=0; i<posA.count; i++) {
                    const x = posA.getX(i), y = posA.getY(i);
                    const r = Math.hypot(x, y);
                    if (r > inner + 0.001) {
                        const theta = Math.atan2(y, x);
                        const weight = (r - inner) / (outer - inner);
                        const toothMod = (Math.sign(Math.sin(theta * teeth)) + 1) / 2 * depth * weight; 
                        const newR = r + toothMod;
                        posA.setXYZ(i, newR * Math.cos(theta), newR * Math.sin(theta), 0);
                    }
                }
                geo.computeVertexNormals();
                break;
            }
            case 'ring-wave': {
                const inner = p[0], outer = p[1], waves = p[2], amp = p[3], tSegs = mult(p[4]), pSegs = mult(p[5]);
                geo = new THREE.RingGeometry(inner, outer, tSegs, pSegs);
                geo.userData.wSegs = tSegs; geo.userData.hSegs = pSegs;
                const posA = geo.attributes.position;
                for (let i=0; i<posA.count; i++) {
                    const x = posA.getX(i), y = posA.getY(i);
                    const rBase = Math.hypot(x, y);
                    const theta = Math.atan2(y, x);
                    const newR = rBase + Math.sin(theta * waves) * amp;
                    posA.setXYZ(i, newR * Math.cos(theta), newR * Math.sin(theta), 0);
                }
                geo.computeVertexNormals();
                break;
            }
            case 'ring-spiral': {
                const inner = p[0], outer = p[1], turns = p[2], thetaSegs = mult(p[3]), phiSegs = mult(p[4]);
                geo = new THREE.PlaneGeometry(1, 1, thetaSegs, phiSegs);
                geo.userData.wSegs = thetaSegs; geo.userData.hSegs = phiSegs;
                const posA = geo.attributes.position;
                for(let i=0; i<posA.count; i++) {
                    const u = posA.getX(i) + 0.5; // 0 to 1
                    const v = posA.getY(i) + 0.5; // 0 to 1
                    const theta = u * turns * Math.PI * 2;
                    const rWidth = (outer - inner) / (turns * 1.5); // Ribbon width is narrower than total space
                    const rBase = inner + u * (outer - inner - rWidth);
                    const r = rBase + v * rWidth;
                    posA.setXYZ(i, r * Math.cos(theta), r * Math.sin(theta), 0);
                }
                geo.computeVertexNormals();
                break;
            }
            case 'grid': 
                geo = new THREE.PlaneGeometry(p[0], p[1], mult(p[2]), mult(p[3])); 
                geo.userData.wSegs = mult(p[2]); geo.userData.hSegs = mult(p[3]);
                break;
            case 'math': {
                const range = p[0], segs = mult(p[1]);
                const mathContext = `const sin = Math.sin; const cos = Math.cos; const tan = Math.tan; const asin = Math.asin; const acos = Math.acos; const atan = Math.atan; const atan2 = Math.atan2; const abs = Math.abs; const sqrt = Math.sqrt; const cbrt = Math.cbrt; const pow = Math.pow; const exp = Math.exp; const log = Math.log; const max = Math.max; const min = Math.min; const PI = Math.PI; const E = Math.E; const ceil = Math.ceil; const floor = Math.floor; const round = Math.round; const sign = Math.sign; const hypot = Math.hypot; const random = Math.random; const a = ${state.mathVars.a}; const b = ${state.mathVars.b}; const c = ${state.mathVars.c};`;
                const errEl = document.getElementById('math-error');
                let func; try {
                    if (!isValidFormula(state.mathFormula)) throw new Error('Invalid formula');
                    func = new Function('x', 'z', mathContext + 'return ' + state.mathFormula + ';\n//# sourceURL=MathFormula.js');
                    if(errEl) errEl.style.display = 'none';
                } catch(e) {
                    if(errEl) errEl.style.display = 'block';
                    return new THREE.PlaneGeometry(range*2, range*2, segs, segs);
                }
                geo = new THREE.PlaneGeometry(range * 2, range * 2, segs, segs);
                geo.userData.wSegs = segs; geo.userData.hSegs = segs;
                const pos = geo.attributes.position; for(let i=0; i<pos.count; i++){ const x = pos.getX(i), z = pos.getY(i); let y = 0; try { y = func(x, z); } catch(e) { y = 0; } pos.setXYZ(i, x, y, z); }
                geo.computeVertexNormals();
                break;
            }
            case 'parametric': {
                const uMin = p[0], uMax = p[1], vMin = p[2], vMax = p[3], pSegs = mult(p[4]);
                const pMathContext = `const sin = Math.sin; const cos = Math.cos; const tan = Math.tan; const asin = Math.asin; const acos = Math.acos; const atan = Math.atan; const atan2 = Math.atan2; const abs = Math.abs; const sqrt = Math.sqrt; const cbrt = Math.cbrt; const pow = Math.pow; const exp = Math.exp; const log = Math.log; const max = Math.max; const min = Math.min; const PI = Math.PI; const E = Math.E; const ceil = Math.ceil; const floor = Math.floor; const round = Math.round; const sign = Math.sign; const hypot = Math.hypot; const random = Math.random;`;
                const errEl = document.getElementById('param-error');
                let funcX, funcY, funcZ; try {
                    if (!isValidFormula(state.parametricFormulas.x) || !isValidFormula(state.parametricFormulas.y) || !isValidFormula(state.parametricFormulas.z)) throw new Error('Invalid formula');
                    funcX = new Function('u', 'v', pMathContext + 'return ' + state.parametricFormulas.x + ';\n//# sourceURL=ParametricX.js');
                    funcY = new Function('u', 'v', pMathContext + 'return ' + state.parametricFormulas.y + ';\n//# sourceURL=ParametricY.js');
                    funcZ = new Function('u', 'v', pMathContext + 'return ' + state.parametricFormulas.z + ';\n//# sourceURL=ParametricZ.js');
                    if(errEl) errEl.style.display = 'none';
                } catch(e) {
                    if(errEl) errEl.style.display = 'block';
                    return new THREE.PlaneGeometry(5, 5, pSegs, pSegs);
                }
                geo = new THREE.PlaneGeometry(1, 1, pSegs, pSegs);
                geo.userData.wSegs = pSegs; geo.userData.hSegs = pSegs;
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
            case 'torus-knot': wSegs = params[2]; hSegs = params[3]; closedU = true; closedV = true; break;
            case 'torus-mobius': wSegs = params[3]; hSegs = params[2]; closedU = true; closedV = false; break;
            case 'torus-twisted': wSegs = params[3]; hSegs = params[2]; closedU = true; closedV = true; break;
            case 'knot': wSegs = params[3]; hSegs = params[2]; closedU = true; closedV = true; break;
            case 'ring': wSegs = params[2]; hSegs = params[3]; closedU = true; break;
            case 'ring-gear': wSegs = params[4]; hSegs = params[5]; closedU = true; break;
            case 'ring-wave': wSegs = params[4]; hSegs = params[5]; closedU = true; break;
            case 'ring-spiral': wSegs = params[3]; hSegs = params[4]; closedU = false; break;
            default: if (params.length >= 2) { wSegs = params[params.length-2]; hSegs = params[params.length-1]; } else { wSegs = 10; hSegs = 10; } break;
        }
        const pos = geometry.attributes.position, vertArray = [], rawSplineGroups = [];
        const lineValueArray = [];
        const pushSegments = (pts, lineVal = -1.0) => { for(let i=0; i<pts.length-1; i++) { vertArray.push(pts[i].x, pts[i].y, pts[i].z); vertArray.push(pts[i+1].x, pts[i+1].y, pts[i+1].z); lineValueArray.push(lineVal, lineVal); } };

        if (type === 'cube') {
            const sx = params[3], sy = params[4], sz = params[5];
            const faces = [{ name: 'Right', u: sz, v: sy }, { name: 'Left',  u: sz, v: sy }, { name: 'Top',   u: sx, v: sz }, { name: 'Bottom',u: sx, v: sz }, { name: 'Front', u: sx, v: sy }, { name: 'Back',  u: sx, v: sy }];
            let offset = 0;
            faces.forEach((f, i) => {
                const uSegs = f.u, vSegs = f.v, groupSplines = [];
                if (state.gridUV.u) { for (let y = 0; y <= vSegs; y++) { const pts = []; for (let x = 0; x <= uSegs; x++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints(uSegs * subdivision); let lineVal = (state.lineGradient.axis === 'u' || state.lineGradient.axis === 'both') ? (vSegs > 0 ? y / vSegs : 0) : -1.0; pushSegments(sp, lineVal); groupSplines.push({ points: pts, closed: false, direction: 'u', lineValue: lineVal }); } }
                if (state.gridUV.v) { for (let x = 0; x <= uSegs; x++) { const pts = []; for (let y = 0; y <= vSegs; y++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints(vSegs * subdivision); let lineVal = (state.lineGradient.axis === 'v' || state.lineGradient.axis === 'both') ? (uSegs > 0 ? x / uSegs : 0) : -1.0; pushSegments(sp, lineVal); groupSplines.push({ points: pts, closed: false, direction: 'v', lineValue: lineVal }); } }
                if (state.gridUV.d1) {
                    for (let startX = 0; startX <= uSegs; startX++) { const pts = []; for (let x = startX, y = 0; x <= uSegs && y <= vSegs; x++, y++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(pts.length > 1) { const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints((pts.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: pts, closed: false, direction: 'd1', lineValue: -1.0 }); } }
                    for (let startY = 1; startY <= vSegs; startY++) { const pts = []; for (let x = 0, y = startY; x <= uSegs && y <= vSegs; x++, y++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(pts.length > 1) { const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints((pts.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: pts, closed: false, direction: 'd1', lineValue: -1.0 }); } }
                }
                if (state.gridUV.d2) {
                    for (let startX = 0; startX <= uSegs; startX++) { const pts = []; for (let x = startX, y = 0; x >= 0 && y <= vSegs; x--, y++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(pts.length > 1) { const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints((pts.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: pts, closed: false, direction: 'd2', lineValue: -1.0 }); } }
                    for (let startY = 1; startY <= vSegs; startY++) { const pts = []; for (let x = uSegs, y = startY; x >= 0 && y <= vSegs; x--, y++) { const idx = offset + y * (uSegs + 1) + x; pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(pts.length > 1) { const curve = new THREE.CatmullRomCurve3(pts); const sp = curve.getPoints((pts.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: pts, closed: false, direction: 'd2', lineValue: -1.0 }); } }
                }
                rawSplineGroups.push({ name: `Face_${i}_${f.name}`, splines: groupSplines }); offset += (uSegs + 1) * (vSegs + 1);
            });
        } else {
            const expected = (wSegs + 1) * (hSegs + 1);
            if (type !== 'landscape' && !state.spline.force && pos.count !== expected) { console.warn('Spline generation skipped: Vertex count mismatch.', type, pos.count, expected); return createQuadWireframe(geometry); }
            const groupSplines = [];
            if (state.gridUV.u) { for (let y = 0; y <= hSegs; y++) { const points = []; for (let x = 0; x <= wSegs; x++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } let isClosed = closedU; if (isClosed) { if (points.length > 1 && points[0].distanceTo(points[points.length-1]) < 0.0001) points.pop(); } if(points.length < 2) continue; const curve = new THREE.CatmullRomCurve3(points); curve.closed = isClosed; const splinePoints = curve.getPoints(wSegs * subdivision); let lineVal = (state.lineGradient.axis === 'u' || state.lineGradient.axis === 'both') ? (hSegs > 0 ? y / hSegs : 0) : -1.0; pushSegments(splinePoints, lineVal); groupSplines.push({ points: [...points], closed: isClosed, direction: 'u', lineValue: lineVal }); } }
            if (state.gridUV.v) { for (let x = 0; x <= wSegs; x++) { const points = []; for (let y = 0; y <= hSegs; y++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } let isClosed = closedV; if (isClosed) { if (points.length > 1 && points[0].distanceTo(points[points.length-1]) < 0.0001) points.pop(); } if(points.length < 2) continue; const curve = new THREE.CatmullRomCurve3(points); curve.closed = isClosed; const splinePoints = curve.getPoints(hSegs * subdivision); let lineVal = (state.lineGradient.axis === 'v' || state.lineGradient.axis === 'both') ? (wSegs > 0 ? x / wSegs : 0) : -1.0; pushSegments(splinePoints, lineVal); groupSplines.push({ points: [...points], closed: isClosed, direction: 'v', lineValue: lineVal }); } }
            if (state.gridUV.d1) {
                for (let startX = 0; startX <= wSegs; startX++) { const points = []; for (let x = startX, y = 0; x <= wSegs && y <= hSegs; x++, y++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(points.length > 1) { const curve = new THREE.CatmullRomCurve3(points); const sp = curve.getPoints((points.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: [...points], closed: false, direction: 'd1', lineValue: -1.0 }); } }
                for (let startY = 1; startY <= hSegs; startY++) { const points = []; for (let x = 0, y = startY; x <= wSegs && y <= hSegs; x++, y++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(points.length > 1) { const curve = new THREE.CatmullRomCurve3(points); const sp = curve.getPoints((points.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: [...points], closed: false, direction: 'd1', lineValue: -1.0 }); } }
            }
            if (state.gridUV.d2) {
                for (let startX = 0; startX <= wSegs; startX++) { const points = []; for (let x = startX, y = 0; x >= 0 && y <= hSegs; x--, y++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(points.length > 1) { const curve = new THREE.CatmullRomCurve3(points); const sp = curve.getPoints((points.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: [...points], closed: false, direction: 'd2', lineValue: -1.0 }); } }
                for (let startY = 1; startY <= hSegs; startY++) { const points = []; for (let x = wSegs, y = startY; x >= 0 && y <= hSegs; x--, y++) { let idx = y * (wSegs + 1) + x; if (idx >= pos.count) idx = idx % pos.count; points.push(new THREE.Vector3().fromBufferAttribute(pos, idx)); } if(points.length > 1) { const curve = new THREE.CatmullRomCurve3(points); const sp = curve.getPoints((points.length - 1) * subdivision); pushSegments(sp, -1.0); groupSplines.push({ points: [...points], closed: false, direction: 'd2', lineValue: -1.0 }); } }
            }
            rawSplineGroups.push({ name: 'Main', splines: groupSplines });
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertArray, 3)); geo.setAttribute('lineValue', new THREE.Float32BufferAttribute(lineValueArray, 1)); geo.userData.splineGroups = rawSplineGroups; return geo;
    }

    function createLissajousSphereWireframe(params, subdivision = 12) {
        const radius = params[0] || 1.5;
        const samples = Math.max(10, Math.round(params[1] || 1000));
        const freqU = params[2] || 7;
        const freqV = params[3] || 5;
        const phase = params[4] || 0;
        
        const rawPoints = [];
        for (let i = 0; i <= samples; i++) {
            const t = (i / samples) * Math.PI * 2;
            const u = freqU * t + phase;
            const v = freqV * t;
            const x = radius * Math.cos(u) * Math.cos(v);
            const z = radius * Math.sin(u) * Math.cos(v);
            const y = radius * Math.sin(v);
            rawPoints.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(rawPoints);
        const splinePoints = curve.getPoints(samples * Math.min(subdivision, 4));
        
        const linePositions = [];
        const lineValues = [];
        for (let i = 0; i < splinePoints.length - 1; i++) {
            linePositions.push(
                splinePoints[i].x, splinePoints[i].y, splinePoints[i].z,
                splinePoints[i+1].x, splinePoints[i+1].y, splinePoints[i+1].z
            );
            const val = i / (splinePoints.length - 1);
            lineValues.push(val, val);
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        geo.setAttribute('lineValue', new THREE.Float32BufferAttribute(lineValues, 1));
        geo.userData.splineGroups = [{ name: 'Lissajous', splines: [{ points: rawPoints, closed: true, direction: 'u', lineValue: 0.5 }] }];
        return geo;
    }

    function createVoronoiSphereWireframe(params) {
        const radius = params[0] || 1.5;
        const detail = Math.max(1, Math.round(params[1] || 3));
        const randomness = params[2] || 0.6;
        
        let baseGeo = new THREE.IcosahedronGeometry(radius, detail);
        baseGeo = THREE.BufferGeometryUtils.mergeVertices(baseGeo);
        
        const pos = baseGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(pos, i);
            const hash = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) * 43758.5453;
            const hash2 = Math.cos(v.x * 34.9898 + v.y * 12.233 + v.z * 56.719) * 43758.5453;
            const rand1 = hash - Math.floor(hash);
            const rand2 = hash2 - Math.floor(hash2);
            
            const normal = v.clone().normalize();
            const tangent = new THREE.Vector3(-normal.z, 0, normal.x).normalize();
            if(tangent.length() < 0.1) tangent.set(0, normal.z, -normal.y).normalize();
            const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
            
            const displacement = (radius / (detail + 1)) * randomness;
            v.add(tangent.multiplyScalar((rand1 - 0.5) * displacement));
            v.add(bitangent.multiplyScalar((rand2 - 0.5) * displacement));
            
            v.normalize().multiplyScalar(radius);
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        return new THREE.WireframeGeometry(baseGeo);
    }

    function createHopfSphereWireframe(params, subdivision = 12) {
        const radius = params[0] || 1.5;
        const rings = Math.max(1, Math.round(params[1] || 12));
        const tilt = params[2] || 0.5;
        
        const rawSplineGroups = [];
        const linePositions = [];
        const lineValues = [];
        const segments = 128;
        
        for (let r = 0; r < rings; r++) {
            const angle = (r / rings) * Math.PI;
            const pts = [];
            for (let i = 0; i <= segments; i++) {
                const t = (i / segments) * Math.PI * 2;
                let x = radius * Math.cos(t);
                let y = radius * Math.sin(t);
                let z = 0;
                
                const tiltedY = y * Math.cos(tilt) - z * Math.sin(tilt);
                const tiltedZ = y * Math.sin(tilt) + z * Math.cos(tilt);
                y = tiltedY;
                z = tiltedZ;
                
                const rotX = x * Math.cos(angle) - z * Math.sin(angle);
                const rotZ = x * Math.sin(angle) + z * Math.cos(angle);
                
                pts.push(new THREE.Vector3(rotX, y, rotZ));
            }
            for (let i = 0; i < pts.length - 1; i++) {
                linePositions.push(pts[i].x, pts[i].y, pts[i].z, pts[i+1].x, pts[i+1].y, pts[i+1].z);
                const val = i / (pts.length - 1);
                lineValues.push(val, val);
            }
            rawSplineGroups.push({ name: `Ring_${r}`, splines: [{ points: pts, closed: true, direction: 'u', lineValue: r / rings }] });
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        geo.setAttribute('lineValue', new THREE.Float32BufferAttribute(lineValues, 1));
        geo.userData.splineGroups = rawSplineGroups;
        return geo;
    }

    function createDiagonalSphereWireframe(params) {
        const radius = params[0] || 1.5;
        const wSegs = Math.max(3, Math.round(params[1] || 24));
        const hSegs = Math.max(2, Math.round(params[2] || 16));
        
        const linePositions = [];
        
        for (let i = 0; i < wSegs; i++) {
            for (let j = 0; j < hSegs; j++) {
                const u0 = (i / wSegs) * Math.PI * 2;
                const u1 = ((i + 1) / wSegs) * Math.PI * 2;
                const v0 = (j / hSegs) * Math.PI;
                const v1 = ((j + 1) / hSegs) * Math.PI;
                
                const p00 = new THREE.Vector3(radius * Math.cos(u0) * Math.sin(v0), radius * Math.cos(v0), radius * Math.sin(u0) * Math.sin(v0));
                const p11 = new THREE.Vector3(radius * Math.cos(u1) * Math.sin(v1), radius * Math.cos(v1), radius * Math.sin(u1) * Math.sin(v1));
                const p01 = new THREE.Vector3(radius * Math.cos(u0) * Math.sin(v1), radius * Math.cos(v1), radius * Math.sin(u0) * Math.sin(v1));
                const p10 = new THREE.Vector3(radius * Math.cos(u1) * Math.sin(v0), radius * Math.cos(v0), radius * Math.sin(u1) * Math.sin(v0));
                
                linePositions.push(p00.x, p00.y, p00.z, p11.x, p11.y, p11.z);
                linePositions.push(p01.x, p01.y, p01.z, p10.x, p10.y, p10.z);
            }
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        return geo;
    }

    function createLoxodromeSphereWireframe(params, subdivision = 12) {
        const radius = params[0] || 1.5;
        const samples = Math.max(10, Math.round(params[1] || 600));
        const slope = params[2] || 0.1;
        
        const rawPoints = [];
        for (let i = 0; i < samples; i++) {
            const t = (i / (samples - 1));
            const v = -Math.PI / 2 + t * Math.PI;
            const safeV = Math.max(-Math.PI/2 + 0.001, Math.min(Math.PI/2 - 0.001, v));
            const u = (1 / slope) * Math.log(Math.tan(Math.PI / 4 + safeV / 2));
            
            const x = radius * Math.cos(u) * Math.cos(safeV);
            const z = radius * Math.sin(u) * Math.cos(safeV);
            const y = radius * Math.sin(safeV);
            rawPoints.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(rawPoints);
        const splinePoints = curve.getPoints(samples * Math.min(subdivision, 4));
        
        const linePositions = [];
        const lineValues = [];
        for (let i = 0; i < splinePoints.length - 1; i++) {
            linePositions.push(
                splinePoints[i].x, splinePoints[i].y, splinePoints[i].z,
                splinePoints[i+1].x, splinePoints[i+1].y, splinePoints[i+1].z
            );
            const val = i / (splinePoints.length - 1);
            lineValues.push(val, val);
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        geo.setAttribute('lineValue', new THREE.Float32BufferAttribute(lineValues, 1));
        geo.userData.splineGroups = [{ name: 'Loxodrome', splines: [{ points: rawPoints, closed: false, direction: 'u', lineValue: 0.5 }] }];
        return geo;
    }

    function createFibonacciSpiralWireframe(params, subdivision = 12) {
        const radius = params[0] || 1.5;
        const samples = Math.max(10, Math.round(params[1] || 400));
        const turns = params[2] || 10;
        
        const rawPoints = [];
        for (let i = 0; i < samples; i++) {
            const y = 1 - (i / (samples - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const theta = turns * Math.PI * 2 * (i / (samples - 1));
            rawPoints.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
        }
        
        const curve = new THREE.CatmullRomCurve3(rawPoints);
        const splinePoints = curve.getPoints(samples * subdivision);
        
        const linePositions = [];
        const lineValues = [];
        for (let i = 0; i < splinePoints.length - 1; i++) {
            linePositions.push(
                splinePoints[i].x, splinePoints[i].y, splinePoints[i].z,
                splinePoints[i+1].x, splinePoints[i+1].y, splinePoints[i+1].z
            );
            const val1 = i / (splinePoints.length - 1);
            const val2 = (i + 1) / (splinePoints.length - 1);
            lineValues.push(val1, val1);
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        geo.setAttribute('lineValue', new THREE.Float32BufferAttribute(lineValues, 1));
        geo.userData.splineGroups = [{ name: 'Spiral', splines: [{ points: rawPoints, closed: false, direction: 'u', lineValue: 0.5 }] }];
        return geo;
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

    
    
    function updateGeometry(fromGizmo = false) {
        if (mainMeshGroup) { scene.remove(mainMeshGroup); if (mainMeshGroup.userData.dispose) mainMeshGroup.userData.dispose(); }

        syncStateToActiveGeometry();

        const applyDeformations = (geometry, options = {}) => {
            const { skipNormals = false } = options;
            const rng = mulberry32(state.noise.seed);
            let noiseGenerator;
            switch (state.noise.noiseType) {
                case 'perlin': noiseGenerator = new PerlinNoise(rng); break;
                case 'worley': noiseGenerator = new WorleyNoise(rng); break;
                case 'voronoi': noiseGenerator = new VoronoiNoise(rng); break;
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
                noise: (v, p) => { if (p.axis === 'all') { v.x += simplex.noise3D(v.x * p.freq, v.y * p.freq, v.z * p.freq) * p.amp; v.y += simplex.noise3D(v.x * p.freq + 100, v.y * p.freq + 100, v.z * p.freq + 100) * p.amp; v.z += simplex.noise3D(v.x * p.freq + 200, v.y * p.freq + 200, v.z * p.freq + 200) * p.amp; } else { const n = simplex.noise3D(v.x * p.freq, v.y * p.freq, v.z * p.freq) * p.amp; if (p.axis === 'center') { vDir.copy(v).normalize(); v.addScaledVector(vDir, n); } else { const idx = axMap[p.axis]; v.setComponent(idx, v.getComponent(idx) + n); } } },
                bulge: (v, p) => { const dist = v.length(), factor = 1 + (Math.sin(dist * 3.0) * p.str * 0.5); if (p.axis === 'all') v.multiplyScalar(factor); else { const idx = axMap[p.axis]; v.setComponent(idx, v.getComponent(idx) * factor); } },
                bend: (v, p) => { const axisIdx = axMap[p.axis], mainVal = v.getComponent(axisIdx), targetIdx = (axisIdx + 1) % 3, current = v.getComponent(targetIdx); v.setComponent(targetIdx, current + (mainVal * mainVal) * p.amt); },
                taper: (v, p) => { const axisIdx = axMap[p.axis], mainVal = v.getComponent(axisIdx), scale = Math.max(0, 1 + (mainVal * p.amt)), uIdx = (axisIdx + 1) % 3, wIdx = (axisIdx + 2) % 3; v.setComponent(uIdx, v.getComponent(uIdx) * scale); v.setComponent(wIdx, v.getComponent(wIdx) * scale); },
                ripple: (v, p) => { const axisIdx = axMap[p.axis], u = v.getComponent((axisIdx + 1) % 3), w = v.getComponent((axisIdx + 2) % 3), d = Math.sqrt(u*u + w*w), val = v.getComponent(axisIdx); v.setComponent(axisIdx, val + Math.sin(d * p.freq) * p.amp); },
                spherify: (v, p) => { const str = p.str; if (str > 0.001) { const len = v.length(); if (len > 0.0001) { const target = v.clone().normalize().multiplyScalar(1.5); v.lerp(target, str); } } },
                skew: (v, p) => { const amt = p.amt, axis = p.axis; if (axis === 'x') { v.y += v.x * amt; v.z += v.x * amt; } else if (axis === 'y') { v.x += v.y * amt; v.z += v.y * amt; } else { v.x += v.z * amt; v.y += v.z * amt; } },
                pinch: (v, p) => { const dist = v.length(), factor = Math.max(0.1, 1 - (Math.exp(-dist * dist * 0.1) * p.str)); if (p.axis === 'all') v.multiplyScalar(factor); else { const idx = axMap[p.axis]; v.setComponent(idx, v.getComponent(idx) * factor); } },
                stretch: (v, p) => { const axisIdx = axMap[p.axis], amt = p.amt, scale = 1 + amt, invScale = 1 / Math.max(0.01, Math.sqrt(scale)); v.setComponent(axisIdx, v.getComponent(axisIdx) * scale); const uIdx = (axisIdx+1)%3, wIdx = (axisIdx+2)%3; v.setComponent(uIdx, v.getComponent(uIdx) * invScale); v.setComponent(wIdx, v.getComponent(wIdx) * invScale); },
                swirl: (v, p) => { const axisIdx = axMap[p.axis], uIdx = (axisIdx+1)%3, wIdx = (axisIdx+2)%3, u = v.getComponent(uIdx), w = v.getComponent(wIdx), d = Math.sqrt(u*u + w*w), angle = d * p.str, c = Math.cos(angle), s = Math.sin(angle); v.setComponent(uIdx, u*c - w*s); v.setComponent(wIdx, u*s + w*c); },
                quantize: (v, p) => { const steps = Math.max(1, p.steps); if (p.axis === 'all') { v.x = Math.round(v.x * steps) / steps; v.y = Math.round(v.y * steps) / steps; v.z = Math.round(v.z * steps) / steps; } else { const idx = axMap[p.axis]; v.setComponent(idx, Math.round(v.getComponent(idx) * steps) / steps); } },
                zigzag: (v, p) => { const axisIdx = axMap[p.axis], val = v.getComponent(axisIdx), uIdx = (axisIdx+1)%3, wIdx = (axisIdx+2)%3; v.setComponent(uIdx, v.getComponent(uIdx) + Math.asin(Math.sin(val * p.freq)) * p.amp); v.setComponent(wIdx, v.getComponent(wIdx) + Math.asin(Math.sin(val * p.freq + Math.PI/2)) * p.amp); }
            };
            state.deformationOrder.forEach(type => { 
                if (state[type] && state[type].enabled) {
                    if (type === 'smooth') {
                        const amt = state[type].str;
                        let actualIters = Math.round(state[type].iters || 1);
                        if (options.isSolid && state.solidSubdiv > 1) {
                            actualIters = Math.round(actualIters * state.solidSubdiv * state.solidSubdiv);
                        }
                        const arr = pos.array;
                        const vCount = pos.count;
                        
                        if (geometry.index) {
                            const idx = geometry.index.array;
                            for (let k = 0; k < actualIters; k++) {
                                const sumArr = new Float32Array(arr.length);
                                const countArr = new Uint16Array(vCount);
                                for (let i = 0; i < idx.length; i+=3) {
                                    const a = idx[i], b = idx[i+1], c = idx[i+2];
                                    sumArr[a*3] += arr[b*3]+arr[c*3]; countArr[a]+=2; sumArr[a*3+1] += arr[b*3+1]+arr[c*3+1]; sumArr[a*3+2] += arr[b*3+2]+arr[c*3+2];
                                    sumArr[b*3] += arr[a*3]+arr[c*3]; countArr[b]+=2; sumArr[b*3+1] += arr[a*3+1]+arr[c*3+1]; sumArr[b*3+2] += arr[a*3+2]+arr[c*3+2];
                                    sumArr[c*3] += arr[a*3]+arr[b*3]; countArr[c]+=2; sumArr[c*3+1] += arr[a*3+1]+arr[b*3+1]; sumArr[c*3+2] += arr[a*3+2]+arr[b*3+2];
                                }
                                for (let i = 0; i < vCount; i++) {
                                    if (countArr[i] > 0) {
                                        arr[i*3] = arr[i*3]*(1-amt) + (sumArr[i*3]/countArr[i])*amt;
                                        arr[i*3+1] = arr[i*3+1]*(1-amt) + (sumArr[i*3+1]/countArr[i])*amt;
                                        arr[i*3+2] = arr[i*3+2]*(1-amt) + (sumArr[i*3+2]/countArr[i])*amt;
                                    }
                                }
                            }
                        } else {
                            for (let k = 0; k < actualIters; k++) {
                                const newArr = new Float32Array(arr.length);
                                for (let i = 0; i < vCount; i++) {
                                    const prev = Math.max(0, i - 1) * 3;
                                    const next = Math.min(vCount - 1, i + 1) * 3;
                                    const curr = i * 3;
                                    newArr[curr] = arr[curr]*(1-amt) + (arr[prev] + arr[next])*0.5*amt;
                                    newArr[curr+1] = arr[curr+1]*(1-amt) + (arr[prev+1] + arr[next+1])*0.5*amt;
                                    newArr[curr+2] = arr[curr+2]*(1-amt) + (arr[prev+2] + arr[next+2])*0.5*amt;
                                }
                                pos.array.set(newArr);
                            }
                        }
                    } else {
                        for (let i = 0; i < pos.count; i++) {
                            v.fromBufferAttribute(pos, i);
                            deformations[type](v, state[type]);
                            pos.setXYZ(i, v.x, v.y, v.z);
                        }
                    }
                }
            });
            if (!skipNormals) geometry.computeVertexNormals();
        };

        let mergedGeoWire = [];
        let mergedGeoSolid = [];
        let anySplineCount = false;

        const originalGeoType = state.geoType;
        const originalGeoParams = [...state.geoParams];
        const originalMathFormula = state.mathFormula;
        const originalMathVars = { ...state.mathVars };
        const originalParametricFormulas = { ...state.parametricFormulas };
        const originalLandscape = { ...state.landscape };

        state.geometries.forEach(geoDef => {
            state.geoType = geoDef.type;
            state.geoParams = geoDef.params;
            state.mathFormula = geoDef.mathFormula;
            state.mathVars = geoDef.mathVars;
            state.parametricFormulas = geoDef.parametricFormulas;
            state.landscape = geoDef.landscape;

            const geoWire = generateBaseGeometry(1);
            
            const matrix = new THREE.Matrix4();
            const euler = new THREE.Euler(geoDef.rot.x * Math.PI/180, geoDef.rot.y * Math.PI/180, geoDef.rot.z * Math.PI/180);
            const quaternion = new THREE.Quaternion().setFromEuler(euler);
            const scale = new THREE.Vector3(geoDef.scl.x, geoDef.scl.y, geoDef.scl.z);
            const position = new THREE.Vector3(geoDef.pos.x, geoDef.pos.y, geoDef.pos.z);
            matrix.compose(position, quaternion, scale);
            geoWire.applyMatrix4(matrix);

            const isHiddenLine = state.style === 'hidden-line' || state.style === 'triangles' || state.style === 'dots-solid' || state.style === 'halftone' || state.style === 'checkerboard';
            let isSpline = ['math', 'sphere', 'cylinder', 'cone', 'torus', 'knot', 'ring', 'parametric'].includes(state.geoType);
            if (state.geoType === 'grid' && state.geoParams[4]) isSpline = true;
            if (state.geoType === 'cube' && state.geoParams[6]) isSpline = true;
            if (state.geoType === 'landscape') isSpline = true;
            if (sphereTypes.includes(state.geoType) && state.geoType !== 'sphere') isSpline = false; 
            if (state.geoType === 'sphere') isSpline = true; 
            
            const supportsSplines = ['grid', 'cube', 'math', 'parametric', 'sphere', 'cylinder', 'cone', 'torus', 'torus-knot', 'torus-mobius', 'torus-twisted', 'ring', 'landscape'].includes(state.geoType);
            if (state.lineGradient.enabled && supportsSplines) isSpline = true;

            let geoSolid;
            let effectiveSolidSubdiv = state.solidSubdiv;
            if (isHiddenLine && isSpline) effectiveSolidSubdiv = Math.max(state.solidSubdiv, 4);
            if (isHiddenLine && isSpline && effectiveSolidSubdiv > 1) {
                geoSolid = generateBaseGeometry(effectiveSolidSubdiv);
                geoSolid.applyMatrix4(matrix);
            } else {
                geoSolid = geoWire.clone();
            }

            applyDeformations(geoWire);
            if (geoSolid !== geoWire && geoSolid.uuid !== geoWire.uuid) {
                applyDeformations(geoSolid, { isSolid: true });
            }

            let wireGeo;
            if (state.style === 'halftone') {
                wireGeo = new THREE.BufferGeometry();
            } else if (state.geoType === 'sphere-circles') {
                wireGeo = createOverlappingCirclesWireframe(state.geoParams);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
            } else if (state.geoType === 'sphere-spiral') {
                wireGeo = createFibonacciSpiralWireframe(state.geoParams, state.spline.subdiv);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
                anySplineCount = true;
            } else if (state.geoType === 'sphere-geodesic') {
                const baseGeo = new THREE.IcosahedronGeometry(state.geoParams[0] || 1.5, Math.round(state.geoParams[1] || 2));
                wireGeo = new THREE.WireframeGeometry(baseGeo);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
            } else if (state.geoType === 'sphere-hexagonal') {
                const baseGeo = new THREE.DodecahedronGeometry(state.geoParams[0] || 1.5, Math.round(state.geoParams[1] || 1));
                wireGeo = new THREE.EdgesGeometry(baseGeo, 10);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
            } else if (state.geoType === 'sphere-lissajous') {
                wireGeo = createLissajousSphereWireframe(state.geoParams, state.spline.subdiv);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
                anySplineCount = true;
            } else if (state.geoType === 'sphere-voronoi') {
                wireGeo = createVoronoiSphereWireframe(state.geoParams);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
            } else if (state.geoType === 'sphere-hopf') {
                wireGeo = createHopfSphereWireframe(state.geoParams, state.spline.subdiv);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
                anySplineCount = true;
            } else if (state.geoType === 'sphere-diagonal') {
                wireGeo = createDiagonalSphereWireframe(state.geoParams);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
            } else if (state.geoType === 'sphere-loxodrome') {
                wireGeo = createLoxodromeSphereWireframe(state.geoParams, state.spline.subdiv);
                wireGeo.applyMatrix4(matrix);
                applyDeformations(wireGeo, { skipNormals: true });
                anySplineCount = true;
            } else if (isSpline && (state.style !== 'dots' && state.style !== 'dots-solid' && state.style !== 'triangles' || state.lineGradient.enabled)) {
                wireGeo = createSplineWireframe(geoWire, state.geoParams, state.geoType, state.spline.subdiv);
                anySplineCount = true;
            } else if (state.style === 'dots' || state.style === 'dots-solid') {
                wireGeo = geoWire.clone();
            } else if (state.style === 'triangles') {
                wireGeo = new THREE.WireframeGeometry(geoWire);
            } else {
                wireGeo = createQuadWireframe(geoWire);
            }

            if (wireGeo && !wireGeo.attributes.lineValue && wireGeo.attributes.position) {
                const count = wireGeo.attributes.position.count;
                wireGeo.setAttribute('lineValue', new THREE.Float32BufferAttribute(new Float32Array(count).fill(-1.0), 1));
            }

            mergedGeoWire.push(wireGeo);
            mergedGeoSolid.push(geoSolid);
        });

        state.geoType = originalGeoType;
        state.geoParams = originalGeoParams;
        state.mathFormula = originalMathFormula;
        state.mathVars = originalMathVars;
        state.parametricFormulas = originalParametricFormulas;
        state.landscape = originalLandscape;

        let finalGeoWire = mergedGeoWire.length > 1 ? THREE.BufferGeometryUtils.mergeBufferGeometries(mergedGeoWire) : (mergedGeoWire.length === 1 ? mergedGeoWire[0] : new THREE.BufferGeometry());
        
        let combinedSplineGroups = [];
        mergedGeoWire.forEach(geo => {
            if (geo.userData && geo.userData.splineGroups) {
                combinedSplineGroups.push(...geo.userData.splineGroups);
            }
        });
        if (combinedSplineGroups.length > 0) {
            finalGeoWire.userData = finalGeoWire.userData || {};
            finalGeoWire.userData.splineGroups = combinedSplineGroups;
        }

        let finalGeoSolid = mergedGeoSolid.length > 1 ? THREE.BufferGeometryUtils.mergeBufferGeometries(mergedGeoSolid) : (mergedGeoSolid.length === 1 ? mergedGeoSolid[0] : new THREE.BufferGeometry());

        mainMeshGroup = new THREE.Group();
        mainMeshGroup.rotation.set(THREE.MathUtils.degToRad(state.objRot.x), THREE.MathUtils.degToRad(state.objRot.y), THREE.MathUtils.degToRad(state.objRot.z));

        let clipPlanes = [];
        if (state.clip.enabled) {
            const normal = new THREE.Vector3();
            let pos = state.clip.pos;
            if (state.clip.axis === 'x') normal.set(-1, 0, 0);
            else if (state.clip.axis === '-x') { normal.set(1, 0, 0); pos = -pos; }
            else if (state.clip.axis === 'y') normal.set(0, -1, 0);
            else if (state.clip.axis === '-y') { normal.set(0, 1, 0); pos = -pos; }
            else if (state.clip.axis === 'z') normal.set(0, 0, -1);
            else if (state.clip.axis === '-z') { normal.set(0, 0, 1); pos = -pos; }
            clipPlanes.push(new THREE.Plane(normal, pos));
        }

        const style = state.style; let meshWire; let meshSolid;
        if (style === 'hidden-line' || style === 'triangles' || style === 'dots-solid' || style === 'halftone' || style === 'checkerboard') {
            
            let solidGeoToUse = finalGeoSolid;
            if (Math.abs(state.hiddenSettings.inflate) > 0.0001) {
                solidGeoToUse = finalGeoSolid.clone();
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

            let matSolid;
            if (style === 'halftone') {
                matSolid = new THREE.MeshMatcapMaterial({ matcap: matcapTexture, side: THREE.DoubleSide, clippingPlanes: clipPlanes, clipShadows: true });
                matSolid.onBeforeCompile = (shader) => {
                    matSolid.userData.shader = shader;
                    shader.uniforms.matcapRotation = { get value() { return state.matcapRotation; } };
                    shader.fragmentShader = "uniform vec2 matcapRotation;\n" + shader.fragmentShader;
                    shader.fragmentShader = shader.fragmentShader.replace(
                        'vec4 matcapColor = texture2D( matcap, uv );',
                        `
                        vec2 rotatedUV = uv - 0.5;

                        // X rotation (actually vertical shift in UV space)
                        float sX = sin(matcapRotation.x);
                        float cX = cos(matcapRotation.x);

                        // Y rotation (horizontal spin)
                        float sY = sin(matcapRotation.y);
                        float cY = cos(matcapRotation.y);

                        // Apply 2D rotation for Y spin
                        vec2 spinUV;
                        spinUV.x = rotatedUV.x * cY - rotatedUV.y * sY;
                        spinUV.y = rotatedUV.x * sY + rotatedUV.y * cY;

                        // For X rotation, we treat it as a vertical offset or secondary rotation
                        // A more complete way is 3D normal rotation, but for Matcaps 2D rotation + offsets works well.
                        vec4 matcapColor = texture2D( matcap, spinUV + 0.5 + vec2(0.0, matcapRotation.x * 0.5) );
                        `
                    );
                };
            } else {
                matSolid = new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x000000, polygonOffset: true, polygonOffsetFactor: state.hiddenSettings.bias, polygonOffsetUnits: state.hiddenSettings.bias, flatShading: true, side: THREE.DoubleSide, clippingPlanes: clipPlanes, clipShadows: true });
            }
            meshSolid = new THREE.Mesh(solidGeoToUse, matSolid);
            mainMeshGroup.add(meshSolid);
        }

        if (style === 'halftone') {
            meshWire = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({visible: false}));
        } else if (style === 'dots' || style === 'dots-solid') {
            const m = matWireShader.clone(); m.clipping = true; m.clippingPlanes = clipPlanes;
            meshWire = new THREE.Points(finalGeoWire, m);
        } else {
            const m = matWireShader.clone(); m.clipping = true; m.clippingPlanes = clipPlanes;
            meshWire = new THREE.LineSegments(finalGeoWire, m);
        }
        
        mainMeshGroup.add(meshWire);
        mainMeshGroup.userData.solid = meshSolid; mainMeshGroup.userData.wire = meshWire; mainMeshGroup.userData.clipPlane = clipPlanes.length > 0 ? clipPlanes[0] : null;
        mainMeshGroup.userData.dispose = () => { finalGeoWire.dispose(); if(finalGeoSolid && finalGeoSolid !== finalGeoWire) finalGeoSolid.dispose(); if(meshSolid) meshSolid.material.dispose(); if(meshWire.geometry) meshWire.geometry.dispose(); if(meshWire.material) meshWire.material.dispose(); };
        scene.add(mainMeshGroup);

        if (!fromGizmo && typeof transformProxy !== 'undefined' && transformParent) {
            transformParent.rotation.set(THREE.MathUtils.degToRad(state.objRot.x), THREE.MathUtils.degToRad(state.objRot.y), THREE.MathUtils.degToRad(state.objRot.z));
            transformProxy.position.set(state.geoPos.x, state.geoPos.y, state.geoPos.z);
            transformProxy.rotation.set(THREE.MathUtils.degToRad(state.geoRot.x), THREE.MathUtils.degToRad(state.geoRot.y), THREE.MathUtils.degToRad(state.geoRot.z));
            transformProxy.scale.set(state.geoScl.x, state.geoScl.y, state.geoScl.z);
        }

        document.getElementById('poly-count').textContent = `${finalGeoWire.attributes.position ? finalGeoWire.attributes.position.count / 3 | 0 : 0} tris${anySplineCount ? ' (splines)' : ''}`;
        if(state.svgPreview) disableSVGPreview();
    }


    function onWindowResize() { const w = container.clientWidth, h = container.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
    function animate() { requestAnimationFrame(animate); controls.update(); updateMaterialUniforms(); renderer.render(scene, camera); }

    let previewAbortController = null; let cachedSVGContent = null;
    function disableSVGPreview() {
        if (!state.svgPreview) return; state.svgPreview = false;
        const btn = document.getElementById('btn-preview-svg'); if(btn) btn.classList.remove('btn-active-yellow');
        cachedSVGContent = null; if (previewAbortController) { previewAbortController.abort(); previewAbortController = null; }
        const cont = document.getElementById('svg-container'); const canv = document.getElementById('canvas-container'); const loader = document.getElementById('preview-loader');
        if(cont) { cont.style.display = 'none'; cont.innerHTML = ''; } if(canv) canv.style.opacity = '1'; if(loader) loader.style.display = 'none'; updateMaterialUniforms();
    }
    async function enableSVGPreview() {
        if (state.svgPreview) return; if (previewAbortController) previewAbortController.abort(); previewAbortController = new AbortController(); const signal = previewAbortController.signal;
        state.svgPreview = true; cachedSVGContent = null;
        const cont = document.getElementById('svg-container'); const canv = document.getElementById('canvas-container'); const pLoader = document.getElementById('preview-loader'); const pBar = document.getElementById('preview-bar');
        const pMessage = document.getElementById('preview-message'); const pStats = document.getElementById('preview-stats');
        if(pMessage) pMessage.textContent = 'Generating Preview...'; if(pStats) pStats.textContent = 'Lines: 0 Dots: 0';
        if(cont) { cont.style.display = 'block'; cont.innerHTML = ''; } if(canv) canv.style.opacity = '0'; if(pLoader) pLoader.style.display = 'flex'; if(pBar) pBar.style.width = '0%';
        const cancelHandler = (e) => { if (e.key === 'Escape') { disableSVGPreview(); document.removeEventListener('keydown', cancelHandler); } }; document.addEventListener('keydown', cancelHandler);
        try {
            const width = container.clientWidth, height = container.clientHeight, bg = state.style.includes('hidden') || state.style === 'halftone' || state.style === 'checkerboard' ? '#111' : 'transparent';
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
        const width = container.clientWidth, height = container.clientHeight, bg = state.style.includes('hidden') || state.style === 'halftone' || state.style === 'checkerboard' ? '#111' : 'transparent';
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
        const bg = state.style.includes('hidden') || state.style === 'halftone' || state.style === 'checkerboard' ? '#111' : 'transparent';

        const meshWire = mainMeshGroup.userData.wire;
        const meshSolid = mainMeshGroup.userData.solid;
        const isDots = (state.style === 'dots' || state.style === 'dots-solid');
        const isHiddenLine = (state.style === 'hidden-line' || state.style === 'triangles' || state.style === 'dots-solid' || state.style === 'halftone' || state.style === 'checkerboard');
        
        state.properOrder = (state.zDepth.color || state.zDepth.opacity || state.zDepth.dof);
        
        const splineGroups = meshWire ? meshWire.geometry.userData.splineGroups : null;
        camera.updateMatrixWorld();
        const matWorld = meshWire ? meshWire.matrixWorld : new THREE.Matrix4();
        const matView = camera.matrixWorldInverse;
        const matProj = camera.projectionMatrix;
        const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
        const halfW = width / 2, halfH = height / 2, near = camera.near;

        // --- Core Helpers ---
        const _vProj = new THREE.Vector3();
        const _c1 = new THREE.Vector3();
        function project(vCam) { 
            _vProj.copy(vCam).applyMatrix4(matProj); 
            return { x: (_vProj.x * halfW) + halfW, y: -(_vProj.y * halfH) + halfH, w: _vProj.w }; 
        }

        const clipPlaneLocal = mainMeshGroup.userData.clipPlane; 
        let clipPlane = null; 
        if (clipPlaneLocal) clipPlane = clipPlaneLocal.clone();
        const isClipped = (v) => clipPlane && clipPlane.distanceToPoint(v) < 0;

        const stats = { renderedLines: 0, totalLines: 0, renderedDots: 0, totalDots: 0 };
        const progressConfig = { start: 10, end: 90 };
        const progressState = { processed: 0, lastPercent: 0, total: 0 };
        function getStatsSnapshot() { return { lines: stats.renderedLines, totalLines: stats.totalLines, dots: stats.renderedDots, totalDots: stats.totalDots }; }
        function pushProgress(percent, message) {
            if (!onProgress) return;
            const clamped = Math.max(0, Math.min(100, percent));
            progressState.lastPercent = Math.max(progressState.lastPercent, clamped);
            onProgress(clamped, message, { stats: getStatsSnapshot() });
        }
        function updateStreamingProgress(message) {
            if (!onProgress) return;
            const ratio = progressState.total > 0 ? Math.min(1, progressState.processed / progressState.total) : 0;
            const rawPercent = progressConfig.start + ratio * (progressConfig.end - progressConfig.start);
            const rounded = Math.round(rawPercent);
            const percent = Math.min(progressConfig.end, Math.max(progressState.lastPercent, rounded));
            if (!message && percent === progressState.lastPercent) return;
            progressState.lastPercent = Math.max(progressState.lastPercent, percent);
            onProgress(percent, message, { stats: getStatsSnapshot() });
        }
        function tickProgress(amount = 1, message) {
            if (amount > 0) progressState.processed += amount;
            updateStreamingProgress(message);
        }
        function reportLineSegment(lineStr) {
            if (onChunk) onChunk(lineStr, { type: 'line', final: false });
        }
        function reportDotSegment(circleStr) {
            if (onChunk) onChunk(circleStr, { type: 'dot', final: false });
        }
        function countSplines() {
            if (!splineGroups) return 0;
            return splineGroups.reduce((acc, group) => acc + ((Array.isArray(group.splines)) ? group.splines.length : 0), 0);
        }
        function setTotals() {
            const splineTotal = countSplines();
            const posAttr = (meshWire && meshWire.geometry && meshWire.geometry.attributes) ? meshWire.geometry.attributes.position : null;
            const posCount = posAttr ? posAttr.count : 0;
            const edgeCount = Math.floor(posCount / 2);
            stats.totalLines = !isDots ? Math.max(0, splineTotal || edgeCount) : 0;
            stats.totalDots = isDots ? posCount : 0;
            progressState.total = Math.max(1, stats.totalLines + stats.totalDots);
        }
        function markLineRendered(message) {
            if (stats.totalLines === 0) return;
            stats.renderedLines = Math.min(stats.renderedLines + 1, stats.totalLines);
            tickProgress(1, message || 'Processing lines...');
        }
        function markDotRendered(message) {
            if (stats.totalDots === 0) return;
            stats.renderedDots = Math.min(stats.renderedDots + 1, stats.totalDots);
            tickProgress(1, message || 'Processing dots...');
        }
        setTotals();

        const raycaster = new THREE.Raycaster();
        const rayDir = new THREE.Vector3();
        
        // Ensure bounding volumes for occlusion
        if (meshSolid && meshSolid.geometry && !meshSolid.geometry.boundingSphere) { 
            meshSolid.geometry.computeBoundingSphere(); 
            meshSolid.geometry.computeBoundingBox(); 
        }

        // We'll need a way to access gpuDepthData and depthResW/H inside checkOcclusion
        let gpuDepthData = null;
        let depthResW = Math.max(2560, Math.floor(width * 4.0));
        let depthResH = Math.max(2560, Math.floor(height * 4.0));

        function checkOcclusion(targetPoint, isSilhouetteLine = false) {
            if (!isHiddenLine || !meshSolid || !gpuDepthData) return false;
            
            _c1.copy(targetPoint).applyMatrix4(matView);
            _vProj.copy(_c1).applyMatrix4(matProj);
            const tx = (_vProj.x * 0.5 + 0.5), ty = (_vProj.y * 0.5 + 0.5);
            if (tx < 0 || tx > 1 || ty < 0 || ty > 1) return false;
            const fx = tx * (depthResW - 1), fy = ty * (depthResH - 1);
            const ix = Math.floor(fx), iy = Math.floor(fy);
            let storedDepth;
            const gridSize = state.gpuGridSize || 1;
            if (gridSize <= 1) {
                const wx = fx - ix, wy = fy - iy, nx = Math.min(depthResW - 1, ix + 1), ny = Math.min(depthResH - 1, iy + 1);
                const d00 = gpuDepthData[iy * depthResW + ix], d10 = gpuDepthData[iy * depthResW + nx], d01 = gpuDepthData[ny * depthResW + ix], d11 = gpuDepthData[ny * depthResW + nx];
                let validD = 0, weight = 0;
                if (d00 < 0.999) { validD += d00 * (1 - wx) * (1 - wy); weight += (1 - wx) * (1 - wy); }
                if (d10 < 0.999) { validD += d10 * wx * (1 - wy); weight += wx * (1 - wy); }
                if (d01 < 0.999) { validD += d01 * (1 - wx) * wy; weight += (1 - wx) * wy; }
                if (d11 < 0.999) { validD += d11 * wx * wy; weight += wx * wy; }
                storedDepth = (weight > 0.001) ? (validD / weight) * camera.far : camera.far;
            } else {
                let minD = 1.0; const radius = Math.floor(gridSize / 2);
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = Math.max(0, Math.min(depthResW - 1, ix + dx)), ny = Math.max(0, Math.min(depthResH - 1, iy + dy));
                        const d = gpuDepthData[ny * depthResW + nx]; if (d < minD) minD = d;
                    }
                }
                storedDepth = minD * camera.far;
            }
            const currentDepth = -_c1.z;
            let bias = (state.hiddenSettings.bias * 0.1) + state.hiddenSettings.epsilon;
            if (isSilhouetteLine) bias += 0.2; // robust noise floor strictly for silhouettes
            return currentDepth > storedDepth + bias;
        }

        const checkSignal = () => { if (signal && signal.aborted) throw new Error('Cancelled'); };
        let lastYield = performance.now(); const YIELD_MS = 30;
        async function smartYield() { 
            if (performance.now() - lastYield > YIELD_MS) { 
                await new Promise(r => setTimeout(r, 0)); 
                lastYield = performance.now(); 
                checkSignal(); 
                return true; 
            } 
            return false; 
        }

        // --- Style Specific Logic ---
        if (state.style === 'halftone') {
            if (onProgress) onProgress(10, 'Rendering halftone map...', { stats: { lines: 0, totalLines: 0, dots: 0, totalDots: 0 } });
            const rt = new THREE.WebGLRenderTarget(width, height, { format: THREE.RGBAFormat });
            const oldBg = scene.background;
            scene.background = null;

            const oldAlpha = renderer.getClearAlpha();
            const oldCol = renderer.getClearColor(new THREE.Color());
            renderer.setClearColor(0x000000, 0);

            if(meshWire) meshWire.visible = false;

            renderer.setRenderTarget(rt);
            renderer.clear();
            renderer.render(scene, camera);
            renderer.setRenderTarget(null);

            if(meshWire) meshWire.visible = true;
            scene.background = oldBg;
            renderer.setClearColor(oldCol, oldAlpha);

            const buffer = new Uint8Array(width * height * 4);
            renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);
            rt.dispose();

            if (onProgress) onProgress(40, 'Generating dots...', { stats: { lines: 0, totalLines: 0, dots: 0, totalDots: 0 } });
            let outputBuffer = '';
            const step = Math.max(2, state.halftone.grid);
            const maxSize = state.halftone.size;
            const angleRad = state.halftone.angle * Math.PI / 180;
            const sinA = Math.sin(angleRad);
            const cosA = Math.cos(angleRad);

            const cx = width / 2;
            const cy = height / 2;
            const diag = Math.sqrt(width*width + height*height);
            const startX = -diag/2;
            const endX = diag/2;
            const startY = -diag/2;
            const endY = diag/2;

            let dotCount = 0;

            for (let ry = startY; ry < endY; ry += step) {
                for (let rx = startX; rx < endX; rx += step) {
                    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    const px = Math.round(cx + rx * cosA - ry * sinA);
                    const py = Math.round(cy + rx * sinA + ry * cosA);

                    if (px >= 0 && px < width && py >= 0 && py < height) {
                        const bufY = height - 1 - py;
                        const idx = (bufY * width + px) * 4;
                        const alpha = buffer[idx+3];

                        if (alpha < 128) continue;

                        const r = buffer[idx];
                        const g = buffer[idx+1];
                        const b = buffer[idx+2];
                        const brightness = (r + g + b) / (3 * 255);

                        let val = state.halftone.invert ? brightness : (1.0 - brightness);

                        if (val > 0.05) {
                            const radius = (maxSize / 2) * val;
                            if (radius > 0.1) {
                                const circleStr = `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${radius.toFixed(2)}" fill="${state.baseColor}"/>`;
                                outputBuffer += circleStr;
                                dotCount++;
                                if (onChunk) onChunk(circleStr, { type: 'dot', final: false });
                            }
                        }
                    }
                }
            }
            if (onProgress) onProgress(100, 'Done', { stats: { lines: 0, totalLines: 0, dots: dotCount, totalDots: dotCount } });
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bg}">${outputBuffer}</svg>`;
        }

        // GPU Depth Capture (needed for checkerboard and hidden line styles)
        if (isHiddenLine && meshSolid) {
            pushProgress(5, 'GPU: Capturing Depth Map (High Res)...');
            const depthTarget = new THREE.WebGLRenderTarget(depthResW, depthResH);
            const depthMaterial = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                clipping: true,
                clippingPlanes: clipPlane ? [clipPlane] : [],
                polygonOffset: true,
                polygonOffsetFactor: 1.0,
                polygonOffsetUnits: 1.0,
                vertexShader: `
                    #include <clipping_planes_pars_vertex>
                    varying float vDepth; 
                    void main() { 
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); 
                        #include <clipping_planes_vertex>
                        gl_Position = projectionMatrix * mvPosition; 
                        vDepth = -mvPosition.z; 
                    }`,
                fragmentShader: `
                    #include <clipping_planes_pars_fragment>
                    varying float vDepth; 
                    uniform float far; 
                    vec4 packDepth(float depth) { 
                        const vec4 bitShift = vec4(16777216.0, 65536.0, 256.0, 1.0); 
                        const vec4 bitMask = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); 
                        vec4 res = fract(depth * bitShift); 
                        res -= res.xxyz * bitMask; 
                        return res; 
                    } 
                    void main() { 
                        #include <clipping_planes_fragment>
                        gl_FragColor = packDepth(vDepth / far); 
                    }`,
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

        if (state.style === 'checkerboard') {
            if (onProgress) onProgress(10, 'Analyzing mesh quads...', { stats: { lines: 0, totalLines: 0, dots: 0, totalDots: 0 } });
            
            const index = meshSolid.geometry.index;
            const pos = meshSolid.geometry.attributes.position;
            const uvs = meshSolid.geometry.attributes.uv;
            const wSegs = meshSolid.geometry.userData.wSegs || 10;
            const hSegs = meshSolid.geometry.userData.hSegs || 10;
            const geoType = state.geoType;
            
            const faces = [];
            const isQuad = (geoType !== 'icosahedron' && geoType !== 'tetrahedron' && geoType !== 'octahedron' && geoType !== 'dodecahedron');

            if (index && isQuad) {
                for (let i = 0; i < index.count; i += 6) {
                    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    
                    const a = index.getX(i), b = index.getX(i+1), c = index.getX(i+2);
                    const e = index.getX(i+4);
                    
                    const vA = new THREE.Vector3().fromBufferAttribute(pos, a).applyMatrix4(matWorld);
                    const vB = new THREE.Vector3().fromBufferAttribute(pos, b).applyMatrix4(matWorld);
                    const vC = new THREE.Vector3().fromBufferAttribute(pos, c).applyMatrix4(matWorld);
                    const vE = new THREE.Vector3().fromBufferAttribute(pos, e).applyMatrix4(matWorld);
                    
                    const mid = new THREE.Vector3().add(vA).add(vB).add(vC).add(vE).divideScalar(4);
                    const dist = camPos.distanceTo(mid);
                    
                    if (isClipped(mid)) continue;

                    // Near-plane culling: skip quads that are behind the camera or clip the near plane
                    // to avoid projection artifacts (inverted/distorted SVG paths)
                    const vA_cam = vA.clone().applyMatrix4(matView);
                    const vB_cam = vB.clone().applyMatrix4(matView);
                    const vC_cam = vC.clone().applyMatrix4(matView);
                    const vE_cam = vE.clone().applyMatrix4(matView);
                    if (vA_cam.z > -near || vB_cam.z > -near || vC_cam.z > -near || vE_cam.z > -near) continue;

                    // Slightly more generous bias for checkerboard to avoid self-occlusion artifacts
                    const isOccluded = isHiddenLine && checkOcclusion(mid);
                    if (isOccluded && state.checkerboard.deleteHidden) continue;

                    const pts = [vA_cam, vB_cam, vE_cam, vC_cam].map(vc => project(vc));

                    // Checkerboard logic
                    let row, col;
                    const qIdx = i / 6;
                    
                    if (uvs) {
                        const uvA = new THREE.Vector2().fromBufferAttribute(uvs, a);
                        const uvB = new THREE.Vector2().fromBufferAttribute(uvs, b);
                        const uvC = new THREE.Vector2().fromBufferAttribute(uvs, c);
                        const uvE = new THREE.Vector2().fromBufferAttribute(uvs, e);
                        const midUV = new THREE.Vector2().add(uvA).add(uvB).add(uvC).add(uvE).divideScalar(4);
                        
                        col = Math.floor(midUV.x * wSegs);
                        row = Math.floor(midUV.y * hSegs);
                    } else if (geoType === 'cube') {
                        const ws = meshSolid.geometry.userData.wSegs;
                        const hs = meshSolid.geometry.userData.hSegs;
                        const ds = meshSolid.geometry.userData.dSegs;
                        
                        const faceSegments = [
                            { w: ds, h: hs }, { w: ds, h: hs }, // Right, Left
                            { w: ws, h: ds }, { w: ws, h: ds }, // Top, Bottom
                            { w: ws, h: hs }, { w: ws, h: hs }  // Front, Back
                        ];
                        
                        let accumulatedQuads = 0;
                        let faceIdx = 0;
                        for (let f = 0; f < 6; f++) {
                            const count = faceSegments[f].w * faceSegments[f].h;
                            if (qIdx < accumulatedQuads + count) {
                                faceIdx = f;
                                const localQIdx = qIdx - accumulatedQuads;
                                row = Math.floor(localQIdx / faceSegments[f].w);
                                col = localQIdx % faceSegments[f].w;
                                break;
                            }
                            accumulatedQuads += count;
                        }
                        row += faceIdx; 
                    } else {
                        row = Math.floor(qIdx / wSegs);
                        col = qIdx % wSegs;
                    }
                    
                    let isWhite = (row + col) % 2 === 0;
                    if (state.checkerboard.invert) isWhite = !isWhite;
                    const color = isWhite ? state.checkerboard.col1 : state.checkerboard.col2;
                    
                    faces.push({ pts, z: dist, color, isOccluded });
                }
            } else if (index) {
                // Triangles only
                for (let i = 0; i < index.count; i += 3) {
                    const a = index.getX(i), b = index.getX(i+1), c = index.getX(i+2);
                    const vA = new THREE.Vector3().fromBufferAttribute(pos, a).applyMatrix4(matWorld);
                    const vB = new THREE.Vector3().fromBufferAttribute(pos, b).applyMatrix4(matWorld);
                    const vC = new THREE.Vector3().fromBufferAttribute(pos, c).applyMatrix4(matWorld);
                    const mid = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
                    const dist = camPos.distanceTo(mid);
                    if (isClipped(mid)) continue;

                    // Near-plane culling: skip triangles that are behind the camera or clip the near plane
                    const vA_cam = vA.clone().applyMatrix4(matView);
                    const vB_cam = vB.clone().applyMatrix4(matView);
                    const vC_cam = vC.clone().applyMatrix4(matView);
                    if (vA_cam.z > -near || vB_cam.z > -near || vC_cam.z > -near) continue;

                    const isOccluded = isHiddenLine && checkOcclusion(mid);
                    if (isOccluded && state.checkerboard.deleteHidden) continue;

                    const pts = [vA_cam, vB_cam, vC_cam].map(vc => project(vc));
                    
                    let row = 0, col = 0;
                    if (uvs) {
                        const uvA = new THREE.Vector2().fromBufferAttribute(uvs, a);
                        const uvB = new THREE.Vector2().fromBufferAttribute(uvs, b);
                        const uvC = new THREE.Vector2().fromBufferAttribute(uvs, c);
                        const midUV = new THREE.Vector2().add(uvA).add(uvB).add(uvC).divideScalar(3);
                        col = Math.floor(midUV.x * wSegs);
                        row = Math.floor(midUV.y * hSegs);
                    } else {
                        col = (i / 3) % wSegs;
                        row = Math.floor((i / 3) / wSegs);
                    }
                    
                    let isWhite = (row + col) % 2 === 0;
                    if (state.checkerboard.invert) isWhite = !isWhite;
                    const color = isWhite ? state.checkerboard.col1 : state.checkerboard.col2;
                    faces.push({ pts, z: dist, color, isOccluded });
                }
            }

            faces.sort((a, b) => b.z - a.z);

            let outputBuffer = '';
            faces.forEach(f => {
                let pathD = `M ${f.pts[0].x.toFixed(1)},${f.pts[0].y.toFixed(1)}`;
                for (let j = 1; j < f.pts.length; j++) pathD += ` L ${f.pts[j].x.toFixed(1)},${f.pts[j].y.toFixed(1)}`;
                pathD += ' Z';
                // Add a tiny stroke of the same color to prevent gaps between quads
                outputBuffer += `<path d="${pathD}" fill="${f.color}" stroke="${f.color}" stroke-width="0.3" stroke-linejoin="round"/>`;
            });
            
            if (onProgress) onProgress(100, 'Done', { stats: { lines: 0, totalLines: 0, dots: faces.length, totalDots: faces.length } });
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bg}">${outputBuffer}</svg>`;
        }

        // --- DEPTH ANALYSIS (skip if no zDepth features are enabled for performance) ---
        let minVal = Infinity, maxVal = -Infinity, safeRange = 1.0, minZ = 0, maxZ = 1, safeZRange = 1.0, gradDir = null;
        let dofMinVal = Infinity, dofMaxVal = -Infinity, safeDofRange = 1.0;
        let opMinZ = 0, opMaxZ = 1, safeOpZRange = 1.0;
        const useZDepth = state.zDepth.color || state.zDepth.opacity || state.zDepth.dof || state.zDepth.size;
        const useDOF = state.zDepth.dof;
        let opEval = null, sizeEval = null;
        
        if (useZDepth) {
            if (useDOF) {
                opEval = state.dof.smoothCurve ? createMonotoneInterpolator(state.dof.opCurve) : (t) => evaluateLinear(t, state.dof.opCurve);
                sizeEval = state.dof.smoothCurve ? createMonotoneInterpolator(state.dof.sizeCurve) : (t) => evaluateLinear(t, state.dof.sizeCurve);
            }
            const pos = meshWire.geometry.attributes.position; 
            const vTemp = new THREE.Vector3(); 
            const step = Math.max(1, Math.floor(pos.count / 200));
            gradDir = getGradientDirection();

            for (let i=0; i<pos.count; i+=step) { 
                vTemp.fromBufferAttribute(pos, i).applyMatrix4(matWorld); 
                const distVal = vTemp.distanceTo(camPos);
                if (distVal < dofMinVal) dofMinVal = distVal;
                if (distVal > dofMaxVal) dofMaxVal = distVal;
                const val = (state.gradMode === 'directional') ? vTemp.dot(gradDir) : distVal;
                if (val < minVal) minVal = val; if (val > maxVal) maxVal = val; 
            }
            const range = maxVal - minVal; 
            safeRange = range < 0.01 ? 1.0 : range; 
            const dofRange = dofMaxVal - dofMinVal;
            safeDofRange = dofRange < 0.01 ? 1.0 : dofRange;
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
        const getStyle = (dist, worldPt, lineVal = -1.0) => {
            let col = (state.svgPreview && !state.zDepth.color && !state.lineGradient.enabled) ? '#f1c40f' : state.baseColor; 
            let op = 1.0; let scale = 1.0;
            
            if (state.lineGradient.enabled && lineVal >= 0.0) {
                if (state.lineGradient.stops && state.lineGradient.stops.length > 0) {
                    let c = state.lineGradient.stops[0].c;
                    for (let i = 0; i < state.lineGradient.stops.length - 1; i++) {
                        const s1 = state.lineGradient.stops[i];
                        const s2 = state.lineGradient.stops[i+1];
                        if (lineVal >= s1.p && lineVal <= s2.p) {
                            const localT = (lineVal - s1.p) / (s2.p - s1.p);
                            c = '#' + new THREE.Color(s1.c).lerp(new THREE.Color(s2.c), localT).getHexString();
                            break;
                        } else if (lineVal > s2.p) {
                            c = s2.c;
                        }
                    }
                    col = c;
                }
            }
            
            // Only calculate zDepth values if at least one zDepth feature is enabled (for performance)
            if (useZDepth) {
                const metric = (state.gradMode === 'directional') ? worldPt.dot(gradDir) : dist;
                const t = Math.max(0.0, Math.min(1.0, (metric - minZ) / safeZRange));
                
                if (state.zDepth.color) {
                    if (state.colorStops && state.colorStops.length > 0) {
                        let c = state.colorStops[0].c;
                        for (let i = 0; i < state.colorStops.length - 1; i++) {
                            const s1 = state.colorStops[i];
                            const s2 = state.colorStops[i+1];
                            if (t >= s1.p && t <= s2.p) {
                                const localT = (t - s1.p) / (s2.p - s1.p);
                                c = '#' + new THREE.Color(s1.c).lerp(new THREE.Color(s2.c), localT).getHexString();
                                break;
                            } else if (t > s2.p) {
                                c = s2.c;
                            }
                        }
                        col = c;
                    } else {
                        col = '#' + new THREE.Color(state.colorNear).lerp(new THREE.Color(state.colorFar), t).getHexString();
                    }
                }
                if (state.zDepth.opacity) {
                    const opT = Math.max(0.0, Math.min(1.0, (metric - opMinZ) / safeOpZRange));
                    op *= (1.0 - opT);
                }
                if (state.zDepth.size) {
                    const sT = Math.max(0.0, Math.min(1.0, (metric - minZ) / safeZRange));
                    const targetSize = state.zSize.near + (state.zSize.far - state.zSize.near) * sT;
                    scale *= targetSize / (state.style === 'dots' ? state.pointSize : state.strokeWidth);
                }
                
                if (useDOF) { 
                    let distDOF = (dist - dofMinVal) / safeDofRange;
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

        function getBezierCommand(p0, p1, p2, p3, tension = 0.15) { 
            const t1x = (p2.x - p0.x) * tension, t1y = (p2.y - p0.y) * tension, 
                  t2x = (p3.x - p1.x) * tension, t2y = (p3.y - p1.y) * tension; 
            return `C ${(p1.x + t1x).toFixed(3)},${(p1.y + t1y).toFixed(3)} ${(p2.x - t2x).toFixed(3)},${(p2.y - t2y).toFixed(3)} ${p2.x.toFixed(3)},${p2.y.toFixed(3)}`; 
        }

        // --- SEGMENT BUFFERING ---
        const rawSegments = [];
        const allSegments = [];

        const collectLine = (pA, pB, dist, worldMid, isSpline = false, lineVal = -1.0) => {
            // 1. Min Length Check (skip if minLen is 0 for performance)
            const minLen = state.hiddenSettings.minLen || 0;
            if (minLen > 0) {
                const dx = pA.x - pB.x, dy = pA.y - pB.y;
                const lenSq = dx*dx + dy*dy;
                if (lenSq < minLen * minLen) return;
            }

            // 2. Style Calculation
            const style = getStyle(dist, worldMid, lineVal);
            if (lineVal === -999.0) style.scale = (state.hiddenSettings.silhouetteWidth || 3.0) / (state.strokeWidth || 1);
            if (style.op <= 0.001) return;

            rawSegments.push({ p1: {x: pA.x, y: pA.y}, p2: {x: pB.x, y: pB.y}, z: dist, style: style, isSpline: isSpline });
            if (state.properOrder) allSegments.push({ p1: {x: pA.x, y: pA.y}, p2: {x: pB.x, y: pB.y}, z: dist, style: style, isSpline: isSpline });
        };

        // --- RECURSIVE SUBDIVISION ---
        function traceSegmentRecursive(pStart, pEnd, depth, isSpline = false, lineVal = -1.0) {
            const wStart = pStart.clone().applyMatrix4(matWorld);
            const wEnd = pEnd.clone().applyMatrix4(matWorld);
            const dStart = camPos.distanceTo(wStart);
            const dEnd = camPos.distanceTo(wEnd);
            
            const isSil = (lineVal === -999.0);
            const visStart = !isClipped(wStart) && (checkOcclusion(wStart, isSil) === state.hiddenSettings.invert);
            const visEnd = !isClipped(wEnd) && (checkOcclusion(wEnd, isSil) === state.hiddenSettings.invert);
            
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
                         collectLine(scr1, scr2, (dStart+dEnd)/2, wMid, isSpline, lineVal);
                     }
                } else if (depth < 2) {
                     // Both hidden, but might be tunneling? Check mid
                     const mid = pStart.clone().lerp(pEnd, 0.5);
                     const wMid = mid.clone().applyMatrix4(matWorld);
                     const dMid = camPos.distanceTo(wMid);
                     const visMid = !isClipped(wMid) && (checkOcclusion(wMid, isSil) === state.hiddenSettings.invert);
                     if (visMid) {
                         traceSegmentRecursive(pStart, mid, depth + 1, isSpline, lineVal);
                         traceSegmentRecursive(mid, pEnd, depth + 1, isSpline, lineVal);
                     }
                }
                return;
            }
            
            let maxDepth = 6;
            let doReturn = false;
            if (depth > maxDepth) {
                doReturn = true;
            }
            if (doReturn) { 
                if (visStart) {
                    const mid = pStart.clone().lerp(pEnd, 0.5);
                    const wMid = mid.clone().applyMatrix4(matWorld);
                    const c1 = wStart.clone().applyMatrix4(matView);
                    const c2 = wMid.clone().applyMatrix4(matView); 
                    collectLine(project(c1), project(c2), dStart, wMid, isSpline, lineVal);
                } else if (visEnd) {
                    const mid = pStart.clone().lerp(pEnd, 0.5);
                    const wMid = mid.clone().applyMatrix4(matWorld);
                    const c1 = wMid.clone().applyMatrix4(matView);
                    const c2 = wEnd.clone().applyMatrix4(matView);
                    collectLine(project(c1), project(c2), dEnd, wMid, isSpline, lineVal);
                }
                return;
            }
            
            const mid = pStart.clone().lerp(pEnd, 0.5);
            traceSegmentRecursive(pStart, mid, depth + 1, isSpline, lineVal);
            traceSegmentRecursive(mid, pEnd, depth + 1, isSpline, lineVal);
        }

        let output = '';

        // --- PROCESSING LOOPS ---
        const _p1 = new THREE.Vector3();
        const _p2 = new THREE.Vector3();
        const _w1 = new THREE.Vector3();
        const _w2 = new THREE.Vector3();
        const _c2 = new THREE.Vector3();
        const _mid = new THREE.Vector3();

        if (splineGroups && !isDots) {
            const totalGroups = splineGroups.length;
            const shouldSeparateUV = !state.properOrder && !state.zDepth.color && !state.zDepth.opacity && !state.zDepth.dof;
            for (let g = 0; g < totalGroups; g++) {
                checkSignal(); const group = splineGroups[g], splines = group.splines; let groupOutput = '', groupOutputU = '', groupOutputV = '';
                tickProgress(0, `Processing Group ${group.name}...`);
                await new Promise(r => setTimeout(r, 0)); // Ensure non-blocking
                for (let i = 0; i < splines.length; i++) {
                    await smartYield(); 
                    const splineData = splines[i], rawPoints = splineData.points;
                    if(rawPoints.length < 2) { markLineRendered('Processing lines...'); continue; }

                    const curve = new THREE.CatmullRomCurve3(rawPoints); 
                    curve.closed = splineData.closed;
                    const densePoints = curve.getPoints(rawPoints.length * state.hiddenSettings.splineRes);

                    for(let j = 0; j < densePoints.length - 1; j++) {
                        traceSegmentRecursive(densePoints[j], densePoints[j+1], 0, true, splineData.lineValue);
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
              const lineValAttr = meshWire.geometry.attributes.lineValue;
               const rnd = (n) => Math.round(n * 1000); 
               const dotsMap = new Map();
               tickProgress(0, 'Processing Dots...');
               for (let i = 0; i < total; i++) {
                  await smartYield();
                  v1.fromBufferAttribute(pos, i).applyMatrix4(matWorld);
                  if (clipPlane && clipPlane.distanceToPoint(v1) < 0) continue;
                  let lineVal = -1.0;
                  if (lineValAttr) lineVal = lineValAttr.getX(i);
                  const s = `${rnd(v1.x)},${rnd(v1.y)},${rnd(v1.z)}`;
                  const existing = dotsMap.get(s);
                  if (!existing || (lineVal >= 0.0 && existing.lineVal < 0.0)) {
                      dotsMap.set(s, { v: v1.clone(), lineVal: lineVal });
                  }
               }

               const dotsArray = [];
               for (const [s, data] of dotsMap.entries()) {
                  await smartYield();
                  const vVec = data.v;
                  const c1 = vVec.clone().applyMatrix4(matView); if (c1.z > -near) continue;
                  const p = project(c1); 
                  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) continue;
                  const dist = camPos.distanceTo(vVec);
                  if (checkOcclusion(vVec) === state.hiddenSettings.invert) {
                      const { col, op, scale } = getStyle(dist, vVec, data.lineVal);
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
             const lineValAttr = meshWire.geometry.attributes.lineValue;
             const total = pos.count / 2;
             
             tickProgress(0, 'Processing Lines...');
               for (let i = 0; i < total; i++) {
                  await smartYield();
                  const idx = i * 2; 
                  _p1.fromBufferAttribute(pos, idx);
                  _p2.fromBufferAttribute(pos, idx+1);
                  
                  let lineVal = -1.0;
                  if (lineValAttr) lineVal = lineValAttr.getX(idx);

                  traceSegmentRecursive(_p1, _p2, 0, false, lineVal);
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
            let pathCount = 0;
            const precision = 1;

            if (state.properOrder) {
                for (const seg of segments) {
                    const col = seg.style.col;
                    const op = seg.style.op.toFixed(2);
                    const width = (state.strokeWidth * seg.style.scale).toFixed(2);
                    const isSpline = seg.isSpline;

                    let pathD = `M ${seg.p1.x.toFixed(3)},${seg.p1.y.toFixed(3)} L ${seg.p2.x.toFixed(3)},${seg.p2.y.toFixed(3)}`;
                    pathCount++;
                    const pathStr = `<path d="${pathD}" fill="none" stroke="${col}" stroke-width="${width}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
                    finalSVG += pathStr;
                    reportLineSegment(pathStr);
                }
                if (pathCount > 1) {
                console.log("DEBUG: Generated " + pathCount + " paths for signature!");
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
                    const key1 = `${seg.p1.x.toFixed(precision)},${seg.p1.y.toFixed(precision)}`;
                    const key2 = `${seg.p2.x.toFixed(precision)},${seg.p2.y.toFixed(precision)}`;
                    if(!map.has(key1)) map.set(key1, []);
                    map.get(key1).push(seg);
                    if(!map.has(key2)) map.set(key2, []);
                    map.get(key2).push(seg);
                });

                const visited = new Set();

                for (const seg of groupSegs) {
                    if (visited.has(seg)) continue;
                    const pathPoints = [seg.p1, seg.p2];
                    visited.add(seg);
                    
                    // Trace forward
                    let currentTail = seg.p2;
                    while(true) {
                        const tailKey = `${currentTail.x.toFixed(precision)},${currentTail.y.toFixed(precision)}`;
                        const candidates = map.get(tailKey);
                        let nextSeg = null;
                        if (candidates) {
                            for (let c of candidates) {
                                if (!visited.has(c)) { nextSeg = c; break; }
                            }
                        }
                        if (nextSeg) {
                            const k1 = `${nextSeg.p1.x.toFixed(precision)},${nextSeg.p1.y.toFixed(precision)}`;
                            if (k1 === tailKey) { pathPoints.push(nextSeg.p2); currentTail = nextSeg.p2; }
                            else { pathPoints.push(nextSeg.p1); currentTail = nextSeg.p1; }
                            visited.add(nextSeg);
                        } else break;
                    }

                    // Trace backward
                    let currentHead = seg.p1;
                    while(true) {
                        const headKey = `${currentHead.x.toFixed(precision)},${currentHead.y.toFixed(precision)}`;
                        const candidates = map.get(headKey);
                        let nextSeg = null;
                        if (candidates) {
                            for (let c of candidates) {
                                if (!visited.has(c)) { nextSeg = c; break; }
                            }
                        }
                        if (nextSeg) {
                            const k1 = `${nextSeg.p1.x.toFixed(precision)},${nextSeg.p1.y.toFixed(precision)}`;
                            if (k1 === headKey) { pathPoints.unshift(nextSeg.p2); currentHead = nextSeg.p2; }
                            else { pathPoints.unshift(nextSeg.p1); currentHead = nextSeg.p1; }
                            visited.add(nextSeg);
                        } else break;
                    }
                    
                    let pathD = `M ${pathPoints[0].x.toFixed(3)},${pathPoints[0].y.toFixed(3)}`;
                    const useBeziers = isSpline && pathPoints.length > 2; 
                    
                    if (useBeziers) {
                        for (let k = 0; k < pathPoints.length - 1; k++) {
                            pathD += ' ' + getBezierCommand(pathPoints[Math.max(0, k - 1)], pathPoints[k], pathPoints[k + 1], pathPoints[Math.min(pathPoints.length - 1, k + 2)]);
                        }
                    } else {
                        for (let k = 1; k < pathPoints.length; k++) {
                            pathD += ` L ${pathPoints[k].x.toFixed(3)},${pathPoints[k].y.toFixed(3)}`;
                        }
                    }
                    pathCount++;
                    const pathStr = `<path d="${pathD}" fill="none" stroke="${col}" stroke-width="${width}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
                    finalSVG += pathStr;
                    reportLineSegment(pathStr);
                }
            }
            if (pathCount > 1) {
                console.log("DEBUG: Generated " + pathCount + " paths for signature!");
            }
            return finalSVG;
        }

        if (state.hiddenSettings.silhouette && (state.style === 'hidden-line' || state.style === 'triangles')) {
            pushProgress(85, 'Extracting Silhouette...');
            if (meshSolid && meshSolid.geometry && meshSolid.geometry.index) {
                const geo = meshSolid.geometry;
                const pos = geo.attributes.position;
                const idx = geo.index;
                const faceNormals = [];
                const edges = {}; 
                const _vA = new THREE.Vector3(), _vB = new THREE.Vector3(), _vC = new THREE.Vector3(), _cb = new THREE.Vector3(), _ab = new THREE.Vector3();
                
                for (let i = 0; i < idx.count; i += 3) {
                    const a = idx.getX(i), b = idx.getX(i+1), c = idx.getX(i+2);
                    _vA.fromBufferAttribute(pos, a).applyMatrix4(matWorld);
                    _vB.fromBufferAttribute(pos, b).applyMatrix4(matWorld);
                    _vC.fromBufferAttribute(pos, c).applyMatrix4(matWorld);
                    
                    _cb.subVectors(_vC, _vB);
                    _ab.subVectors(_vA, _vB);
                    _cb.cross(_ab);
                    
                    const centerX = (_vA.x + _vB.x + _vC.x) / 3;
                    const centerY = (_vA.y + _vB.y + _vC.y) / 3;
                    const centerZ = (_vA.z + _vB.z + _vC.z) / 3;
                    
                    let dot = 0;
                    if (camera.isPerspectiveCamera) {
                        dot = _cb.x * (camPos.x - centerX) + _cb.y * (camPos.y - centerY) + _cb.z * (camPos.z - centerZ);
                    } else {
                        const toCam = new THREE.Vector3(0,0,1).applyMatrix4(camera.matrixWorld).sub(camera.position).normalize();
                        dot = _cb.dot(toCam);
                    }
                    
                    faceNormals[i/3] = dot > 0;
                    
                    const addEdge = (u, v) => {
                        const key = (u < v) ? `${u}_${v}` : `${v}_${u}`;
                        if (!edges[key]) edges[key] = { u, v, f1: i/3, f2: -1 };
                        else edges[key].f2 = i/3;
                    };
                    addEdge(a, b); addEdge(b, c); addEdge(c, a);
                }
                
                for (let key in edges) {
                    const e = edges[key];
                    let isSilhouette = false;
                    if (e.f2 === -1) isSilhouette = faceNormals[e.f1];
                    else isSilhouette = faceNormals[e.f1] !== faceNormals[e.f2];
                    
                    if (isSilhouette) {
                        _p1.fromBufferAttribute(pos, e.u);
                        _p2.fromBufferAttribute(pos, e.v);
                        traceSegmentRecursive(_p1, _p2, 0, false, -999.0);
                    }
                }
            }
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
