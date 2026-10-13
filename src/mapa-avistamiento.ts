
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'mapa-avistamiento',

  schema: {
    panel: ecs.eid,
    audioEntity: ecs.eid,
    audioUrl: ecs.string,
  },

  schemaDefaults: {
    audioUrl: 'assets/button click.mp3',
  },

  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('esperando')
      .initial()
      .listen(eid, ecs.input.SCREEN_TOUCH_START, () => {
        const config = schemaAttribute.get(eid)

        // Reproducir el sonido corto del botón
        if (config.audioEntity && config.audioUrl) {
          ecs.Audio.set(world, config.audioEntity, {
            url: config.audioUrl,
            loop: false,
            paused: false,
            volume: 1,
          })
        }

        // Mostrar el panel informativo
        if (config.panel) {
          world.events.dispatch(
            world.events.globalId,
            'MostrarPanelAves'
          )
        }
      })
  },
})
