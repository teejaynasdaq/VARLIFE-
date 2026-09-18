# VARLIFE

This folder is the git repo for [teejaynasdaq/VARLIFE-](https://github.com/teejaynasdaq/VARLIFE-).

## Run the app

The Expo app lives one level down:

```powershell
cd uber-main
npm install
npx expo start -c
```

Open that uber-main folder in Cursor / VS Code when you work on the app.

## Firebase

Project id: `varlife-4eeeb`  
See `uber-main/FIREBASE_SETUP.md`.

## Note on `supabase/`

`uber-main/supabase` still holds older Veriff edge-function code. The mobile app itself uses Firebase (Auth / Firestore / Storage). Do not delete `supabase` until Veriff is fully moved.