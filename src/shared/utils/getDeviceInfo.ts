let cachedIP: string | null = null;
let cachedCountry: string | null = null;

export async function getDeviceInfo() {
    let osVersion = 'Unknown';
    let browser = 'Unknown';
    let my_ip = 'Unknown';
    let my_country_code = 'Unknown';
    let country_code = 'Unknown';
    let device_id = localStorage.getItem('deviceId');

    // Generate UUID function
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // Check if a deviceId exists in localStorage, if not generate a new one
    if (!device_id) {
        device_id = generateUUID();
        localStorage.setItem('deviceId', device_id); // Store the new deviceId in localStorage
    }

    if (navigator.userAgent) {
        const userAgent = navigator.userAgent;

        // Determine the operating system
        if (userAgent.includes('Windows')) {
            osVersion = 'Windows';
        } else if (userAgent.includes('Mac OS')) {
            osVersion = 'MacOS';
        } else if (userAgent.includes('Linux')) {
            osVersion = 'Linux';
        } else {
            osVersion = 'Other';
        }

        // Determine the browser
        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
            browser = 'Edge';
        } else {
            browser = 'Other';
        }
    }

    // Check if the IP has been cached
    if (cachedIP && cachedCountry) {
        my_ip = cachedIP;
        my_country_code = cachedCountry;
    } else {
        try {
            const response = await fetch('https://ipinfo.io/?token=7427e31ad2b2b7');
            const data = await response.json();
            my_ip = data.ip ?? 'Unknown';
            my_country_code = data.country ?? 'Unknown';
            cachedIP = my_ip;
            cachedCountry = my_country_code;
        } catch (error) {
            console.error('Error fetching IP address:', error);
            my_ip = 'Unknown';
            my_country_code = 'Unknown';
        }
    }

    return {
        osVersion,
        browser,
        my_ip,
        my_country_code,
        device_id
    };

}
