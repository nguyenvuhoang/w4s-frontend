# O24OpenAPIManager



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://delivery-gitlab.jits.com.vn/delivery/jits/o24openapimanager.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://delivery-gitlab.jits.com.vn/delivery/jits/o24openapimanager/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Automatically merge when pipeline succeeds](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing(SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thank you to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README
Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
=======
# Admin Console - Full Template

Complete enterprise-grade Next.js 16 banking/financial portal with comprehensive features from Admin Console.

## 🚀 Features

### Authentication & Security
- **NextAuth v5** with JWT strategy
- Custom Credentials provider with device fingerprinting
- AuthGuard HOC for protected routes
- SignalR integration for real-time verification
- Session management with token refresh
- Idle timer with auto-logout

### UI Components
- **MUI 7** with custom theme system
- Comprehensive component library (@core/components)
- Custom layouts (Vertical & Horizontal navigation)
- Multi-level menu system with dynamic routing
- DataGrid with advanced filtering
- Form components with validation
- Modals, tooltips, notifications (React Hot Toast)

### Internationalization (i18n)
- **Next-Intl** with 3 locales: English (en), Lao (la), Vietnamese (vi)
- Dynamic route segments with `[locale]`
- Translation dictionaries for all UI elements
- Language switcher in navigation

### Backend Integration
- Service-oriented architecture with `src/servers/`
- Standardized HTTP wrapper with auth injection
- API helper functions (apiPost, createDefaultBody)
- Workflow-based request pattern
- Error interceptors (401/422/500 handling)

### Advanced Features
- Dynamic form builder with drag-and-drop
- Report generation and preview
- Calendar integration (FullCalendar)
- File upload with base64 encoding
- PDF viewer and generator
- Excel export functionality
- QR code generation
- Contract management workflows

### Developer Experience
- TypeScript 5 with strict mode
- Path aliases (@core, @layouts, @menu, @views, @components)
- React Hook Form + Valibot/Zod validation
- Zustand for state management
- ESLint configuration
- Turbopack for fast development

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
# REQUIRED: NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, API_URL
```

## 🔧 Configuration

### Environment Variables

**Required:**
- `NEXT_PUBLIC_API_URL` - Main API endpoint
- `NEXT_PUBLIC_REST_API_ENDPOINT` - REST API endpoint
- `NEXT_PUBLIC_APPLICATION_CODE` - Application identifier (default: PORTAL)
- `NEXTAUTH_SECRET` - NextAuth encryption key (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for dev)
- `API_URL` - Server-side API base URL

**Optional:**
- `NEXT_PUBLIC_SIGNALR` - SignalR hub URL for real-time features
- `NEXT_PUBLIC_REPORT_URI` - Report server URL
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile CAPTCHA
- `NEXT_PUBLIC_IMAGE_API_ENDPOINT` - Image service URL

### Theme Configuration

Theme settings in `src/configs/themeConfig.ts`:
```typescript
{
  mode: 'light', // Only light mode supported
  primaryColor: 'primary',
  skin: 'default',
  layout: 'vertical',
  navbar: {
    type: 'fixed',
    contentWidth: 'wide'
  }
}
```

## 🏃 Running the App

```bash
# Development mode (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── @core/            # Core components, hooks, utils, theme
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   ├── stores/       # Zustand stores
│   ├── theme/        # MUI theme configuration
│   └── utils/        # Helper functions
├── @layouts/         # Layout components (Vertical/Horizontal)
├── @menu/            # Navigation menu system
├── app/              # Next.js 16 App Router
│   ├── [locale]/     # Localized routes (en/la/vi)
│   ├── api/          # API route handlers
│   └── @modal/       # Parallel route modals
├── components/       # Application-specific components
├── configs/          # Configuration files
├── contexts/         # React Context providers
├── data/             # Static data, dictionaries, navigation
├── hocs/             # Higher-Order Components (AuthGuard)
├── hooks/            # Custom hooks
├── servers/          # Backend service integration
│   ├── bank-service/
│   ├── portal-service/
│   ├── system-service/
│   └── lib/          # HTTP client and API helpers
├── schemaValidations/ # Form validation schemas
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── views/            # Page-specific view components
    ├── accounting/
    ├── contracts/
    ├── forms/
    ├── nolayout/
    └── pages/
```

## 🔐 Authentication Flow

1. User navigates to `/login`
2. Credentials submitted via `src/app/api/login/route.ts`
3. Backend validates + returns JWT token
4. Token stored in session (NextAuth) and localStorage
5. All API requests authenticated via `src/servers/lib/http.ts`
6. Protected routes wrapped with `AuthGuard` HOC

## 🌐 Adding New Routes

### 1. Create Page Component
```typescript
// src/app/[locale]/(dashboard)/(portal)/your-page/page.tsx
import type { Metadata } from 'next';
import YourView from '@views/your-page';

export const metadata: Metadata = {
  title: 'Your Page Title'
};

export default async function YourPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <YourView locale={locale} />;
}
```

### 2. Create View Component
```typescript
// src/views/your-page/index.tsx
'use client';
import { Card, CardContent } from '@mui/material';

export default function YourView({ locale }: { locale: string }) {
  return (
    <Card>
      <CardContent>
        {/* Your content */}
      </CardContent>
    </Card>
  );
}
```

### 3. Add Menu Entry
```typescript
// src/data/navigation/verticalMenuData.tsx
{
  label: 'Your Page',
  href: '/your-page',
  icon: 'tabler-icon-name'
}
```

### 4. Add Translations
```json
// src/data/dictionaries/en.json, la.json, vi.json
{
  "navigation": {
    "yourPage": "Your Page Title"
  }
}
```

## 🛠️ Working with Forms

```typescript
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { object, string } from 'valibot';

const schema = object({
  fieldName: string('Field is required')
});

export default function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: valibotResolver(schema)
  });

  const onSubmit = async (data) => {
    // Use apiPost from shared package
    const response = await apiPost('/endpoint', data, token);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="fieldName"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Field Name" />
        )}
      />
    </form>
  );
}
```

## 🌍 i18n Usage

```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations();
  
  return <h1>{t('navigation.dashboard')}</h1>;
}
```

## 📡 API Integration

```typescript
import { apiPost, createDefaultBody } from '@/servers/lib/api';
import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session } = useSession();
  
  const fetchData = async () => {
    const response = await apiPost(
      '/your-endpoint',
      createDefaultBody('WORKFLOW_ID', { 
        field1: 'value' 
      }),
      session?.user?.token,
      { lang: 'en' }
    );
    
    if (response.data) {
      // Handle success
    }
  };
}
```

## 🎨 Customization

### Theme Colors
Edit `src/configs/primaryColorConfig.ts` and `src/configs/brandColorConfig.ts`

### Layout Mode
Change `layout` in `src/configs/themeConfig.ts`:
- `vertical` - Sidebar navigation (default)
- `horizontal` - Top navigation bar

### Menu Structure
Modify `src/data/navigation/verticalMenuData.tsx` or `horizontalMenuData.tsx`

## 📝 Important Notes

- **Next.js 16**: Uses App Router with async params pattern
- **React 19**: Latest React features enabled
- **Server Components**: Default in `app/` directory, use `'use client'` explicitly
- **Light Mode Only**: UI enforces light-only theme
- **No Middleware**: Uses `proxy.ts` for routing (Next.js 16 convention)
- **Path Aliases**: Use `@core/*`, `@views/*`, etc. instead of relative imports

## 🔒 Security Features

- JWT token validation
- Device fingerprinting on login
- Idle timeout with automatic logout
- Secure cookie settings
- CSRF protection via NextAuth
- SSL certificate support (see `/cert` folder)

## 📚 Built With

- [Next.js 16](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [MUI 7](https://mui.com/) - Component library
- [NextAuth v5](https://next-auth.js.org/) - Authentication
- [Next-Intl](https://next-intl-docs.vercel.app/) - i18n
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Valibot](https://valibot.dev/) - Schema validation
- [SignalR](https://learn.microsoft.com/en-us/aspnet/core/signalr/) - Real-time communication

## 🐳 Deployment

### Docker
```bash
docker build -t emi-portal .
docker run -p 3000:3000 emi-portal
```

### PM2 (Production)
```bash
npm run build
pm2 start ecosystem.config.js
```

## 📄 License

Private - Admin Console

## 🤝 Support

For issues or questions, please contact the development team.

---

**Generated with** [create-o24ui-app](https://www.npmjs.com/package/create-o24ui-app)
