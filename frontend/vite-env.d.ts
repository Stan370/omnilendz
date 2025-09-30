interface ImportMetaEnv {
    readonly VITE_OMNI_ADDRESS: string;
    // Add other environment variables as needed
    // For example:
    // readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }