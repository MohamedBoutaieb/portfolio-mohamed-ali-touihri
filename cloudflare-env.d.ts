declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PORTFOLIO_ADMIN_EMAIL?: string;
  }
}
