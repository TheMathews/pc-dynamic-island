# PC Dynamic Island

Widget interactivo de escritorio para Windows inspirado en la *Dynamic Island*, construido con una arquitectura desacoplada cliente-servidor mediante **Vue 3 + TypeScript + Electron** en el frontend y **Python + FastAPI + SQLite** en el backend.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

---

## Características Principales

* **Telemetría en Tiempo Real (WebSockets):** Monitoreo continuo de uso de CPU, memoria RAM y estado de batería mediante `psutil` con latencia mínima.
* **Control Multimedia Nativo (WinRT SMTC):** Integración con sesiones multimedia del sistema operativo (`winsdk`) para visualizar pistas activas (Spotify, navegadores, reproductores locales) y controlar reproducción/pausa.
* **Gestor de Portapapeles Persistente (SQLite):** Almacenamiento local de fragmentos copiados con recuperación rápida en un clic.
* **Ventana Overlay Click-Through:** Superposición transparente siempre visible (`alwaysOnTop`) que ignora eventos del ratón fuera del área activa y se expande con animaciones fluidas.
* **Atajos Globales y Autoarranque:** Soporte para combinaciones de teclas globales (`Ctrl + Shift + Espacio`) y registro opcional en el inicio de sesión de Windows.
* **Orquestación Autónoma:** El proceso principal de Electron gestiona automáticamente el ciclo de vida del servidor `Uvicorn` en segundo plano.

---

## Arquitectura del Proyecto

```text
pc-dynamic-island/
├── backend/
│   ├── app/
│   │   ├── main.py                 # Servidor FastAPI, endpoints REST y stream WebSocket
│   │   └── services/
│   │       ├── media_controller.py # Integración con Windows Media Transport Controls
│   │       └── clipboard.py        # Persistencia en SQLite para el portapapeles
│   └── requirements.txt
├── frontend/
│   ├── electron/
│   │   ├── main.ts                 # Proceso principal Electron, subproceso Python y hotkeys
│   │   └── preload.ts              # Puente seguro ContextBridge IPC
│   ├── src/
│   │   ├── components/
│   │   │   └── IslandContainer.vue # Interfaz reactiva de la Dynamic Island
│   │   ├── composables/
│   │   │   └── useBackendSocket.ts # Cliente WebSocket con reconexión automática
│   │   └── App.vue
│   ├── package.json
│   └── vite.config.ts
└── README.md