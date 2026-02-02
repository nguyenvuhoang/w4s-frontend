# Admin Console Scripts

## 📄 generate-page.mjs

Tự động tạo boilerplate cho page mới trong Admin Console với đầy đủ cấu trúc server/client components.

### 🚀 Usage

```bash
# Basic usage - tạo nolayout page
npm run generate:page user-management

# Với view subpage (detail page)
npm run generate:page transaction-logs -- --view

# Nested path
npm run generate:page reports/monthly

# Skip error/skeleton components
npm run generate:page api-gateway -- --skip-error --skip-skeleton

# Normal layout page (không phải nolayout)
npm run generate:page dashboard/analytics -- --type normal
```

### 📁 What It Creates

Với command `npm run generate:page user-management --view`:

```
src/
├── app/[locale]/(dashboard)/(portal)/(nolayout)/
│   └── user-management/
│       ├── page.tsx              # Server component (RSC)
│       └── view/[...slug]/
│           └── page.tsx          # Detail page RSC
│
└── views/nolayout/
    └── user-management/
        ├── index.tsx             # Main client component
        ├── UserManagementError.tsx    # Error boundary
        ├── UserManagementSkeleton.tsx # Loading skeleton
        └── view/
            └── index.tsx         # Detail view component
```

### 🎯 Generated Code Structure

**Server Page (RSC):**
```tsx
// app/[locale]/(dashboard)/(portal)/(nolayout)/user-management/page.tsx
import type { Locale } from '@configs/i18n'
import UserManagementContent from '@views/nolayout/user-management'

export default async function UserManagementPage(props: Props) {
  const params = await props.params
  const { locale } = params
  return <UserManagementContent locale={locale} />
}
```

**Client Component:**
```tsx
// views/nolayout/user-management/index.tsx
'use client'
import type { Locale } from '@configs/i18n'

export default function UserManagementContent({ locale }: Props) {
  // TODO: Implement your logic here
  return <Card>...</Card>
}
```

### ⚙️ Options

| Flag | Description | Example |
|------|-------------|---------|
| `--type <nolayout\|normal>` | Layout type (default: nolayout) | `--type normal` |
| `--view` | Generate view subpage with [...slug] route | `--view` |
| `--skip-error` | Skip error component generation | `--skip-error` |
| `--skip-skeleton` | Skip skeleton component generation | `--skip-skeleton` |

### 📝 Next Steps After Generation

1. **Edit main component:**
   ```bash
   src/views/nolayout/[page-name]/index.tsx
   ```

2. **Add menu entry:**
   ```tsx
   // src/data/navigation/verticalMenuData.tsx
   {
     label: 'User Management',
     href: '/user-management',
     icon: 'tabler:users'
   }
   ```

3. **Add translations:**
   ```json
   // src/data/dictionaries/en.json
   {
     "userManagement": {
       "title": "User Management",
       "description": "Manage users..."
     }
   }
   ```

4. **Test in browser:**
   ```
   http://localhost:3000/en/user-management
   ```

### 🔄 Common Patterns

**List + Detail Pages:**
```bash
npm run generate:page contract-management -- --view
# Creates:
# - /contract-management (list)
# - /contract-management/view/[id] (detail)
```

**Nested Routes:**
```bash
npm run generate:page reports/transaction-summary
# Creates: /reports/transaction-summary
```

**Simple Page (no error/skeleton):**
```bash
npm run generate:page quick-action -- --skip-error --skip-skeleton
```

### 🎨 Customization

Edit `scripts/generate-page.mjs` to customize:
- Default imports
- Component structure
- Styling patterns
- API patterns

### 🐛 Troubleshooting

**Error: Page path is required**
```bash
# ❌ Wrong
npm run generate:page

# ✅ Correct
npm run generate:page my-page
```

**Need to pass flags with npm:**
```bash
# Use -- to pass flags to script
npm run generate:page my-page -- --view --skip-error
```

**Path aliases not resolving:**
- Check `tsconfig.json` paths configuration
- Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### 💡 Pro Tips

1. **Use kebab-case for page names:**
   ```bash
   npm run generate:page user-management  # ✅ Good
   npm run generate:page UserManagement   # ❌ Will be converted to usermanagement
   ```

2. **Nested pages inherit parent layout:**
   ```bash
   npm run generate:page settings/security
   # Respects /settings layout if exists
   ```

3. **Quick prototype without extras:**
   ```bash
   npm run generate:page prototype -- --skip-error --skip-skeleton
   ```

4. **Batch create with shell script:**
   ```bash
   # create-pages.sh
   npm run generate:page users
   npm run generate:page roles
   npm run generate:page permissions
   ```

### 📚 Related Documentation

- [Admin Console Architecture](../document/COLOR_ARCHITECTURE_DIAGRAM.md)
- [Component Guidelines](../document/COLOR_CONFIGURATION_GUIDE.md)
- [Next.js App Router](https://nextjs.org/docs/app)
