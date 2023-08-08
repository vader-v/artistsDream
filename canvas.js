const c = document.querySelector('#canvas');
const ctx = c.getContext('2d');

//Resizing 
c.height = window.innerHeight
c.width = window.innerWidth

// a Rectangle
// ctx.strokeStyle = 'teal'
// ctx.lineWidth = 5
// ctx.strokeRect(50, 50, 200, 200)
// ctx.strokeRect(200, 200, 200, 500)

// a Triangle
// ctx.beginPath()
// ctx.moveTo(100, 100)
// ctx.lineTo(200, 100)
// ctx.lineTo(200, 150)
// ctx.closePath()
// ctx.stroke()

//variables
let painting = false

function start(e) {
  painting = true
  draw(e)
}

function end() {
  painting = false
  ctx.beginPath()
}

function draw(e) {
  if(!painting) return;
  ctx.lineWidth = 10
  ctx.strokeStyle = 'teal'
  ctx.lineCap = 'round'
  ctx.lineTo(e.clientX, e.clientY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(e.clientX, e.clientY)
}
//Event listeners

c.addEventListener('mousedown', start)
c.addEventListener('mouseup', end)
c.addEventListener('mouseout', end)
c.addEventListener('mousemove', draw)

window.addEventListener('resize', () => {
  c.height = window.innerHeight
  c.width = window.innerWidth
})