import "server-only";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { getMessages } from "next-intl/server";
import { IncomingCalls } from "./incoming";

/**
 * A call ringing for me, in every signed-in space (talent, recruiter, computer or phone), with only
 * the texts of the call: the spaces pass their own texts to the browser, not those of the Chat.
 */
export async function IncomingCallsHost() {
  const messages = await getMessages();
  const chat = messages.phoneChat as { call: AbstractIntlMessages; duration: AbstractIntlMessages };
  return (
    <NextIntlClientProvider messages={{ phoneChat: { call: chat.call, duration: chat.duration } }}>
      <IncomingCalls />
    </NextIntlClientProvider>
  );
}
