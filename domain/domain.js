/* ==================================================================
    Classe criada para representar objetos que devem ser renderizados

    Seu construtor possui os parâmetros de posicao, rotacao, escala, velocidade de rotacao e velocidade de translação,
    que definirão a matriz modelView gerada pela CPU na etapa de desenho
*/

class GameObject {
  /**
   * @param {vec3} pos - Translação do centro do objeto para as coordenadas do mundo
   * @param {vec3} theta - Rotação do objeto com relação a cada eixo do mundo
   * @param {vec3} escala - Escala do objeto com relação a cada eixo do mundo
   * @param {vec3} vtheta - Velocidade de rotação do objeto com relação a cada eixo do mundo
   * @param {vec3} vtrans - Velocidade de translação do objeto com relação a cada eixo do mundo
   * @returns {GameObject} - GameObject com as transformações fornecidas
   */
  constructor(pos, theta, escala, vtheta, vtrans) {
    this.pos = pos;
    this.theta = theta;
    this.escala = escala;
    this.vtheta = vtheta;
    this.vtrans = vtrans;
  }

  /**
   * @param {vec3[]} vertexes - Define o array de vértices do modelo
   */
  setMesh(vertexes) {
    this.vertexes = vertexes;
    this.calculateNormals();
  }

  setTexture(diffuseIndex) {
    this.diffuseIndex = diffuseIndex;
    this.texture = true;
  }

  setTextureMap(textureMap) {
    this.textureMap = textureMap;
  }

  /**
   * @param {Material} material - Define o material do objeto
   */
  setMaterial(material) {
    this.material = material;
  }

  /**
   * @param {Material} material - Define diretamente as cores dos vértices e sobrescreve definição do material
   */
  setColors(colors) {
    this.colors = colors;

    if (this.colors.length !== this.vertexes.length) {
      let cIndex = 0;
      let newColorA = [];

      this.vertexes.forEach(() => {
        newColorA.push(this.colors[cIndex % this.colors.length]);
        cIndex++;
      });

      this.colors = newColorA;
    }
  }

  /**
   * Calcula as normais dos vértices, com base em cada triângulo
   */
  calculateNormals() {
    this.normals = [];
    for (let i = 0; i < this.vertexes.length; i += 3) {
      const [a, b, c] = this.vertexes.slice(i, i + 3);

      const v1 = subtract(b, a);
      const v2 = subtract(c, a);

      const normal = normalize(cross(v1, v2));

      this.normals.push(normal, normal, normal);
    }
  }

  /**
   * @param {Collider} collider - Define a colisão do objeto
   */
  set collider(collider) {
    this._collider = collider;
  }

  /**
   * @returns {Collider} Colisor definido
   */
  get collider() {
    return this._collider;
  }

  /**
   * @param {Ray} ray - Raio disparado
   * @returns {string} - Face colidida mais próxima (se houver colisão)
   */
  testCollision(ray, playerPos) {
    if (this.collider) {
      const collisionPoint = this.collider.testCollision(ray, playerPos);

      // if (collisionPoint) console.log(`Collision point ${collisionPoint}`);

      return collisionPoint;
    }
  }
}

/* ==================================================================
    Classe criada para representar cubos

    Seu construtor possui os parâmetros de posicao, rotacao, escala, velocidade de rotacao e velocidade de translação,
    que definirão a matriz modelView gerada pela CPU na etapa de desenho
*/

class Cube extends GameObject {
  /**
   * @param {vec3} pos - Translação do centro do objeto para as coordenadas do mundo
   * @param {vec3} theta - Rotação do objeto com relação a cada eixo do mundo
   * @param {vec3} escala - Escala do objeto com relação a cada eixo do mundo
   * @param {vec3} vtheta - Velocidade de rotação do objeto com relação a cada eixo do mundo
   * @param {vec3} vtrans - Velocidade de translação do objeto com relação a cada eixo do mundo
   * @returns {Cube} - Cube com as transformações fornecidas
   */
  constructor(pos, theta, escala, vtheta, vtrans) {
    var v = [
      vec3(-0.5, -0.5, 0.5),
      vec3(-0.5, 0.5, 0.5),
      vec3(0.5, 0.5, 0.5),
      vec3(0.5, -0.5, 0.5),
      vec3(-0.5, -0.5, -0.5),
      vec3(-0.5, 0.5, -0.5),
      vec3(0.5, 0.5, -0.5),
      vec3(0.5, -0.5, -0.5),
    ];
    // prettier-ignore
    var vertex = [
      v[1], v[0], v[3], // top
      v[3], v[2], v[1], 

      v[2], v[3], v[7], // right
      v[7], v[6], v[2], 

      v[3], v[0], v[4], // front
      v[4], v[7], v[3], 

      v[6], v[5], v[1], // back
      v[1], v[2], v[6], 

      v[4], v[5], v[6], // bottom
      v[6], v[7], v[4], 

      v[5], v[4], v[0], // left
      v[0], v[1], v[5],
    ];

    var vT = [vec2(0.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(1.0, 0.0)];

    // prettier-ignore
    var textureCordsBase = [
      vT[0], vT[1], vT[2], 
      vT[2], vT[3], vT[0],
    ];

    var textureCords = [].concat(...Array(6).fill(textureCordsBase));

    super(pos, theta, escala, vtheta, vtrans);
    super.setMesh(vertex);
    super.setTextureMap(textureCords);

    const faceColliderTop = new FaceCollider(vertex.slice(0, 6));
    const faceColliderRight = new FaceCollider(vertex.slice(6, 12));
    const faceColliderFront = new FaceCollider(vertex.slice(12, 18));
    const faceColliderBack = new FaceCollider(vertex.slice(18, 24));
    const faceColliderBottom = new FaceCollider(vertex.slice(24, 30));
    const faceColliderLeft = new FaceCollider(vertex.slice(30, 36));

    const cubeCollider = new CubeCollider(
      faceColliderTop,
      faceColliderRight,
      faceColliderFront,
      faceColliderBack,
      faceColliderBottom,
      faceColliderLeft,
      this
    );

    super.collider = cubeCollider;
  }

  setIndexInWorldVolume(x, y, z) {
    this.index = { x, y, z };
  }
}

class Collider {}

class CubeCollider extends Collider {
  /**
   * @param {FaceCollider} top - Define a face de cima do cubo
   * @param {FaceCollider} right - Define a face da direita do cubo
   * @param {FaceCollider} front - Define a face da frente do cubo
   * @param {FaceCollider} back - Define a face de trás do cubo
   * @param {FaceCollider} bottom - Define a face de baixo do cubo
   * @param {FaceCollider} left - Define a face da esquerda do cubo
   * @param {Cube} cube - Cubo contendo suas transformações
   * @returns {CubeCollider}
   */
  constructor(top, right, front, back, bottom, left, cube) {
    super();
    this._top = top;
    this._right = right;
    this._front = front;
    this._back = back;
    this._bottom = bottom;
    this._left = left;
    this._cube = cube;
  }

  /**
   * @param {Ray} ray - Raio disparado
   * @returns {string} - Face atingida
   */
  testCollision(ray, playerPos) {
    const topCollisionPoint = this.testFaceCollision(ray, this._top);

    const collisionFaces = [topCollisionPoint].filter((point) => !!point);

    if (!collisionFaces.length) {
      return;
    }

    // console.log("top collision", this._cube.index);

    // return collisionFaces.reduce((nearestCollision, actualCollision) => {
    //   const lengthToPoint = length(subtract(actualCollision, playerPos));
    //   const nearestLength = length(nearestCollision);

    //   if (lengthToPoint < nearestLength) {
    //     return actualCollision;
    //   }

    //   return nearestCollision;
    // }, collisionFaces[0]);

    return [this._cube.index.x, this._cube.index.y, this._cube.index.z + 1];
  }

  /**
   * @param {Ray} ray - Raio disparado
   * @param {FaceCollider} face - Face testada
   * @returns {vec3} - Ponto da colisão
   */
  testFaceCollision(ray, face) {
    const isFacingNormal = dot(ray.direction, face.normal) < 0;
    if (!isFacingNormal) return;

    const r0p0 = subtract(add(this._cube.pos, face.p0), ray.from);

    const alpha = dot(r0p0, face.normal) / dot(ray.direction, face.normal);

    const p0p = subtract(mult(alpha, ray.direction), subtract(add(this._cube.pos, face.p0), ray.from));
    const projection1 = dot(p0p, face.s1) / length(face.s1) + this._cube.escala[0] / 2;
    const projection2 = dot(p0p, face.s2) / length(face.s2) + this._cube.escala[1] / 2;

    if (projection1 > 0 && projection1 < this._cube.escala[0]) {
      if (projection2 > 0 && projection2 < this._cube.escala[1]) {
        const p = add(ray.from, mult(alpha, ray.direction));
        console.log(`Collided with face in point ${p}`);
        gCubeB.pos = p;
        return p;
      }
    }
  }
}

class Ray {
  /**
   * @param {Ray} from - Ponto inicial
   * @param {FaceCollider} direction - Direção do raio
   * @param {FaceCollider} length - Tamanho do raio
   * @returns {Ray}
   */
  constructor(from, direction, length) {
    this._from = from;
    this._direction = direction;
    this._length = length;
  }

  get from() {
    return this._from;
  }

  get direction() {
    return this._direction;
  }

  get length() {
    return this._length;
  }
}

class FaceCollider {
  /**
   * @param {vec3[]} vertexes - Array dos 4 vértices da face em ordem-anti-horária
   * @returns {FaceCollider}
   */
  constructor(vertexes) {
    this.vertexes = vertexes;
    this._s1 = subtract(this.v1, this.v0);
    this._s2 = subtract(this.v1, this.v4);
    this._normal = normalize(cross(this.s1, this.s2));
  }

  get v0() {
    return this.vertexes[1];
  }

  get v1() {
    return this.vertexes[0];
  }

  get v2() {
    return this.vertexes[5];
  }

  get v4() {
    return this.vertexes[2];
  }

  get normal() {
    return this._normal;
  }

  get s1() {
    return this._s1;
  }

  get s2() {
    return this._s2;
  }

  get p0() {
    return this.v0;
  }
}

class BlockController {
  constructor(textureConfig, gCtx) {
    this.textures = [Texture.Grass(), Texture.Rock(), Texture.Wood()];

    const diffuseTextureBuffer = new TextureBuffer(
      textureConfig.TEXTURE_BUFFER_SIZE,
      textureConfig.TEXTURE_SIZE,
      textureConfig.diffuseTextureUnitIndex,
      gCtx
    );

    // diffuseTextureBuffer.addTexture(this.textures[0]);
    this.textures.forEach((texture) => diffuseTextureBuffer.addTexture(texture));
    this.diffuseTextureBuffer = diffuseTextureBuffer;
    this.textureBuffer = diffuseTextureBuffer;
    this.cubeScale = vec3(50, 50, 50);
  }

  Grass(pos, theta) {
    const cube = new Cube(pos, theta, this.cubeScale, vec3(0, 0, 0), vec3(0, 0, 0));
    cube.setMaterial(Material.defaultMaterial());
    cube.setTexture(0);
    return cube;
  }

  Rock(pos, theta) {
    const cube = new Cube(pos, theta, this.cubeScale, vec3(0, 0, 0), vec3(0, 0, 0));
    cube.setMaterial(Material.defaultMaterial());
    cube.setTexture(1);
    return cube;
  }

  Wood(pos, theta) {
    const cube = new Cube(pos, theta, this.cubeScale, vec3(0, 0, 0), vec3(0, 0, 0));
    cube.setMaterial(Material.defaultMaterial());
    cube.setTexture(2);
    return cube;
  }
}

/* ==================================================================
    Classe criada para representar esferas

    Seu construtor possui os parâmetros de posicao, rotacao, escala, velocidade de rotacao, velocidade de translação,
    que definirão a matriz modelView gerada pela CPU na etapa de desenho e ndivisoes, que define a resolução da esfera (em nº de triângulos)
*/
class Sphere extends GameObject {
  /**
   * @param {vec3} pos - Translação do centro do objeto para as coordenadas do mundo
   * @param {vec3} theta - Rotação do objeto com relação a cada eixo do mundo
   * @param {vec3} escala - Escala do objeto com relação a cada eixo do mundo
   * @param {vec3} vtheta - Velocidade de rotação do objeto com relação a cada eixo do mundo
   * @param {vec3} vtrans - Velocidade de translação do objeto com relação a cada eixo do mundo
   * @param {vec3} ndivisoes - Número de divisões consecutivas de cada triângulo da esfera (balão) inicial
   * @returns {Sphere} - Sphere com as transformações e resolução fornecidas
   */

  constructor(pos, theta, escala, vtheta, vtrans, ndivisoes) {
    super(pos, theta, escala, vtheta, vtrans);

    let vp = [vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)];

    let vn = [vec3(-1.0, 0.0, 0.0), vec3(0.0, -1.0, 0.0), vec3(0.0, 0.0, -1.0)];

    let baseTriangles = [
      [vp[0], vp[1], vp[2]],
      [vp[0], vp[2], vn[1]],
      [vp[0], vn[2], vp[1]],
      [vp[0], vn[1], vn[2]],
      [vn[0], vp[2], vp[1]],
      [vn[0], vn[1], vp[2]],
      [vn[0], vp[1], vn[2]],
      [vn[0], vn[2], vn[1]],
    ];

    this.vertexes = [];
    for (let i = 0; i < baseTriangles.length; i++) {
      let a, b, c;
      [a, b, c] = baseTriangles[i];
      this.subdivideTriangles(a, b, c, ndivisoes);
    }

    super.setMesh(this.vertexes);
  }

  subdivideTriangles(a, b, c, ndivs) {
    if (ndivs > 0) {
      let ab = mix(a, b, 0.5);
      let bc = mix(b, c, 0.5);
      let ca = mix(c, a, 0.5);

      ab = normalize(ab);
      bc = normalize(bc);
      ca = normalize(ca);

      this.subdivideTriangles(a, ab, ca, ndivs - 1);
      this.subdivideTriangles(b, bc, ab, ndivs - 1);
      this.subdivideTriangles(c, ca, bc, ndivs - 1);
      this.subdivideTriangles(ab, bc, ca, ndivs - 1);
    } else {
      this.vertexes.push(a, b, c);
    }
  }
}

/**
 * Classe com representações de cores em vec4
 */

class Color {
  static Red = vec4(1, 0, 0, 1);
  static Green = vec4(0, 1, 0, 1);
  static Blue = vec4(0, 0, 1, 1);
  static Yellow = vec4(1, 1, 0, 1);
  static White = vec4(1, 1, 1, 1);
  static Black = vec4(0, 0, 0, 1);
  static DarkGrey = vec4(0.2, 0.2, 0.2, 1);

  /**
   * @returns {vec4} - Cor aleatória
   */

  static getRandomColor() {
    return vec4(Math.random(), Math.random(), Math.random(), 1);
  }
}

class Material {
  /**
   * @param {vec4} diffuse - Cor difusa do material
   * @param {vec4} ambient - Cor ambiente do material
   * @param {number} alphaSpecular - Concentração da reflexão especular
   * @returns {Material} - Material, que pode ser usado em diferentes objetos
   */
  constructor(diffuse, ambient, alphaSpecular) {
    this.diffuse = diffuse;
    this.ambient = ambient;
    this.alphaSpecular = alphaSpecular;
  }

  /**
   * @param {boolean} value - Valor da flag responsável por definir cores aleatórias para cada vértice
   */
  set randomVertexColor(value) {
    this.areRandomVertexColor = value;
  }

  static defaultMaterial() {
    return new Material(Color.White, Color.DarkGrey, 10000);
  }
}

/**
 * Classe representando uma luz pontual ou direcional
 */

class Light {
  /**
   * @param {vec4} pos - Posição da luz no mundo
   * @param {vec4} diffuse - Componente difusa
   * @param {vec4} specular - Componente especular
   * @param {vec4} ambient - Componente especular
   * @returns {Light} - Luz com as propriedades definidas
   */
  constructor(pos, diffuse, specular, ambient) {
    this.pos = pos;
    this.diffuse = diffuse;
    this.specular = specular;
    this.ambient = ambient;
  }
}

/**
 * Classe representando a câmera
 */

class Camera {
  /**
   * @param {vec3} pos - Posição da câmera no mundo
   * @param {vec3} initialAt - Ponto de visão inicial
   * @returns {Camera} - Câmera com as propriedades definidas
   */
  constructor(pos, initialAt) {
    this.pos = pos;
    this.initialAt = initialAt;
    this.theta = vec3(0, 0, 0);
    this.mDir = vec4(0, 0, 0, 0);
    this.up = vec4(0, 0, 1, 0);

    const forward = subtract(initialAt, pos);
    this.initialForward = forward;

    this.forward = forward;
    this.forward = vec4(forward[0], forward[1], forward[2], 0);
    this.dEA = length(this.forward);
  }

  /**
   * @param {vec3} at - Ponto de visão atual da câmera
   */
  set currentAt(at) {
    this._currentAt = at;
  }

  /**
   * @returns {vec3} currentAt - Ponto de visão atual da câmera
   */
  get currentAt() {
    return this._currentAt;
  }
}

class TextureBuffer {
  constructor(bufferSize, sizePerTexture, textureUnitIndex, gCtx) {
    this.buffer = new Uint8Array(4 * bufferSize * bufferSize);
    this.bufferSize = bufferSize;
    this.textureUnitIndex = textureUnitIndex;
    this.sizePerTexture = sizePerTexture;
    this.textureIndex = 0;
    this.texturePerBuffer = bufferSize / sizePerTexture;
    this.gCtx = gCtx;
  }

  /**
   * Adiciona textura ao buffer
   * @param {Texture} texture - Textura a ser adicionada no buffer
   */
  addTexture(texture) {
    const bufferSize = this.bufferSize;
    const sizePerTexture = this.sizePerTexture;

    const textureIndex = this.textureIndex;

    // const [start, end] = this.getTextureMappingByIndex(this.textureIndex++);
    const offset = textureIndex * sizePerTexture * 4;

    console.log(textureIndex);

    for (let s = 0; s < sizePerTexture * 4; s++) {
      for (let t = 0; t < sizePerTexture * 4; t++) {
        if (textureIndex == 1) {
          console.log(
            `Saving texture at buffer index: ${s * (textureIndex + 1) * sizePerTexture + t}, texture buffer: ${
              s * sizePerTexture + t
            }, s: ${s}, t: ${t}, textureIndex: ${textureIndex} with colour component: ${
              texture.getTextureBytes()[s * sizePerTexture * 4 + t]
            } and texture length: ${texture.getTextureBytes().length} offset: ${offset}`
          );
        }

        this.buffer[s * bufferSize * 4 + t + textureIndex * sizePerTexture * 4] =
          texture.getTextureBytes()[s * sizePerTexture * 4 + t];
      }
    }

    this.textureIndex += 1;
  }

  /**
   * @param {number} index - Retorna s e t da textura baseado no índice
   * @returns {vec2[]}
   */
  getTextureMappingByIndex(index) {
    if (index > this.textureIndex) {
      console.warn("No texture with given index", index);
      return [];
    }

    const bufferSize = this.bufferSize;
    const sizePerTexture = this.sizePerTexture;
    const offset = sizePerTexture / bufferSize;

    const colUnclamped0 = index * offset;
    const s = Math.floor(colUnclamped0) * offset;
    const t = colUnclamped0 % 1;

    console.log(s);

    return [vec2(t, s), vec2(t + offset, s + offset)];
  }

  /**
   * Associa o conjunto de texturas a uma unidade de textura na GPU
   */
  buildTexture() {
    const textureUnitRef = `TEXTURE${this.textureUnitIndex}`;

    const ctx = this.gCtx;
    var ctxTexture = ctx.createTexture();
    ctx.activeTexture(ctx[textureUnitRef]);
    ctx.bindTexture(ctx.TEXTURE_2D, ctxTexture);
    ctx.texImage2D(
      ctx.TEXTURE_2D,
      0,
      ctx.RGBA,
      this.bufferSize,
      this.bufferSize,
      0,
      ctx.RGBA,
      ctx.UNSIGNED_BYTE,
      this.buffer
    );
    ctx.generateMipmap(ctx.TEXTURE_2D);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
  }
}

class Texture {
  constructor(nRow, nCol, size, pattern) {
    this.N_ROWS = nRow;
    this.N_COLS = nCol;
    this.TEX_SIZE = size;

    this.texture = new Uint8Array(4 * size * size);
    this.pattern = pattern;

    if (this.pattern) this.buildTexture();
  }

  buildTexture() {
    const { pattern, TEX_SIZE: size, texture } = this;

    if (pattern == "GRASS") {
      for (var i = 0, ind = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          var c = Math.random() * 255;
          texture[ind++] = 0;
          texture[ind++] = c;
          texture[ind++] = 0;
          texture[ind++] = 255;
        }
      }
    }

    if (pattern == "ROCK") {
      for (var i = 0, ind = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          var offset = Math.random() * 100;
          var c = 50 + offset;

          texture[ind++] = c;
          texture[ind++] = c;
          texture[ind++] = c;
          texture[ind++] = 255;
        }
      }
    }

    if (pattern == "WOOD") {
      const goldenrod = vec3(218, 165, 32);
      const outline = mult(0.6, goldenrod);

      const patternX = 31 / 2;
      const patternY = 31 / 4;

      for (var i = 0, ind = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          var gridY = Math.ceil(j / patternY);

          var isWoodOutline = !Math.floor(i % (31 / 2)) || !Math.floor(j % (31 / 4));

          if (gridY % 2) {
            isWoodOutline = !Math.floor((i + patternX / 2) % (31 / 2)) || !Math.floor(j % (31 / 4));
          }

          var offset = Math.random() * 40 - 20;
          offset = Math.max(5, offset);
          offset = Math.min(15, offset);

          texture[ind++] = isWoodOutline ? outline[0] + offset : goldenrod[0] + offset;
          texture[ind++] = isWoodOutline ? outline[1] + offset : goldenrod[1] + offset;
          texture[ind++] = isWoodOutline ? outline[2] + offset : goldenrod[2] + offset;
          texture[ind++] = 255;
        }
      }
    }

    if (pattern == "BRICK") {
      const goldenrod = vec3(218, 165, 32);
      const outline = mult(0.6, goldenrod);

      const patternX = 31 / 2;
      const patternY = 31 / 4;

      for (var i = 0, ind = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          var gridY = Math.ceil(j / patternY);

          var isWoodOutline = !Math.floor(i % (31 / 2)) || !Math.floor(j % (31 / 4));

          if (gridY % 2) {
            isWoodOutline = !Math.floor((i + patternX / 2) % (31 / 2)) || !Math.floor(j % (31 / 4));
          }

          var offset = Math.random() * 40 - 20;
          offset = Math.max(5, offset);
          offset = Math.min(15, offset);

          texture[ind++] = isWoodOutline ? outline[0] + offset : goldenrod[0] + offset;
          texture[ind++] = isWoodOutline ? outline[1] + offset : goldenrod[1] + offset;
          texture[ind++] = isWoodOutline ? outline[2] + offset : goldenrod[2] + offset;
          texture[ind++] = 255;
        }
      }
    }
  }

  setTexture(texture) {
    this.texture = texture;
  }

  getTextureBytes() {
    return this.texture;
  }

  static Grass() {
    const texture = new Texture(32, 32, 32, "GRASS");
    return texture;
  }

  static Rock() {
    const texture = new Texture(32, 32, 32, "ROCK");
    return texture;
  }

  static Wood() {
    const texture = new Texture(32, 32, 32, "WOOD");
    return texture;
  }
}

class World {
  constructor(worldSize, worldHeight, textureConfig, gCtx) {
    this.worldSize = worldSize;
    this.worldHeight = worldHeight;
    this.worldVoxelMatrix = [];
    this.worldVoxelMatrixReferences = [];

    for (let x = 0; x < worldSize; x++) {
      this.worldVoxelMatrix[x] = [];
      this.worldVoxelMatrixReferences[x] = [];
      for (let y = 0; y < worldSize; y++) {
        this.worldVoxelMatrix[x][y] = [];
        this.worldVoxelMatrixReferences[x][y] = [];
        for (let z = 0; z < worldHeight; z++) {
          this.worldVoxelMatrix[x][y][z] = -1;
          this.worldVoxelMatrixReferences[x][y][z] = null;
        }
      }
    }

    const blockController = new BlockController(textureConfig, gCtx);
    this.blockController = blockController;
    this.blockByIndex = [
      (pos, theta) => blockController.Grass(pos, theta),
      (pos, theta) => blockController.Rock(pos, theta),
      (pos, theta) => blockController.Wood(pos, theta),
    ];
  }

  getBlockTypeByIndex(x, y, z) {
    const indexBlockToPlace = this.worldVoxelMatrix[x][y][z];
    return this.blockByIndex[indexBlockToPlace];
  }

  getBlockByIndex(x, y, z) {
    return this.worldVoxelMatrixReferences[x][y][z];
  }

  setBlockByIndex(x, y, z, block) {
    this.worldVoxelMatrixReferences[x][y][z] = block;
  }

  getNewBlockIndexByRayCollision(ray, playerPos) {
    for (let x = 0; x < this.worldSize; x++) {
      for (let y = 0; y < this.worldSize; y++) {
        for (let z = 0; z < this.worldHeight; z++) {
          const block = this.worldVoxelMatrixReferences[x][y][z];
          if (block !== null) {
            const collisionTested = block.testCollision(ray, playerPos);

            if (collisionTested?.length) {
              return ([x, y, z] = collisionTested);
            }
          }
        }
      }
    }
  }

  buildGround(groundLevel) {
    for (let x = 0; x < this.worldVoxelMatrix.length; x++) {
      for (let y = 0; y < this.worldVoxelMatrix[x].length; y++) {
        this.worldVoxelMatrix[x][y][groundLevel] = 0;
      }
    }
  }

  placeBlock(blockType, index) {
    const halfWL = Math.ceil(this.worldSize / 2);
    const halfWH = Math.ceil(this.worldHeight / 2);

    const blockToPlace = this.blockByIndex[blockType];

    if (blockToPlace) {
      const [x, y, z] = index;

      const block = blockToPlace(vec3((x - halfWL) * 50, (y - halfWL) * 50, (z - halfWH) * 50), vec3(0, 0, 0));

      this.setBlockByIndex(x, y, z, block);
      block.setIndexInWorldVolume(x, y, z);

      console.log(block.diffuseIndex);

      const [start, end] = this.blockController.diffuseTextureBuffer.getTextureMappingByIndex(block.diffuseIndex);

      // var vT = [vec2(0.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(1.0, 0.0)];
      var vT = [vec2(start[0], start[1]), vec2(end[0], start[1]), vec2(end[0], end[1]), vec2(start[0], end[1])];

      // prettier-ignore
      var textureCordsBase = [
        vT[0], vT[1], vT[2], 
        vT[2], vT[3], vT[0],
      ];

      var textureCords = [].concat(...Array(6).fill(textureCordsBase));
      // console.log(JSON.stringify({ textureCords }));

      console.log(JSON.stringify({ start: start, end: end }));

      block.setTextureMap(textureCords);
      gObjects.push(block);
    }
  }

  build() {
    for (let x = 0; x < this.worldVoxelMatrix.length; x++) {
      for (let y = 0; y < this.worldVoxelMatrix[x].length; y++) {
        for (let z = 0; z < this.worldVoxelMatrix[x][y].length; z++) {
          this.placeBlock(this.worldVoxelMatrix[x][y][z], [x, y, z]);
        }
      }
    }
    this.blockController.textureBuffer.buildTexture();
  }
}
