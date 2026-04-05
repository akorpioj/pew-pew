import { initializeApp } from "firebase-admin/app";

initializeApp();

export { setUserRole } from "./setUserRole";
export { syncUserOnSignup } from "./syncUserOnSignup";
export { embedArticle } from "./embedArticle";
export { askWiki } from "./askWiki";
