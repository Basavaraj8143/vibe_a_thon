# SilentSOS 🛡️

**SilentSOS** is a personal safety application designed to provide immediate assistance in emergencies without drawing attention. With a simple gesture or tap pattern, it triggers a silent alarm that notifies your emergency contacts with your location, a recorded audio clip, and an automated phone call.

## 🚀 Features

-   **Stealth Trigger:** Activate SOS via **Triple Tap** on the screen or a **Shake** gesture.
-   **Real-Time Location:** Instantly sends your precise GPS coordinates (Google Maps link) via SMS.
-   **Audio Evidence:** Automatically records **10 seconds** of audio and attaches it to the SMS alert.
-   **Automated Calls:** Initiates a phone call to your contacts with a Text-to-Speech (TTS) alert message using Twilio.
-   **Premium UI:** Clean, dark/light mode interface designed for quick access and readability.
-   **Direct SMS:** Uses the native SMS app for reliability and attachment support.

## 🛠️ Tech Stack

-   **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
-   **Language:** TypeScript
-   **APIs:**
    -   **Twilio:** For automated TTS phone calls and SMS fallback.
    -   **Expo Sensors:** Accelerometer for shake detection.
    -   **Expo Location:** For GPS tracking.
    -   **Expo AV:** For audio recording.
    -   **Expo SMS & Sharing:** For sending alerts.

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/SilentSOS.git
    cd SilentSOS
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Twilio:**
    Open `src/utils/twilio.ts` and add your Twilio credentials:
    ```typescript
    const TWILIO_ACCOUNT_SID = 'YOUR_SID';
    const TWILIO_AUTH_TOKEN = 'YOUR_TOKEN';
    const TWILIO_PHONE_NUMBER = 'YOUR_TWILIO_NUMBER';
    ```
    > **⚠️ Warning:** Storing credentials on the client-side is insecure and intended for prototyping/hackathons only. For production, move this logic to a backend server.

4.  **Run the app:**
    ```bash
    npx expo start
    ```
    Scan the QR code with the **Expo Go** app on your Android/iOS device.

## 📱 Usage

1.  **Add Contacts:** Go to the "Manage Contacts" screen and add trusted phone numbers.
2.  **Arm the App:** Keep the app open (foreground) when walking in unsafe areas.
3.  **Trigger SOS:**
    -   **Triple Tap** anywhere on the screen.
    -   **Shake** the phone vigorously.
4.  **Alerts Sent:**
    -   Contacts receive an SMS with your location.
    -   Contacts receive a phone call saying "This is a Silent SOS Alert...".
    -   After 10 seconds, your SMS app opens with the audio recording attached, ready to send.

## 🔮 Future Improvements

-   [ ] Cloud storage for audio recordings (Firebase/AWS).
-   [ ] Background service for triggering SOS when the app is closed.
-   [ ] PIN protection for disarming the alarm.
-   [ ] iOS Widget support.

## 📄 License

This project is licensed under the MIT License.
