const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')

async function authRoutes(fastify) {

  // REGISTER
  fastify.post('/auth/register', async (request, reply) => {
    const { email, name, password, role } = request.body

    // Email var mı kontrol et
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ error: 'Bu email zaten kayıtlı' })
    }

    // Şifreyi hash'le
    const passwordHash = await bcrypt.hash(password, 10)

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: role || 'student' },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    })

    return reply.status(201).send({ user })
  })

  // LOGIN
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return reply.status(401).send({ error: 'Email veya şifre hatalı' })
    }

    // Şifreyi kontrol et
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Email veya şifre hatalı' })
    }

    // Token'ları üret
    const accessToken = fastify.jwt.sign(
      { userId: user.id, role: user.role },
      { expiresIn: '15m' }
    )

    const refreshToken = fastify.jwt.sign(
      { userId: user.id, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' }
    )

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
  })

  // REFRESH TOKEN
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body

    try {
      const payload = fastify.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET })

      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) return reply.status(401).send({ error: 'Kullanıcı bulunamadı' })

      const accessToken = fastify.jwt.sign(
        { userId: user.id, role: user.role },
        { expiresIn: '15m' }
      )

      return reply.send({ accessToken })
    } catch {
      return reply.status(401).send({ error: 'Geçersiz refresh token' })
    }
  })

  // ME — kim olduğumu öğren
  fastify.get('/auth/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    })
    return reply.send({ user })
  })
}

module.exports = authRoutes