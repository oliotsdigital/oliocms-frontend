# Static Assets Directory

You can upload and store all your website logos, product images, brand icons, and static assets in this folder (`public/`).

## Folder Structure

- `public/logos/`: Place your brand logos, app icons, and favicon files here.
  - Example: `public/logos/logo.png` -> Access in Next.js via `/logos/logo.png` or `<img src="/logos/logo.png" />`
- `public/images/`: Place general product photos, banner images, and background graphics here.
  - Example: `public/images/product-1.jpg` -> Access in Next.js via `/images/product-1.jpg`
- `public/uploads/`: Place uploaded media files here.
  - Example: `public/uploads/banner.webp` -> Access in Next.js via `/uploads/banner.webp`

## How to use in Next.js components:

```tsx
// Example Image Component usage:
<img src="/logos/logo.png" alt="OlioCMS Logo" className="w-8 h-8" />
```
