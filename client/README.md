# SalonSite - Nail Salon Website Generator

SalonSite is a platform for generating and managing professional nail salon websites with a subscription-based hosting model and Stripe payment integration. The platform enables creating sample websites for salons that can be customized and claimed by salon owners.

![SalonSite Dashboard](https://via.placeholder.com/800x400?text=SalonSite+Dashboard)

## Features

- **Automatic Sample Website Generation**: Create sample websites using business data and customizable templates
- **Client Portal**: Salon owners can claim and customize their websites
- **Template Gallery**: Multiple professional templates optimized for the beauty industry
- **Subscription Management**: Tiered pricing plans with Stripe integration
- **Admin Dashboard**: Monitor leads, manage subscriptions, and track performance
- **Responsive Design**: Mobile-friendly websites for all devices
- **User Authentication**: Secure login and registration system
- **Live Chat Assistant**: Help visitors with common questions

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Backend**: Node.js with Express
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (optional) or in-memory storage
- **Authentication**: Passport.js with session-based auth
- **Payment Processing**: Stripe
- **Bundler**: Vite

## Prerequisites

Before running the project, you need:

- Node.js 18+ and npm
- Stripe account for payment processing
- (Optional) PostgreSQL database

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Required for Stripe integration
STRIPE_SECRET_KEY=sk_test_your_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_public_key

# Optional for PostgreSQL (if using database instead of in-memory storage)
DATABASE_URL=postgresql://username:password@localhost:5432/salonsite

# For session management
SESSION_SECRET=your_session_secret
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/salonsite.git
cd salonsite
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the backend API server and frontend development server concurrently.

## Project Structure

```
salonsite/
├── client/                # Frontend code
│   ├── src/
│   │   ├── assets/        # Static assets
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
├── server/                # Backend code
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   └── vite.ts            # Vite server configuration
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Database schema and types
├── components.json        # shadcn/ui configuration
├── package.json           # Project dependencies
└── vite.config.ts         # Vite configuration
```

## Development Workflow

1. Define data models in `shared/schema.ts`
2. Implement API endpoints in `server/routes.ts`
3. Create/modify React components in `client/src/components`
4. Add pages in `client/src/pages`
5. Update routing in `client/src/App.tsx`

## Deployment

### Option 1: Deploy on Replit

1. Fork this project on Replit
2. Add the required environment variables in the Replit Secrets tab
3. Run the project
4. Click the "Deploy" button in Replit's interface

### Option 2: Deploy to a VPS or Cloud Provider

1. Build the production version:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```
npm install drizzle-kit@latest drizzle-orm@latest

npx drizzle-kit generate


3. For production, consider using a process manager like PM2:
```bash
npm install -g pm2
pm2 start dist/server/index.js
```

### Option 3: Docker Deployment

1. Build the Docker image:
```bash
docker build -t salonsite .
```

2. Run the container:
```bash
docker run -p 5000:5000 -e STRIPE_SECRET_KEY=sk_test_xxx -e VITE_STRIPE_PUBLIC_KEY=pk_test_xxx salonsite
```

## User Types and Roles

- **Visitors**: Can view sample sites and pricing
- **Salon Owners**: Can claim their site, customize content, and manage subscriptions
- **Administrators**: Can manage all salon sites, templates, and platform settings

## API Endpoints

npx @openapitools/openapi-generator-cli generate \
  -i schema.yaml \
  -g typescript-axios \  # or `javascript`, `typescript-fetch`
  -o src/api/

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login a user
- `POST /api/logout` - Logout a user
- `GET /api/user` - Get current user information

### Salon Websites
- `GET /api/salons` - Get all salon websites
- `GET /api/salons/:id` - Get a specific salon website
- `GET /api/salons/sample/:sampleUrl` - Get a sample salon website by URL
- `POST /api/salons` - Create a new salon website
- `PATCH /api/salons/:id` - Update a salon website
- `POST /api/salons/:id/claim` - Claim a salon website

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get a specific template

### Subscription Plans
- `GET /api/subscription-plans` - Get all subscription plans
- `POST /api/create-payment-intent` - Create a payment intent for Stripe
- `POST /api/get-or-create-subscription` - Create or retrieve a subscription

## Payment Processing

SalonSite supports multiple payment providers that can be enabled or disabled via environment variables:

### Available Payment Providers

1. **Stripe**: Industry-standard payment processing
2. **PayPal**: Alternative payment processing (integration ready)
3. **Manual Payments**: Bank transfer or in-person payment options

### Payment Configuration

You can configure which payment providers are available in your `.env` file:

```
# Enable/disable payment providers
ENABLE_STRIPE=true
ENABLE_PAYPAL=false
ENABLE_MANUAL=true

# Set the default payment provider (must be one that's enabled)
DEFAULT_PAYMENT_PROVIDER=stripe
```

### Integrating with Stripe

To use Stripe for payments:

1. Set `ENABLE_STRIPE=true` in your `.env` file
2. Create a Stripe account at https://stripe.com
3. Get your API keys from the Stripe Dashboard
4. Add the keys to your environment variables:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_public_key
   ```
5. Test the payment flow using Stripe test cards
6. For production, update to live Stripe keys

### Integrating with PayPal

To use PayPal for payments:

1. Set `ENABLE_PAYPAL=true` in your `.env` file
2. Create a PayPal Developer account at https://developer.paypal.com
3. Create an application to get your API credentials
4. Add the keys to your environment variables:
   ```
   PAYPAL_API_KEY=your_paypal_api_key
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

### Using Manual Payments

For manual payments (bank transfers, in-person payments):

1. Set `ENABLE_MANUAL=true` in your `.env` file
2. No additional API keys are required
3. The system will generate reference numbers for tracking payments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@salonsite.com or use the live chat assistant on the website.