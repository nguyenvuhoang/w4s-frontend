const AES_KEY = "zPMYLe1bfGsqJap+U0KrUrvqjFpPErU2";

import CryptoJS from 'crypto-js';
import { encode as base64_encode } from 'base-64';
import { v4 as uuidv4 } from 'uuid';


export function AES256Encrypt(encryptedData: any) {
  if (encryptedData === undefined) return {
    iv: '',
    textmessage: null
  }
  var key = CryptoJS.enc.Utf8.parse(AES_KEY);
  // var iv = CryptoJS.enc.Utf8.parse(CONSTKEYIV);

  var ivStr = uuidv4();

  var ivStr16 = base64_encode(ivStr).substring(0, 16);

  var iv = CryptoJS.enc.Utf8.parse(ivStr16);
  var plaintextData = CryptoJS.AES.encrypt(
    encryptedData,
    key,
    { iv: iv }).toString();

  return {
    iv: ivStr16,
    textmessage: plaintextData
  };
}

export function AES256Decrypt(encryptedData: any | null, ivkey: string | null) {
  if (ivkey !== null && encryptedData !== null) {
    try {
      var rawData = CryptoJS.enc.Base64.parse(encryptedData);
      var key = CryptoJS.enc.Utf8.parse(AES_KEY);
      var iv = CryptoJS.enc.Utf8.parse(ivkey);

      var plaintextData = CryptoJS.AES.decrypt(
        rawData.toString(CryptoJS.enc.Base64), // Pass the base64 string directly
        key,
        { iv: iv }
      );
      var plaintext = plaintextData.toString(CryptoJS.enc.Utf8);
      return JSON.parse(plaintext);
    } catch (error) {
      return JSON.parse(encryptedData);
    }
  }

  return JSON.parse(encryptedData);
}


export function Decrypt(encryptedData: any, ivkey?: string) {
  if (ivkey) {
    var rawData = CryptoJS.enc.Base64.parse(encryptedData.data);
    var key = CryptoJS.enc.Utf8.parse(ivkey);
    var iv = CryptoJS.enc.Utf8.parse(ivkey);

    var plaintextData = CryptoJS.AES.decrypt(
      { ciphertext: rawData } as any, // Cast to any to bypass type check
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
    var plaintext = plaintextData.toString(CryptoJS.enc.Utf8);
    return JSON.parse(plaintext);
  }
  return encryptedData;
}




export function GenerateMessage(data: any) {
  const encryptedData = data.data
  const ivkey = data.headers.proskills39
  return AES256Decrypt(encryptedData, ivkey)
}
