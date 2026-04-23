/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_APPWRITE_ENDPOINT: string;
  readonly NEXT_PUBLIC_APPWRITE_PROJECT_ID: string;
  readonly NEXT_PUBLIC_APPWRITE_DATABASE_ID: string;
  readonly NEXT_PUBLIC_APPWRITE_DATASETS_COLLECTION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
