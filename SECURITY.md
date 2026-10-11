# Security review — 2026-10-10

## Completed
- Independent read-only AI review and manual endpoint/DB authorization review.
- Reject unauthenticated APIs centrally and explicitly protect sheet sync. Enforce known guild roles, same-origin writes, JSON body types and streamed request limits.
- Remove implicit legacy DB fallback. Read-only guild DB cannot write. Normal scoped queries cannot query administrative tables or update without a filter. Price GET no longer writes inferred attributes.
- Keep PBKDF2 salted password hashes; sign sessions using a separate secret runtime variable (GUILD_SESSION_SECRET). User/guild/hash/expiry are bound into the signature. Password and secret rotation invalidate old sessions.
- Reserve password guesses atomically: at most five per guild/user per minute, including parallel requests. Create a guild, its owner and password in one D1 batch.
- No automatic first-visitor administrator on an empty database. Existing administrator records are retained; a fresh installation needs an explicitly configured PLATFORM_ADMIN_USER_ID to bootstrap legacy ownership.
- Add CSP (nonce for server HTML), nosniff, HSTS, referrer and permissions policies to worker responses and static assets. Personal API/HTML responses are not cached. No permissive CORS.
- Hide database/runtime error details in responses and avoid raw exception logging. Validate main state identity, quantities, numeric values and size. Harden CSV formula handling.
- Development uses local D1 and local fixtures; production secrets are not copied to test files. Production sheet synchronization and GitHub exports cannot run in development mode. Mock authentication is serve-only. Ignore .env*, .dev.vars*, private keys and service-account files.
- Preserve all existing guild, activity, settlement and pricing records. No destructive migration.

## Verification
- 50 Node tests passed, including cross-guild isolation, private questions, viewer API write denial, anonymous API denial, cross-origin denial, streamed-body limits, session forgery rejection, atomic attempt counters and malformed state.
- TypeScript noEmit and JavaScript syntax checks passed.
- Pattern scan: 165 source files and 350 Git-history blobs; no matching private keys or common API-token patterns. Pattern scanning is not a guarantee that every secret was found; no dedicated Semgrep/Gitleaks binary was installed.
- Initial pnpm audit: critical 1 / high 30 / moderate 23 / low 8 dependency findings (not necessarily exploitable endpoints).
- Updated Next 16.3.8, React/RSC 19.2.8, Vite 8.0.16 and affected transitive packages. Final production audit: zero findings. Full audit: one high braces 3.0.3 development dependency warning, no patched version reported, GHSA-vfj7-8cjw-p6xm.

## Remaining limits
- D1 has no PostgreSQL RLS switch. This app enforces tenant isolation through server-side guild scoping and authorization; future queries require review. Long term use explicit tenant-aware repository queries instead of SQL rewriting.
- Existing editors can change settlement snapshots and balances by design. Strict immutable financial audit logs and fully server-executed settlement commands are not implemented.
- Password throttling is per trusted user and guild, not a distributed IP/account-abuse defense. Guild creation has no dedicated rate limit yet.
- Google Sheets sharing permissions and GitHub account security are separate operational controls. GitHub backup is not configured (no backup token/repository set). Private SQL backups contain password hashes and must be protected.
- Local tests are isolated; a separate hosted staging Site/database was not created. No live penetration test or browser-driven visual verification was performed.
- Trusted Sites authentication headers depend on the platform proxy boundary. Direct worker exposure must not bypass that boundary.

Repeat after dependency changes: node scripts/security-scan.mjs; node --test tests/*.test.mjs; tsc --noEmit; pnpm audit --prod; pnpm audit. Never use real guild data or production credentials in fixtures. No sensitive values belong in this document.
