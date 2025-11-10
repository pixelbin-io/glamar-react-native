// src/GlamArProvider.tsx
import type * as React from "react";
import { WebViewBridge } from "./WebViewBridge";

export const GlamArProvider: React.FC = () => {
  return <WebViewBridge sourceUrl="https://cdn.glamar.io/sdk/" />;
};
