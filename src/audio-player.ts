
import * as ecs from '@8thwall/ecs'

// Texturas del símbolo de reproducción y pausa.
import PLAY_TEXTURE from '../assets/textures/play.png'
import PAUSE_TEXTURE from '../assets/textures/pause.png'

// Guardamos el estado visual de cada reproductor.
const estados = new Map<any, any>()

ecs.registerComponent({
  name: 'audio-player',

  add: (world, component) => {
    const boton = component.eid

    // Los hijos de botonAudio, según la jerarquía actual:
    // 0 = Plane, 1 = Text, 2 = barras.
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

    const hijosBarras = Array.from(world.getChildren(barras)) as any[]

    // Guardamos las escalas originales para restaurarlas correctamente.
    const escalaTexto = {...ecs.Scale.get(world, texto)}
    const escalaGrupoBarras = {...ecs.Scale.get(world, barras)}

    const barrasInfo = hijosBarras.map((eid, indice) => ({
      eid,
      x: ecs.Scale.get(world, eid).x,
      y: ecs.Scale.get(world, eid).y,
      fase: indice * 0.8,
    }))

    estados.set(boton, {
      plane,
      texto,
      barras,
      escalaTexto,
      escalaGrupoBarras,
      barrasInfo,
      tiempo: 0,
    })

    // Al comenzar, el audio queda pausado.
    if (ecs.Audio.has(world, boton)) {
      ecs.Audio.mutate(world, boton, (audio) => {
        audio.paused = true
        return false
      })
    } else {
      console.warn('audio-player: falta el componente Audio en botonAudio.')
      return
    }

    // Mostramos el triángulo de reproducción.
    ecs.Material.mutate(world, plane, (material) => {
      material.textureSrc = PLAY_TEXTURE
      return false
    })

    // El texto aparece y las barras quedan ocultas.
    ecs.Scale.set(world, texto, escalaTexto)
    ecs.Scale.set(world, barras, {
      x: 0,
      y: 0,
      z: 0,
    })

    // Al tocar el cilindro rojo, reproducimos o pausamos.
    world.events.addListener(
      boton,
      ecs.input.SCREEN_TOUCH_START,
      () => {
        if (!ecs.Audio.has(world, boton)) {
          console.warn('Esta entidad no tiene componente Audio.')
          return
        }

        ecs.Audio.mutate(world, boton, (audio) => {
          audio.paused = !audio.paused
          return false
        })

        const audioActual = ecs.Audio.get(world, boton)
        const estado = estados.get(boton)

        if (!estado) return

        if (!audioActual.paused) {
          // Reproduciendo: símbolo de pausa, texto oculto y barras visibles.
          ecs.Material.mutate(world, estado.plane, (material) => {
            material.textureSrc = PAUSE_TEXTURE
            return false
          })

          ecs.Scale.set(world, estado.texto, {
            x: 0,
            y: 0,
            z: 0,
          })

          ecs.Scale.set(world, estado.barras, estado.escalaGrupoBarras)
        } else {
          // Pausado: triángulo, texto visible y barras ocultas.
          ecs.Material.mutate(world, estado.plane, (material) => {
            material.textureSrc = PLAY_TEXTURE
            return false
          })

          ecs.Scale.set(world, estado.texto, estado.escalaTexto)

          ecs.Scale.set(world, estado.barras, {
            x: 0,
            y: 0,
            z: 0,
          })

          // Dejamos todas las barras en su altura mínima.
          estado.barrasInfo.forEach((barra: any) => {
            ecs.Scale.set(world, barra.eid, {
              x: barra.x,
              y: barra.y,
              z: 0.15,
            })
          })
        }
      }
    )

    console.log('Reproductor de audio preparado.')
  },

  tick: (world, component) => {
    const estado = estados.get(component.eid)

    if (!estado || !ecs.Audio.has(world, component.eid)) return

    const audio = ecs.Audio.get(world, component.eid)

    // No animamos cuando el audio está pausado.
    if (audio.paused) return

    estado.tiempo += 0.12

    // Animación decorativa de las nueve barras.
    estado.barrasInfo.forEach((barra: any) => {
      const onda = (Math.sin(estado.tiempo + barra.fase) + 1) / 2
      const escalaZ = 0.15 + onda * 0.85

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
