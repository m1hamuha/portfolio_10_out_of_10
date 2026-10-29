import type { CsvInput } from './csv'
import stressCsvText from '../data/stress-1000-rows.csv?raw'

export interface PresetBundle {
  id: 'shopify' | 'amazon' | 'woocommerce' | 'stress-1000'
  name: string
  badge: string
  description: string
  files: CsvInput[]
  rowCount: number
}

export const SHOPIFY_PRESET: PresetBundle = {
  id: 'shopify',
  name: 'Shopify D2C Store',
  badge: 'Shopify',
  description: 'Multi-order fashion & home goods catalogue with advertising spend and return tracking.',
  rowCount: 10,
  files: [
    {
      name: 'shopify-orders.csv',
      text: `Name,Created at,Currency,Lineitem quantity,Lineitem name,Lineitem price,Lineitem SKU,Lineitem discount,Refunded Amount,Shipping Country
#1001,2026-07-01 10:00:00 +0200,EUR,4,Organic Cotton Duvet King,39.90,HOM-001,0,0,DE
#1002,2026-07-01 11:30:00 +0200,EUR,2,Linen Waffle Towel Set,34.90,HOM-002,2.00,0,FR
#1003,2026-07-02 09:15:00 +0200,EUR,1,Merino Throw Blanket,69.00,HOM-003,0,0,DE
#1004,2026-07-02 14:00:00 +0200,EUR,3,Percale Fitted Sheet Double,15.90,HOM-004,1.50,15.90,IT
#1005,2026-07-03 16:45:00 +0200,EUR,5,Bamboo Bath Mat,12.50,HOM-005,0,0,DE
#1006,2026-07-03 18:20:00 +0200,EUR,2,Sateen Pillowcase Pair,13.90,HOM-006,0,0,FR
#1007,2026-07-04 11:10:00 +0200,EUR,6,Cushion Cover Velvet,9.90,HOM-007,0,9.90,DE
#1008,2026-07-04 13:50:00 +0200,EUR,4,Blackout Curtain 140x200,32.00,HOM-009,5.00,0,DE
#1009,2026-07-05 10:05:00 +0200,EUR,1,Wool Area Rug 120x170,119.00,HOM-010,0,0,FR
#1010,2026-07-05 15:30:00 +0200,EUR,3,Quilted Bedspread King,54.00,HOM-012,0,54.00,DE`,
    },
    {
      name: 'shopify-products.csv',
      text: `Title,SKU,Price,Cost per item
Organic Cotton Duvet King,HOM-001,39.90,19.50
Linen Waffle Towel Set,HOM-002,34.90,12.50
Merino Throw Blanket,HOM-003,69.00,28.00
Percale Fitted Sheet Double,HOM-004,15.90,8.20
Bamboo Bath Mat,HOM-005,12.50,6.40
Sateen Pillowcase Pair,HOM-006,13.90,5.10
Cushion Cover Velvet,HOM-007,9.90,4.30
Blackout Curtain 140x200,HOM-009,32.00,17.80
Wool Area Rug 120x170,HOM-010,119.00,44.00
Quilted Bedspread King,HOM-012,54.00,33.50`,
    },
    {
      name: 'shopify-ad-spend.csv',
      text: `SKU,Ad spend
HOM-001,45.00
HOM-002,38.00
HOM-004,22.00
HOM-007,18.00
HOM-012,65.00`,
    },
  ],
}

export const AMAZON_PRESET: PresetBundle = {
  id: 'amazon',
  name: 'Amazon FBA Settlement',
  badge: 'Amazon FBA',
  description: 'Amazon settlement export with referral fees, FBA fulfilment costs, storage fees, and refunds.',
  rowCount: 8,
  files: [
    {
      name: 'amazon-settlement.csv',
      text: `settlement-id,date/time,type,sku,description,quantity,marketplace,product-sales,selling-fees,fba-fees,other-transaction-fees
9842101,2026-07-01 12:00:00,Order,AMZ-101,Acoustic ANC Headphones,5,amazon.de,495.00,-74.25,-26.50,-4.50
9842102,2026-07-01 13:10:00,Order,AMZ-102,Ergonomic Mechanical Keyboard,8,amazon.de,792.00,-118.80,-41.60,-6.20
9842103,2026-07-02 08:30:00,Refund,AMZ-101,Acoustic ANC Headphones,-2,amazon.de,-198.00,29.70,0,-5.00
9842104,2026-07-02 14:25:00,Order,AMZ-103,USB-C 10-in-1 Hub,12,amazon.fr,598.80,-89.82,-46.80,-5.40
9842105,2026-07-03 11:00:00,Order,AMZ-104,Precision Gaming Mouse,15,amazon.de,748.50,-112.28,-58.50,-7.10
9842106,2026-07-03 16:40:00,Order,AMZ-105,Laptop Cooling Stand,6,amazon.it,210.00,-31.50,-34.80,-3.20
9842107,2026-07-04 10:15:00,Order,AMZ-106,RGB Desk Light Bar,9,amazon.de,359.10,-53.87,-37.80,-4.10
9842108,2026-07-05 15:50:00,Order,AMZ-107,Wireless Fast Charger Stand,14,amazon.fr,418.60,-62.79,-54.60,-5.80`,
    },
    {
      name: 'amazon-costs.csv',
      text: `SKU,Cost per item,Title
AMZ-101,42.00,Acoustic ANC Headphones
AMZ-102,38.50,Ergonomic Mechanical Keyboard
AMZ-103,16.20,USB-C 10-in-1 Hub
AMZ-104,18.00,Precision Gaming Mouse
AMZ-105,14.50,Laptop Cooling Stand
AMZ-106,12.00,RGB Desk Light Bar
AMZ-107,9.80,Wireless Fast Charger Stand`,
    },
  ],
}

export const WOOCOMMERCE_PRESET: PresetBundle = {
  id: 'woocommerce',
  name: 'WooCommerce Order Dump',
  badge: 'WooCommerce',
  description: 'WooCommerce orders export with embedded line COGS, shipping charges, and Stripe gateway fees.',
  rowCount: 6,
  files: [
    {
      name: 'woocommerce-orders.csv',
      text: `Order Number,Order Date,Order Status,Item SKU,Item Name,Quantity,Item Price,Item Cost,Shipping Amount,Discount Amount,Refund Amount,Payment Method,Payment Gateway Fee,Shipping Country
WC-5001,2026-07-01 10:20:00,completed,WOO-COFFEE-01,Artisan Single Origin Roast,6,18.50,7.20,4.90,0,0,Stripe,3.52,DE
WC-5002,2026-07-01 14:45:00,completed,WOO-GRIND-02,Precision Burr Grinder,2,89.00,48.00,6.50,5.00,0,Stripe,5.46,DE
WC-5003,2026-07-02 09:10:00,refunded,WOO-SCALE-03,Smart Brewing Scale,1,54.00,24.00,4.90,0,54.00,PayPal,2.10,FR
WC-5004,2026-07-02 16:30:00,completed,WOO-KETTLE-04,Gooseneck Temperature Kettle,3,79.00,41.00,6.50,0,0,Stripe,7.17,IT
WC-5005,2026-07-03 11:15:00,completed,WOO-MUG-05,Double Wall Ceramic Mug,8,16.00,5.40,4.90,2.00,0,Stripe,4.02,DE
WC-5006,2026-07-03 17:00:00,completed,WOO-FILTER-06,Unbleached Paper Filters 100pk,15,7.50,2.10,3.90,0,0,Stripe,3.56,DE`,
    },
  ],
}

export const STRESS_1000_PRESET: PresetBundle = {
  id: 'stress-1000',
  name: '1,000-Row Multi-Channel Stress Dataset',
  badge: '1k Stress Test',
  description: '1,000 distinct SKUs across 6 categories and 4 European marketplaces with 120 deliberate profit leaks.',
  rowCount: 1000,
  files: [
    {
      name: 'stress-1000-rows.csv',
      text: stressCsvText,
    },
  ],
}

export const ALL_PRESETS: PresetBundle[] = [
  SHOPIFY_PRESET,
  AMAZON_PRESET,
  WOOCOMMERCE_PRESET,
  STRESS_1000_PRESET,
]

export function getPresetById(id: string): PresetBundle | undefined {
  return ALL_PRESETS.find((p) => p.id === id)
}
