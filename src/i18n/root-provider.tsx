"use client";

/**
 * The browser-side text provider, used as is by the root layout. The server version of
 * NextIntlClientProvider reads the request configuration, which would fix the language of the
 * whole request in French before a public page has set it (src/i18n/site-locale.ts).
 */
export { NextIntlClientProvider as RootIntlProvider } from "next-intl";
