
import * as ecs from '@8thwall/ecs'

const estados = new Map<any, any>()

function reproducirAudio(world: any, entidad: any) {
  if (!entidad || !ecs.Audio.has(world, entidad)) {
    console.warn('No se encontró el componente Audio:', entidad)
    return
  }

  ecs.Audio.mutate(world, entidad, (audio) => {
    audio.paused = false
    return false
  })
}

function ocultar(world: any, entidad: any) {
  if (entidad) {
    ecs.Hidden.set(world, entidad, {})
  }
}

function mostrar(world: any, entidad: any) {
  if (entidad) {
    ecs.Hidden.remove(world, entidad)
  }
}

function desactivar(world: any, entidad: any) {
  if (entidad && ecs.Disabled.has(world, entidad)) {
    ecs.Disabled.set(world, entidad, {})
  }
}

function activar(world: any, entidad: any) {
  if (!entidad) return

  if (ecs.Disabled.has(world, entidad)) {
    ecs.Disabled.remove(world, entidad)
  }

  ecs.Hidden.remove(world, entidad)
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
  if (!entidad) return

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
  if (!entidad) return

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
    toqueA: ecs.eid,
    toqueB: ecs.eid,
    toqueC: ecs.eid,

    pregunta2: ecs.eid,
    opcion2A: ecs.eid,
    opcion2B: ecs.eid,
    opcion2C: ecs.eid,
    toque2A: ecs.eid,
    toque2B: ecs.eid,
    toque2C: ecs.eid,

    pregunta3: ecs.eid,
    opcion3A: ecs.eid,
    opcion3B: ecs.eid,
    opcion3C: ecs.eid,
    toque3A: ecs.eid,
    toque3B: ecs.eid,
    toque3C: ecs.eid,

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
            cajas: [r.opcionA, r.opcionB, r.opcionC],
            toques: [r.toqueA, r.toqueB, r.toqueC],
            correcta: 1,
          },
          {
            titulo: r.pregunta2,
            cajas: [r.opcion2A, r.opcion2B, r.opcion2C],
            toques: [r.toque2A, r.toque2B, r.toque2C],
            correcta: 1,
          },
          {
            titulo: r.pregunta3,
            cajas: [r.opcion3A, r.opcion3B, r.opcion3C],
            toques: [r.toque3A, r.toque3B, r.toque3C],
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

        const ocultarPregunta = (i: number) => {
          const p = preguntas[i]
          if (!p) return

          ocultar(world, p.titulo)

          p.cajas.forEach((caja) => ocultar(world, caja))
          p.toques.forEach((plano) => ocultar(world, plano))
        }

        const mostrarPregunta = (i: number) => {
          const p = preguntas[i]
          if (!p) return

          activar(world, p.titulo)

          p.cajas.forEach((caja) => activar(world, caja))
          p.toques.forEach((plano) => activar(world, plano))
        }

        // Al iniciar, ocultar las preguntas 2 y 3.
        ocultarPregunta(1)
        ocultarPregunta(2)

        // Mostrar la pregunta 1.
        mostrarPregunta(0)

        ocultar(world, r.panelAprobado)
        ocultar(world, r.panelNoAprobado)
        ocultar(world, r.botonSiguiente)

        // Registrar los toques en los planos y animar las cajas.
        preguntas.forEach((p, indicePregunta) => {
          p.toques.forEach((plano, indiceOpcion) => {
            const caja = p.cajas[indiceOpcion]

            if (!plano || !caja) {
              console.warn(
                `Falta asignar el plano o la caja de la opción ${
                  ['A', 'B', 'C'][indiceOpcion]
                } de la pregunta ${indicePregunta + 1}.`
              )
              return
            }

            world.events.addListener(
              plano,
              ecs.input.SCREEN_TOUCH_START,
              () => {
                console.log(
                  `Toque: pregunta ${indicePregunta + 1}, opción ${
                    ['A', 'B', 'C'][indiceOpcion]
                  }`
                )

                if (
                  estado.terminado ||
                  estado.respondida ||
                  estado.indice !== indicePregunta
                ) {
                  return
                }

                estado.respondida = true

                const esCorrecta = indiceOpcion === p.correcta
                const cajaCorrecta = p.cajas[p.correcta]

                if (esCorrecta) {
                  estado.aciertos += 1
                  reproducirAudio(world, r.sonidoBien)

                  p.cajas.forEach((otraCaja, i) => {
                    if (i !== p.correcta) {
                      encoger(world, otraCaja)
                    }
                  })

                  destacar(world, cajaCorrecta)
                  console.log('Respuesta correcta')
                } else {
                  reproducirAudio(world, r.sonidoMal)

                  girar(world, caja)
                  destacar(world, cajaCorrecta)

                  p.cajas.forEach((otraCaja, i) => {
                    if (i !== indiceOpcion && i !== p.correcta) {
                      encoger(world, otraCaja)
                    }
                  })

                  world.time.setTimeout(() => {
                    encoger(world, caja)
                  }, 500)

                  console.log(
                    `Respuesta incorrecta. La correcta es ${
                      ['A', 'B', 'C'][p.correcta]
                    }`
                  )
                }

                mostrar(world, r.botonSiguiente)
              }
            )
          })
        })

        // Botón Siguiente.
        if (r.botonSiguiente) {
          world.events.addListener(
            r.botonSiguiente,
            ecs.input.SCREEN_TOUCH_START,
            () => {
              console.log('Toque detectado en Siguiente')

              if (!estado.respondida || estado.terminado) return

              ocultar(world, r.botonSiguiente)
              ocultarPregunta(estado.indice)

              if (estado.indice < preguntas.length - 1) {
                estado.indice += 1
                estado.respondida = false

                // Activar y mostrar la siguiente pregunta.
                mostrarPregunta(estado.indice)

                console.log(
                  `Pregunta ${estado.indice + 1} activada`
                )
              } else {
                estado.terminado = true

                if (estado.aciertos >= 2) {
                  mostrar(world, r.panelAprobado)
                  console.log(`Aprobaste: ${estado.aciertos}/3`)
                } else {
                  mostrar(world, r.panelNoAprobado)
                  console.log(`No aprobaste: ${estado.aciertos}/3`)
                }
              }
            }
          )
        }

        console.log('Cuestionario inicializado')
      })
  },
})
