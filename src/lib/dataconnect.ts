import { getDataConnect, connectDataConnectEmulator } from "firebase/data-connect";
import { connectorConfig } from "@dataconnect/generated";
import app from "./firebase";

// Single shared DataConnect instance for the whole app.
// All generated hooks (getCategoryTree, upsertArticle, etc.) accept this instance.
const dataConnect = getDataConnect(app, connectorConfig);

// Point at the local emulator when running in development.
// The Data Connect emulator defaults to port 9399.
if (import.meta.env.DEV) {
  connectDataConnectEmulator(dataConnect, "localhost", 9399);
}

export default dataConnect;
