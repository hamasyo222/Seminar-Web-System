import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'
import { DEFAULT_EMAIL_TEMPLATES } from '../lib/mail'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 管理者ユーザー作成
  const adminPassword = await hashPassword('admin123456')
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '管理者',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // メールテンプレート作成
  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { code: template.code },
      update: {},
      create: {
        ...template,
        variables: JSON.stringify(template.variables),
      },
    })
  }
  console.log('✅ Email templates created')

  // セミナー作成
  const seminar1 = await prisma.seminar.create({
    data: {
      slug: 'web-development-basics',
      title: 'Web開発入門講座',
      description: `本講座では、Web開発の基礎から実践的なスキルまでを体系的に学習します。

【対象者】
・プログラミング初心者
・Web開発に興味がある方
・キャリアチェンジを考えている方

【学習内容】
・HTML/CSS/JavaScriptの基礎
・レスポンシブデザイン
・フロントエンドフレームワーク入門
・バックエンド開発の基礎
・データベース設計

【講師】
山田太郎 - フルスタックエンジニア
10年以上の開発経験を持ち、多数のWebサービスを立ち上げてきました。`,
      category: 'プログラミング',
      tags: JSON.stringify(['Web開発', 'プログラミング', '初心者向け']),
      imageUrl: 'https://via.placeholder.com/800x400?text=Web+Development',
      status: 'PUBLISHED',
    },
  })

  const seminar2 = await prisma.seminar.create({
    data: {
      slug: 'ai-machine-learning',
      title: 'AI・機械学習実践ワークショップ',
      description: `AIと機械学習の基礎から実装まで、ハンズオン形式で学ぶワークショップです。

【対象者】
・Python経験者
・データサイエンスに興味がある方
・AI技術を業務に活用したい方

【学習内容】
・機械学習の基礎理論
・Pythonによるデータ分析
・ディープラーニング入門
・実践的なモデル構築
・AIプロジェクトの進め方`,
      category: 'AI・データサイエンス',
      tags: JSON.stringify(['AI', '機械学習', 'Python', 'データ分析']),
      imageUrl: 'https://via.placeholder.com/800x400?text=AI+Machine+Learning',
      status: 'PUBLISHED',
    },
  })

  // キャンセルポリシー作成
  await prisma.cancellationPolicy.create({
    data: {
      seminarId: seminar1.id,
      name: '標準キャンセルポリシー',
      description: 'お申込み後のキャンセルは以下の規定に従います。',
      rulesJson: JSON.stringify([
        { daysBefore: 7, refundRate: 100 },
        { daysBefore: 3, refundRate: 50 },
        { daysBefore: 1, refundRate: 0 },
      ]),
    },
  })

  await prisma.cancellationPolicy.create({
    data: {
      seminarId: seminar2.id,
      name: '標準キャンセルポリシー',
      description: 'お申込み後のキャンセルは以下の規定に従います。',
      rulesJson: JSON.stringify([
        { daysBefore: 14, refundRate: 100 },
        { daysBefore: 7, refundRate: 70 },
        { daysBefore: 3, refundRate: 50 },
        { daysBefore: 0, refundRate: 0 },
      ]),
    },
  })

  // セッション作成
  const now = new Date()
  const session1 = await prisma.session.create({
    data: {
      seminarId: seminar1.id,
      title: '第1回 土曜日開催',
      startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1週間後
      endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6時間
      format: 'HYBRID',
      venue: '東京会議室',
      venueAddress: '東京都渋谷区渋谷1-2-3 ABCビル5F',
      onlineUrl: 'https://zoom.us/j/123456789',
      zoomType: 'WEBINAR',
      zoomId: '123456789',
      capacity: 50,
      status: 'SCHEDULED',
    },
  })

  const session2 = await prisma.session.create({
    data: {
      seminarId: seminar1.id,
      title: '第2回 平日夜間開催',
      startAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2週間後
      endAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3時間
      format: 'ONLINE',
      onlineUrl: 'https://zoom.us/j/987654321',
      zoomType: 'WEBINAR',
      zoomId: '987654321',
      capacity: 100,
      status: 'SCHEDULED',
    },
  })

  const session3 = await prisma.session.create({
    data: {
      seminarId: seminar2.id,
      startAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3週間後
      endAt: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000), // 2日間
      format: 'OFFLINE',
      venue: '大阪研修センター',
      venueAddress: '大阪府大阪市北区梅田2-3-4',
      capacity: 30,
      status: 'SCHEDULED',
    },
  })

  // チケット種別作成
  await prisma.ticketType.createMany({
    data: [
      {
        sessionId: session1.id,
        name: '一般',
        description: '通常料金',
        price: 30000,
        taxRate: 10,
        stock: 30,
        maxPerOrder: 5,
        sortOrder: 1,
        isActive: true,
      },
      {
        sessionId: session1.id,
        name: '早割',
        description: '開催1週間前までの申込み',
        price: 25000,
        taxRate: 10,
        stock: 10,
        maxPerOrder: 3,
        salesEndAt: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000), // 今日まで
        sortOrder: 0,
        isActive: true,
      },
      {
        sessionId: session1.id,
        name: '学生',
        description: '学生証の提示が必要です',
        price: 15000,
        taxRate: 10,
        stock: 10,
        maxPerOrder: 1,
        sortOrder: 2,
        isActive: true,
      },
      {
        sessionId: session2.id,
        name: '一般',
        price: 20000,
        taxRate: 10,
        stock: 80,
        maxPerOrder: 10,
        sortOrder: 1,
        isActive: true,
      },
      {
        sessionId: session2.id,
        name: '団体割引',
        description: '3名以上でお申込みの場合',
        price: 18000,
        taxRate: 10,
        stock: 20,
        maxPerOrder: 10,
        sortOrder: 2,
        isActive: true,
      },
      {
        sessionId: session3.id,
        name: '通常料金',
        description: '教材費・昼食代込み',
        price: 80000,
        taxRate: 10,
        stock: 25,
        maxPerOrder: 3,
        sortOrder: 1,
        isActive: true,
      },
      {
        sessionId: session3.id,
        name: '早割特別価格',
        description: '開催2週間前までの申込み限定',
        price: 70000,
        taxRate: 10,
        stock: 5,
        maxPerOrder: 2,
        salesEndAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        sortOrder: 0,
        isActive: true,
      },
    ],
  })

  // クーポン作成
  await prisma.coupon.create({
    data: {
      code: 'WELCOME2024',
      name: '新規登録キャンペーン',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      usageLimit: 100,
      validFrom: now,
      validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90日間有効
      minAmount: 10000,
      seminarIds: JSON.stringify([]),
      isActive: true,
    },
  })

  await prisma.coupon.create({
    data: {
      code: 'STUDENT50',
      name: '学生限定割引',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      usageLimit: 50,
      validFrom: now,
      validUntil: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1年間有効
      seminarIds: JSON.stringify([seminar1.id]),
      isActive: true,
    },
  })

  console.log('✅ Sample data created successfully!')
  console.log('\n📝 Admin login credentials:')
  console.log('   Email: admin@example.com')
  console.log('   Password: admin123456')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
