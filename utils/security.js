const ENCRYPTION_KEY = crypto.getRandomValues(new Uint8Array(32));

class SecurityUtil {
    static async encrypt(data) {
        try {
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(JSON.stringify(data));

            const key = await crypto.subtle.importKey(
                'raw',
                ENCRYPTION_KEY,
                'AES-GCM',
                false,
                ['encrypt']
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encodedData
            );

            return {
                encrypted: Array.from(new Uint8Array(encryptedData)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    static async decrypt(encryptedData, iv) {
        try {
            const key = await crypto.subtle.importKey(
                'raw',
                ENCRYPTION_KEY,
                'AES-GCM',
                false,
                ['decrypt']
            );

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: new Uint8Array(iv)
                },
                key,
                new Uint8Array(encryptedData)
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }
}

export const secureStorage = {
    async setItem(key, value) {
        const encrypted = await SecurityUtil.encrypt(value);
        if (encrypted) {
            localStorage.setItem(key, JSON.stringify(encrypted));
        }
    },

    async getItem(key) {
        const encrypted = JSON.parse(localStorage.getItem(key));
        if (!encrypted) return null;

        return await SecurityUtil.decrypt(encrypted.encrypted, encrypted.iv);
    },

    removeItem(key) {
        localStorage.removeItem(key);
    }
};
