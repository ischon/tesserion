# 🃏 Tesserion

Tesserion is a premium, real-time Scrum Poker tool designed for agile teams. It offers a sleek, high-performance experience for estimating tasks with your team, featuring customizable card sequences and seamless authentication.

Hosted at [tesserion.schon.dev](https://tesserion.schon.dev)

## 🚀 Features

- **Real-time Synchronization**: Powered by Firebase Realtime Database for instant updates across all participants.
- **Customizable Card Sequences**:
  - **Fibonacci**: Standard estimation sequence.
  - **Sequential**: Custom range (e.g., 0-10, 0-20).
  - **T-Shirt Sizing**: Configurable sizes via environment variables (e.g., XXS to XXL).
- **Interactive Board**: A dynamic table layout where participants can see who has voted, with a dramatic reveal animation.
- **Company Domain Isolation**: Only colleagues from your own email domain can see and join your rituals.
- **Persistent Presence**: Automatically handles join/leave events, including tab closures, and cleans up empty rooms.
- **Editable Rituals**: Change the ritual name on the fly or adjust the card deck during creation.
- **Statistics**: Instant calculation of average and total vote count upon reveal.

## 🛠 Tech Stack

- **Frontend**: [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Real-time Database**: [Firebase Realtime Database](https://firebase.google.com/products/realtime-database)
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth) (Google Login)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/)

## 📦 Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- A Firebase Project
- A Cloudflare Account (for hosting)

### 2. Firebase Configuration
1. Create a Firebase project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Google Authentication** in the Auth section.
3. Create a **Realtime Database** (choose the location closest to your team).
4. Register a "Web App" and copy the configuration.

### 3. Local Environment
Clone the repository and install dependencies:

```bash
git clone https://github.com/ischon/tesserion.git
cd tesserion
npm install
```

Create a `.env` file based on `.env.sample` and fill in your Firebase credentials:

```text
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
...
```

### 4. Running Locally
```bash
npm run dev
```

## 🌐 Deployment (Cloudflare Pages)

Tesserion is optimized for Cloudflare Pages.

1. Connect your repository to **Cloudflare Pages**.
2. Set the build command: `npm run build`.
3. Set the output directory: `dist`.
4. Add the environment variables from your `.env` to the Cloudflare Pages dashboard.
5. **Note**: Ensure you whitelist your custom domain (`tesserion.schon.dev`) and the Firebase domain (`your-project.firebaseapp.com`) in the Google Cloud Console (OAuth Redirect URIs and API Key Restrictions).

## 📄 License

© 2025 [Ian Schön](https://github.com/ischon). All rights reserved.
