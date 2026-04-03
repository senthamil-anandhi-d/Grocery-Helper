# Firebase Setup Guide for Grocery Helper

Follow these steps to enable **Cloud Sync** and **User Accounts** in your application.

## 1. Project Creation
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add Project"** and name it `Grocery-Helper`.
3.  Click **"Continue"** through the Google Analytics step.

## 2. Add Web App
1.  On your project overview page, click the **Web icon (</>)** to register a Web App.
2.  Enter a nickname (e.g., `grocery-helper-app`) and click **"Register app"**.
3.  You will see a `firebaseConfig` object. **Copy those values**.

## 3. Enable Firestore Database
1.  On the left menu, click **"Firestore Database"** and then **"Create Database"**.
2.  Choose a location and select **"Start in test mode"**. Click **"Enable"**.

## 4. Enable Authentication
1.  Click **"Authentication"** on the left menu.
2.  Click **"Get Started"**, then under **"Sign-in method"**, select **"Email/Password"**.
3.  Toggle the **"Enable"** switch and click **"Save"**.

## 5. Add Keys to Your App
1.  Open `app.js` in your project folder.
2.  Find the `firebaseConfig` section at the top.
3.  Replace the placeholder values with your actual project keys.

## 6. Update Firestore Rules (Secure Your Data)
To ensure only YOU can access your data:
1.  In the Firebase Console, go to **Firestore Database** -> **Rules** tab.
2.  Replace the code with this:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
3.  Click **"Publish"**.

## 7. Restart & Log In
1.  Refresh your browser.
2.  Click the **User Icon (👤)** in the navigation bar.
3.  Select **"Register"** or **"Sign In"** and log in.

🎉 **Your app is now securely cloud-synced and ready for all your devices!**
