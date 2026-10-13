
import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'cerrar-panel-avistamiento',

  stateMachine: ({world, eid}) => {
    ecs.defineState('esperando')
      .initial()
      .listen(eid, ecs.input.SCREEN_TOUCH_START, () => {
        world.events.dispatch(
          world.events.globalId,
          'OcultarPanelAves'
        )

        console.log('Panel de avistamiento cerrado')
      })
  },
})
