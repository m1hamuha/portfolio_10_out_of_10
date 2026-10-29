# Files a customer uploads

## Shopify

Required:

1. Orders export from Shopify, including line-item SKU, quantity and price.
2. Products export from Shopify, with `SKU` and `Cost per item` filled in.

Optional: a CSV with `SKU` and `Ad spend`.

## Amazon

Required:

1. Settlement flat-file report containing SKU, quantity, product sales, selling fees and FBA fees.
2. A product-cost CSV with `SKU` and `Cost per item`, `Unit cost` or `COGS`.

Optional: an Advertised Product report with `Advertised SKU` and `Spend`.

## What happens next

MarginPulse lists every file it recognises. If sales or product costs are missing, the Analyse button stays disabled and the screen says which export to add. Optional missing costs remain visible in the coverage score and are not guessed.

Use one currency per analysis. The current self-service release supports EUR.
