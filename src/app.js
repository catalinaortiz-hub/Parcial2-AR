const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/ave 1.json'),
      require('../image-targets/ave 2.json'),
      require('../image-targets/ave 3.json'),
      require('../image-targets/ave 4.json'),
      require('../image-targets/ave 5.json'),

    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)