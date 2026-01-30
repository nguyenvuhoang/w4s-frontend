import { createCipheriv } from 'crypto';

const CONSTKEY = 'abhf@311'; 

export function encrypt(textToEncrypt: string): string {
    const keyBytes = Buffer.alloc(16);
    const pwdBytes = Buffer.from(CONSTKEY, 'utf8');
    pwdBytes.copy(keyBytes, 0, 0, Math.min(pwdBytes.length, keyBytes.length));

    const iv = keyBytes; 
    const cipher = createCipheriv('aes-128-cbc', keyBytes, iv);
    cipher.setAutoPadding(true);

    const encrypted = Buffer.concat([
        cipher.update(textToEncrypt, 'utf8'),
        cipher.final()
    ]);

    return encrypted.toString('base64');
}
