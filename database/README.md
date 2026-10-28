# AUREVÉ marketplace database

## Apply the schema
1. Create a PostgreSQL database (Neon is suitable).
2. Open the database SQL editor and run all of `schema.sql`.
3. In Vercel → project **aureve** → Settings → Environment Variables, add:
   - `DATABASE_URL`: the database connection string
   - `AUREVE_ADMIN_TOKEN`: a long random secret
4. Redeploy the production project after setting the variables.

## API endpoints
- `GET /api/listings?q=watch&category=Watches&location=London`: published listings only.
- `POST /api/enquiries`: stores a buyer enquiry.
- `POST /api/seller-applications`: stores a seller application for review.
- `GET /api/admin/review`: returns pending listings, new enquiries, and pending seller applications; requires `x-admin-token`.
- `PATCH /api/admin/review`: approve/reject listings and seller applications, or update enquiry status; requires `x-admin-token`.

Public seller applications are not seller accounts and do not publish listings. A human review is required before a listing can appear publicly. Payment processing, identity verification, email delivery, seller accounts, and buyer sign-in are not yet enabled; do not accept real payments until those are implemented and tested.
