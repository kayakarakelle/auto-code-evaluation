require('dotenv').config()
const Fastify = require('fastify')

const app = Fastify({ logger: true })

// JWT plugin
app.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET
})

// authenticate decorator — SADECE BİR TANE OLMALI
app.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    console.log('JWT Hata:', err.message)
    console.log('Header:', request.headers.authorization)
    reply.status(401).send({ error: 'Token geçersiz veya eksik' })
  }
})

// requireRole middleware
app.decorate('requireRole', function(roles) {
  return async function(request, reply) {
    await request.jwtVerify()
    if (!roles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Bu işlem için yetkin yok' })
    }
  }
})

// Route'ları kaydet
app.register(require('./src/routes/auth'))
app.register(require('./src/routes/courses'))      
app.register(require('./src/routes/assignments')) 
app.register(require('./src/routes/submissions'))  


// Health check
app.get('/health', async () => ({ status: 'ok', service: 'api-gateway' }))

// Başlat
app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1) }
})