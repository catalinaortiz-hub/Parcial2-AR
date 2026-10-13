
import * as ecs from '@8thwall/ecs'

const listenersPorAve = new Map<any, Array<{
  eid: any,
  callback: () => void,
}>>()

ecs.registerComponent({
  name: 'bird-info-panel',

  schema: {
    botonAlimentacion: ecs.eid,
    botonComportamiento: ecs.eid,
    botonHabitat: ecs.eid,

    panelAlimentacion: ecs.eid,
    panelComportamiento: ecs.eid,
    panelHabitat: ecs.eid,

    sonidoBotones: ecs.eid,
  },

  add: (world, component) => {
    const {
      botonAlimentacion,
      botonComportamiento,
      botonHabitat,
      panelAlimentacion,
      panelComportamiento,
      panelHabitat,
      sonidoBotones,
    } = component.schema

    const botones = [
      botonAlimentacion,
      botonComportamiento,
      botonHabitat,
    ]

    const paneles = [
      panelAlimentacion,
      panelComportamiento,
      panelHabitat,
    ]

    // Guardar las posiciones originales de los botones.
    const posiciones = botones.map((eid) => {
      const p = ecs.Position.get(world, eid)

      return {
        x: p.x,
        y: p.y,
        z: p.z,
      }
    })

    // Ordenar las posiciones de izquierda a derecha.
    const indicesPosiciones = [0, 1, 2].sort((a, b) => {
      return posiciones[a].x - posiciones[b].x
    })

    const posicionesMenu = indicesPosiciones.map((indice) => {
      return posiciones[indice]
    })

    // Orden actual de los botones.
    let ordenActual = [...botones].sort((a, b) => {
      const pa = ecs.Position.get(world, a)
      const pb = ecs.Position.get(world, b)

      return pa.x - pb.x
    })

    // Guardar las posiciones originales de las tarjetas.
    const posicionesPaneles = paneles.map((panel) => {
      const p = ecs.Position.get(world, panel)

      return {
        x: p.x,
        y: p.y,
        z: p.z,
      }
    })

    // Ocultar todas las tarjetas al iniciar.
    paneles.forEach((panel) => {
      ecs.Hidden.set(world, panel, {})
    })

    let panelActivo: any = null

    const ocultarPaneles = () => {
      paneles.forEach((panel) => {
        if (ecs.PositionAnimation.has(world, panel)) {
          ecs.PositionAnimation.remove(world, panel)
        }

        ecs.Hidden.set(world, panel, {})
      })

      panelActivo = null
    }

    // Animar la entrada de una tarjeta desde la izquierda.
    const mostrarPanelAnimado = (panel: any, indice: number) => {
      const destino = posicionesPaneles[indice]
      const desplazamiento = 1.2

      // Cancelar cualquier animación anterior.
      if (ecs.PositionAnimation.has(world, panel)) {
        ecs.PositionAnimation.remove(world, panel)
      }

      // Colocar la tarjeta a la izquierda de su destino.
      ecs.Position.set(world, panel, {
        x: destino.x - desplazamiento,
        y: destino.y,
        z: destino.z,
      })

      // Hacer visible la tarjeta.
      ecs.Hidden.remove(world, panel)

      // Deslizarla hasta su posición original.
      ecs.PositionAnimation.set(world, panel, {
        autoFrom: true,
        toX: destino.x,
        toY: destino.y,
        toZ: destino.z,
        duration: 350,
        loop: false,
        easeOut: true,
        easingFunction: 'Cubic',
      })
    }

    // Animar el menú para que el botón seleccionado
    // pase a la posición izquierda.
    const moverMenu = (botonSeleccionado: any) => {
      const otrosBotones = ordenActual.filter(
        (boton) => boton !== botonSeleccionado
      )

      ordenActual = [botonSeleccionado, ...otrosBotones]

      ordenActual.forEach((boton, indice) => {
        if (ecs.PositionAnimation.has(world, boton)) {
          ecs.PositionAnimation.remove(world, boton)
        }

        const destino = posicionesMenu[indice]

        ecs.PositionAnimation.set(world, boton, {
          autoFrom: true,
          toX: destino.x,
          toY: destino.y,
          toZ: destino.z,
          duration: 350,
          loop: false,
          easeOut: true,
          easingFunction: 'Cubic',
        })
      })
    }

    const listeners: Array<{
      eid: any,
      callback: () => void,
    }> = []

    botones.forEach((boton, indice) => {
      const panel = paneles[indice]

      const callback = () => {
        // Reproducir el sonido compartido.
        if (ecs.Audio.has(world, sonidoBotones)) {
          ecs.Audio.mutate(world, sonidoBotones, (audio) => {
            audio.paused = true
            return false
          })

          ecs.Audio.mutate(world, sonidoBotones, (audio) => {
            audio.paused = false
            return false
          })
        } else {
          console.warn(
            'bird-info-panel: no se encontró Audio en SonidoBotones.'
          )
        }

        // Mover el botón seleccionado a la izquierda.
        moverMenu(boton)

        // Si se pulsa la tarjeta abierta, cerrarla.
        if (panelActivo === panel) {
          ocultarPaneles()
          return
        }

        // Ocultar las anteriores y mostrar la seleccionada.
        ocultarPaneles()
        mostrarPanelAnimado(panel, indice)
        panelActivo = panel
      }

      world.events.addListener(
        boton,
        ecs.input.SCREEN_TOUCH_START,
        callback
      )

      listeners.push({ eid: boton, callback })
    })

    listenersPorAve.set(component.eid, listeners)

    console.log('bird-info-panel preparado.')
  },

  remove: (world, component) => {
    const listeners = listenersPorAve.get(component.eid)

    if (listeners) {
      listeners.forEach(({ eid, callback }) => {
        world.events.removeListener(
          eid,
          ecs.input.SCREEN_TOUCH_START,
          callback
        )
      })
    }

    listenersPorAve.delete(component.eid)
  },
})
