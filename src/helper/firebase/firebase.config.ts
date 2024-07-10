import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
// import * as ServiceAccountValues from "./hotspotmeet-service.json";
import dotenv from "dotenv";
dotenv.config();
const ServiceAccountval: any = {
  type: "service_account",
  project_id: "hotspotmeet-47c49",
  private_key_id: "174769e146b90ded18fd1fe4f954e00855f2f3d7",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmp2kldD8a9TMk\nt0fytq158iji6UWFS174rLnIWjZjv7yVA6VRKJNec317LqHY/OQkSj/Wip8Gv/a/\nWuDcu7qnFxW7itxqnittQpmSs2nQ/IZjcospMYBGJFjZzx/fvbLxS1avXqR3tLPG\ncpYA5+zlvqXTNkUevs//HrC5Gvj8o8b4r5ulDqGDeDGqYM9w83C2+I+jXOKmXKYv\nnTImFTKnSW2BD3kQrCbNU2nsSxyLiFbSooALKbJz1ZNr0HdyvpnV/QU6Hm82e+M0\narXYozLDf80JOEWBvQn+w0728EWuRiZjxQLynejUE2mYK9Z61NjFZb3Tci6zTFXk\nhTaf9OOxAgMBAAECggEASEPu9dVPKf7qkwDA+7AYUHlgHmk+Art4rsejdgwcaqux\neEKQ9LzuDnZxErHZb9DVkyD5Rqxsog4qzrZ3LHBhU2RQwbbItpjoxuOq2XDgMUXX\ndpcsXgv/jirjtms47JoDVtuu9rPJCLl8fVCh2Dm5wbQmjwyI83iVlBC4XEQkdNRS\nvq46vqv7ikGGjX82OOSSHQ377pYTbhwNyUu2Zm/nmFgQJ5Od4n/OcRxikDlJZOfP\nbtZsoMG9hley44pCqsrpz8t5m9UW3t7Xx+4azZDq6/oi6V/vPYumJtxl5tDFz1AW\nZvCsaEjTX8LQ6At9Mle1jsp8eRUzYIT85+stbq8D2wKBgQDXkTWsprUxeEFO/ICK\ntFmIFcEslCwMptZ0Mg45hwvvIgLbNzxQ8KfXMfagC8CE9oJv5SfyKuBHUVmmWNMa\nmbyj2MZTttENLgNwct9DVwpNEbgoh78jba4sniDw4+h+6vs1R/WodsETeSaeQNgj\nmV7sPQZSawQuE8/4u8VtYh8uhwKBgQDF6Y4gS+GLn/P17NBnLuY57FuGBitBVFGV\nbvsfP0M46msiw/E41ZI7P8JsFkt0+/1YgH1WiqD8Hd/Wr8WYb8JqfrjhirydVH0p\npuLMQOlprL5ljBc7FLGzM29g7GtqSKNGQ1eDlrWjIjLSml32IOkuM93DDYDyc3o1\nBPfAQKnyBwKBgQCrtISWc2ucbfdHXSVeVm2CUiG+yn+TzEjB4SUneYRuBB9WUdb/\nedGXPbr+nJ3Kyzf2vQdmg/SFmizYraPpak+yCvdesx4ta1td9IIV93zDCrwvvIDp\nTXIRJBuFBWSpw645MIpil8UPJ880+t2u7XmInsssVwXLVgiwTZDioefIfQKBgQC2\njOF9xMA768Q5WMA6DLZrQyqAivwm/EFsVrvnbJDy1LcRkC7WP5jscblBvabINw7O\nLWZvBtvK8TtgaS0XmC550H1z/GZRsHbqjnav9EfYI3BTdk6PPl1Sb+USP8Asfuer\njb4RMFhGKus5+w0kU+MBrPGmUrRX7lAQy45ClOKszQKBgHVuIn+gey1kntVYNiaW\nY1Sd9VBfTxmxTkzA0iMYCfd+9DwlAN75rcwEHEIomxOJdLeOCnL6AnHcTgO4V1kk\nGhMmjuliASoog4W93SsxwIxOjoe8U7j+F2sEeZxPVC0pjngAM28/SeYWu9GSoWiX\n42f81mFwcD/50GzcuDkg8FWe\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-5uqra@hotspotmeet-47c49.iam.gserviceaccount.com",
  client_id: "102001978397332940271",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-5uqra%40hotspotmeet-47c49.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};
admin.initializeApp({
  credential: admin.credential.cert(ServiceAccountval),
});
export default admin;
