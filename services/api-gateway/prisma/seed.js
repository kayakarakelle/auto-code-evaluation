const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Seed başlıyor...')

  // Şifreleri hash'le
  const hash = await bcrypt.hash('password123', 10)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      name: 'Platform Admin',
      role: 'admin',
      passwordHash: hash
    }
  })

  // Instructor'lar
  const instructor1 = await prisma.user.upsert({
    where: { email: 'ahmet@platform.com' },
    update: {},
    create: {
      email: 'ahmet@platform.com',
      name: 'Dr. Ahmet Yılmaz',
      role: 'instructor',
      passwordHash: hash
    }
  })

  const instructor2 = await prisma.user.upsert({
    where: { email: 'ayse@platform.com' },
    update: {},
    create: {
      email: 'ayse@platform.com',
      name: 'Dr. Ayşe Kaya',
      role: 'instructor',
      passwordHash: hash
    }
  })

  // Öğrenciler
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ali@student.com' },
      update: {},
      create: { email: 'ali@student.com', name: 'Ali Veli', role: 'student', passwordHash: hash }
    }),
    prisma.user.upsert({
      where: { email: 'zeynep@student.com' },
      update: {},
      create: { email: 'zeynep@student.com', name: 'Zeynep Demir', role: 'student', passwordHash: hash }
    }),
    prisma.user.upsert({
      where: { email: 'mehmet@student.com' },
      update: {},
      create: { email: 'mehmet@student.com', name: 'Mehmet Çelik', role: 'student', passwordHash: hash }
    }),
  ])

  console.log(`✓ ${students.length + 3} kullanıcı oluşturuldu`)

  // Kurslar
  const course1 = await prisma.course.upsert({
    where: { id: 'course-python-2025' },
    update: {},
    create: {
      id: 'course-python-2025',
      title: 'Python Programlama',
      semester: '2025-Fall',
      language: 'python',
      instructorId: instructor1.id
    }
  })

  const course2 = await prisma.course.upsert({
    where: { id: 'course-js-2025' },
    update: {},
    create: {
      id: 'course-js-2025',
      title: 'Web Geliştirme',
      semester: '2025-Fall',
      language: 'javascript',
      instructorId: instructor2.id
    }
  })

  console.log('✓ 2 kurs oluşturuldu')

  // Kayıtlar — öğrencileri kurslara ekle
  for (const student of students) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course1.id } },
      update: {},
      create: { studentId: student.id, courseId: course1.id }
    })
  }

  console.log('✓ Öğrenciler kurslara kaydedildi')

  // Ödevler
  const assignment1 = await prisma.assignment.upsert({
    where: { id: 'assignment-fibonacci' },
    update: {},
    create: {
      id: 'assignment-fibonacci',
      title: 'Fibonacci Serisi',
      description: 'Verilen n sayısına kadar Fibonacci serisini hesaplayan fonksiyon yaz.',
      referenceSolution: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
      testCases: [
        { input: '0', expectedOutput: '0' },
        { input: '1', expectedOutput: '1' },
        { input: '5', expectedOutput: '5' },
        { input: '10', expectedOutput: '55' },
      ],
      dueDate: new Date('2025-12-31'),
      courseId: course1.id
    }
  })

  const assignment2 = await prisma.assignment.upsert({
    where: { id: 'assignment-palindrome' },
    update: {},
    create: {
      id: 'assignment-palindrome',
      title: 'Palindrom Kontrolü',
      description: 'Verilen string\'in palindrom olup olmadığını kontrol et.',
      referenceSolution: 'def is_palindrome(s):\n    s = s.lower().replace(" ", "")\n    return s == s[::-1]',
      testCases: [
        { input: 'racecar', expectedOutput: 'True' },
        { input: 'hello', expectedOutput: 'False' },
        { input: 'A man a plan a canal Panama', expectedOutput: 'True' },
      ],
      dueDate: new Date('2025-12-31'),
      courseId: course1.id
    }
  })

  console.log('✓ 2 ödev oluşturuldu')
  console.log('\nSeed tamamlandı!')
  console.log('─────────────────────────────')
  console.log('Test hesapları (şifre: password123):')
  console.log('  admin@platform.com      → admin')
  console.log('  ahmet@platform.com      → instructor')
  console.log('  ali@student.com         → student')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())