function Surface (ronin) {
  this.el = document.createElement('canvas')
  this.el.id = 'surface'
  this._guide = document.createElement('canvas')
  this._guide.id = 'guide'
  this.ratio = window.devicePixelRatio
  // Contexts
  this.context = this.el.getContext('2d')
  this.guide = this._guide.getContext('2d')

  this.install = function (host) {
    host.appendChild(this.el)
    host.appendChild(this._guide)
    window.addEventListener('resize', (e) => { this.onResize() }, false)
    this._guide.addEventListener('mousedown', ronin.onMouseDown, false)
    this._guide.addEventListener('mousemove', ronin.onMouseMove, false)
    this._guide.addEventListener('mouseup', ronin.onMouseUp, false)
  }

  this.start = function () {
    this.maximize()
  }

  // Shape

  this.stroke = (shape, width, color, context = this.context) => {
    context.beginPath()
    this.trace(shape, context)
    context.lineWidth = width
    context.strokeStyle = color
    if (isText(shape)) {
      context.font = `${shape.p}px ${shape.f}`
      context.strokeText(shape.t, shape.x, shape.y)
    } else if (isSvg(shape)) {
      context.lineWidth = width
      context.strokeStyle = color
      context.stroke(new Path2D(shape.d))
    } else {
      context.stroke()
    }
    context.closePath()
  }

  // Fill

  this.fill = (shape, color, context = this.context) => {
    context.beginPath()
    context.fillStyle = color
    this.trace(shape, context)
    if (isText(shape)) {
      context.font = `${shape.g}px ${shape.f}`
      context.fillText(shape.s, shape.x, shape.y)
    } else if (isSvg(shape)) {
      context.fillStyle = color
      context.fill(new Path2D(shape.d))
    } else {
      context.fill()
    }
    context.closePath()
  }

  this.linearGradient = function (x1, y1, x2, y2, colors, context = this.context) {
    const gradient = context.createLinearGradient(x1, y1, x2, y2)
    const step = 1 / (colors.length - 1)
    colors.forEach((color, i) => {
      gradient.addColorStop(i * step, color)
    })
    return gradient
  }

  // Tracers

  this.trace = function (shape, context) {
    if (isRect(shape)) {
      this.traceRect(shape, context)
    } else if (isLine(shape)) {
      this.traceLine(shape, context)
    } else if (isCircle(shape)) {
      this.traceCircle(shape, context)
    } else if (isText(shape)) {
      this.traceText(shape, context)
    } else if (isSvg(shape)) {
      this.traceSVG(shape, context)
    } else {
      console.warn('Unknown type', shape)
    }
  }

  this.traceRect = function (rect, context) {
    context.moveTo(rect.x, rect.y)
    context.lineTo(rect.x + rect.w, rect.y)
    context.lineTo(rect.x + rect.w, rect.y + rect.h)
    context.lineTo(rect.x, rect.y + rect.h)
    context.lineTo(rect.x, rect.y)
  }

  this.traceLine = function (line, context) {
    context.moveTo(line.a.x, line.a.y)
    context.lineTo(line.b.x, line.b.y)
  }

  this.traceCircle = function (circle, context) {
    context.arc(circle.cx, circle.cy, circle.r, 0, 2 * Math.PI)
  }

  this.traceText = function (text, context) {

  }

  this.traceSVG = function (text, context) {

  }

  // IO

  this.open = function (path) {
    return new Promise(resolve => {
      const img = new Image()
      img.src = path
      img.onload = () => {
        ronin.log(`Open ${img.width}x${img.height}`)
        const rect = { x: 0, y: 0, w: img.width, h: img.height }
        this.resize(rect, true)
        this.context.drawImage(img, 0, 0, img.width, img.height)
        resolve()
      }
    })
  }

  this.draw = function (img, rect = this.getFrame()) {
    return new Promise(resolve => {
      img.onload = () => {
        ronin.log(`Draw ${img.width}x${img.height}`)
        this.context.drawImage(img, rect.x, rect.y, rect.w, rect.h) // no strect: img.height * (rect.w / img.width)
        resolve()
      }
    })
  }

  this.crop = function (rect) {
    ronin.log(`Crop ${rect.w}x${rect.h} from ${rect.x}x${rect.y}`)
    const crop = this.getCrop(rect)
    this.resize(rect, true)
    this.context.drawImage(crop, 0, 0)
  }

  this.clear = function (rect = this.getFrame(), context = this.context) {
    context.clearRect(rect.x, rect.y, rect.w, rect.h)
  }

  this.clearGuide = function (rect = this.getFrame(), context = this.guide) {
    context.clearRect(rect.x, rect.y, rect.w, rect.h)
  }

  this.clone = function (a, b) {
    this.context.drawImage(this.el, a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h)
  }

  this.resize = function (size, fit = false) {
    const frame = this.getFrame()
    if (frame.w === size.w && frame.h === size.h) { return }
    console.log('Surface', `Resize: ${size.w}x${size.h}`)
    this.el.width = size.w
    this.el.height = size.h
    this.el.style.width = (size.w / this.ratio) + 'px'
    this.el.style.height = (size.h / this.ratio) + 'px'
    this._guide.width = size.w
    this._guide.height = size.h
    this._guide.style.width = (size.w / this.ratio) + 'px'
    this._guide.style.height = (size.h / this.ratio) + 'px'
    if (fit === true) {
      this.fitWindow(size)
    }
  }

  this.getFrame = function () {
    return { x: 0, y: 0, w: this.el.width, h: this.el.height, t: 'rect' }
  }

  this.fitWindow = function (size) {
    const win = require('electron').remote.getCurrentWindow()
    const pad = { w: ronin.commander.isVisible === true ? 400 : 60, h: 60 }
    if (size.w < 10 || size.h < 10) { return }
    win.setSize(Math.floor((size.w / this.ratio) + pad.w), Math.floor((size.h / this.ratio) + pad.h), true)
  }

  this.maximize = function () {
    this.resize({ x: 0, y: 0, w: ((window.innerWidth - 60) * this.ratio), h: ((window.innerHeight - 60) * this.ratio), t: 'rect' })
  }

  this.onResize = function () {
    if (ronin.commander._input.value === '') {
      this.maximize()
    }
    const f = this.getFrame()
    ronin.log(`resize ${f.w}x${f.h}`)
  }

  this.getCrop = function (rect) {
    const newCanvas = document.createElement('canvas')
    newCanvas.width = rect.w
    newCanvas.height = rect.h
    newCanvas.getContext('2d').drawImage(this.el, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
    return newCanvas
  }

  this.resizeImage = function (src, dst, type = 'image/png', quality = 1.0) {
    return new Promise(resolve => {
      const tmp = new Image()
      let canvas
      let context
      let cW = src.naturalWidth
      let cH = src.naturalHeight
      tmp.src = src.src
      // resolve()
      tmp.onload = () => {
        canvas = document.createElement('canvas')
        cW /= 2
        cH /= 2
        if (cW < src.width) {
          cW = src.width
        }
        if (cH < src.height) {
          cH = src.height
        }
        canvas.width = cW
        canvas.height = cH
        context = canvas.getContext('2d')
        context.drawImage(tmp, 0, 0, cW, cH)
        dst.src = canvas.toDataURL(type, quality)
        if (cW <= src.width || cH <= src.height) { return resolve() }
        tmp.src = dst.src
        return resolve()
      }
    })
  }

  function isRect (shape) {
    return !isNaN(shape.x) && !isNaN(shape.y) && !isNaN(shape.w) && !isNaN(shape.h)
  }
  function isCircle (shape) {
    return !isNaN(shape.cx) && !isNaN(shape.cy) && !isNaN(shape.r)
  }
  function isSvg (shape) {
    return shape.d
  }
  function isText (shape) {
    return !isNaN(shape.x) && !isNaN(shape.y) && !isNaN(shape.p) && shape.t && shape.f
  }
  function isLine (shape) {
    return shape.a && !isNaN(shape.a.x) && !isNaN(shape.a.y) && shape.b && !isNaN(shape.b.x) && !isNaN(shape.b.y)
  }
}
