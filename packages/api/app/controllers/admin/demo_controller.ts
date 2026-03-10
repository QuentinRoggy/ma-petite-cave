import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Wine from '#models/wine'
import Subscription from '#models/subscription'
import Box from '#models/box'
import BoxWine from '#models/box_wine'
import ClientWine from '#models/client_wine'
import { DateTime } from 'luxon'

type WineColor = 'rouge' | 'blanc' | 'rosé' | 'pétillant'

const DEMO_WINES: Array<{
  name: string
  domain: string
  vintage: number | null
  color: WineColor
  region: string
  grapes: string
  alcoholDegree: number
  guardMin: number
  guardMax: number
  aromas: string[]
  foodPairings: string[]
  notes: string
}> = [
  {
    name: 'Château Margaux',
    domain: 'Château Margaux',
    vintage: 2019,
    color: 'rouge',
    region: 'Bordeaux - Margaux',
    grapes: 'Cabernet Sauvignon, Merlot, Petit Verdot',
    alcoholDegree: 13.5,
    guardMin: 10,
    guardMax: 30,
    aromas: ['Fruits noirs', 'Épices', 'Vanille', 'Cèdre'],
    foodPairings: ['Viande rouge grillée', 'Gibier', 'Fromages affinés'],
    notes: 'Un grand cru classé d\'exception, élégant et complexe.',
  },
  {
    name: 'Meursault Premier Cru "Les Charmes"',
    domain: 'Domaine Roulot',
    vintage: 2021,
    color: 'blanc',
    region: 'Bourgogne - Côte de Beaune',
    grapes: 'Chardonnay',
    alcoholDegree: 13,
    guardMin: 5,
    guardMax: 15,
    aromas: ['Beurre', 'Noisette', 'Fleurs blanches', 'Agrumes'],
    foodPairings: ['Poisson en sauce', 'Volaille crémée', 'Fromages de chèvre'],
    notes: 'Riche et minéral, avec une belle longueur en bouche.',
  },
  {
    name: 'Côte-Rôtie "La Landonne"',
    domain: 'E. Guigal',
    vintage: 2018,
    color: 'rouge',
    region: 'Vallée du Rhône Nord',
    grapes: 'Syrah',
    alcoholDegree: 14,
    guardMin: 8,
    guardMax: 25,
    aromas: ['Violette', 'Olive noire', 'Lard fumé', 'Réglisse'],
    foodPairings: ['Bœuf braisé', 'Agneau', 'Cuisine épicée'],
    notes: 'Puissant et soyeux, un vin de garde exceptionnel.',
  },
  {
    name: 'Champagne Brut "Grande Cuvée"',
    domain: 'Krug',
    vintage: null,
    color: 'pétillant',
    region: 'Champagne',
    grapes: 'Chardonnay, Pinot Noir, Pinot Meunier',
    alcoholDegree: 12,
    guardMin: 0,
    guardMax: 10,
    aromas: ['Brioche', 'Fruits secs', 'Miel', 'Fleurs'],
    foodPairings: ['Apéritif', 'Fruits de mer', 'Cuisine asiatique'],
    notes: 'L\'assemblage signature de la maison, d\'une complexité rare.',
  },
  {
    name: 'Bandol Rosé',
    domain: 'Domaine Tempier',
    vintage: 2023,
    color: 'rosé',
    region: 'Provence - Bandol',
    grapes: 'Mourvèdre, Grenache, Cinsault',
    alcoholDegree: 13.5,
    guardMin: 0,
    guardMax: 3,
    aromas: ['Pêche', 'Abricot', 'Herbes de Provence'],
    foodPairings: ['Bouillabaisse', 'Grillades', 'Cuisine méditerranéenne'],
    notes: 'Le rosé de référence, structuré et gastronomique.',
  },
  {
    name: 'Chablis Grand Cru "Les Clos"',
    domain: 'Domaine William Fèvre',
    vintage: 2020,
    color: 'blanc',
    region: 'Bourgogne - Chablis',
    grapes: 'Chardonnay',
    alcoholDegree: 13,
    guardMin: 5,
    guardMax: 20,
    aromas: ['Citron', 'Pierre à fusil', 'Iode', 'Amande'],
    foodPairings: ['Huîtres', 'Crustacés', 'Poisson grillé'],
    notes: 'La quintessence du Chablis, minéral et tendu.',
  },
]

export default class DemoController {
  /**
   * Setup complete demo environment
   * POST /admin/demo/setup
   */
  async setup({ request, response }: HttpContext) {
    const {
      merchantEmail = 'demo-caviste@cuvee.app',
      clientEmail = 'demo-client@cuvee.app',
      merchantName = 'Jean Caviste',
      clientName = 'Marie Cliente',
      shopName = 'Cave du Château',
      password = 'demo1234',
    } = request.body()

    // 1. Create or find merchant
    let merchant = await User.findBy('email', merchantEmail)
    let merchantCreated = false

    if (!merchant) {
      // Password is auto-hashed by withAuthFinder mixin
      merchant = await User.create({
        email: merchantEmail,
        password: password,
        role: 'merchant',
        fullName: merchantName,
      })
      await merchant.related('merchantProfile').create({
        shopName: shopName,
        address: '12 rue des Vignes, 33000 Bordeaux',
        phone: '05 56 00 00 00',
      })
      merchantCreated = true
    }

    // 2. Create or find client
    let client = await User.findBy('email', clientEmail)
    let clientCreated = false

    if (!client) {
      // Password is auto-hashed by withAuthFinder mixin
      client = await User.create({
        email: clientEmail,
        password: password,
        role: 'client',
        fullName: clientName,
      })
      clientCreated = true
    }

    // 3. Create or find subscription
    let subscription = await Subscription.query()
      .where('merchantId', merchant.id)
      .where('clientId', client.id)
      .first()

    let subscriptionCreated = false
    if (!subscription) {
      subscription = await Subscription.create({
        merchantId: merchant.id,
        clientId: client.id,
        status: 'active',
        activatedAt: DateTime.now(),
      })
      subscriptionCreated = true
    }

    // 4. Create wines
    const wines: Wine[] = []
    let winesCreated = 0

    for (const wineData of DEMO_WINES) {
      let wine = await Wine.query()
        .where('merchantId', merchant.id)
        .where('name', wineData.name)
        .first()

      if (!wine) {
        wine = await Wine.create({
          ...wineData,
          merchantId: merchant.id,
        })
        winesCreated++
      }
      wines.push(wine)
    }

    // 5. Create a box with wines
    const currentMonth = DateTime.now().toFormat('yyyy-MM')
    let box = await Box.query()
      .where('subscriptionId', subscription.id)
      .where('month', currentMonth)
      .first()

    let boxCreated = false
    if (!box) {
      box = await Box.create({
        subscriptionId: subscription.id,
        month: currentMonth,
        status: 'sent',
        sentAt: DateTime.now(),
      })

      // Add 2 wines to the box
      for (let i = 0; i < Math.min(2, wines.length); i++) {
        const boxWine = await BoxWine.create({
          boxId: box.id,
          wineId: wines[i].id,
          merchantNotes: `Un excellent ${wines[i].color} à déguster avec attention. ${wines[i].notes}`,
          position: i + 1,
        })

        // Create ClientWine
        await ClientWine.create({
          boxWineId: boxWine.id,
          clientId: client.id,
          status: 'in_cellar',
        })
      }
      boxCreated = true
    }

    // 6. Create a previous month box with ratings
    const previousMonth = DateTime.now().minus({ months: 1 }).toFormat('yyyy-MM')
    let previousBox = await Box.query()
      .where('subscriptionId', subscription.id)
      .where('month', previousMonth)
      .first()

    if (!previousBox && wines.length >= 4) {
      previousBox = await Box.create({
        subscriptionId: subscription.id,
        month: previousMonth,
        status: 'sent',
        sentAt: DateTime.now().minus({ months: 1 }),
      })

      // Add 2 different wines
      for (let i = 2; i < Math.min(4, wines.length); i++) {
        const boxWine = await BoxWine.create({
          boxId: previousBox.id,
          wineId: wines[i].id,
          merchantNotes: `Découvrez ce magnifique ${wines[i].color}. ${wines[i].notes}`,
          position: i - 1,
        })

        // Create ClientWine with rating
        await ClientWine.create({
          boxWineId: boxWine.id,
          clientId: client.id,
          status: 'finished',
          rating: 4 + Math.floor(Math.random() * 2), // 4 or 5 stars
          personalNotes: 'Excellent vin, très apprécié lors du dîner !',
          openedAt: DateTime.now().minus({ weeks: 2 }),
          finishedAt: DateTime.now().minus({ weeks: 1 }),
        })
      }
    }

    return response.ok({
      message: 'Demo setup complete',
      merchant: {
        email: merchantEmail,
        password: password,
        created: merchantCreated,
      },
      client: {
        email: clientEmail,
        password: password,
        created: clientCreated,
      },
      subscription: {
        created: subscriptionCreated,
      },
      wines: {
        total: wines.length,
        created: winesCreated,
      },
      box: {
        created: boxCreated,
        month: currentMonth,
      },
    })
  }

  /**
   * Reset demo data
   * POST /admin/demo/reset
   */
  async reset({ request, response }: HttpContext) {
    const {
      merchantEmail = 'demo-caviste@cuvee.app',
      clientEmail = 'demo-client@cuvee.app',
    } = request.body()

    let merchantDeleted = false
    let clientDeleted = false

    // Delete client first (to handle foreign key constraints)
    if (clientEmail) {
      const client = await User.findBy('email', clientEmail)
      if (client) {
        await client.delete()
        clientDeleted = true
      }
    }

    // Delete merchant (cascades to wines, boxes, etc.)
    if (merchantEmail) {
      const merchant = await User.findBy('email', merchantEmail)
      if (merchant) {
        await merchant.delete()
        merchantDeleted = true
      }
    }

    return response.ok({
      message: 'Demo data reset',
      merchantDeleted,
      clientDeleted,
    })
  }
}
