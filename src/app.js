const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/Colibrí libando flores tropicales.json'),
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)