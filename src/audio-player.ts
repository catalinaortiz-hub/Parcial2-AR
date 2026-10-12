
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'audio-player',

  add: (world, component) => {
    // El audio comienza pausado.
    if (ecs.Audio.has(world, component.eid)) {
      ecs.Audio.mutate(world, component.eid, (audio) => {
        audio.paused = true
        return false
      })
    }

    // Al tocar la entidad, alterna entre reproducir y pausar.
    world.events.addListener(
      component.eid,
      ecs.input.SCREEN_TOUCH_START,
      () => {
        if (!ecs.Audio.has(world, component.eid)) {
          console.warn('Esta entidad no tiene componente Audio.')
          return
        }

        ecs.Audio.mutate(world, component.eid, (audio) => {
          audio.paused = !audio.paused
          return false
        })
      }
    )

    console.log('Reproductor de audio preparado.')
  },
})
