# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- Sync Convex codegen types: removed stale module references from app-level generated types, added dashboard module to root codegen, and updated dataModel to schema-less mode for app-level Convex directory (b2ebdc6)

### Added
- TODOS.md with prioritized backlog (biomarker alerts, GDPR email unsubscribe, observability, email queue upgrade, action item pagination)
- Patient detail panel and enhanced intake consent options (e55cb90)
- Patient dashboard and quote builder functionality (de8b1d8)
- Complete i18n externalization across all remaining frontend pages (54d8205)
- Complete frontend build for Celljevity Longevity OS (f343bab, 702f979)
- Comprehensive assignment-based access control for backend (3b0e4ef, add213a)
- Full CRUD for all backend resources with pricing (e2f5e64, 101214f)
- Comprehensive security audit trail (ce22572)
- Seed admin users script (3825aff)
- Complete backend with leads, secure document tokens, RBAC filtering (8bbd6d0, 934a6f9)
- Complete backend with schema, auth, RBAC, API routes, OpenAPI codegen (0c37b3a)
- Initial commit (e7d19ec)

### Fixed
- Code review findings for Task #4 Frontend (4dd2fa2, 2d65816)
- API client declarations and OpenAPI spec sync - Task #7 (6208987)
- All code review issues for Task #3 Backend (33b3fa6, cbbefa6, e6aa0dd)
- Backend review items addressed across multiple rounds (bd75224, c8333f5, e94e837, 9ab10d5, 13f6f40)

### Changed
- Add `.worktrees/` to `.gitignore` (010d1bb)
- Merged changes from ethmdrtx/main (9d331f1)
- Transitioned from Plan to Build mode (664cd11)
