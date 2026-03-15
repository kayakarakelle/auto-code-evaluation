const prisma = require('../lib/prisma')
const { uploadFile, getFile } = require('../lib/storage')

async function submissionRoutes(fastify) {

  // Kod gönder
  fastify.post('/assignments/:assignmentId/submit', {
    onRequest: [fastify.requireRole(['student'])]
  }, async (request, reply) => {
    const { code, language } = request.body
    const { assignmentId } = request.params
    const studentId = request.user.userId

    // Ödevi kontrol et
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })
    if (!assignment) {
      return reply.status(404).send({ error: 'Ödev bulunamadı' })
    }

    // Uzantıyı belirle
    const extensions = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp' }
    const ext = extensions[language] || 'txt'

    // MinIO'ya yükle
    const fileKey = `submissions/${studentId}/${assignmentId}/${Date.now()}.${ext}`
    await uploadFile(fileKey, Buffer.from(code, 'utf-8'), 'text/plain')

    // DB'ye kaydet
    const submission = await prisma.submission.create({
      data: {
        code,
        filePath: fileKey,
        status: 'pending',
        studentId,
        assignmentId
      }
    })

    return reply.status(201).send({
      submission: { id: submission.id, status: submission.status, filePath: fileKey }
    })
  })

  // Submission durumunu getir
  fastify.get('/submissions/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const submission = await prisma.submission.findUnique({
      where: { id: request.params.id },
      include: {
        result: true,
        assignment: { select: { title: true, courseId: true } }
      }
    })

    if (!submission) {
      return reply.status(404).send({ error: 'Submission bulunamadı' })
    }

    // Öğrenci sadece kendi submission'ını görebilir
    if (request.user.role === 'student' && submission.studentId !== request.user.userId) {
      return reply.status(403).send({ error: 'Yetkisiz erişim' })
    }

    return reply.send({ submission })
  })

  // Dosyayı MinIO'dan getir
  fastify.get('/submissions/:id/code', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const submission = await prisma.submission.findUnique({
      where: { id: request.params.id }
    })

    if (!submission) {
      return reply.status(404).send({ error: 'Bulunamadı' })
    }

    const code = await getFile(submission.filePath)
    return reply.send({ code })
  })
}

module.exports = submissionRoutes