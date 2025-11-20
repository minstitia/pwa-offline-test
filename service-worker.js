const CACHE_NAME = "pwa-test-cache-v2";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./incoming.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// 설치 단계: 파일들을 캐시에 저장
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// 활성화 단계: 이전 캐시 정리 (버전 변경 시)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

// 네트워크 요청 가로채기: 오프라인일 때 캐시에서 응답
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 있으면 캐시 사용, 없으면 네트워크 요청
      return response || fetch(event.request);
    })
  );
});

/**
 * (선택) 푸시 알림 처리용 - 나중에 서버에서 Web Push 붙일 때 사용
 * 지금은 실제 푸시를 안 쓰더라도, 구조만 잡아두는 용도입니다.
 */
self.addEventListener("push", (event) => {
  // 서버에서 { title, body, alarmId } 형태로 보냈다고 가정
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || "약 복용 알림";
  const options = {
    body: data.body || "약 드실 시간입니다.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: {
      url: "./incoming.html" + (data.alarmId ? "?alarmId=" + data.alarmId : "")
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 시 전화 수신 화면으로 이동
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "./index.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
