# MarginPulse — self-service import specification

## Outcome

A seller can upload ordinary Shopify or Amazon exports and receive a product-and-channel profitability report without an operator preparing the data.

## Acceptance criteria

- Recognise supported files by their headers rather than their filename.
- Support Shopify Orders, Shopify product costs, Amazon settlements, SKU costs and SKU ad spend.
- Show every uploaded file as recognised or unsupported.
- Join sales, costs and advertising by SKU while preserving the sales channel.
- Refuse to analyse when sales or COGS are missing and name the required export.
- Keep missing advertising and other costs visibly missing; never turn unknown into zero.
- Support an advanced MarginPulse CSV only as a fallback.
- Calculate net profit once; finding impact must not be subtracted again.
- Export one profitability row per product-channel combination.
- Keep imported data in the browser and never imply that an external store was changed.

## Explicit non-goals for this release

- Direct Shopify, Amazon, advertising or accounting APIs.
- Every historical or country-specific Amazon report layout.
- Automatic price, campaign, listing, inventory or VAT changes.
- Currency conversion, accounting, legal or tax advice.
- Billing, login and cloud storage.

## Release gate

All automated tests and the production build must pass. The upload flow must be checked on desktop and 390 px mobile with no browser console errors. README claims must match the implemented product.
