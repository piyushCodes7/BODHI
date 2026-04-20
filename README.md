<div align="center">
<pre>
██████╗  ██████╗ ██████╗ ██╗  ██╗██╗
██╔══██╗██╔═══██╗██╔══██╗██║  ██║██║
██████╔╝██║   ██║██║  ██║███████║██║
██╔══██╗██║   ██║██║  ██║██╔══██║██║
██████╔╝╚██████╔╝██████╔╝██║  ██║██║
╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝
</pre>
</div>

<p align="center"><strong>Your Money. Alive.</strong></p>

<p align="center"><em>The Financial Immune System Built for Gen-Z</em></p>

<p align="center">
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi" alt="FastAPI"/></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/Mobile-React%20Native-61DAFB?style=flat-square&logo=react" alt="React Native"/></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql" alt="PostgreSQL"/></a>
  <img src="https://img.shields.io/badge/License-Hackathon%20Demo-lightgrey?style=flat-square" alt="License"/>
</p>

<p align="center">
  Built by <strong>Team BUGHACKERS 404</strong> — Govind Jindal · Aaradhya Khanna · Piyush Sharma<br/>
  <em>FINVASIA Innovation Hackathon 2026</em>
</p>

<p align="center">
  <img src="assets/banner.png" alt="BODHI Banner" width="100%"/>
  <!-- Replace assets/banner.png with your hero banner or app logo -->
</p>

---

## Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Local Setup Guide](#-local-setup-guide)
- [Privacy Model](#-privacy-model)
- [Team](#-team)

---

## 🚨 Problem Statement

81% of Gen-Z abandon finance apps after poor first experiences. Existing tools fail this generation in five distinct ways:

| Pain Point | The Reality |
|---|---|
| **FOMO Investing** | Decisions driven by group chats, with zero personal strategy or risk context |
| **Awkward IOUs** | Group trips leave weeks of unresolved debts and fractured friendships |
| **Unread Insurance** | Dense legal PDFs go ignored — most Gen-Z have no idea what they're actually covered for |
| **Impulse Spending** | Money leaves accounts before the brain catches up; no real-time guardrails exist |
| **Privacy Fears** | 68% of users refuse apps that demand sensitive bank credentials upfront |

---

## 💡 Solution Overview

BODHI is not a dashboard. It is a **Financial Immune System**.

It operates silently in the background, intercepts poor financial decisions before they happen, and transforms personal finance into a multiplayer experience worth engaging with — built natively for the way Gen-Z actually lives, spends, and invests.

---

## 🧬 Core Features

### 🔐 Zero-Knowledge On-Device Architecture
SMS parsing and spending classification run entirely on the device's NPU using TensorFlow Lite. Raw financial data never leaves the phone — ever.

### 📈 Venture Clubs — Social Investing, Reinvented
Swipe-to-vote micro-investment clubs. Pool ₹500 with five friends, vote democratically on stocks, and share both the risk and the reward. Finance as a team sport.

### 🧳 Self-Destructing Trip Wallets
Everyone contributes upfront. Expenses auto-deduct in real time. When the trip ends, the wallet dissolves and automatically settles all unspent balances — zero IOUs, zero awkward conversations.

### 📖 Stories-Based Insurance Decoder
Complex policy PDFs are processed by Gemini 1.5 Pro and transformed into 30-second, jargon-free visual stories — highlighting exact coverage gaps in language anyone can understand.

### 🧠 BODHI Brain — Your Financial Co-Pilot
An on-device AI layer powered by MobileBERT + LSTM models that learns your spending DNA and flags anomalies, patterns, and opportunities in real time.

---

## 📱 Interface Showcase

<p align="center">
  <img src="assets/screenshots/login.png" alt="Login Screen" width="22%"/>
  <img src="assets/screenshots/social-hub.png" alt="Social Hub" width="22%"/>
  <img src="assets/screenshots/insurance-stories.png" alt="Insurance Stories" width="22%"/>
  <img src="assets/screenshots/market.png" alt="Market" width="22%"/>
</p>
<p align="center">
  <em>Login &nbsp;·&nbsp; Social Hub &nbsp;·&nbsp; Insurance Stories &nbsp;·&nbsp; Market</em>
</p>

---

## 🧠 System Architecture

BODHI runs on a scalable, AI-first microservices architecture. Privacy-sensitive logic stays on-device; cloud intelligence handles everything else.

```mermaid
graph LR
    subgraph "📱 Mobile App (React Native)"
        UI["Payments | Contri | Simulator\nInsurance | Brain UI"]
    end

    subgraph "🚪 API Gateway"
        GW["FastAPI\nAuth · Rate Limit · Routing"]
    end

    subgraph "⚙️ Microservices"
        MS1["💳 Payment Service"]
        MS2["🤝 Contri Service"]
        MS3["📊 Simulation Engine"]
        MS4["🛡️ Insurance RAG"]
        MS5["🧠 Brain Service"]
    end

    subgraph "🤖 AI / ML Layer"
        OD["On-Device\nSMS Parser · MobileBERT · LSTM"]
        CL["Cloud AI\nLangChain RAG · Gemini 1.5 Pro · Whisper"]
    end

    subgraph "🗄️ Data Layer"
        DB1[("PostgreSQL")]
        DB2[("Redis Cache")]
        DB3[("Vector DB")]
        DB4[("S3 Storage")]
    end

    UI --> GW
    GW --> MS1 & MS2 & MS3 & MS4 & MS5
    MS5 --> OD
    MS4 --> CL
    MS1 & MS2 & MS3 --> DB1 & DB2
    CL --> DB3 & DB4
```

> 💡 If your Markdown renderer does not support Mermaid, view the full architecture diagram here:

<p align="center">
  <img src="assets/architecture.png" alt="BODHI System Architecture" width="85%"/>
  <!-- Replace assets/architecture.png with an exported image of the architecture diagram -->
</p>

---

## 🔌 API Reference

All services are fully documented via FastAPI's auto-generated OpenAPI spec at `/docs`.

| Category | Method | Endpoint | Description |
|---|---|---|---|
| Auth | `POST` | `/auth/register` | Create a new user account |
| Auth | `POST` | `/auth/login` | Authenticate and receive JWT |
| Trade | `POST` | `/trade/buy` | Execute a buy order (paper or live) |
| Trade | `POST` | `/trade/sell` | Execute a sell order |
| Trade | `GET` | `/trade/portfolio` | Fetch portfolio holdings and P&L |
| Prices | `GET` | `/price/live` | Real-time market tick data |
| Prices | `GET` | `/price/batch` | Batch quote fetch |
| Wallets | `POST` | `/wallets/groups` | Create a shared investment pool |
| Trips | `POST` | `/wallets/trips/{id}/contribute` | Add funds to a trip ledger |
| Expenses | `POST` | `/expenses/settle` | Auto-calculate and settle debts |
| Insurance | `POST` | `/insurance/query` | Query the insurance RAG pipeline |

---

## 📂 Project Structure

```
BODHI/
├── bodhi-backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/            # All route handlers
│   │   │   └── deps.py            # Dependency injection
│   │   ├── core/
│   │   │   ├── config.py          # App configuration
│   │   │   ├── security.py        # JWT & auth utilities
│   │   │   └── logging.py         # Structured logging
│   │   ├── db/
│   │   │   ├── base.py            # SQLAlchemy base
│   │   │   ├── session.py         # DB session management
│   │   │   └── migrations/        # Alembic migrations
│   │   ├── models/                # ORM models
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # Business logic layer
│   │   └── main.py                # App entrypoint
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
└── mobileApp_BODHI/               # React Native app
    ├── src/
    │   ├── api/                   # API client layer
    │   ├── assets/
    │   │   ├── icons/
    │   │   └── images/
    │   ├── components/
    │   │   ├── common/            # Shared UI components
    │   │   └── feature/           # Feature-specific components
    │   ├── config/
    │   ├── constants/
    │   ├── hooks/                 # Custom React hooks
    │   ├── navigation/            # React Navigation setup
    │   ├── screens/
    │   │   ├── auth/
    │   │   ├── market/
    │   │   ├── payments/
    │   │   └── social/
    │   ├── services/              # Business logic & AI bridge
    │   ├── store/                 # Global state (Redux/Zustand)
    │   ├── theme/                 # Design tokens
    │   ├── types/                 # TypeScript types
    │   └── utils/
    ├── __tests__/
    ├── android/
    ├── ios/
    ├── App.tsx
    └── package.json
```

---

### ⚠️ This App works well on iOS but you may face version conflict issues on Android .

---
## 💻 Local Setup Guide

> This guide assumes a clean machine. Follow all three phases in order.

### Phase 0 — Install Prerequisites

**🍎 macOS**
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js, Python, Git, and PostgreSQL
brew install node python git postgresql@14

# Start PostgreSQL and create the database
brew services start postgresql@14
createdb bodhi

createuser -s postgres
```

**🪟 Windows**

1. Install [Git](https://git-scm.com)
2. Install [Node.js LTS](https://nodejs.org)
3. Install [Python 3.10+](https://python.org) — ⚠️ check **"Add Python to PATH"** during setup
4. Install [PostgreSQL](https://postgresql.org) — note the password you set for the `postgres` user
5. Open **SQL Shell (psql)** and run:
   ```sql
   CREATE DATABASE bodhi;
   ```

**🐧 Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install nodejs npm python3 python3-venv python3-pip git postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb bodhi
```

---

### Phase 1 — Clone the Repository

```bash
git clone https://github.com/govindjindal/BODHI.git
cd BODHI
```

---

### Phase 2 — Backend Setup (FastAPI)

```bash
cd bodhi-backend
```

**1. Create and activate a virtual environment**

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

> You should see `(venv)` prepended to your terminal prompt.

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Generate a JWT secret key**

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output — you'll need it in the next step.

**4. Create the environment file**

Create a `.env` file inside `bodhi-backend/` with the following contents:

```env
# Database
# Windows users: replace postgres:postgres with your actual credentials
DATABASE_URL=postgresql://postgres:postgres@localhost/bodhi

# Security
JWT_SECRET=paste_your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# AI APIs
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**5. Start the backend server**

```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0
```

✅ Backend is live. Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive API explorer. **Keep this terminal open.**

---

### Phase 3 — Frontend Setup (React Native)

Open a **new terminal window** and run:

```bash
cd mobileApp_BODHI
```

**1. Install Node packages**

```bash
npm install react-native-sqlite-storage --legacy-peer-deps
```

**2. Install iOS dependencies (macOS only)**

```bash
cd ios && pod install && cd ..
```

OR

**2. Install android dependencies**

```bash
cd android && npm install @react-native-async-storage/async-storage@1.23.1 --legacy-peer-deps && cd ..
```

**3. Start the Metro bundler**

```bash
npx react-native start --reset-cache
```

```bash
Click i for ios
Click a for android
```
### 📱 Running on a Physical Mobile Device

If you are running the app on a physical phone (or certain emulators), your phone cannot connect to `localhost` or `127.0.0.1` because it thinks "localhost" is the phone itself. 

You must point the React Native app to your computer's actual Local Wi-Fi IP address. **Make sure your phone and computer are connected to the exact same Wi-Fi network.**

#### Step 1: Find your Computer's IP Address
Open your terminal or command prompt and run the command for your operating system:

* **🍎 macOS:**
```bash
  ipconfig getifaddr en0
```

(If that returns blank, try en1 or check System Settings > Network > Wi-Fi).

* 🪟 Windows:
```bash
ipconfig
```

(Look for the line that says IPv4 Address under your Wi-Fi or Ethernet adapter).

* 🐧 Linux:

```bash
hostname -I
```
#### Step 2: Update the React Native App
Once you have your IP address (e.g., 192.168.1.55), open your API configuration file (usually located at mobileApp_BODHI/src/api/client.ts or similar).

Change the BASE_URL to use your computer's IP address:

TypeScript
// ❌ WRONG (Works for web, breaks for physical phones)
// const BASE_URL = 'http://localhost:8000';

// ✅ CORRECT (Replace with your actual IP address)
const BASE_URL = '[http://192.168.1.55:8000](http://192.168.1.55:8000)';

### Step 3: Run the Backend on the Network
Finally, make sure your FastAPI backend is actually broadcasting to the network, not just internally. Start your Uvicorn server with the --host 0.0.0.0 flag:

```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --reload
```

🎉 **BODHI is now running locally.**

---

### 🛠 Troubleshooting

| Error | Fix |
|---|---|
| `Command not found: python` (Windows) | Re-run the Python installer → Modify → enable **"Add Python to PATH"** |
| `psycopg2.OperationalError: role does not exist` (Mac/Linux) | Update your `.env` `DATABASE_URL` to use your system username: `postgresql://yourusername@localhost/bodhi` |
| `pod install failed` (macOS) | Run `sudo gem install cocoapods` and retry |

---

## 🔒 Privacy Model

BODHI is built on a **Zero-Knowledge Architecture**:

- **On-Device Inference** — SMS parsing and spending classification run locally via TensorFlow Lite on the device NPU
- **No Raw Data Upload** — Transaction details, SMS content, and spending patterns are never transmitted to BODHI servers
- **Credential-Free** — BODHI never requests bank login credentials; no screen scraping, no account linking
- **Secure Auth** — All API calls are protected by short-lived JWT tokens with refresh token rotation enforced

---

## 🗺️ Roadmap

- [x] Core payment flows and trip wallet MVP
- [x] Insurance RAG pipeline with Gemini 1.5 Pro
- [x] Venture Clubs with swipe-to-vote UI
- [ ] On-device SMS spending parser 
- [ ] UPI deep-link integration via Razorpay
- [ ] Voice-first finance queries (Whisper integration)
- [ ] Cross-platform desktop companion
- [ ] Open Banking API support (Account Aggregator framework)
- [ ] Linking with Google and Apple Sign up

---

## 👥 Team

| Name | Role |
|---|---|
|**Govind Jindal** | Backend + Frontend Architecture, Integration|
| **Aaradhya Khanna** | RAG LLM Architecture & Payment Integration|
| **Piyush Sharma** | SMS Parser, Security & BODHI Brain |

---

## 📄 License

This project was built for the **FINVASIA Innovation Hackathon 2026** and is shared for educational and demonstration purposes only.

---

<p align="center">Made with 🧠 and way too much coffee by <strong>Team BUGHACKERS 404</strong></p>

<p align="center"><em>BODHI — Your money. Alive.</em></p>
