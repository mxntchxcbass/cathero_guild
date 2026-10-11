import Script from "next/script";
import {vaultMarkup} from "./vault-markup";
export default function Page(){return <><link rel="stylesheet" href="/style.css"/><div dangerouslySetInnerHTML={{__html:vaultMarkup}}/><Script src="/app.js" type="module" strategy="afterInteractive"/></>}
