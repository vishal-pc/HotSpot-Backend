declare module "jwk-to-pem" {
  export default function jwkToPem(
    jwk: any,
    options?: { private: boolean }
  ): string;
}
