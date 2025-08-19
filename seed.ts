
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const [adminRole, producerRole, csrRole] = await Promise.all([
    prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin' } }),
    prisma.role.upsert({ where: { name: 'Producer' }, update: {}, create: { name: 'Producer' } }),
    prisma.role.upsert({ where: { name: 'CSR' }, update: {}, create: { name: 'CSR' } }),
  ])

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@example.com', password: await hash('password123', 10), roleId: adminRole.id }
  })
  await prisma.user.upsert({
    where: { email: 'producer@example.com' },
    update: {},
    create: { name: 'Producer One', email: 'producer@example.com', password: await hash('password123', 10), roleId: producerRole.id }
  })

  await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      type: 'person',
      legal_name: 'Jane Doe',
      preferred_name: 'Jane',
      mobile: '+12055550101', // E.164
      email: 'jane@example.com'
    }
  })
  console.log('Seed complete')
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect())
