# Drainr Quote Tool

Automated quote generation tool that integrates ServiceM8 with Qwilr for streamlined workflow.

## Features

### Phase 1 (Current) ✓
- ServiceM8 job lookup by job number
- Auto-fetch client details (name, email, phone, address)
- Auto-fetch job details (address, job number)
- Dark theme UI matching CIPP calculator

### Phase 2 (Upcoming)
- Quote details form (pipe size, meters, junctions, digging)
- Qwilr document generation
- Automated email sending

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (dark cyan theme)
- **ServiceM8 API** - Job and client data
- **Vercel** - Hosting

## Getting Started

### Prerequisites

- Node.js 18+ installed
- ServiceM8 API key
- GitHub account
- Vercel account (free)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/j03l5k1/quotetool.git
cd quotetool
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your ServiceM8 API key:
```
SERVICEM8_API_KEY=your-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable:
   - Name: `SERVICEM8_API_KEY`
   - Value: Your ServiceM8 API key
4. Deploy!

## Usage

1. Enter a ServiceM8 job number
2. Click "Fetch Job"
3. Review fetched client and job details
4. (Phase 2) Fill in quote details
5. (Phase 2) Generate Qwilr quote and send email

## Project Structure

```
quotetool/
├── app/
│   ├── api/
│   │   └── servicem8/        # API route for ServiceM8
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── lib/
│   └── servicem8.ts           # ServiceM8 API client
├── .env.local                 # Environment variables (gitignored)
├── .env.example               # Example env file
├── package.json               # Dependencies
└── tailwind.config.ts         # Tailwind configuration
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERVICEM8_API_KEY` | ServiceM8 API key | Yes |

## API Endpoints

### GET `/api/servicem8?jobNumber={number}`

Fetches job and client data from ServiceM8.

**Response:**
```json
{
  "job": {
    "uuid": "...",
    "generated_job_id": "12345",
    "job_address": "123 Main St"
  },
  "company": {
    "uuid": "...",
    "name": "Client Name",
    "email": "client@example.com",
    "phone": "0400000000",
    "address": "123 Client St"
  }
}
```

## Development Roadmap

- [x] Phase 1: ServiceM8 integration
- [ ] Phase 2: Quote details form
- [ ] Phase 3: Qwilr integration
- [ ] Phase 4: Email automation

## Contributing

This is a private tool for Drainr. For questions or issues, contact Joel.

## License

Private - All rights reserved
