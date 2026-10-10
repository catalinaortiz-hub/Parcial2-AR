import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'libro-ar-test',

  add: () => {
    console.log('Libro AR: componente iniciado correctamente.')
  },
})