import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'panel-avistamiento',

  stateMachine: ({world, eid}) => {
    ecs.defineState('oculto')
      .initial()
      .onEnter(() => {
        ecs.Hidden.set(world, eid)
      })
      .listen(world.events.globalId, 'MostrarPanelAves', () => {
        ecs.Hidden.remove(world, eid)
      })
      .listen(world.events.globalId, 'OcultarPanelAves', () => {
        ecs.Hidden.set(world, eid)
      })
  },
})