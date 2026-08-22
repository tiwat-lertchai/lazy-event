import { ref } from "vue";
import liff from "@line/liff";

// Holds the LIFF access token once the user is logged in.
// Other parts of the app read this to attach the Authorization header.
export const accessToken = ref<string | null>(null);
export const isReady = ref(false);

export async function initLiff() {
  await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return; // liff.login() redirects away, code after this won't run
  }

  accessToken.value = liff.getAccessToken();
  isReady.value = true;
}
