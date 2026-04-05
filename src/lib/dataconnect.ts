import { getDataConnect } from "firebase/data-connect";
import { connectorConfig } from "@dataconnect/generated";
import app from "./firebase";

// Single shared DataConnect instance for the whole app.
// All generated hooks (getCategoryTree, upsertArticle, etc.) accept this instance.
const dataConnect = getDataConnect(app, connectorConfig);

export default dataConnect;
