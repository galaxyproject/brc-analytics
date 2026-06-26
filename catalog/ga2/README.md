# Genome Ark 2 catalog directory

This directory provides the catalog data that is presented by the Genome Ark 2 app. Some relevant information may be present in the analogous [BRC Analytics catalog readme](../README.md).

Similar to the BRC Analytics catalog, the GA2 catalog is built using two main commands:

```
npm run build-ga2-from-ncbi
npm run build-ga2-db
```

## Providing organism images

The GA2 app uses images to illustrate organisms. These images must be downloaded in order for the catalog to be built or for the images to appear in the app.

The images can be downloaded to the gitignored `public/organism_image` folder by running `npm run fetch-ga2-organism-images`. This must be done before the initial catalog build step (`build-ga2-from-ncbi`) can be run.

When needed, new images are curated via `npm run select-ga2-organism-images`, but must be uploaded separately.
