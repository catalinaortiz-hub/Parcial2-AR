import * as ecs from '@8thwall/ecs'

type BarraInfo = {
  eid: ecs.Eid,
  x: number,
  y: number,
  z: number,
  fase: number,
}

type EstadoReproductor = {
  barrasInfo: BarraInfo[],
  tiempo: number,
  pausado: boolean,
  avisoEmitido: boolean,
  callback: () => void,
}

// Cada mundo conserva el estado y los listeners de sus reproductores.
const estadosPorMundo = new WeakMap<
  ecs.World,
  Map<ecs.Eid, EstadoReproductor>
>()

const obtenerEstados = (world: ecs.World) => {
  let estados = estadosPorMundo.get(world)

  if (!estados) {
    estados = new Map()
    estadosPorMundo.set(world, estados)
  }

  return estados
}

// Las barras del proyecto son cápsulas.
// Las buscamos entre los descendientes sin depender del orden.
const obtenerBarras = (
  world: ecs.World,
  boton: ecs.Eid
): BarraInfo[] => {
  const barras: ecs.Eid[] = []

  const recorrer = (padre: ecs.Eid) => {
    for (const hijo of world.getChildren(padre)) {
      if (
        ecs.CapsuleGeometry.has(world, hijo) &&
        ecs.Scale.has(world, hijo)
      ) {
        barras.push(hijo)
      }

      recorrer(hijo)
    }
  }

  recorrer(boton)

  return barras.map((eid, indice) => {
    const escala = ecs.Scale.get(world, eid)

    return {
      eid,
      x: escala.x,
      y: escala.y,
      z: escala.z,
      fase: indice * 0.8,
    }
  })
}

const restaurarBarras = (
  world: ecs.World,
  estado: EstadoReproductor
) => {
  estado.barrasInfo.forEach((barra) => {
    if (ecs.Scale.has(world, barra.eid)) {
      ecs.Scale.set(world, barra.eid, {
        x: barra.x,
        y: barra.y,
        z: barra.z,
      })
    }
  })

  estado.tiempo = 0
}

ecs.registerComponent({
  name: 'audio-player',

  add: (world, component) => {
    // Capturamos el eid porque component es un cursor reutilizado.
    const boton = component.eid

    const estado: EstadoReproductor = {
      barrasInfo: obtenerBarras(world, boton),
      tiempo: 0,
      pausado:
        !ecs.Audio.has(world, boton) ||
        ecs.Audio.get(world, boton).paused,
      avisoEmitido: false,

      callback: () => {
        if (!ecs.Audio.has(world, boton)) {
          console.warn(
            'audio-player: no se encontró Audio en botonAudio.'
          )
          return
        }

        // Alternar reproducción y pausa.
        ecs.Audio.mutate(world, boton, (audio) => {
          audio.paused = !audio.paused
          return false
        })

        estado.pausado = ecs.Audio.get(world, boton).paused

        if (estado.pausado) {
          restaurarBarras(world, estado)
        }
      },
    }

    obtenerEstados(world).set(boton, estado)

    world.events.addListener(
      boton,
      ecs.input.SCREEN_TOUCH_START,
      estado.callback
    )
  },

  tick: (world, component) => {
    const estado = obtenerEstados(world).get(component.eid)

    if (!estado || !ecs.Audio.has(world, component.eid)) {
      return
    }

    // Reintentar si los descendientes no estaban listos al iniciar.
    if (estado.barrasInfo.length === 0) {
      estado.barrasInfo = obtenerBarras(world, component.eid)

      if (
        estado.barrasInfo.length === 0 &&
        !estado.avisoEmitido
      ) {
        console.warn(
          'audio-player: no se encontraron barras con geometría Capsule.'
        )
        estado.avisoEmitido = true
      }
    }

    const pausado = ecs.Audio.get(world, component.eid).paused

    if (pausado) {
      // También restaurar si otro script pausa el audio.
      if (!estado.pausado) {
        restaurarBarras(world, estado)
      }

      estado.pausado = true
      return
    }

    estado.pausado = false

    // Velocidad independiente de los FPS.
    // Equivale a los 0.12 radianes por frame originales a 60 FPS.
    estado.tiempo += (world.time.delta / 1000) * 7.2

    estado.barrasInfo.forEach((barra) => {
      if (!ecs.Scale.has(world, barra.eid)) {
        return
      }

      const onda = (
        Math.sin(estado.tiempo + barra.fase) + 1
      ) / 2

      // Conservar X/Y y animar Z entre 15 % y 100 %.
      ecs.Scale.set(world, barra.eid, {
        x: barra.x,
        y: barra.y,
        z: barra.z * (0.15 + onda * 0.85),
      })
    })
  },

  remove: (world, component) => {
    const estados = obtenerEstados(world)
    const estado = estados.get(component.eid)

    if (!estado) {
      return
    }

    world.events.removeListener(
      component.eid,
      ecs.input.SCREEN_TOUCH_START,
      estado.callback
    )

    restaurarBarras(world, estado)
    estados.delete(component.eid)
  },
})