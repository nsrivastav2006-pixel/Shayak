# Sahayata – Local Volunteer Emergency Network

A simple website where people in remote or urban areas can request help (injury, stuck in a river or on a mountain, no aid nearby) by sharing their live location, and local volunteers can register and respond. Built with plain HTML/JS and Firebase (Firestore + Anonymous Auth).

> Not a replacement for emergency services. In danger, call 112 / 108 first.

## Setup

1. Create a project at https://console.firebase.google.com
2. **Authentication** > Sign-in method > enable **Anonymous**
3. **Firestore Database** > Create database
4. Firestore > **Rules** > paste the contents of `firestore.rules` > Publish
5. Project settings > Your apps > Web (`</>`) > copy `firebaseConfig`
6. Paste it into `script.js` (replace the `PASTE_...` values)
7. Authentication > Settings > **Authorized domains** > add `<your-username>.github.io`

## Deploy on GitHub Pages

1. Push these files to a GitHub repository (root of the `main` branch)
2. Repo > Settings > Pages > Source: **Deploy from a branch** > Branch: `main` / `(root)` > Save
3. Your site goes live at `https://<your-username>.github.io/<repo-name>/` (HTTPS is required for GPS location)

## Known limitations

- Anyone who opens the site can see requests and phone numbers. Add volunteer verification and admin approval before real-world use.
- Spam protection: enable Firebase App Check.
- Location is captured once, not tracked continuously.

## License

MIT
