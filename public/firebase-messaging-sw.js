importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyDsurTRqvbH9Qc6II6CvTB63L3Y97yAfIM",
    authDomain: "ips-mobile-386fb.firebaseapp.com",
    projectId: "ips-mobile-386fb",
    storageBucket: "ips-mobile-386fb.firebasestorage.app",
    messagingSenderId: "1081648378200",
    appId: "1:1081648378200:web:c4cff481531c93266bb52d",
    measurementId: "G-PGDWTSHFTS"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log("[firebase-messaging-sw.js] Background message ", payload);

    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icon-192.png",
    });
});
