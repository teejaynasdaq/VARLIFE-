# Firebase setup for VARLIFE

This app uses **Firebase Auth + Cloud Firestore + Storage** as the backend.
(`lib/supabase.ts` is a legacy filename — it talks to Firestore, not Supabase.)

## 1. Fill `.env`

1. Open [Firebase Console](https://console.firebase.google.com/) → project **varlife-4eeeb**
   (or your project if you renamed it).
2. Gear icon → **Project settings** → **Your apps**.
3. Select (or add) a **Web** app.
4. Copy the config into `.env` in this folder:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=varlife-4eeeb.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=varlife-4eeeb
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=varlife-4eeeb.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=1:....:web:....
```

`EXPO_PUBLIC_FIREBASE_APP_ID` must be the real `appId` from the console.
Placeholders containing `abcd` will break Auth/Firestore init.

## 2. Enable Auth

Authentication → Sign-in method → enable **Email/Password** (and any OAuth providers you use).

## 3. Deploy rules

From this folder (Firebase CLI logged into the same Google account):

```bash
firebase deploy --only firestore:rules,storage
```

## 4. Indexes

If the console prompts for a composite index (e.g. `rides` by `status` + `requested_at`),
click the link in the error and create it, or deploy `firestore.indexes.json`.

## 5. Verify

```powershell
npx expo start -c
```

- Sign up → confirm a doc appears under `users/{uid}` in Firestore
- Sign out / in → session should persist
- Request a ride → doc in `rides` with `status: "requested"`
- Driver available list should show that ride

## Git

Never commit `.env`. Commit code + `.env.example` + rules only.
