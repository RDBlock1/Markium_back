// scripts/safe-migrate-between-dbs.ts

import { PrismaClient } from '@prisma/client';

// Old database connection
const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://pratik:Pratik18@localhost:5459/markium_db'
    }
  }
});

// New database connection
const newDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgresy:markium-123@localhost:5440/postgres'
    }
  }
});

async function migrateAllData() {
  console.log('Starting safe data migration between databases...\n');

  try {
    // 1. Migrate Users
    // console.log('Migrating Users...');
    const oldUsers = await oldDb.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        password: true,
        verifyToken: true,
        verifyTokenExpiry: true,
        image: true,
        createdAt: true,
        accessToken: true,
        telegramIntegrationId: true,
      }
    });

    // for (const user of oldUsers) {
    //   await newDb.user.upsert({
    //     where: { id: user.id },
    //     update: {},
    //     create: {
    //       id: user.id,
    //       name: user.name,
    //       email: user.email,
    //       emailVerified: user.emailVerified,
    //       password: user.password,
    //       verifyToken: user.verifyToken,
    //       verifyTokenExpiry: user.verifyTokenExpiry,
    //       image: user.image,
    //       createdAt: user.createdAt,
    //       updatedAt: user.createdAt,
    //       accessToken: user.accessToken,
    //       telegramIntegrationId: user.telegramIntegrationId,
    //       // New fields will be null/default:
    //       // walletAddress, clobApiKey, clobSecret, clobPassphrase
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldUsers.length} users\n`);

    // // 2. Migrate Accounts
    // console.log('Migrating Accounts...');
    // const oldAccounts = await oldDb.account.findMany();
    // for (const account of oldAccounts) {
    //   await newDb.account.upsert({
    //     where: { id: account.id },
    //     update: {},
    //     create: {
    //       id: account.id,
    //       userId: account.userId,
    //       type: account.type,
    //       provider: account.provider,
    //       providerAccountId: account.providerAccountId,
    //       refresh_token: account.refresh_token,
    //       access_token: account.access_token,
    //       expires_at: account.expires_at,
    //       token_type: account.token_type,
    //       scope: account.scope,
    //       id_token: account.id_token,
    //       session_state: account.session_state,
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldAccounts.length} accounts\n`);

    // // 3. Migrate Sessions
    // console.log('Migrating Sessions...');
    // const oldSessions = await oldDb.session.findMany();
    // for (const session of oldSessions) {
    //   await newDb.session.upsert({
    //     where: { id: session.id },
    //     update: {},
    //     create: {
    //       id: session.id,
    //       sessionToken: session.sessionToken,
    //       userId: session.userId,
    //       expires: session.expires,
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldSessions.length} sessions\n`);

    // // 4. Migrate Telegram Integrations
    // console.log('Migrating Telegram Integrations...');
    // const oldTelegram = await oldDb.telegramIntegration.findMany();
    // for (const tg of oldTelegram) {
    //   await newDb.telegramIntegration.upsert({
    //     where: { id: tg.id },
    //     update: {},
    //     create: {
    //       id: tg.id,
    //       userId: tg.userId,
    //       userName: tg.userName || 'Unknown', // Handle potential null
    //       chatId: tg.chatId,
    //       createdAt: tg.createdAt,
    //       updatedAt: tg.updatedAt,
    //       createdById: tg.userId, // Map userId to createdById
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldTelegram.length} telegram integrations\n`);

    // // 5. Migrate WatchLists
    // console.log('Migrating WatchLists...');
    // const oldWatchLists = await oldDb.watchList.findMany();
    // for (const wl of oldWatchLists) {
    //   await newDb.watchList.upsert({
    //     where: { id: wl.id },
    //     update: {},
    //     create: {
    //       id: wl.id,
    //       userId: wl.userId,
    //       marketId: wl.marketId,
    //       triggerType: wl.triggerType || 'PRICE_ABOVE',
    //       triggerValue: wl.triggerValue,
    //       frequency: wl.frequency || 'IMMEDIATE',
    //       isActive: wl.isActive ?? true,
    //       isEmailNotification: wl.isEmailNotification ?? false,
    //       isTelegramNotification: wl.isTelegramNotification ?? false,
    //       lastNotifiedAt: wl.lastNotifiedAt,
    //       createdAt: wl.createdAt,
    //       updatedAt: wl.updatedAt || wl.createdAt,
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldWatchLists.length} watch lists\n`);

    // // 6. Migrate Markets
    // console.log('Migrating Markets...');
    // const oldMarkets = await oldDb.market.findMany();
    // for (const market of oldMarkets) {
    //   await newDb.market.upsert({
    //     where: { id: market.id },
    //     update: {},
    //     create: {
    //       id: market.id,
    //       conditionId: market.conditionId,
    //       marketId: market.marketId,
    //       question: market.question,
    //       slug: market.slug,
    //       liquidity: market.liquidity ?? 0,
    //       volume: market.volume ?? 0,
    //       volume24hr: market.volume24hr ?? 0,
    //       active: market.active ?? true,
    //       closed: market.closed ?? false,
    //       archived: market.archived ?? false,
    //       image: market.image,
    //       category: market.category,
    //       tags: market.tags || [],
    //       outcomes: market.outcomes || [],
    //       outcomePrices: market.outcomePrices || [],
    //       startDate: market.startDate,
    //       endDate: market.endDate,
    //       createdAt: market.createdAt,
    //       updatedAt: market.updatedAt || market.createdAt,
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldMarkets.length} markets\n`);

    // // 7. Migrate ProxyWallets
    // console.log('Migrating ProxyWallets...');
    // const oldWallets = await oldDb.proxyWallet.findMany();
    // for (const wallet of oldWallets) {
    //   await newDb.proxyWallet.upsert({
    //     where: { id: wallet.id },
    //     update: {},
    //     create: {
    //       id: wallet.id,
    //       address: wallet.address,
    //       createdAt: wallet.createdAt,
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldWallets.length} proxy wallets\n`);

    // // 8. Migrate SyncHistory
    // console.log('Migrating SyncHistory...');
    // const oldSync = await oldDb.syncHistory.findMany();
    // for (const sync of oldSync) {
    //   await newDb.syncHistory.upsert({
    //     where: { id: sync.id },
    //     update: {},
    //     create: {
    //       id: sync.id,
    //       startedAt: sync.startedAt,
    //       completedAt: sync.completedAt,
    //       marketsFound: sync.marketsFound ?? 0,
    //       marketsStored: sync.marketsStored ?? 0,
    //       marketsFailed: sync.marketsFailed ?? 0,
    //       walletsFound: sync.walletsFound ?? 0,
    //       walletsStored: sync.walletsStored ?? 0,
    //       status: sync.status,
    //       error: sync.error,
    //     }
    //   });
    // }
    // console.log(`✓ Migrated ${oldSync.length} sync histories\n`);

    // // 9. Migrate UserAnalytics and related tables
    // console.log('Migrating UserAnalytics...');
    // const oldAnalytics = await oldDb.userAnalytics.findMany({
    //   include: {
    //     marketDistribution: true,
    //     buySellData: true,
    //     tradeSizeData: true,
    //     priceStats: true,
    //     monthlyPerformance: true,
    //     weeklyWinRate: true,
    //   }
    // });

    // for (const analytics of oldAnalytics) {
    //   // Create main analytics record
    //   await newDb.userAnalytics.upsert({
    //     where: { id: analytics.id },
    //     update: {},
    //     create: {
    //       id: analytics.id,
    //       address: analytics.address,
    //       totalVolume: analytics.totalVolume ?? 0,
    //       totalProfit: analytics.totalProfit ?? 0,
    //       positionValue: analytics.positionValue ?? 0,
    //       totalTrades: analytics.totalTrades ?? 0,
    //       totalPositions: analytics.totalPositions ?? 0,
    //       averageWinRate: analytics.averageWinRate ?? 0,
    //       avgMonthlyProfit: analytics.avgMonthlyProfit ?? 0,
    //       avgMonthlyTrades: analytics.avgMonthlyTrades ?? 0,
    //       mostTradedCategory: analytics.mostTradedCategory,
    //       tradingStyle: analytics.tradingStyle,
    //       riskProfile: analytics.riskProfile,
    //       createdAt: analytics.createdAt,
    //       updatedAt: analytics.updatedAt || analytics.createdAt,
    //       lastSyncedAt: analytics.lastSyncedAt,
    //     }
    //   });

    //   // Migrate MarketDistribution
    //   for (const md of analytics.marketDistribution) {
    //     await newDb.marketDistribution.upsert({
    //       where: { id: md.id },
    //       update: {},
    //       create: {
    //         id: md.id,
    //         userId: md.userId,
    //         market: md.market,
    //         value: md.value ?? 0,
    //         trades: md.trades ?? 0,
    //         volume: md.volume ?? 0,
    //         uniqueMarkets: md.uniqueMarkets ?? 0,
    //         createdAt: md.createdAt,
    //       }
    //     });
    //   }

    //   // Migrate BuySellData
    //   if (analytics.buySellData) {
    //     const bsd = analytics.buySellData;
    //     await newDb.buySellData.upsert({
    //       where: { id: bsd.id },
    //       update: {},
    //       create: {
    //         id: bsd.id,
    //         userId: bsd.userId,
    //         buyPercentage: bsd.buyPercentage ?? 0,
    //         sellPercentage: bsd.sellPercentage ?? 0,
    //         buyVolume: bsd.buyVolume ?? 0,
    //         sellVolume: bsd.sellVolume ?? 0,
    //         buyCount: bsd.buyCount ?? 0,
    //         sellCount: bsd.sellCount ?? 0,
    //         createdAt: bsd.createdAt,
    //         updatedAt: bsd.updatedAt || bsd.createdAt,
    //       }
    //     });
    //   }

    //   // Migrate TradeSizeData
    //   if (analytics.tradeSizeData) {
    //     const tsd = analytics.tradeSizeData;
    //     await newDb.tradeSizeData.upsert({
    //       where: { id: tsd.id },
    //       update: {},
    //       create: {
    //         id: tsd.id,
    //         userId: tsd.userId,
    //         averageSize: tsd.averageSize ?? 0,
    //         medianSize: tsd.medianSize ?? 0,
    //         minSize: tsd.minSize ?? 0,
    //         maxSize: tsd.maxSize ?? 0,
    //         smallTrades: tsd.smallTrades ?? 0,
    //         mediumTrades: tsd.mediumTrades ?? 0,
    //         largeTrades: tsd.largeTrades ?? 0,
    //         createdAt: tsd.createdAt,
    //         updatedAt: tsd.updatedAt || tsd.createdAt,
    //       }
    //     });
    //   }

    //   // Migrate PriceStats
    //   if (analytics.priceStats) {
    //     const ps = analytics.priceStats;
    //     await newDb.priceStats.upsert({
    //       where: { id: ps.id },
    //       update: {},
    //       create: {
    //         id: ps.id,
    //         userId: ps.userId,
    //         averagePrice: ps.averagePrice ?? 0,
    //         minPrice: ps.minPrice ?? 0,
    //         maxPrice: ps.maxPrice ?? 0,
    //         createdAt: ps.createdAt,
    //         updatedAt: ps.updatedAt || ps.createdAt,
    //       }
    //     });
    //   }

    //   // Migrate MonthlyPerformance
    //   for (const mp of analytics.monthlyPerformance) {
    //     await newDb.monthlyPerformance.upsert({
    //       where: { id: mp.id },
    //       update: {},
    //       create: {
    //         id: mp.id,
    //         userId: mp.userId,
    //         month: mp.month,
    //         yearMonth: mp.yearMonth,
    //         profit: mp.profit ?? 0,
    //         volume: mp.volume ?? 0,
    //         trades: mp.trades ?? 0,
    //         createdAt: mp.createdAt,
    //       }
    //     });
    //   }

    //   // Migrate WeeklyWinRate
    //   for (const wwr of analytics.weeklyWinRate) {
    //     await newDb.weeklyWinRate.upsert({
    //       where: { id: wwr.id },
    //       update: {},
    //       create: {
    //         id: wwr.id,
    //         userId: wwr.userId,
    //         week: wwr.week,
    //         weekDate: wwr.weekDate,
    //         winRate: wwr.winRate ?? 0,
    //         totalTrades: wwr.totalTrades ?? 0,
    //         createdAt: wwr.createdAt,
    //       }
    //     });
    //   }
    // }
    // console.log(`✓ Migrated ${oldAnalytics.length} user analytics records\n`);

    // 10. Migrate BlogPosts with transformations
    console.log('Migrating BlogPosts...');
    const oldPosts = await oldDb.blogPost.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        tags: true,
        author: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    console.log('oldUsers length:', oldUsers.length);
    console.log('Fetched', oldPosts.length, 'posts from old DB');
    for (const post of oldPosts) {
      // Transform old tags string to array
      const tagsArray = post.tags ? post.tags.split(',').map(t => t.trim()) : [];
      
      // Try to find matching user by name
      const matchingUser = oldUsers.find(u => u.name === post.author);

      await newDb.blogPost.upsert({
        where: { id: post.id },
        update: {},
        create: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          content: post.content,
          description:'',
          date: post.createdAt, // Backfill from createdAt
          tagsArray, // New array format
          tags: post.tags, // Keep old format too
          thumbnail: null, // New field
          author: post.author,
          authorUserId: matchingUser?.id || null, // New FK
          featured: false, // New field with default
          readTime: null, // New field
          published: true, // New field with default
          createdAt: post.createdAt,
          updatedAt: post.updatedAt || post.createdAt,
        }
      });
    }
    console.log(`✓ Migrated ${oldPosts.length} blog posts\n`);

    // Note: Conversation and Message models are NEW, so we skip them
    // Note: RulesConversation and RulesMessage models are NEW, so we skip them
    console.log('ℹ️  Skipping Conversation, Message, RulesConversation, RulesMessage (new models)\n');

    // Final verification
    console.log('═══════════════════════════════════');
    console.log('Migration Summary:');
    console.log('═══════════════════════════════════');
    console.log(`Users:                  ${await newDb.user.count()}`);
    console.log(`Accounts:               ${await newDb.account.count()}`);
    console.log(`Sessions:               ${await newDb.session.count()}`);
    console.log(`Telegram Integrations:  ${await newDb.telegramIntegration.count()}`);
    console.log(`Watch Lists:            ${await newDb.watchList.count()}`);
    console.log(`Markets:                ${await newDb.market.count()}`);
    console.log(`Proxy Wallets:          ${await newDb.proxyWallet.count()}`);
    console.log(`Sync Histories:         ${await newDb.syncHistory.count()}`);
    console.log(`User Analytics:         ${await newDb.userAnalytics.count()}`);
    console.log(`Market Distribution:    ${await newDb.marketDistribution.count()}`);
    console.log(`Buy/Sell Data:          ${await newDb.buySellData.count()}`);
    console.log(`Trade Size Data:        ${await newDb.tradeSizeData.count()}`);
    console.log(`Price Stats:            ${await newDb.priceStats.count()}`);
    console.log(`Monthly Performance:    ${await newDb.monthlyPerformance.count()}`);
    console.log(`Weekly Win Rate:        ${await newDb.weeklyWinRate.count()}`);
    console.log(`Blog Posts:             ${await newDb.blogPost.count()}`);
    console.log('═══════════════════════════════════\n');

    console.log('✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in new database');
    console.log('2. Update your app to use the new DATABASE_URL');
    console.log('3. Backup and drop old database when ready:');
    console.log('   dropdb -h localhost -p 5459 -U pratik markium_db');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    throw error;
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrateAllData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });