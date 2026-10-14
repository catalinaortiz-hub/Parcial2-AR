const configurarImagenes = () => {
    window.XR8.XrController.configure({
        imageTargetData: [
            require('../image-targets/ave 1.json'),
            require('../image-targets/ave 2.json'),
            require('../image-targets/ave 3.json'),
            require('../image-targets/ave 4.json'),
            require('../image-targets/ave 5.json'),
            require('../image-targets/LIBRO PARCIAL RV.json'),
            require('../image-targets/quiz.json'),
        ],
    })
}

if (window.XR8) {
    configurarImagenes()
} else {
    window.addEventListener('xrloaded', configurarImagenes, { once: true })
}