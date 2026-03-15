const http = require('http')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ service: 'execution-service', status: 'ok' }))
})

server.listen(3001, () => {
  console.log('execution-service listening on port 3001')
})