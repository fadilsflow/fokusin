import prisma from '@/lib/prisma'

async function testStats() {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const testStats = await prisma.stats.upsert({
      where: {
        userId_date: {
          userId: 'test-user',
          date: today
        }
      },
      update: {
        focusTime: {
          increment: 300
        },
        updatedAt: new Date()
      },
      create: {
        userId: 'test-user',
        date: today,
        focusTime: 300,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('Test stats created/updated:', testStats)
  } catch (error) {
    console.error('Test error:', error)
  }
}

testStats() 