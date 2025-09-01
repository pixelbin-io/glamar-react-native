// declare module "react-native-webview" {
//   import * as React from "react";
//   import { ViewProps } from "react-native";

//   export interface WebViewMessageEvent {
//     nativeEvent: { data: string };
//   }

//   export interface WebViewProps extends ViewProps {
//     source?: { uri?: string; html?: string };
//     onMessage?: (event: WebViewMessageEvent) => void;
//     javaScriptEnabled?: boolean;
//     originWhitelist?: string[];
//     injectedJavaScript?: string;
//     injectedJavaScriptBeforeContentLoaded?: string;
//   }

//   export class WebView extends React.Component<WebViewProps> {}
//   export default WebView;
// }
