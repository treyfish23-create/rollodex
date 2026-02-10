# ROLLodex - Cannabis Brand Database

ROLLodex is a lightweight, permission-based brand database for the cannabis industry. It allows companies to create brand listings and share marketing assets (logos, product images, descriptions, holiday graphics) with other companies via access requests.

## Features

- **Brand Management**: Create and manage your cannabis brand profile
- **Asset Storage**: Upload and organize logos, product images, and campaign assets
- **Permission System**: Request and grant access to other brands' assets
- **Private Notes**: Add private company notes to any brand
- **Team Management**: Invite additional users to your company account
- **Subscriptions**: Stripe-powered billing ($19.99/month + $5/user)
- **Notifications**: In-app notifications for access requests and new assets

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies
- **File Storage**: AWS S3 (or S3-compatible storage)
- **Payments**: Stripe Subscriptions
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- AWS S3 bucket (or compatible storage)
- Stripe account

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd rollodex
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database
DATABASE_URL="postgresql://username:password@hostname:5432/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (create products in Stripe dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_MONTHLY_PRICE_ID="price_..."
STRIPE_ADDITIONAL_USER_PRICE_ID="price_..."

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="rollodex-assets"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

5. **Run the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Stripe Setup

1. Create a Stripe account and get your API keys
2. Create two products in Stripe Dashboard:
   - Main subscription: $19.99/month
   - Additional user: $5/month
3. Copy the price IDs to your `.env` file
4. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. Add webhook events: `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`

### S3 Setup

1. Create an S3 bucket
2. Set up IAM user with permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## Deployment on Railway

1. **Connect your GitHub repository to Railway**

2. **Add environment variables in Railway dashboard**
   - Copy all variables from your `.env` file
   - Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Railway domain

3. **Add PostgreSQL database**
   - Railway will automatically provision and connect a PostgreSQL database
   - The `DATABASE_URL` will be automatically set

4. **Deploy**
   - Railway will automatically deploy on git push
   - First deployment will run database migrations

5. **Set up Stripe webhook**
   - Update your Stripe webhook URL to: `https://your-railway-domain.up.railway.app/api/webhooks/stripe`

## Project Structure

```
rollodex/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── brands/               # Brand management
│   │   ├── upload/               # File upload
│   │   ├── access-requests/      # Permission system
│   │   ├── notifications/        # In-app notifications  
│   │   ├── billing/              # Stripe billing
│   │   ├── team/                 # Team management
│   │   └── webhooks/             # Stripe webhooks
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main dashboard
│   ├── brand/                    # Brand management page
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── AuthProvider.tsx          # Authentication context
│   └── DashboardLayout.tsx       # Dashboard layout
├── lib/                          # Utility functions
│   ├── db.ts                     # Prisma client
│   ├── auth.ts                   # Auth utilities
│   ├── upload.ts                 # S3 utilities
│   ├── stripe.ts                 # Stripe utilities
│   └── notifications.ts          # Notification system
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema
└── package.json                  # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Brands
- `GET /api/brands` - Get user's brand
- `PUT /api/brands` - Update brand info
- `GET /api/brands/[id]` - Get specific brand (with access control)

### Assets
- `POST /api/upload` - Upload asset
- `DELETE /api/upload?id=<id>` - Delete asset

### Access Control
- `GET /api/access-requests` - Get access requests
- `POST /api/access-requests` - Request access
- `PUT /api/access-requests` - Approve/deny request

### Search
- `GET /api/search?q=<query>` - Search brands

### Team Management
- `GET /api/team` - Get team members
- `POST /api/team` - Add team member
- `DELETE /api/team?userId=<id>` - Remove team member

### Billing
- `GET /api/billing` - Get billing status
- `POST /api/billing` - Create checkout/portal session

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark as read

## User Roles

- **MASTER**: Company owner, can manage team and billing
- **USER**: Regular team member, can manage brand and assets

## Subscription Model

- **Base**: $19.99/month per company
- **Additional Users**: $5/month per user after the first
- **Features**: Upload assets, request access, full brand management

## Security Features

- JWT authentication with HTTP-only cookies
- Role-based access control
- File type validation
- File size limits (10MB)
- CORS protection
- SQL injection protection (Prisma)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support, email [your-support-email] or create an issue in the GitHub repository.

## License

This project is proprietary software. All rights reserved.
