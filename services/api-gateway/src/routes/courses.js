const prisma = require('../lib/prisma')

async function courseRoutes(fastify) {

  // Tüm kursları getir — herkes görebilir
  fastify.get('/courses', async (request, reply) => {
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { assignments: true, enrollments: true }
        }
      },
      orderBy: { semester: 'desc' }
    })
    return reply.send({ courses })
  })

  // Tek kurs getir
  fastify.get('/courses/:id', async (request, reply) => {
    const course = await prisma.course.findUnique({
      where: { id: request.params.id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        assignments: {
          select: { id: true, title: true, dueDate: true, maxScore: true }
        },
        _count: { select: { enrollments: true } }
      }
    })

    if (!course) {
      return reply.status(404).send({ error: 'Kurs bulunamadı' })
    }

    return reply.send({ course })
  })

  // Kurs oluştur — sadece instructor ve admin
  fastify.post('/courses', {
    onRequest: [fastify.requireRole(['instructor', 'admin'])]
  }, async (request, reply) => {
    const { title, semester, language } = request.body

    const course = await prisma.course.create({
      data: {
        title,
        semester,
        language,
        instructorId: request.user.userId   // token'dan geliyor, body'den değil
      }
    })

    return reply.status(201).send({ course })
  })

  // Kurs güncelle — sadece o kursun instructor'ı
  fastify.patch('/courses/:id', {
    onRequest: [fastify.requireRole(['instructor', 'admin'])]
  }, async (request, reply) => {
    const course = await prisma.course.findUnique({
      where: { id: request.params.id }
    })

    if (!course) {
      return reply.status(404).send({ error: 'Kurs bulunamadı' })
    }

    // Başkasının kursunu değiştiremesin
    if (course.instructorId !== request.user.userId && request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Bu kursu düzenleme yetkin yok' })
    }

    const updated = await prisma.course.update({
      where: { id: request.params.id },
      data: request.body
    })

    return reply.send({ course: updated })
  })

  // Kursa öğrenci kaydı — öğrenci kendini kaydeder
  fastify.post('/courses/:id/enroll', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: request.user.userId,
          courseId: request.params.id
        }
      }
    })

    if (existing) {
      return reply.status(409).send({ error: 'Zaten kayıtlısın' })
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: request.user.userId,
        courseId: request.params.id
      }
    })

    return reply.status(201).send({ enrollment })
  })
}

module.exports = courseRoutes