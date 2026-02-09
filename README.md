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

## 🔐 Microsoft Authentication Configuration
 
### 1. Configure Microsoft Azure Portal
Before modifying the code, you need to register the application with Microsoft.
 
1. Go to the **[Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)**.
2. Click on **New Registration**.
3. Give your app a name (e.g., *Tesserion*).
4. For **Supported account types**, choose: *"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts"* to allow both business and personal logins.
5. Leave the **Redirect URI** empty for now and click **Register**.
6. **Important**: Note down the **Application (client) ID**. You will need this for Firebase.
 
### 2. Configure Firebase Console
Now, link Microsoft to your Firebase project.
 
1. Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2. Navigate to **Build > Authentication > Sign-in method**.
3. Click on **Add new provider** and select **Microsoft**.
4. Enable the provider.
5. Enter the **Application (client) ID** you copied from Azure.
6. In the Azure Portal, create a **Client Secret** (under **Certificates & secrets**), copy it, and paste it into Firebase.
7. Firebase will provide a **Redirect URL** (e.g., `https://your-app.firebaseapp.com/__/auth/handler`). **Copy this URL!**
 
### 3. Finalize Azure Authentication
Return to the Azure Portal to complete the link:
 
1. Go to your app registration > **Authentication**.
2. Click on **Add a platform > Web**.
3. Paste the **Redirect URL** you received from Firebase and click **Configure**.

