import { Redirect } from "expo-router";

/** Prefer the full chat screen under /(root)/chat */
export default function ChatTabRedirect() {
  return <Redirect href="/(root)/chat" />;
}
