# Source Protection Plan

**Reference:** `https://github.com/ovitechdz/ovitech.saas-`
**Reference commit:** `f99cd02227cd9d6b5325cda21f94b89108b62d26`
**Rule:** the reference repository is READ-ONLY for the entire rebuild.

## ملخص عربي

يُعامل المستودع المرجعي كأصل للقراءة فقط. لا تعديل، لا حذف، لا `reset`، لا `rebase`، لا `push`، ولا نشر. تُنشأ نسخة مرجعية منفصلة للفحص فقط، ويُمنع نسخ أي أسرار أو إعدادات Vercel أو Grok إلى المشروع الجديد. أي تحديث للمرجع يكون عبر `fetch` فقط وبعد إشعار المستخدم.

## 1. Protected assets

| Asset | Path / URL | Protection level |
|---|---|---|
| Official remote repository | `ovitechdz/ovitech.saas-` | Read-only |
| Reference commit | `f99cd02…` | Immutable evidence |
| Future reference clone | `C:\Users\ASUS\ovitech-reference` | Read-only after clone |
| Stale local clone | `C:\Users\ASUS\OVITECH_Sauvegardes\ovitech.saas-` | Do not modify; evidence only |
| Pre-existing prototype | `C:\Users\ASUS\ovitech-clean` | Do not delete; quarantine only with approval |
| Different fork | `OVITECH_Projet_Complet test`, `OVITECH_Sauvegardes\ovitech_projet-complet` | Out of scope; do not touch |
| Target project | `C:\Users\ASUS\ovitech-rebuild` (proposed, not created) | Independent repository |

## 2. Hard prohibitions

The following are forbidden unless the user gives explicit, written approval:

1. Editing, deleting, renaming, or moving files in the reference repository.
2. Running `git reset`, `git clean`, `git rebase`, `git checkout --force`, or `git push` against it.
3. Changing its branches, tags, remotes, or Git history.
4. Force-pushing, opening pull requests, or triggering releases.
5. Deploying the reference or the target to Vercel.
6. Copying `.env`, `.vercel`, `.grok`, credentials, tokens, cookies, or private keys.
7. Copying demo data or personal data into the new production database.
8. Using the reference homepage or Vercel deployment as a production dependency.

## 3. Safe inspection procedure (Phase 1, after approval)

1. Clone the official remote into a dedicated directory:

   ```powershell
   git clone --filter=blob:none https://github.com/ovitechdz/ovitech.saas-.git C:\Users\ASUS\ovitech-reference
   git -C C:\Users\ASUS\ovitech-reference checkout f99cd02227cd9d6b5325cda21f94b89108b62d26
   ```

2. Verify identity before inspection:

   ```powershell
   git -C C:\Users\ASUS\ovitech-reference remote -v
   git -C C:\Users\ASUS\ovitech-reference rev-parse HEAD
   git -C C:\Users\ASUS\ovitech-reference status --short
   ```

3. Disable accidental pushes locally:

   ```powershell
   git -C C:\Users\ASUS\ovitech-reference remote set-url --push origin DISABLED_READ_ONLY
   ```

4. Never run write commands in that worktree.
5. If the reference must be refreshed, use `git fetch` only, then explicitly check out the approved commit.
6. Keep all new work in the separate target directory.

## 4. Secret and configuration handling

- The official HEAD tree contains no `.env`/`.vercel`/`.grok` paths, but a content-level secret scan is still required in Phase 1.
- Any environment variables required by the target are documented in `.env.example` with empty/example values.
- Real secrets live only in the deployment environment, never in Git.
- The target must run without any AI provider; no API key may be a startup requirement.
- The target must not contain a Vercel dependency, configuration, or deploy script.

## 5. Read-only verification checklist

Before and after each inspection session:

- [ ] `git rev-parse HEAD` equals the approved commit.
- [ ] `git remote -v` shows the official remote.
- [ ] Push URL is disabled.
- [ ] `git status --short` is clean, or changes are known and intentional.
- [ ] No file has been written under the reference path.
- [ ] No secrets were copied to the target.
- [ ] No deployment command was executed.

## 6. Incident response

If an accidental write occurs in the reference worktree:

1. Stop all work.
2. Capture `git status` and the affected file list.
3. Do not attempt `reset`/`clean`/`rebase` without approval.
4. Restore only by checking out the approved commit into a **new** clean clone.
5. Report the incident and the exact commands used.
6. Re-verify the official remote is unaffected.

If a secret is discovered:

1. Do not print the value.
2. Record the path only.
3. Notify the user immediately.
4. Exclude it from any copied artifact.
5. Recommend rotation if the secret was ever committed publicly.

## 7. Approval statement

This plan assumes the user has the right to authorize a rebuild of the reference project. The repository currently declares no license. Written confirmation of ownership or permission is required before code reuse, adaptation, or redistribution.
