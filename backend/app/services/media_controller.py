try:
    from winsdk.windows.media.control import (
        GlobalSystemMediaTransportControlsSessionManager as MediaManager,
    )
    HAS_WINSDK = True
except ImportError:
    HAS_WINSDK = False


class MediaController:
    @staticmethod
    async def get_active_session():
        if not HAS_WINSDK:
            return None
        manager = await MediaManager.request_async()
        return manager.get_current_session()

    @classmethod
    async def get_media_info(cls) -> dict:
        if not HAS_WINSDK:
            return {
                "title": "Sin reproducción",
                "artist": "Control multimedia listo",
                "playback_status": "Closed",
            }
        try:
            session = await cls.get_active_session()
            if not session:
                return {
                    "title": "Sin reproducción",
                    "artist": "Abre Spotify o navegador",
                    "playback_status": "Closed",
                }

            info = await session.try_get_media_properties_async()
            playback_info = session.get_playback_info()

            status_map = {
                0: "Closed",
                1: "Opened",
                2: "Changing",
                3: "Stopped",
                4: "Playing",
                5: "Paused",
            }
            status = status_map.get(playback_info.playback_status, "Unknown")

            return {
                "title": info.title or "Sin reproducción",
                "artist": info.artist or "Artista desconocido",
                "playback_status": status,
            }
        except Exception:
            return {
                "title": "Sin reproducción",
                "artist": "—",
                "playback_status": "Closed",
            }

    @classmethod
    async def send_command(cls, command: str) -> bool:
        if not HAS_WINSDK:
            return False
        try:
            session = await cls.get_active_session()
            if not session:
                return False

            if command == "play_pause":
                return await session.try_toggle_play_pause_async()
            elif command == "next":
                return await session.try_skip_next_async()
            elif command == "previous":
                return await session.try_skip_previous_async()
            return False
        except Exception:
            return False