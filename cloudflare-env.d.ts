declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GUILD_SESSION_SECRET?: string;
    PLATFORM_ADMIN_USER_ID?: string;
    GITHUB_BACKUP_REPOSITORY?: string;
    GITHUB_BACKUP_TOKEN?: string;
    GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
    GOOGLE_PRIVATE_KEY?: string;
    GOOGLE_OAUTH_CLIENT_ID?: string;
    GOOGLE_OAUTH_CLIENT_SECRET?: string;
    GOOGLE_OAUTH_REFRESH_TOKEN?: string;
    GOOGLE_SHARED_DRIVE_FOLDER_ID?: string;
    GOOGLE_SHEET_ID?: string;
    BUCKET?: R2Bucket;
  }
}
