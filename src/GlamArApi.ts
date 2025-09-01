// src/GlamArApi.ts
import "./polyfills";

import axios, { AxiosRequestConfig } from "axios";
import * as Crypto from "crypto-js";
import { URL } from "react-native-url-polyfill"; // uses the polyfill we loaded

const BASE_URL = "https://api.pixelbinz0.de";
const HEADER_PREFIX = "x-ebg-";
const SIGNING_KEY = "1234567"; // TODO: inject this from config/env

export interface VersionResponse {
  success: boolean;
  sdkVersion?: string | null;
}

export class GlamArApi {
  constructor(private accessKey: string, private development: boolean = true) {}

  async getVersion(): Promise<VersionResponse | null> {
    try {
      const url = `${BASE_URL}/service/private/misc/v3.0/sdk-settings/version`;

      // Build signed headers
      const now = new Date();
      const utcString = this.formatDateUTC(now);

      // Base request config
      const request: AxiosRequestConfig = {
        url,
        method: "GET",
        headers: {
          Authorization: `Bearer ${Buffer.from(this.accessKey).toString(
            "base64"
          )}`,
          host: new URL(url).host,
          [`${HEADER_PREFIX}param`]: utcString,
        },
      };

      // Build canonical string + signature
      const canonical = this.generateCanonicalString(request);
      const signature = this.generateHmac(
        SIGNING_KEY,
        `${utcString}\n${this.sha256(canonical)}`
      );

      request.headers![`${HEADER_PREFIX}signature`] = `v1:${signature}`;
      request.headers![`${HEADER_PREFIX}param`] =
        Buffer.from(utcString).toString("base64");

      const res = await axios(request);
      console.log("api response success", res.data);
      return (res.data as VersionResponse) || null;
    } catch (e) {
      console.log("api response success", e);

      return null;
    }
  }

  /** Format UTC date like 20240101T123456Z */
  private formatDateUTC(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  /** Generate canonical request string */
  private generateCanonicalString(req: AxiosRequestConfig): string {
    const method = (req.method || "GET").toUpperCase();
    const urlObj = new URL(req.url!);
    const path = urlObj.pathname;
    const query = this.sortedAndEncodedQueryParams(urlObj);
    const headers = this.canonicalHeaders(req);
    const signed = this.signedHeaders(req);
    const body = req.data ? JSON.stringify(req.data) : "";
    const contentHash = this.sha256(body);

    return `${method}\n${path}\n${query}\n${headers}\n\n${signed}\n${contentHash}`;
  }

  private sortedAndEncodedQueryParams(url: URL): string {
    const params = Array.from(url.searchParams.entries());
    const encoded = params.map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    );
    return encoded.sort().join("&");
  }

  private canonicalHeaders(req: AxiosRequestConfig): string {
    const headers = req.headers || {};
    return Object.entries(headers)
      .filter(([name]) =>
        [HEADER_PREFIX, "host"].some((prefix) =>
          name.toLowerCase().startsWith(prefix)
        )
      )
      .map(([name, value]) => `${name.toLowerCase()}:${String(value).trim()}`)
      .sort()
      .join("\n");
  }

  private signedHeaders(req: AxiosRequestConfig): string {
    const headers = req.headers || {};
    return Object.keys(headers)
      .filter((name) =>
        [HEADER_PREFIX, "host"].some((prefix) =>
          name.toLowerCase().startsWith(prefix)
        )
      )
      .map((name) => name.toLowerCase())
      .sort()
      .join(";");
  }

  /** SHA256 hash hex */
  private sha256(content: string): string {
    return Crypto.SHA256(content).toString(Crypto.enc.Hex);
  }

  /** HMAC SHA256 hex */
  private generateHmac(secretKey: string, message: string): string {
    return Crypto.HmacSHA256(message, secretKey).toString(Crypto.enc.Hex);
  }
}
