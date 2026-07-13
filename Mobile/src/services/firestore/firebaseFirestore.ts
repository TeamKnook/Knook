import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from '@react-native-firebase/firestore';
import { appEnvironment } from '@/src/utils/environment';
import { diagnostics } from '@/src/utils/diagnostics';

let emulatorConnected = false;

export function getKnookFirestore(): Firestore {
  const db = getFirestore();

  if (appEnvironment.usesFirestoreEmulator && !emulatorConnected) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    emulatorConnected = true;
    diagnostics.log('firestore-emulator-connected');
  }

  return db;
}
