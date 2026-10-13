import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'libro-ar-test',

  schema: {
    sensitivity: ecs.f32,
  },

  schemaDefaults: {
    sensitivity: 10.0,
  },

  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .listen(
        world.events.globalId,
        ecs.input.SCREEN_TOUCH_MOVE,
        (e) => {
          const {sensitivity} = schemaAttribute.get(eid)
          const angles = ecs.math.vec3.xyz(
             0,
             0,
          e.data.change.x * sensitivity * world.time.delta
)

          

          const rotation = ecs.math.quat.pitchYawRollDegrees(angles)

          world.transform.rotateLocal(eid, rotation)
        }
      )
  },
})
