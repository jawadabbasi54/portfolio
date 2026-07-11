# Deployment guide

## Fastest option: Vercel or Netlify

1. Create a new static-site project.
2. Upload this folder or connect its Git repository.
3. Do not set a build command.
4. Set the publish/output directory to the project root (`.`).
5. Add `jawadabbasi.com` as the custom domain.
6. Add the DNS records shown by the hosting provider.

## AWS S3 + CloudFront

1. Create an S3 bucket for the site files.
2. Upload every file and preserve the `assets/` directory.
3. Keep the bucket private and create a CloudFront distribution with Origin Access Control.
4. Set `index.html` as the default root object.
5. Configure custom error responses:
   - `403` → `/404.html` with response code `404`
   - `404` → `/404.html` with response code `404`
6. Request an ACM certificate for `jawadabbasi.com` and `www.jawadabbasi.com` in `us-east-1`.
7. Attach the certificate and aliases to CloudFront.
8. Create Route 53 alias records pointing the domain to the distribution.
9. Invalidate `/*` after future deployments.

## Recommended cache policy

- HTML, `robots.txt`, and `sitemap.xml`: short cache or no-cache
- CSS and JavaScript: 1 day while filenames remain unchanged
- PNG, SVG, and other assets: long cache

The Three.js runtime is loaded from jsDelivr. The Earth textures and all portfolio content are stored locally in this project.
