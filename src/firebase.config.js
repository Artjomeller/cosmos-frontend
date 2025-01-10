import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDpmE_VKeX-PQfOKN4MmSivH0lX4aUtpHM",
    authDomain: "cosmos-628d1.firebaseapp.com",
    projectId: "cosmos-628d1",
    storageBucket: "cosmos-628d1.firebasestorage.app",
    messagingSenderId: "739449053360",
    appId: "1:739449053360:web:a6d145eeace1e872dc9b75",
    measurementId: "G-LJB16WPL82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };