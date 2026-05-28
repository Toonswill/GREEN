const axios = require('axios');
const moment = require('moment');

const MOCK_MODE = process.env.MOCK_MODE === 'true';
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const SHORTCODE = process.env.SHORTCODE || '174379';
const PASSKEY = process.env.PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback';

// Get OAuth token from Safaricom
async function getAccessToken() {
    if (MOCK_MODE) {
        console.log('🔧 [MOCK] Access token generated');
        return 'mock_token_12345';
    }

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        throw new Error('Missing M-Pesa credentials. Set MOCK_MODE=true for testing or add CONSUMER_KEY/CONSUMER_SECRET to .env');
    }

    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`
                },
                timeout: 30000
            }
        );
        console.log('✅ Access token obtained successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Token generation failed:', error.response?.data || error.message);
        throw new Error('M-Pesa authentication failed. Check your Consumer Key and Secret.');
    }
}

// Format phone number to 254XXXXXXXXX
function formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.toString().trim();
    if (formatted.startsWith('0')) {
        formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+')) {
        formatted = formatted.substring(1);
    } else if (formatted.startsWith('254')) {
        // Already correct
    } else {
        formatted = '254' + formatted;
    }
    return formatted;
}

// Initiate STK Push (M-Pesa Express)
async function stkPush(phoneNumber, amount, accountReference = 'ClimateInvest') {
    if (MOCK_MODE) {
        console.log(`🔧 [MOCK] STK Push to ${phoneNumber} for KES ${amount}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            MerchantRequestID: `mock_${Date.now()}`,
            CheckoutRequestID: `ws_CO_mock_${Date.now()}`,
            ResponseCode: "0",
            ResponseDescription: "Success. Request accepted for processing",
            CustomerMessage: "Mock: STK Push sent successfully"
        };
    }

    const token = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const formattedAmount = Math.round(Number(amount));

    console.log(`📱 Sending STK Push to ${formattedPhone} for KES ${formattedAmount}`);

    const requestBody = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: formattedAmount,
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: accountReference.substring(0, 12),
        TransactionDesc: `Invest in climate project`
    };

    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('✅ STK Push sent:', response.data.CheckoutRequestID);
        return response.data;
    } catch (error) {
        console.error('❌ STK Push failed:', error.response?.data || error.message);
        throw new Error(error.response?.data?.errorMessage || 'Payment request failed');
    }
}

// Query STK Push status
async function queryStatus(checkoutRequestId) {
    if (MOCK_MODE) {
        console.log(`🔧 [MOCK] Query status for ${checkoutRequestId}`);
        return {
            ResponseCode: "0",
            ResultCode: "0",
            ResultDesc: "The service request has been accepted successfully"
        };
    }

    const token = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');

    const requestBody = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
    };

    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        return response.data;
    } catch (error) {
        console.error('❌ Query failed:', error.response?.data || error.message);
        throw new Error('Failed to query payment status');
    }
}

module.exports = { stkPush, queryStatus, formatPhoneNumber };