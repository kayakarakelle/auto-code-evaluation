const prisma = require('../lib/prisma')

async function assignmentRoutes(fastify) {

  // Kursa ait ödevleri getir
  fastify.get('/courses/:courseId/assignments', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const assignments = await prisma.assignment.findMany({
      where: { courseId: request.params.courseId },
      select: {
        id: true, title: true, description: true,
        dueDate: true, maxScore: true, createdAt: true,
        _count: { select: { submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return reply.send({ assignments })
  })

  // Tek ödev getir
  fastify.get('/assignments/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: request.params.id },
      include: {
        course: { select: { id: true, title: true, language: true } },
        _count: { select: { submissions: true } }
      }
    })

    if (!assignment) {
      return reply.status(404).send({ error: 'Ödev bulunamadı' })
    }

    // Öğrenciye referans çözümü gösterme
    if (request.user.role === 'student') {
      delete assignment.referenceSolution
    }

    return reply.send({ assignment })
  })

  // Ödev oluştur — sadece instructor
  fastify.post('/courses/:courseId/assignments', {
    onRequest: [fastify.requireRole(['instructor', 'admin'])]
  }, async (request, reply) => {
    const { title, description, referenceSolution, testCases, dueDate, maxScore } = request.body

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        referenceSolution,
        testCases: testCases || [],
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore || 100,
        courseId: request.params.courseId
      }
    })

    return reply.status(201).send({ assignment })
  })

  // Ödev güncelle
  fastify.patch('/assignments/:id', {
    onRequest: [fastify.requireRole(['instructor', 'admin'])]
  }, async (request, reply) => {
    const { title, description, testCases, dueDate, maxScore } = request.body

    const updated = await prisma.assignment.update({
      where: { id: request.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(testCases && { testCases }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(maxScore && { maxScore })
      }
    })

    return reply.send({ assignment: updated })
  })
}

module.exports = assignmentRoutes