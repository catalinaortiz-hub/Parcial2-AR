
import * as ecs from '@8thwall/ecs'

const estados = new Map<any, any>()

function reproducirAudio(world: any, entidad: any) {
  if (!entidad || !ecs.Audio.has(world, entidad)) {
    console.warn('No se encontró el componente Audio.')
    return
  }

  ecs.Audio.mutate(world, entidad, (audio) => {
    audio.paused = false
    return false
  })
}

function ocultar(world: any, entidad: any) {
  if (entidad) ecs.Hidden.set(world, entidad, {})
}

function mostrar(world: any, entidad: any) {
  if (entidad) ecs.Hidden.remove(world, entidad)
}

function encoger(world: any, entidad: any) {
  if (!entidad) return

  ecs.ScaleAnimation.set(world, entidad, {
    autoFrom: true,
    toX: 0,
    toY: 0,
    toZ: 0,
    duration: 500,
    loop: false,
    easeOut: true,
  })
}

function girar(world: any, entidad: any) {
  ecs.RotateAnimation.set(world, entidad, {
    autoFrom: true,
    toX: 360,
    toY: 0,
    toZ: 0,
    duration: 500,
    loop: false,
    easeOut: true,
    shortestPath: false,
  })
}

function destacar(world: any, entidad: any) {
  ecs.ScaleAnimation.set(world, entidad, {
    autoFrom: true,
    toX: 0.09,
    toY: 0.09,
    toZ: 0.09,
    duration: 250,
    loop: false,
    easeOut: true,
  })
}

ecs.registerComponent({
  name: 'quiz-controller',

  schema: {
    pregunta1: ecs.eid,
    opcionA: ecs.eid,
    opcionB: ecs.eid,
    opcionC: ecs.eid,

    pregunta2: ecs.eid,
    opcion2A: ecs.eid,
    opcion2B: ecs.eid,
    opcion2C: ecs.eid,

    pregunta3: ecs.eid,
    opcion3A: ecs.eid,
    opcion3B: ecs.eid,
    opcion3C: ecs.eid,

    sonidoBien: ecs.eid,
    sonidoMal: ecs.eid,
    botonSiguiente: ecs.eid,

    panelAprobado: ecs.eid,
    panelNoAprobado: ecs.eid,
  },

  schemaDefaults: {},

  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .onEnter(() => {
        const r = schemaAttribute.get(eid)

        const preguntas = [
          {
            titulo: r.pregunta1,
            opciones: [r.opcionA, r.opcionB, r.opcionC],
            correcta: 1,
          },
          {
            titulo: r.pregunta2,
            opciones: [r.opcion2A, r.opcion2B, r.opcion2C],
            correcta: 1,
          },
          {
            titulo: r.pregunta3,
            opciones: [r.opcion3A, r.opcion3B, r.opcion3C],
            correcta: 0,
          },
        ]

        const estado = {
          indice: 0,
          respondida: false,
          aciertos: 0,
          terminado: false,
        }

        estados.set(eid, estado)

        const ocultarPregunta = (indice: number) => {
          const p = preguntas[indice]
          if (!p) return

          ocultar(world, p.titulo)
          p.opciones.forEach((opcion) => ocultar(world, opcion))
        }

        const mostrarPregunta = (indice: number) => {
          const p = preguntas[indice]
          if (!p) return

          mostrar(world, p.titulo)
          p.opciones.forEach((opcion) => mostrar(world, opcion))
        }

        // Inicio: pregunta 1 visible, preguntas 2 y 3 ocultas.
        ocultarPregunta(1)
        ocultarPregunta(2)
        mostrarPregunta(0)

        ocultar(world, r.panelAprobado)
        ocultar(world, r.panelNoAprobado)
        ocultar(world, r.botonSiguiente)

        // Registrar las respuestas de las tres preguntas.
        preguntas.forEach((pregunta, indicePregunta) => {
          pregunta.opciones.forEach((entidadOpcion, indiceOpcion) => {
            if (!entidadOpcion) {
              console.warn(
                `Falta asignar una opción de la pregunta ${indicePregunta + 1}`
              )
              return
            }

            world.events.addListener(
              entidadOpcion,
              ecs.input.SCREEN_TOUCH_START,
              () => {
                if (
                  estado.terminado ||
                  estado.respondida ||
                  estado.indice !== indicePregunta
                ) {
                  return
                }

                estado.respondida = true

                const correcta =
                  indiceOpcion === pregunta.correcta

                if (correcta) {
                  estado.aciertos += 1
                  reproducirAudio(world, r.sonidoBien)

                  pregunta.opciones.forEach((opcion, i) => {
                    if (i !== pregunta.correcta) {
                      encoger(world, opcion)
                    }
                  })

                  destacar(
                    world,
                    pregunta.opciones[pregunta.correcta]
                  )

                  console.log(
                    `¡Correcto! Pregunta ${indicePregunta + 1}`
                  )
                } else {
                  reproducirAudio(world, r.sonidoMal)

                  const opcionElegida = pregunta.opciones[indiceOpcion]
                  const opcionCorrecta =
                    pregunta.opciones[pregunta.correcta]

                  girar(world, opcionElegida)
                  destacar(world, opcionCorrecta)

                  pregunta.opciones.forEach((opcion, i) => {
                    if (
                      i !== indiceOpcion &&
                      i !== pregunta.correcta
                    ) {
                      encoger(world, opcion)
                    }
                  })

                  // Tras girar, desaparece también la opción elegida.
                  world.time.setTimeout(() => {
                    encoger(world, opcionElegida)
                  }, 500)

                  console.log(
                    `Incorrecto. La respuesta correcta era ${
                      ['A', 'B', 'C'][pregunta.correcta]
                    }.`
                  )
                }

                // Permitir avanzar solo después de responder.
                mostrar(world, r.botonSiguiente)
              }
            )
          })
        })

        // El mismo botón avanza entre preguntas y muestra el resultado.
        if (r.botonSiguiente) {
          world.events.addListener(
            r.botonSiguiente,
            ecs.input.SCREEN_TOUCH_START,
            () => {
              if (!estado.respondida || estado.terminado) return

              ocultar(world, r.botonSiguiente)
              ocultarPregunta(estado.indice)

              if (estado.indice < preguntas.length - 1) {
                estado.indice += 1
                estado.respondida = false

                mostrarPregunta(estado.indice)

                console.log(
                  `Pregunta ${estado.indice + 1} de ${preguntas.length}`
                )
                console.log('Se está mostrando la pregunta 2')
              } else {
                estado.terminado = true

                if (estado.aciertos >= 2) {
                  mostrar(world, r.panelAprobado)
                  console.log(
                    `¡Aprobaste! Puntaje: ${estado.aciertos}/3`
                  )
                } else {
                  mostrar(world, r.panelNoAprobado)
                  console.log(
                    `No aprobaste. Puntaje: ${estado.aciertos}/3`
                  )
                }
              }
            }
          )
        }

        console.log('Quiz preparado: 3 preguntas.')
      })
  },
})
