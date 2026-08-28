# Deploying clink.fun

One container serves the built app and the API from the same origin. That is not
an optimization: the frontend only calls `/api/*` relative paths, and the
metadata URLs written on chain must point at the origin that serves them, so a
split deployment introduces a way for those to disagree.

## Live deployment

| | |
|---|---|
| Site | https://clink-fun-93741856042.us-central1.run.app |
| Launchpad | `0x6a546350f79DE0Fc83ADfCe99233183aA090fa15` |
| Chain | Robinhood Chain, 4663 |
| Host | Cloud Run, `us-central1`, project `aerial-vehicle-466722-p5` |
| Blob storage | `gs://clink-fun-data`, mounted at `/data` |

## Why Cloud Run and not the alternatives

**GitHub Pages** cannot work. The API is a server: it stores artwork and
descriptors, which cannot live on chain and cannot be produced by a static host.

**Cloudflare Pages** serves the app fine but the API would need rewriting for
Workers, which has no filesystem. That means R2 for blobs and a different storage
adapter. It is a good future move for edge latency and it is not required to
ship.

**Cloud Run** runs the container as written, mounts a bucket where the API
expects a directory, and scales to zero between visitors.

## Storage is not optional

The API writes images and descriptors to `/data`, and the keccak of a
descriptor's exact bytes is committed on chain at launch. If `/data` is
ephemeral, a redeploy breaks every metadata URL ever written, and the on-chain
commitments point at nothing. The GCS volume mount is what makes those URLs
permanent.

## Deploy

```bash
PROJECT=aerial-vehicle-466722-p5
REGION=us-central1
LAUNCHPAD=0x6a546350f79DE0Fc83ADfCe99233183aA090fa15

# The launchpad address is compiled into the bundle, so it is a build argument.
docker build --build-arg VITE_LAUNCHPAD=$LAUNCHPAD -t clink-fun:latest .
docker tag clink-fun:latest $REGION-docker.pkg.dev/$PROJECT/clink/web:v1
docker push $REGION-docker.pkg.dev/$PROJECT/clink/web:v1

gcloud run deploy clink-fun \
  --image=$REGION-docker.pkg.dev/$PROJECT/clink/web:v1 \
  --project=$PROJECT --region=$REGION \
  --service-account=clink-fun-sa@$PROJECT.iam.gserviceaccount.com \
  --allow-unauthenticated --port=8080 --cpu=1 --memory=512Mi --max-instances=4 \
  --add-volume=name=data,type=cloud-storage,bucket=clink-fun-data \
  --add-volume-mount=volume=data,mount-path=/data \
  --set-env-vars=CLINK_LAUNCHPAD=$LAUNCHPAD,CLINK_PUBLIC_URL=https://your-domain
```

`CLINK_PUBLIC_URL` must be the real public origin. It is baked into every image
and metadata URL the API hands out, and those go on chain.

## First-time setup

```bash
gcloud artifacts repositories create clink --repository-format=docker --location=$REGION
gcloud storage buckets create gs://clink-fun-data --location=$REGION --uniform-bucket-level-access
gcloud iam service-accounts create clink-fun-sa --display-name="clink.fun runtime"
gcloud storage buckets add-iam-policy-binding gs://clink-fun-data \
  --member=serviceAccount:clink-fun-sa@$PROJECT.iam.gserviceaccount.com \
  --role=roles/storage.objectAdmin
```

## Contracts

```bash
cd contracts
forge install foundry-rs/forge-std --no-git
forge test

CLINK_TREASURY=0xYourTreasury forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.mainnet.chain.robinhood.com \
  --private-key $PRIVATE_KEY --broadcast
```

The script deploys the launchpad and registers all 24 stock markets in the same
run, because a launchpad with no enabled quotes is one where every launch reverts.

## Seeding

`scripts/seed.mjs` launches a few real coins through the same path a person uses,
so a fresh deployment is not an empty grid.

```bash
PRIVATE_KEY=0x... node scripts/seed.mjs
```

## Custom domain

```bash
gcloud beta run domain-mappings create --service=clink-fun --domain=clink.fun --region=$REGION
```

Then add the records it prints at your registrar. Cloud Run provisions the
certificate once DNS resolves.
