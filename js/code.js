"use strict";

import * as cg from "./cg.js";
import * as m4 from "./glmjs/mat4.js";
import { length, random, transformMat4 } from "./glmjs/vec3.js";
import * as twgl from "./twgl-full.module.js";
function nueva_region() {
  let terreno = new Array(80);
  const rndb = (a, b) => Math.random() * (b - a) + a; //valor aleatorio entre a y b
  for (let i = -40; i < 40; i++) {
    terreno[i] = new Array(80);
    for (let j = -40; j < 40; j++) {
      let sup = rndb(0, 3);
      terreno[i][j] = [i, -2 - sup, j, Math.floor(sup)];
    }
  }
  // console.log(terreno);
  return terreno;
}

function incrementar_region(Actual) {
  let terrenoActual = Actual;
  // console.log(terrenoActual[-40][1]);

  // let terrenoNuevo = new Array(terrenoActual.length + 2);
  // const rndb = (a, b) => Math.random() * (b - a) + a; //valor aleatorio entre a y b

  // for (let i = -terrenoNuevo.length / 2; i < terrenoNuevo.length / 2; i++) {
  //   terrenoNuevo[i] = new Array(terrenoNuevo.length);
  //   console.log("aaaa", terrenoNuevo.length);
  //   for (let j = -terrenoNuevo.length / 2; j < terrenoNuevo.length / 2; j++) {
  //     if (i == -terrenoNuevo.length / 2 || i == terrenoNuevo.length / 2 - 1 || j == -terrenoNuevo.length / 2 || j == +terrenoNuevo.length / 2 - 1) {
  //       let sup = rndb(0, 3);
  //       terrenoNuevo[i][j] = [i, -2 - sup, j, Math.floor(sup)];
  //       // terrenoNuevo[i][j] = [i, -2, j, 1];
  //     } else {
  //       // console.log("Aqui", terrenoActual[i][j]);
  //       terrenoNuevo[i][j] = terrenoActual[i][j];
  //       // console.log("Aqui2", terrenoNuevo[i][j]);
  //     }
  //   }
  // }
  // return terrenoNuevo;
  return terrenoActual;
}

async function main() {
  const gl = document.querySelector("#canvitas").getContext("webgl2");
  if (!gl) return undefined !== console.log("WebGL 2.0 not supported");

  twgl.setDefaults({ attribPrefix: "a_" });

  const vertSrc = await fetch("glsl/vertexSrc.vert").then((r) => r.text());
  const fragSrc = await fetch("glsl/fragmentSrc.frag").then((r) => r.text());
  const meshProgramInfo = twgl.createProgramInfo(gl, [vertSrc, fragSrc]);
  const cubex = await cg.loadObj("models/cubito/cubito.obj", gl, meshProgramInfo);
  const plataforma = await cg.loadObj("models/gear/cubito.obj", gl, meshProgramInfo);
  const piso1 = await cg.loadObj("models/cubo_verde1/cubito.obj", gl, meshProgramInfo);
  const piso2 = await cg.loadObj("models/cubo_verde2/cubito.obj", gl, meshProgramInfo);
  const tierra = await cg.loadObj("models/tierra/cubito.obj", gl, meshProgramInfo);

  const cam = new cg.Cam([10, 9, 43]);
  const rotationAxis = new Float32Array([0, 1, 0]);

  let aspect = 1;
  let deltaTime = 0;
  let lastTime = 0;
  let theta = 0;

  let terreno = nueva_region();
  // console.log(terreno[-10][0][1]);
  const numObjs = 3;
  const positions = new Array(numObjs);
  const desplazamiento = new Array(numObjs);

  const rndb = (a, b) => Math.random() * (b - a) + a; //valor aleatorio entre a y b
  for (let i = 0; i < numObjs; i++) {
    positions[i] = [rndb(2.0, 14.0), 2, rndb(2.0, 14.0)];
    let v = rndb(0, 2);
    if (v > 1) {
      desplazamiento[i] = [-3 - v, 0, +3 + v];
    } else {
      desplazamiento[i] = [+3 + v, 0, -3 - v];
    }
  }

  const uniforms = {
    u_world: m4.create(),
    u_projection: m4.create(),
    u_view: cam.viewM4,
  };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  function render(elapsedTime) {
    elapsedTime *= 1e-3;
    deltaTime = elapsedTime - lastTime;
    lastTime = elapsedTime;

    if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      aspect = gl.canvas.width / gl.canvas.height;
    }

    gl.clearColor(0.4, 0.5, 0.9, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta = elapsedTime;
    m4.identity(uniforms.u_projection);
    m4.perspective(uniforms.u_projection, cam.zoom, aspect, 0.1, 100);
    gl.useProgram(meshProgramInfo.program);

    for (let i = 0; i < numObjs; i++) {
      m4.identity(uniforms.u_world);
      m4.translate(uniforms.u_world, uniforms.u_world, positions[i]);
      m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);
      twgl.setUniforms(meshProgramInfo, uniforms);

      for (const { bufferInfo, vao, material } of cubex) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(meshProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }

      for (let j = 0; j < 3; j++) {
        if (j == 0 || j == 2) {
          if (positions[i][j] > 18.0) {
            positions[i][j] = 18.0;
            desplazamiento[i][j] = -desplazamiento[i][j];
          } else if (positions[i][j] < 2) {
            positions[i][j] = 2;
            desplazamiento[i][j] = -desplazamiento[i][j];
          }
          //rebote
          for (let ca = 0; ca < numObjs; ca++) {
            if (i != ca) {
              var dx = positions[i][0] - positions[ca][0];
              var dz = positions[i][2] - positions[ca][2];
              var distancia = Math.sqrt(dx * dx + dz * dz);
              if (distancia < 2) {
                desplazamiento[i][j] = -desplazamiento[i][j];
              }
            }
          }
          positions[i][j] += desplazamiento[i][j] * deltaTime;
        }
      }
    }
    for (let i = -terreno.length / 2; i < terreno.length / 2; i += 2) {
      // var cont = 0;
      for (let j = -terreno.length / 2; j < terreno.length / 2; j += 2) {
        m4.identity(uniforms.u_world);
        // console.log(terreno[i][j][0]);
        m4.translate(uniforms.u_world, uniforms.u_world, [terreno[i][j][0], terreno[i][j][1], terreno[i][j][2]]);
        twgl.setUniforms(meshProgramInfo, uniforms);
        if (terreno[i][j][3] == 1) {
          for (const { bufferInfo, vao, material } of piso2) {
            gl.bindVertexArray(vao);
            twgl.setUniforms(meshProgramInfo, {}, material);
            twgl.drawBufferInfo(gl, bufferInfo);
          }
        } else if (terreno[i][j][3] == 2) {
          for (const { bufferInfo, vao, material } of tierra) {
            gl.bindVertexArray(vao);
            twgl.setUniforms(meshProgramInfo, {}, material);
            twgl.drawBufferInfo(gl, bufferInfo);
          }
        } else if (terreno[i][j][3] == 0) {
          for (const { bufferInfo, vao, material } of piso1) {
            gl.bindVertexArray(vao);
            twgl.setUniforms(meshProgramInfo, {}, material);
            twgl.drawBufferInfo(gl, bufferInfo);
          }
        }
        // cont += 1;
      }
    }

    for (let i = -terreno.length / 2; i < terreno.length / 2; i += 2) {
      for (let j = -10; j < -4; j += 2) {
        for (let k = -terreno.length / 2; k < terreno.length / 2; k += 2) {
          m4.identity(uniforms.u_world);
          m4.translate(uniforms.u_world, uniforms.u_world, [i, j, k]);
          twgl.setUniforms(meshProgramInfo, uniforms);
          for (const { bufferInfo, vao, material } of tierra) {
            gl.bindVertexArray(vao);
            twgl.setUniforms(meshProgramInfo, {}, material);
            twgl.drawBufferInfo(gl, bufferInfo);
          }
        }
      }
    }

    for (let i = 0; i <= 20; i += 2) {
      for (let j = 0; j <= 4; j += 2) {
        for (let k = 0; k <= 20; k += 2) {
          m4.identity(uniforms.u_world);
          m4.translate(uniforms.u_world, uniforms.u_world, [i, j, k]);
          if (j == 0) {
            m4.rotate(uniforms.u_world, uniforms.u_world, theta, rotationAxis);

            twgl.setUniforms(meshProgramInfo, uniforms);
            for (const { bufferInfo, vao, material } of plataforma) {
              gl.bindVertexArray(vao);
              twgl.setUniforms(meshProgramInfo, {}, material);
              twgl.drawBufferInfo(gl, bufferInfo);
            }
          }
          if (j == 2) {
            m4.rotate(uniforms.u_world, uniforms.u_world, theta, [0, 0, 1]);
            twgl.setUniforms(meshProgramInfo, uniforms);
            if (k == 0 || k == 20 || i == 0 || i == 20) {
              for (const { bufferInfo, vao, material } of plataforma) {
                gl.bindVertexArray(vao);
                twgl.setUniforms(meshProgramInfo, {}, material);
                twgl.drawBufferInfo(gl, bufferInfo);
              }
            }
          }
        }
      }
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  document.addEventListener("keydown", (e) => {
    /**/ if (e.key === "w") {
      cam.processKeyboard(cg.FORWARD, deltaTime);
      // terreno = incrementar_region(terreno);
    } else if (e.key === "a") {
      cam.processKeyboard(cg.LEFT, deltaTime);
      // terreno = incrementar_region(terreno);
    } else if (e.key === "s") {
      cam.processKeyboard(cg.BACKWARD, deltaTime);
      // terreno = incrementar_region(terreno);
    } else if (e.key === "d") {
      cam.processKeyboard(cg.RIGHT, deltaTime);
      // terreno = incrementar_region(terreno);
    }
  });
  document.addEventListener("mousemove", (e) => cam.movePov(e.x, e.y));
  document.addEventListener("mousedown", (e) => cam.startMove(e.x, e.y));
  document.addEventListener("mouseup", () => cam.stopMove());
  document.addEventListener("wheel", (e) => cam.processScroll(e.deltaY));
}

main();
