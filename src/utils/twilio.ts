/**
 * Twilio SMS Utility
 * 
 * WARNING: Storing Twilio credentials on the client-side is INSECURE.
 * This is only acceptable for a hackathon or private MVP.
 * For production, move this logic to a secure backend server.
 */

const TWILIO_ACCOUNT_SID = 'AC85d041328c6d05b44735022b3a1b78d6'; // Replace with your Account SID
const TWILIO_AUTH_TOKEN = '9a22535a766e9e34d356c8e1703c54ce';    // Replace with your Auth Token
const TWILIO_PHONE_NUMBER = '+16506678756';  // Replace with your Twilio Phone Number

export const sendTwilioSMS = async (to: string, body: string) => {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        console.warn('Twilio credentials missing');
        return false;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Twilio requires form-urlencoded body
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', body);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Twilio Error:', text);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Twilio Network Error:', error);
        return false;
    }
};

export const makeTwilioCall = async (to: string, message: string) => {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        console.warn('Twilio credentials missing');
        return false;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const twimlUrl = `http://twimlets.com/message?Message=${encodeURIComponent(message)}`;

    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Url', twimlUrl);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Twilio Call Error:', text);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Twilio Call Network Error:', error);
        return false;
    }
};
