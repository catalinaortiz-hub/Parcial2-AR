import * as ecs from '@8thwall/ecs'

import PLAY_TEXTURE from './assets/textures/play.png'
import PAUSE_TEXTURE from './assets/textures/pause.png'

// Guardamos el estado de cada reproductor.
const estados = new Map<any, any>()

ecs.registerComponent({
  name: 'audio-player',

  add: (world, component) => {
    const boton = component.eid

    // Obtenemos los hijos de botonAudio.
    const hijos = Array.from(world.getChildren(boton)) as any[]

    if (hijos.length < 3) {
      console.error(
        'audio-player: revisa que Plane, Text y barras sean hijos de botonAudio.'
      )
      return
    }

    const plane = hijos[0]
    const texto = hijos[1]
    const barras = hijos[2]

    // Obtenemos las nueve barras.
    const hijosBarras = Array.from(world.getChildren(barras)) as any[]

    // Guardamos la escala original de cada barra.
    const barrasInfo = hijosBarras.map((eid, indice) => {
      const escala = ecs.Scale.get(world, eid)

      return {
        eid,
        x: escala.x,
        y: escala.y,
        z: escala.z,
        fase: indice * 0.8,
      }
    })

    estados.set(boton, {
      plane,
      texto,
      barras,
      barrasInfo,
      tiempo: 0,
    })

    // Comprobamos que exista el componente Audio.
    if (!ecs.Audio.has(world, boton)) {
      console.warn('No se encontró el componente Audio en botonAudio.')
      return
    }

    // No modificamos las texturas ni ocultamos elementos.
    // Plane, Text y barras conservan su apariencia en Studio.

    // Al tocar el botón, alternamos reproducción y pausa.
    world.events.addListener(
      boton,
      ecs.input.SCREEN_TOUCH_START,
      () => {
        if (!ecs.Audio.has(world, boton)) {
          console.warn('No se encontró el componente Audio en botonAudio.')
          return
        }

        ecs.Audio.mutate(world, boton, (audio) => {
          audio.paused = !audio.paused
          return false
        })

        const audioActual = ecs.Audio.get(world, boton)

        // Al pausar, restauramos la escala original de las barras.
        if (audioActual.paused) {
          const estado = estados.get(boton)
          if (!estado) return

          estado.barrasInfo.forEach((barra: any) => {
            ecs.Scale.set(world, barra.eid, {
              x: barra.x,
              y: barra.y,
              z: barra.z,
            })
          })

          estado.tiempo = 0
        }
      }
    )

    console.log('Reproductor de audio preparado.')
  },

  tick: (world, component) => {
    const estado = estados.get(component.eid)

    if (!estado || !ecs.Audio.has(world, component.eid)) return

    const audio = ecs.Audio.get(world, component.eid)

    // No animamos mientras el audio está pausado.
    if (audio.paused) return

    estado.tiempo += 0.12

    // Animación decorativa de las nueve barras.
    estado.barrasInfo.forEach((barra: any) => {
      const onda = (Math.sin(estado.tiempo + barra.fase) + 1) / 2

      // La escala Z oscila entre el 15 % y el 100 %.
      const escalaZ = barra.z * (0.15 + onda * 0.85)

      ecs.Scale.set(world, barra.eid, {
        x: barra.x,
        y: barra.y,
        z: escalaZ,
      })
    })
  },

  remove: (_world, component) => {
    estados.delete(component.eid)
  },
})