import i18n from "i18next";
import Backend from "i18next-fs-backend";
import path from "path";
import { cookies } from "next/headers";

export async function getServerTranslation(defaultLang = "en") {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang");
  const lang = langCookie?.value || defaultLang;

  const instance = i18n.createInstance();

  await instance
    .use(Backend)
    .init({
      lng: lang,
      fallbackLng: "en",
      ns: ["common"],
      defaultNS: "common",
      backend: {
        loadPath: path.join(process.cwd(), "public/locales/{{lng}}/{{ns}}.json"),
      },
    });

  return instance.t;
}
