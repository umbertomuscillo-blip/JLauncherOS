"""Router JSON-RPC 2.0 per il demone JARVIS.

Gestisce la validazione con modelli Pydantic v2, l'autenticazione crittografica
di sessione con JLAUNCHER_IPC_SECRET, il routing dei comandi e i codici di errore standard.
"""

import datetime
import inspect
import json
import logging
import time
from typing import Any, Callable, Dict, List, Literal, Optional, Tuple, Union

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from core.focus_manager import focus_manager
from core.voice_engine import voice_engine
from modules.clipboard import clipboard_manager
from modules.help_memoria.apfs_monitor import apfs_monitor
from modules.help_memoria.cleaner import cleaner
from modules.help_memoria.disk_scanner import disk_scanner
from modules.media import media_controller
from modules.prompterrr.pipeline import prompterrr_pipeline
from modules.shelf import shelf_manager
from modules.spaces import spaces_manager
from modules.system_apps import app_scanner
from modules.weather import weather_service

logger = logging.getLogger("jlauncheros.router")

# Codici di errore standard JSON-RPC 2.0
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INVALID_PARAMS = -32602
INTERNAL_ERROR = -32603

# Codici di errore proprietari JLauncherOS
SIDECAR_BUSY = -32001
MIC_PERMISSION_DENIED = -32002
DISK_ACCESS_DENIED = -32003
LLM_CONTEXT_OVERFLOW = -32004
AUTHENTICATION_FAILURE = -32005


class JsonRpcError(BaseModel):
    """Oggetto errore conforme a JSON-RPC 2.0."""

    code: int
    message: str
    data: Optional[Any] = None


class JsonRpcRequest(BaseModel):
    """Richiesta JSON-RPC 2.0 inviata dal frontend React."""

    model_config = ConfigDict(extra="ignore")

    jsonrpc: Literal["2.0"] = "2.0"
    id: Union[str, int]
    method: str
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)


class JsonRpcResponse(BaseModel):
    """Risposta di successo conforme a JSON-RPC 2.0."""

    jsonrpc: Literal["2.0"] = "2.0"
    id: Union[str, int]
    result: Any


class JsonRpcErrorResponse(BaseModel):
    """Risposta di errore conforme a JSON-RPC 2.0."""

    jsonrpc: Literal["2.0"] = "2.0"
    id: Optional[Union[str, int]] = None
    error: JsonRpcError


class JsonRpcNotification(BaseModel):
    """Notifica push asincrona conforme a JSON-RPC 2.0 (priva di campo id)."""

    jsonrpc: Literal["2.0"] = "2.0"
    method: str
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)


class HandshakeParams(BaseModel):
    """Parametri per il metodo system.handshake."""

    auth_token: str
    client_version: Optional[str] = "1.0.0"


class SetFocusModeParams(BaseModel):
    """Parametri per il metodo system.setFocusMode."""

    mode: Literal["NORMAL", "DEEP_WORK", "STUDY"]
    duration_minutes: Optional[int] = 50
    silence_audio: Optional[bool] = True


class PingParams(BaseModel):
    """Parametri opzionali per il metodo system.ping."""

    timestamp: Optional[Union[int, float]] = None


class TriggerDiskScanParams(BaseModel):
    """Parametri per il metodo memory.scan / memory.triggerDiskScan."""

    deep_scan: Optional[bool] = False
    targets: Optional[List[str]] = None
    target_dir: Optional[str] = None


class CleanCachesParams(BaseModel):
    """Parametri per il metodo memory.clean / memory.cleanCaches."""

    scan_id: Optional[str] = ""
    categories: Optional[List[str]] = Field(default_factory=list)
    dry_run: Optional[bool] = False


class ExecutePipelineParams(BaseModel):
    """Parametri per il metodo prompterrr.submitPrompt / prompterrr.executePipeline."""

    prompt_input: Optional[str] = None
    prompt: Optional[str] = None
    context_files: Optional[List[str]] = None
    mode: Optional[str] = "architect_critic"
    temperature: Optional[float] = 0.2
    enable_cache: Optional[bool] = True

    def get_prompt_text(self) -> str:
        return (self.prompt_input or self.prompt or "").strip()


class AbortPipelineParams(BaseModel):
    """Parametri per il metodo prompterrr.abortPipeline."""

    pipeline_id: str


class ControlPlaybackParams(BaseModel):
    """Parametri per il metodo media.controlPlayback."""

    action: Literal["play", "pause", "play_pause", "next", "previous"]


class MediaSeekParams(BaseModel):
    """Parametri per il metodo media.seek."""

    position_seconds: int


class ClipboardGetHistoryParams(BaseModel):
    """Parametri per il metodo clipboard.getHistory."""

    filter_type: Optional[str] = "all"
    search: Optional[str] = None


class ClipboardItemParams(BaseModel):
    """Parametri per il metodo clipboard.copyItem / deleteItem."""

    item_id: str


class ShelfAddFileParams(BaseModel):
    """Parametri per il metodo shelf.addFile."""

    name: str
    source_path: Optional[str] = None
    size_bytes: Optional[int] = 0


class ShelfItemParams(BaseModel):
    """Parametri per il metodo shelf.removeFile / shelf.airDropFile."""

    item_id: str


class WeatherParams(BaseModel):
    """Parametri per il metodo weather.getCurrent / weather.getForecast."""

    city: Optional[str] = "Cupertino"


class SpaceSwitchParams(BaseModel):
    """Parametri per il metodo spaces.switchSpace / batchLaunchWorkflow / exportSpace."""

    space_id: str


class SpaceSaveParams(BaseModel):
    """Parametri per il metodo spaces.saveSpace."""

    space: Dict[str, Any]


class SpaceImportParams(BaseModel):
    """Parametri per il metodo spaces.importSpace."""

    payload: Dict[str, Any]


class SystemLaunchAppParams(BaseModel):
    """Parametri per il metodo system.launchApp."""

    app_path: str


class SystemUninstallPreviewParams(BaseModel):
    """Parametri per il metodo system.uninstallAppPreview."""

    app_path: str


class IPCRouter:
    """Router centrale per il dispatch e l'autenticazione dei messaggi JSON-RPC 2.0."""

    def __init__(self, expected_auth_token: str = "") -> None:
        self.expected_auth_token: str = expected_auth_token
        self.start_time: float = time.time()
        self.active_focus_mode: str = "NORMAL"
        self._broadcaster: Optional[Callable[[str, Dict[str, Any]], Any]] = None

    def set_broadcaster(self, broadcaster: Callable[[str, Dict[str, Any]], Any]) -> None:
        """Imposta il callback per il push broadcast su WebSocket verso tutti i client autenticati."""
        self._broadcaster = broadcaster
        voice_engine.set_broadcaster(broadcaster)

    async def _emit_event(self, method: str, params: Dict[str, Any]) -> None:
        """Invia un evento push asincrono tramite il broadcaster registrato."""
        if self._broadcaster:
            try:
                if inspect.iscoroutinefunction(self._broadcaster):
                    await self._broadcaster(method, params)
                else:
                    self._broadcaster(method, params)
            except Exception as exc:
                logger.error("Errore durante l'emissione dell'evento push %s: %s", method, exc, exc_info=True)

    def set_auth_token(self, token: str) -> None:
        """Aggiorna il token di autenticazione atteso."""
        self.expected_auth_token = token

    async def dispatch(self, raw_message: str, is_authenticated: bool) -> Tuple[Optional[str], bool]:
        """Elabora un messaggio grezzo in arrivo sul WebSocket.

        Ritorna una tupla: (risposta_json_str, appena_autenticato).
        """
        # 1. Parsing JSON grezzo
        try:
            data = json.loads(raw_message)
        except json.JSONDecodeError as exc:
            logger.warning("Ricevuto payload JSON non valido: %s", exc)
            err_resp = JsonRpcErrorResponse(
                id=None,
                error=JsonRpcError(code=PARSE_ERROR, message="Parse error: invalid JSON payload"),
            )
            return err_resp.model_dump_json(), False

        # Verifica preliminare che il payload sia un dict
        if not isinstance(data, dict):
            err_resp = JsonRpcErrorResponse(
                id=None,
                error=JsonRpcError(code=INVALID_REQUEST, message="Invalid Request: payload must be a JSON object"),
            )
            return err_resp.model_dump_json(), False

        req_id = data.get("id")

        # 2. Validazione struttura JSON-RPC 2.0
        try:
            request = JsonRpcRequest.model_validate(data)
        except ValidationError as val_err:
            logger.warning("Payload non conforme a JSON-RPC 2.0: %s", val_err)
            err_resp = JsonRpcErrorResponse(
                id=req_id,
                error=JsonRpcError(code=INVALID_REQUEST, message=f"Invalid Request: {val_err}"),
            )
            return err_resp.model_dump_json(), False

        # 3. Gestione Handshake di Autenticazione
        if request.method == "system.handshake":
            try:
                params = HandshakeParams.model_validate(request.params or {})
            except ValidationError as param_err:
                err_resp = JsonRpcErrorResponse(
                    id=request.id,
                    error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {param_err}"),
                )
                return err_resp.model_dump_json(), False

            # Verifica corrispondenza token di sessione
            if self.expected_auth_token and params.auth_token != self.expected_auth_token:
                logger.warning("Tentativo di handshake fallito con auth_token non corrispondente.")
                err_resp = JsonRpcErrorResponse(
                    id=request.id,
                    error=JsonRpcError(
                        code=AUTHENTICATION_FAILURE,
                        message="Authentication Failure: Invalid session secret",
                    ),
                )
                return err_resp.model_dump_json(), False

            # Handshake completato con successo
            uptime = round(time.time() - self.start_time, 2)
            res = JsonRpcResponse(
                id=request.id,
                result={
                    "status": "authenticated",
                    "daemon_uptime_seconds": uptime,
                    "system_mode": self.active_focus_mode,
                },
            )
            logger.info("Client autenticato con successo tramite system.handshake.")
            return res.model_dump_json(), True

        # 4. Controllo Accesso: se non autenticato, rifiuto immediato
        if not is_authenticated:
            logger.warning(
                "Rifiutata invocazione del metodo '%s' da client non autenticato.",
                request.method,
            )
            err_resp = JsonRpcErrorResponse(
                id=request.id,
                error=JsonRpcError(
                    code=AUTHENTICATION_FAILURE,
                    message="Authentication Failure: Session not authenticated. Call system.handshake first.",
                ),
            )
            return err_resp.model_dump_json(), False

        # 5. Routing dei Metodi Autenticati
        try:
            if request.method == "system.setFocusMode":
                try:
                    p = SetFocusModeParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                prev_mode = self.active_focus_mode
                self.active_focus_mode = p.mode
                expires_at = (
                    datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(minutes=p.duration_minutes or 50)
                ).isoformat()

                logger.info("Focus Mode aggiornato da %s a %s", prev_mode, self.active_focus_mode)
                res = JsonRpcResponse(
                    id=request.id,
                    result={
                        "previous_mode": prev_mode,
                        "active_mode": self.active_focus_mode,
                        "expires_at": expires_at,
                    },
                )
                return res.model_dump_json(), False

            elif request.method == "system.ping":
                try:
                    p = PingParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                server_now_ms = int(time.time() * 1000)
                res = JsonRpcResponse(
                    id=request.id,
                    result={
                        "pong": True,
                        "echo_timestamp": p.timestamp,
                        "server_time": server_now_ms,
                    },
                )
                return res.model_dump_json(), False

            # --- HELP MEMORIA (DIAGNOSTICA & STORAGE APFS) ---
            elif request.method in ("memory.scan", "memory.triggerDiskScan"):
                try:
                    scan_params = TriggerDiskScanParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                async def on_scan_progress(progress_info: Dict[str, Any]) -> None:
                    await self._emit_event("event.memory.scanProgress", progress_info)

                if scan_params.target_dir:
                    scan_res = await disk_scanner.scan_directory_async(
                        scan_params.target_dir,
                        broadcast_cb=self._emit_event,
                    )
                    res = JsonRpcResponse(
                        id=request.id,
                        result={
                            "scan_id": f"scan_{int(time.time())}",
                            "status": "completed",
                            "discovered_cleanable_bytes": scan_res.get("size_bytes", 0),
                            "scanned_files": scan_res.get("count", 0),
                            "breakdown": {scan_params.target_dir: scan_res},
                        },
                    )
                    return res.model_dump_json(), False

                scan_res = await disk_scanner.scan_targets(
                    targets=scan_params.targets,
                    deep_scan=scan_params.deep_scan or False,
                    progress_callback=on_scan_progress,
                )

                # Verifica allarme spazio APFS
                alarm = apfs_monitor.check_alarm()
                if alarm:
                    await self._emit_event("event.memory.diskAlarm", alarm)

                res = JsonRpcResponse(
                    id=request.id,
                    result={
                        "scan_id": scan_res["scan_id"],
                        "status": "completed",
                        "discovered_cleanable_bytes": scan_res["discovered_cleanable_bytes"],
                        "scanned_files": scan_res["scanned_files"],
                        "breakdown": scan_res["breakdown"],
                    },
                )
                return res.model_dump_json(), False

            elif request.method in ("memory.clean", "memory.cleanCaches"):
                try:
                    clean_params = CleanCachesParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                target_categories = clean_params.categories or ["caches", "logs", "xcode_derived_data"]
                clean_res = await cleaner.clean_categories(
                    categories=target_categories,
                    dry_run=clean_params.dry_run or False,
                )
                res = JsonRpcResponse(
                    id=request.id,
                    result=clean_res,
                )
                return res.model_dump_json(), False

            elif request.method == "memory.getStorageTelemetry":
                telemetry = apfs_monitor.get_telemetry()
                res = JsonRpcResponse(id=request.id, result=telemetry)
                return res.model_dump_json(), False

            # --- PROMPTERRR (ARCHITETTO-CRITICO & CONTEXT CACHE) ---
            elif request.method in ("prompterrr.submitPrompt", "prompterrr.executePipeline"):
                try:
                    pipe_params = ExecutePipelineParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                prompt_text = pipe_params.get_prompt_text()
                if not prompt_text:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message="Invalid params: missing 'prompt' or 'prompt_input'"),
                    )
                    return err_resp.model_dump_json(), False

                async def on_token_chunk(token_info: Dict[str, Any]) -> None:
                    await self._emit_event("event.prompterrr.tokenStream", token_info)

                pipe_res = await prompterrr_pipeline.execute(
                    prompt_input=prompt_text,
                    context_files=pipe_params.context_files,
                    mode=pipe_params.mode or "architect_critic",
                    temperature=pipe_params.temperature or 0.2,
                    enable_cache=pipe_params.enable_cache if pipe_params.enable_cache is not None else True,
                    token_callback=on_token_chunk,
                )

                # Emissione evento completamento
                await self._emit_event("event.prompterrr.pipelineComplete", pipe_res)

                res = JsonRpcResponse(
                    id=request.id,
                    result=pipe_res,
                )
                return res.model_dump_json(), False

            elif request.method == "prompterrr.abortPipeline":
                try:
                    abort_params = AbortPipelineParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                aborted = prompterrr_pipeline.abort(abort_params.pipeline_id)
                res = JsonRpcResponse(
                    id=request.id,
                    result={
                        "pipeline_id": abort_params.pipeline_id,
                        "status": "aborted" if aborted else "not_found",
                    },
                )
                return res.model_dump_json(), False

            # --- VOICE ENGINE & NOTCH AUDIO ---
            elif request.method == "voice.startListening":
                voice_res = await voice_engine.start_listening()
                res = JsonRpcResponse(id=request.id, result=voice_res)
                return res.model_dump_json(), False

            elif request.method == "voice.stopListening":
                voice_res = await voice_engine.stop_listening()
                res = JsonRpcResponse(id=request.id, result=voice_res)
                return res.model_dump_json(), False

            # --- MEDIA CONTROLLER (NOTCH & VINYL STUDIO) ---
            elif request.method == "media.getPlaybackState":
                playback_state = await media_controller.get_playback_state_async()
                res = JsonRpcResponse(id=request.id, result=playback_state)
                return res.model_dump_json(), False

            elif request.method == "media.controlPlayback":
                try:
                    media_params = ControlPlaybackParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                media_res = await media_controller.control_playback_async(media_params.action)
                await self._emit_event("event.media.trackChanged", media_res)
                res = JsonRpcResponse(id=request.id, result=media_res)
                return res.model_dump_json(), False

            elif request.method == "media.seek":
                try:
                    seek_p = MediaSeekParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                seek_res = await media_controller.seek_async(seek_p.position_seconds)
                await self._emit_event("event.media.trackChanged", seek_res)
                res = JsonRpcResponse(id=request.id, result=seek_res)
                return res.model_dump_json(), False

            # --- CLIPBOARD MANAGER ---
            elif request.method == "clipboard.getHistory":
                try:
                    clip_params = ClipboardGetHistoryParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                history = await clipboard_manager.get_history_async(
                    filter_type=clip_params.filter_type,
                    search=clip_params.search,
                )
                res = JsonRpcResponse(id=request.id, result={"items": history, "count": len(history)})
                return res.model_dump_json(), False

            elif request.method == "clipboard.copyItem":
                try:
                    copy_p = ClipboardItemParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                success = await clipboard_manager.copy_item_async(copy_p.item_id)
                res = JsonRpcResponse(id=request.id, result={"success": success, "item_id": copy_p.item_id})
                return res.model_dump_json(), False

            elif request.method == "clipboard.deleteItem":
                try:
                    del_p = ClipboardItemParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                success = clipboard_manager.delete_item(del_p.item_id)
                res = JsonRpcResponse(id=request.id, result={"success": success, "item_id": del_p.item_id})
                return res.model_dump_json(), False

            elif request.method == "clipboard.clearHistory":
                cleared = clipboard_manager.clear_history()
                res = JsonRpcResponse(id=request.id, result={"success": cleared})
                return res.model_dump_json(), False

            # --- DROP SHELF (POCKET) & AIRDROP ---
            elif request.method == "shelf.getFiles":
                files = shelf_manager.get_items()
                res = JsonRpcResponse(id=request.id, result={"items": files, "count": len(files)})
                return res.model_dump_json(), False

            elif request.method == "shelf.addFile":
                try:
                    add_p = ShelfAddFileParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                new_file = shelf_manager.add_file(
                    name=add_p.name,
                    source_path=add_p.source_path,
                    size_bytes=add_p.size_bytes or 0,
                )
                res = JsonRpcResponse(id=request.id, result=new_file)
                return res.model_dump_json(), False

            elif request.method == "shelf.removeFile":
                try:
                    rem_p = ShelfItemParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                removed = shelf_manager.remove_item(rem_p.item_id)
                res = JsonRpcResponse(id=request.id, result={"success": removed, "item_id": rem_p.item_id})
                return res.model_dump_json(), False

            elif request.method == "shelf.clear":
                cleared = shelf_manager.clear()
                res = JsonRpcResponse(id=request.id, result={"success": cleared})
                return res.model_dump_json(), False

            elif request.method == "shelf.airDropFile":
                try:
                    air_p = ShelfItemParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                air_res = await shelf_manager.airdrop_file_async(air_p.item_id)
                res = JsonRpcResponse(id=request.id, result=air_res)
                return res.model_dump_json(), False

            # --- WEATHER SERVICE ---
            elif request.method in ("weather.getCurrent", "weather.getForecast"):
                try:
                    w_params = WeatherParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                w_data = await weather_service.get_weather_async(w_params.city or "Cupertino")
                res = JsonRpcResponse(id=request.id, result=w_data)
                return res.model_dump_json(), False

            # --- SPACES & WORKFLOWS ---
            elif request.method == "spaces.getSpaces":
                all_spaces = spaces_manager.get_all_spaces()
                res = JsonRpcResponse(id=request.id, result=all_spaces)
                return res.model_dump_json(), False

            elif request.method == "spaces.switchSpace":
                try:
                    sw_p = SpaceSwitchParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                active_space = spaces_manager.switch_space(sw_p.space_id)
                if not active_space:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Space '{sw_p.space_id}' non trovato"),
                    )
                    return err_resp.model_dump_json(), False

                res = JsonRpcResponse(id=request.id, result=active_space)
                return res.model_dump_json(), False

            elif request.method == "spaces.saveSpace":
                try:
                    save_p = SpaceSaveParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                saved = spaces_manager.save_space(save_p.space)
                res = JsonRpcResponse(id=request.id, result=saved)
                return res.model_dump_json(), False

            elif request.method == "spaces.deleteSpace":
                try:
                    del_sp = SpaceSwitchParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                deleted = spaces_manager.delete_space(del_sp.space_id)
                res = JsonRpcResponse(id=request.id, result={"success": deleted, "space_id": del_sp.space_id})
                return res.model_dump_json(), False

            elif request.method == "spaces.batchLaunchWorkflow":
                try:
                    wf_p = SpaceSwitchParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                launch_res = await spaces_manager.batch_launch_workflow_async(wf_p.space_id)
                res = JsonRpcResponse(id=request.id, result=launch_res)
                return res.model_dump_json(), False

            elif request.method == "spaces.exportSpace":
                try:
                    exp_p = SpaceSwitchParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                exported = spaces_manager.export_space(exp_p.space_id)
                res = JsonRpcResponse(id=request.id, result=exported)
                return res.model_dump_json(), False

            elif request.method == "spaces.importSpace":
                try:
                    imp_p = SpaceImportParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                imported = spaces_manager.import_space(imp_p.payload)
                res = JsonRpcResponse(id=request.id, result=imported)
                return res.model_dump_json(), False

            # --- SYSTEM APPS & LAUNCHER GRID ---
            elif request.method == "system.getApplications":
                apps = await app_scanner.get_applications_async()
                res = JsonRpcResponse(id=request.id, result={"apps": apps, "total": len(apps)})
                return res.model_dump_json(), False

            elif request.method == "system.launchApp":
                try:
                    l_params = SystemLaunchAppParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                ok = await app_scanner.launch_app_async(l_params.app_path)
                res = JsonRpcResponse(id=request.id, result={"success": ok, "app_path": l_params.app_path})
                return res.model_dump_json(), False

            elif request.method == "system.uninstallAppPreview":
                try:
                    u_params = SystemUninstallPreviewParams.model_validate(request.params or {})
                except ValidationError as exc:
                    err_resp = JsonRpcErrorResponse(
                        id=request.id,
                        error=JsonRpcError(code=INVALID_PARAMS, message=f"Invalid params: {exc}"),
                    )
                    return err_resp.model_dump_json(), False

                preview = await app_scanner.get_uninstall_preview_async(u_params.app_path)
                res = JsonRpcResponse(id=request.id, result=preview)
                return res.model_dump_json(), False

            else:
                logger.warning("Metodo richiesto non registrato: %s", request.method)
                err_resp = JsonRpcErrorResponse(
                    id=request.id,
                    error=JsonRpcError(
                        code=METHOD_NOT_FOUND,
                        message=f"Method not found: '{request.method}'",
                    ),
                )
                return err_resp.model_dump_json(), False

        except Exception as exc:
            logger.error("Errore interno durante l'esecuzione di '%s': %s", request.method, exc, exc_info=True)
            err_resp = JsonRpcErrorResponse(
                id=request.id,
                error=JsonRpcError(code=INTERNAL_ERROR, message=f"Internal error: {exc}"),
            )
            return err_resp.model_dump_json(), False
