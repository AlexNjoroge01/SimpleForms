import { defineConfig } from "@neon/config/v1"

import { STORAGE_BUCKET } from "./lib/storage-bucket"

// Neon Object Storage. `neon deploy` provisions the bucket and writes the
// AWS_* credentials to .env.local. Private: files are served via presigned URLs.
export default defineConfig({
  buckets: {
    [STORAGE_BUCKET]: { access: "private" },
  },
})
