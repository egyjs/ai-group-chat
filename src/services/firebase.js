import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBxGceqGey7bLBfZt51Q9XjslmK4s3_XDo",
    authDomain: "fcm-test-f2be5.firebaseapp.com",
    databaseURL: "https://fcm-test-f2be5.firebaseio.com",
    projectId: "fcm-test-f2be5",
    storageBucket: "fcm-test-f2be5.firebasestorage.app",
    messagingSenderId: "226031136965",
    appId: "1:226031136965:web:22be0acb7d41379c26c0ac",
    measurementId: "G-GGDBN1WSFN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
