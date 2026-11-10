# 🖥️ PC Dynamic Island

> **Interactive Dynamic Island desktop overlay for Windows** — Built with a decoupled client-server architecture combining **Electron + Vue 3 + TypeScript** on the frontend and an asynchronous **Python + FastAPI + SQLite** engine on the backend.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=for-the-badge&logo=electron&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

---

## 📋 Descripción General / Overview

**PC Dynamic Island** traslada la experiencia interactiva de la *Dynamic Island* al escritorio de Windows mediante un widget flotante no intrusivo. Se mimetiza en la parte superior central de la pantalla y permanece en modo *click-through* (transparente a los clics del ratón) hasta que el usuario interactúa con él, recibe una notificación en tiempo real o invoca un atajo de teclado global.

A diferencia de un widget monolítico tradicional, el proyecto implementa una **arquitectura cliente-servidor desacoplada**:
1. **Capa de Presentación y Ventana Nativa (`frontend/`):** Gestionada por **Electron** y renderizada con **Vue 3 (Composition API)**, **TypeScript** y **Tailwind CSS v4**, garantizando animaciones fluidas a 60 FPS y comunicación segura mediante IPC (`ContextBridge`).
2. **Motor de Sistema y Automatización (`backend/`):** Un servicio local en **Python** impulsado por **FastAPI** y **Uvicorn** que transmite telemetría por **WebSockets**, interactúa con las APIs nativas de Windows Runtime (**WinRT SMTC**), ejecuta subprocesos seguros y persiste el historial de portapapeles en **SQLite**.

---

## ✨ Características Principales

* **⚡ Telemetría de Hardware en Tiempo Real (WebSockets):** Monitoreo continuo y asíncrono de carga de CPU, uso de memoria RAM y nivel de batería mediante `psutil` con reconexión automática.
* **🎵 Control Multimedia Nativo de Windows (WinRT):** Conexión directa con *Global System Media Transport Controls* (`winsdk`) para detectar pistas en reproducción (Spotify, navegadores web, reproductores locales) y controlar *Play, Pause, Next y Previous*.
* **📋 Historial de Portapapeles Persistente (SQLite):** Base de datos embebida que almacena fragmentos de texto copiados libre de duplicados y permite re-copiarlos con un solo clic.
* **🔔 Sistema de Notificaciones Push Animadas:** Endpoint REST dedicado (`/api/v1/notifications/push`) capaz de inyectar alertas emergentes en el stream WebSocket que expanden automáticamente la isla durante 4 segundos.
* **🖱️ Tecnología Overlay Click-Through:** La ventana transparente ignora dinámicamente los eventos del puntero fuera del área activa de la cápsula (`setIgnoreMouseEvents`), evitando bloquear los menús de otras aplicaciones maximizadas.
* **⌨️ Atajos Globales y Autoarranque (Startup):** Soporte para atajos de sistema en segundo plano (`Ctrl + Shift + Espacio` y tecla `MediaPlayPause`) y configuración de inicio automático con Windows desde la propia interfaz.
* **🚀 Ciclo de Vida Autónomo:** El proceso principal de Electron levanta y supervisa automáticamente el subproceso de Python (`uvicorn`) al abrir la aplicación y lo cierra limpiamente al salir.

---

## 🏗️ Arquitectura del Sistema

```text
pc-dynamic-island/
├── backend/                        # Motor Backend en Python
│   ├── app/
│   │   ├── main.py                 # Servidor FastAPI, rutas REST y WebSocket /ws/telemetry
│   │   └── services/
│   │       ├── media_controller.py # Control de sesiones multimedia vía Windows Runtime (winsdk)
│   │       └── clipboard.py        # Capa de persistencia SQLite para el historial de portapapeles
│   └── requirements.txt            # Dependencias del entorno Python
├── frontend/                       # Cliente Desktop con Electron + Vue 3 + TypeScript
│   ├── electron/
│   │   ├── main.ts                 # Ventana transparente, orquestador Python y Global Shortcuts
│   │   └── preload.ts              # Puente de seguridad IPC (window.electronAPI)
│   ├── src/
│   │   ├── components/
│   │   │   └── IslandContainer.vue # Componente principal con estados, pestañas y transiciones
│   │   ├── composables/
│   │   │   └── useBackendSocket.ts # Composable reactivo de conexión WebSocket y fetch REST
│   │   ├── App.vue
│   │   └── vite-env.d.ts           # Definiciones de tipos TypeScript para el puente Electron
│   ├── package.json                # Scripts de desarrollo y configuración de electron-builder
│   └── vite.config.ts              # Bundling con Vite y Tailwind CSS v4
└── README.md