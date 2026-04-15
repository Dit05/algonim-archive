'use strict'

function downloadBlob(blob) {
  window.open(URL.createObjectURL(blob))
}

function showError(err, selectLine = false) {
  const div = document.getElementById('error-div')

  if(err) {
    console.error(err)
    div.style.display = 'block'
    div.children[0].innerText = err
    if(selectLine && err.lineNumber) {
      const scriptArea = document.getElementById('script-area')
      const text = scriptArea.value

      let lines = err.lineNumber
      let start = -1
      let end = -1
      while(lines --> 0) {
        if(lines === 1) start = end + 1
        end = text.indexOf('\n', end + 1)
      }

      scriptArea.focus()
      scriptArea.setSelectionRange(start, end)
    }
  } else {
    div.style.display = 'none'
  }
}

function loadExample(name) {
  document.getElementById('example-select').value = ''
  if(name in examples) {
    document.getElementById('script-area').value = String(examples[name]).replace('async function(seq)', 'async (seq) =>')
  }
}

function getUserFunction() {
  let text = document.getElementById('script-area').value
  text = 'const Algonim = window.Algonim; ' + text
  const result = eval(text)
  if(typeof(result) !== 'function') {
    throw new TypeError("Your code must be an expression that evaluates to a function.")
  }
  return result
}

function dropHandler(ev) {
  showError(undefined)
  try {
    ev.preventDefault()
    const files = [...ev.dataTransfer.items]
      .map((item) => item.getAsFile())
    importGif(files)
  } catch(err) {
    showError(err)
  }
}

function importButtonPressed() {
  const input = document.getElementById('file-input')
  importGif([...input.files])
}

function importGif(files) {
  files = files
    .filter((file) => file && file.type == 'image/gif')
  if(files.length == 0) {
    throw new Error("No GIF file has been provided.")
  }

  window.Algonim.importEmbedFromGif(files[0])
    .catch((err) => {
      showError(err)
      throw err
    })
    .then((payload) => {
      const decoder = new TextDecoder()
      const str = decoder.decode(payload)
      document.getElementById('script-area').value = str
    })
}


async function slideshow() {
  showError(undefined)
  try {
    algonim.scrollIntoView()
    await algonim.slideshow(getUserFunction())
  } catch(err) {
    showError(err, true)
  }
}

function stopSlideshow() {
  algonim.stopSlideshow()
}

async function makeGif() {
  showError(undefined)

  let embed = undefined
  if(document.getElementById('gif-embedCode').checked) {
    const encoder = new TextEncoder()
    embed = encoder.encode(document.getElementById('script-area').value)
  }

  const options = {
    colorTableBits: Number(document.getElementById('gif-tableBits').value),
    allowSmallerTables: Boolean(document.getElementById('gif-allowSmallerTables').checked),
    loopCount: Number(document.getElementById('gif-loop').checked ? Infinity : NaN),
    useLocalColorTables: Boolean(document.getElementById('gif-useLocalColorTables').checked),
    embedContent: embed,
    onlyDifferences: true
  }

  let blob = undefined
  try {
    blob = await algonim.recordGif(getUserFunction(), document.getElementById('gif-progress'), options)
  } catch(err) {
    showError(err)
  }
  if(blob) downloadBlob(blob)
}


const examples = {

'complete example': async (seq) => {
  // An example showing off most features.
  seq.config.resolution = { width: 640, height: 480 }

  const code = new Algonim.Models.Code()
  code.setLines([
    'i <- 3',
    'while i>0 do',
    '\tprint(i)',
    '\ti <- i-1',
    'done'
  ])

  const fakeConsole = new Algonim.Models.Code()
  fakeConsole.numberingStyleOverride = null
  fakeConsole.numberSeparatorStyle = null
  const outputLines = [ 'Output:' ]
  fakeConsole.setLines(outputLines)

  const graph = new Algonim.Models.Graph()
  //graph.fontStyle.font = '8px sans'
  const nodes = graph.setLayout({
    'node1': { pos: [50, 50], value: 149, connect: ['node2', 'node3'] },
    'node2': { pos: [200, 60], connect: ['node1'] },
    'node3': { pos: [100, 350], value: 'node three' }
  })
  const border = new Algonim.EllipseBorder()
  border.forceAspectRatio = 1
  border.line = { stroke: 'red', lineWidth: 2 }
  nodes['node1'].border = border

  let layout = {
    'split': 'vertical',
    'ratio': 0.5,
    'left': graph,
    'right': {
      'split': 'horizontal',
      'top': code,
      'bottom': fakeConsole
    }
  }

  code.arrowLines = 0

  seq.setLayout(layout)

  await seq.capture()

  let i = 3
  const signs = {}
  signs['i'] = code.createSign(0)
  signs['i'].text = `${i}`

  code.arrowLines = 1
  await seq.capture()
  while(i > 0) {
    code.arrowLines = 2
    await seq.capture()
    outputLines.push(`${i}`)
    fakeConsole.setLines(outputLines)
    await seq.capture()
    code.arrowLines = 3
    await seq.capture()
    i -= 1
    signs['i'].text = `${i}`
    await seq.capture()
    code.arrowLines = 1
    await seq.capture()
  }
  code.arrowLines = 4
  await seq.capture()

  code.arrowLines = null
  await seq.capture()

  signs['i'].destroy()
  code.createSign(4).text = 'Fin.'
  await seq.capture()
},

'mélységi keresés': async function(seq) {
  seq.config.resolution = { width: 800, height: 500 }
  seq.config.defaultDelayMs = 1200

  const code = new Algonim.Models.Code()
  code.textStyle.font = '10pt sans'
  code.textHeightFactor = 0.9
  code.setLines([
    'Mélységi keresés (k, V)',
    '',
    'Startcsúcs := k',
    'M (Startcsúcs) := 0',
    'Sz (Startcsúcs) := nincs',
    'Nyílt := {Startcsúcs}',
    'Zárt := {}',
    '',
    'While Nyílt nem üres do',
    '\tLegyen C eleme Nyílt uh. M(C) =\n  Max{M(D)| D eleme Nyílt}',
    '',
    '\tif C eleme V then return C',
    '',
    '\tfor C minden D gyermekére do',
    '\t\tif D nem eleme Nyílt és D nem eleme Zárt then',
    '',
    '\t\t\tM(D) := M(C) + 1',
    '\t\t\tSz(D) := C',
    '\t\t\tNyílt := Nyílt ⋃ {D}',
    '',
    '\t\tfi',
    '\tod',
    '',
    '\tNyílt := Nyílt ∖ {C}',
    '\tZárt := Zárt ⋃ {C}',
    '',
    'od',
    'return "Nincs megoldás"'
  ])

  const graph = new Algonim.Models.Graph()
  const nodes = graph.setLayout({
    '1': { pos: [200, 50], value: 0, connect: ['2'] },
    '2': { pos: [150, 150], value: 1, connect: ['5', '4', '3'] },
    '3': { pos: [250, 150], value: 2, connect: ['1'] },
    '4': { pos: [100, 250], value: 2, connect: ['6'] },
    '5': { pos: [200, 250], value: 2, connect: ['6'] },
    '6': { pos: [150, 350], value: 3, connect: ['7'] },
    '7': { pos: [150, 450], value: 4, connect: [] },
  })
  for(const key in nodes) {
    nodes[key].hideValue = true
  }

  const borders = {}
  borders.unvisited = new Algonim.EllipseBorder()
  borders.unvisited.forceAspectRatio = 1
  borders.open = new Algonim.EllipseBorder()
  borders.open.forceAspectRatio = 1
  borders.open.fill = 'red'
  borders.closed = new Algonim.EllipseBorder()
  borders.closed.forceAspectRatio = 1
  borders.closed.fill = 'gray'
  borders.actual = new Algonim.EllipseBorder()
  borders.actual.forceAspectRatio = 1
  borders.actual.fill = borders.open.fill
  borders.actual.line = { stroke: 'blue', lineWidth: 4 }

  const overlay = new Algonim.Models.Overlay(graph)
  overlay.drawAfter = (drawer) => {
    drawer.drawText('Terminális csúcs', {x: 180, y: 450}, {align: 'left'})
  }

  seq.setLayout({
    'split': 'vertical',
    'ratio': 0.5,
    'left': overlay,
    'right': code
  })

  function setBorders() {
    for(const key in nodes) {
      const node = nodes[key]
      if(node == actual) {
        node.border = borders.actual
      } else if(closed.has(node)) {
        node.border = borders.closed
      } else if(open.includes(node)) {
        node.border = borders.open
      } else {
        node.border = borders.unvisited
      }
    }
  }
  const open = []
  const closed = new Set()
  let actual = undefined
  setBorders()

  code.arrowLines = 2
  await seq.capture()

  code.arrowLines = 3
  await seq.capture()
  nodes['1'].hideValue = false
  await seq.capture()

  code.arrowLines = 4
  await seq.capture()

  code.arrowLines = 5
  await seq.capture()
  open.push(nodes['1'])
  setBorders()
  await seq.capture()

  while(open.length > 0) {
    code.arrowLines = 9
    await seq.capture()

    const top = open.pop()
    actual = top
    setBorders()
    await seq.capture()

    code.arrowLines = 11
    await seq.capture()
    if(top == nodes['7']) {
      code.createSign(11).text = 'Vége.'
      await seq.capture(3)
      return
    }

    code.arrowLines = 13
    await seq.capture()
    for(const child of top.connections) {
      code.arrowLines = 14
      await seq.capture()

      if(!open.includes(child) && !closed.has(child)) {
        code.arrowLines = 16
        await seq.capture()
        child.hideValue = false

        code.arrowLines = 17
        await seq.capture()

        code.arrowLines = 18
        await seq.capture()
        open.push(child)
        setBorders()
      }

      code.arrowLines = 20
      await seq.capture()
    }

    code.arrowLines = 23
    await seq.capture()
    code.arrowLines = 24
    await seq.capture()
    closed.add(top)
    actual = undefined
    setBorders()
    await seq.capture()
  }
},

rainbow: async function(seq) {
  // Generates a single frame with lots of colors for quantization to deal with.
  seq.config.resolution = { width: 512, height: 256 }
  const rainbow = new Algonim.Models.Rainbow()
  rainbow.step = { x: 4, y: 4 }
  seq.setLayout(rainbow)
  await seq.capture()
},

voronoi: async function(seq) {
  // Demonstrates the built-in Voronoi model that was used to test the k-d tree utilized by color tables.
  const COUNT = 64
  const SPEED = 8
  const FRAMES = 64

  const points = new Array(COUNT)
  for(let i = 0; i < points.length; i++) {
    points[i] = {
      x: Math.floor(Math.random() * seq.config.resolution.width),
      y: Math.floor(Math.random() * seq.config.resolution.height),
      vx: Math.floor((Math.random() - 0.5) * SPEED),
      vy: Math.floor((Math.random() - 0.5) * SPEED),
      color: Math.floor(Math.random() * 0xffffff)
    }
  }

  seq.config.resolution = { width: 480, height: 272 }
  const voronoi = new Algonim.Models.Voronoi()
  seq.setLayout(voronoi)
  voronoi.step = { x: 2, y: 2 }

  for(let j = 0; j < FRAMES; j++) {
    voronoi.points.clear()
    for(let i = 0; i < points.length; i++) {
      const point = points[i]
      voronoi.points.set({ x: point.x, y: point.y }, point.color)
      point.x += point.vx
      point.y += point.vy
      if(point.x < 0 && point.vx < 0) point.vx *= -1
      if(point.y < 0 && point.vy < 0) point.vy *= -1
      if(point.x >= seq.config.resolution.width && point.vx > 0) point.vx *= -1
      if(point.y >= seq.config.resolution.height && point.vy > 0) point.vy *= -1
    }
    await seq.capture(0.05)
  }
},

'loop test': async function(seq) {
  // Short animation with two frames to test looping.
  seq.config.resolution = { width: 128, height: 64 }
  seq.config.defaultDelayMs = 500 // Five. Hundred. Millisecs.
  const code = new Algonim.Models.Code()
  seq.setLayout(code)
  code.setLines(['a'])
  await seq.capture()
  code.setLines(['b'])
  await seq.capture()
},

'text wrapping': async function(seq) {
  // Shows CodeModel's automatic line wrapping.
  seq.config.resolution = { width: 256, height: 512 }
  const code = new Algonim.Models.Code()
  seq.setLayout(code)
  code.setLines([
    "Hello World!",
    "This line is quite long, I sure hope it's all visible.",
    "    This one is indented and long as well.",
    "Manually\nbroken\nline"
  ])
  await seq.capture()
}

} // End of example object
