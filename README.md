There are 2 subfolders. Each is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). They are built in a similar way.

* [kyc_provider](./kyc_provider) provides a basic example of a KYC provider system.
* [settlement_provider](./settlement_provider) provides a basic example of an exchange settlement system integrated with custodians.

There are 2 important branches:

* `pre-polymesh`, that imagines a simplified existing setup for a KYC or settlement provider.
* `post-polymesh`, that provides an example of integration of the existing operations with Polymesh.

There is a pull request, which should not be merged, that makes explicit the changes that went into `post-polymesh`. This can serve as the starting point for reflection.

A general note. There is no login for the `pre-polymesh` parts, so anyone can impersonate someone else. Obviously, this is a design decision meant to avoid overburdening the learner. In the `post-polymesh` parts, there is still no login, but the public / private keys default system prevents spoofing anyway.

## Getting Started

In each sub-folder:

1. Install:
    ```bash
    npm install
    ```
2. Enter your `keys.json` following the model found in `keys.json.sample`.
3. See the specifics in each folder's `README.md`.
4. Run the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Modify it

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Further creation steps

```bash
npm install --save-dev typescript @types/react @types/node
touch tsconfig.json
npm run dev
```
