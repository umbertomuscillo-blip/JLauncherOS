/**
 * ⚡ IPC Schema Types (Fase 2 Full Implementation)
 * Protocollo JSON-RPC 2.0 per comunicazione tra UI React e Demone Python.
 */

export interface JsonRpcRequest<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: T;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface JsonRpcNotification<T = unknown> {
  jsonrpc: "2.0";
  method: string;
  params?: T;
}

// =============================================================================
// NAMESPACE: system
// =============================================================================

export type FocusMode = "NORMAL" | "DEEP_WORK" | "STUDY";

export interface HandshakeParams {
  auth_token: string;
  client_version?: string;
}

export interface HandshakeResult {
  status: "authenticated";
  daemon_uptime_seconds: number;
  system_mode: FocusMode;
}

export interface SetFocusModeParams {
  mode: FocusMode;
  duration_minutes?: number;
  silence_audio?: boolean;
}

export interface SetFocusModeResult {
  previous_mode: FocusMode;
  active_mode: FocusMode;
  expires_at: string;
}

export interface PingParams {
  timestamp?: number;
}

export interface PingResult {
  pong: boolean;
  echo_timestamp?: number;
  server_time: number;
}

// =============================================================================
// NAMESPACE: voice
// =============================================================================

export interface StartListeningResult {
  listening: boolean;
  sample_rate: number;
}

export interface StopListeningResult {
  listening: boolean;
}

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export interface VoiceStateChangedEvent {
  state: VoiceState;
  audio_amplitude: number;
  energy_frequency?: number[];
}

export interface VoiceTranscriptEvent {
  is_final: boolean;
  text: string;
  confidence: number;
}

// =============================================================================
// NAMESPACE: memory (Help Memoria)
// =============================================================================

export interface MemoryScanParams {
  deep_scan?: boolean;
  targets?: string[];
  target_dir?: string;
}

export interface MemoryScanResult {
  scan_id: string;
  status: string;
  discovered_cleanable_bytes: number;
  scanned_files: number;
  breakdown: Record<string, unknown>;
}

export type TriggerDiskScanParams = MemoryScanParams;
export type TriggerDiskScanResult = MemoryScanResult;

export interface MemoryCleanParams {
  scan_id?: string;
  categories?: string[];
  dry_run?: boolean;
}

export interface MemoryCleanResult {
  freed_bytes: number;
  freed_human: string;
  deleted_files_count: number;
  dry_run: boolean;
}

export type CleanCachesParams = MemoryCleanParams;
export type CleanCachesResult = MemoryCleanResult;

export interface DiskScanProgressEvent {
  scan_id: string;
  current_path: string;
  scanned_files: number;
  discovered_cleanable_bytes: number;
  percentage: number;
}

export interface DiskAlarmEvent {
  mount_point: string;
  available_bytes: number;
  available_human: string;
  severity: "LOW" | "WARNING" | "CRITICAL";
  recommendation: string;
}

// =============================================================================
// NAMESPACE: prompterrr
// =============================================================================

export interface SubmitPromptParams {
  prompt?: string;
  prompt_input?: string;
  context_files?: string[];
  mode?: "architect_critic" | "standard";
  temperature?: number;
  enable_cache?: boolean;
}

export interface SubmitPromptResult {
  pipeline_id: string;
  duration_ms: number;
  cache_hit: boolean;
  tokens_saved: number;
  final_prompt: string;
}

export type ExecutePipelineParams = SubmitPromptParams;
export type ExecutePipelineResult = SubmitPromptResult;

export interface AbortPipelineParams {
  pipeline_id: string;
}

export interface AbortPipelineResult {
  pipeline_id: string;
  status: string;
}

export interface TokenStreamEvent {
  pipeline_id: string;
  stage: "architect" | "critic";
  token_chunk: string;
  tokens_emitted: number;
}

export interface PipelineCompleteEvent {
  pipeline_id: string;
  duration_ms: number;
  cache_hit: boolean;
  tokens_saved: number;
  final_prompt: string;
}

// =============================================================================
// NAMESPACE: media
// =============================================================================

export interface ControlPlaybackParams {
  action: "play" | "pause" | "play_pause" | "next" | "previous";
}

export interface ControlPlaybackResult {
  action_executed: string;
  is_playing: boolean;
}

export interface MediaTrackState {
  title: string;
  artist: string;
  album: string;
  duration_seconds: number;
  position_seconds: number;
  is_playing: boolean;
  player_app: string;
  album_art_url?: string;
  vinyl_rpm?: number;
  volume?: number;
}

export interface MediaTrackChangedEvent extends MediaTrackState {}

export interface MediaSeekParams {
  position_seconds: number;
}

// =============================================================================
// NAMESPACE: clipboard (Dynamic Notch & Launcher History)
// =============================================================================

export type ClipboardType = "all" | "text" | "color" | "link" | "screenshot" | "file";

export interface ClipboardItem {
  item_id: string;
  content_type: "text" | "color" | "link" | "screenshot" | "file";
  text_content: string;
  preview: string;
  timestamp: number;
  metadata?: {
    hex?: string;
    rgb?: string;
    domain?: string;
    dimensions?: string;
    is_dir?: boolean;
    [key: string]: unknown;
  };
}

export interface ClipboardGetHistoryParams {
  filter_type?: string;
  search?: string;
}

export interface ClipboardGetHistoryResult {
  items: ClipboardItem[];
  count: number;
}

// =============================================================================
// NAMESPACE: shelf (Pocket Drop Shelf & AirDrop)
// =============================================================================

export interface ShelfItem {
  item_id: string;
  name: string;
  path: string;
  size_bytes: number;
  size_human: string;
  added_at: number;
  file_type: "file" | "image" | "audio" | "doc" | "archive" | "design" | "pdf";
}

export interface ShelfGetFilesResult {
  items: ShelfItem[];
  count: number;
}

// =============================================================================
// NAMESPACE: weather (Live Conditions & Forecast)
// =============================================================================

export interface WeatherHourly {
  time: string;
  temp: number;
  condition: string;
  icon: string;
  pop: number;
}

export interface WeatherDaily {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

export interface WeatherData {
  city: string;
  region: string;
  temperature: number;
  unit: string;
  feels_like: number;
  condition: string;
  condition_code: string;
  high: number;
  low: number;
  humidity: number;
  wind_speed_kmh: number;
  air_quality_index: number;
  air_quality_label: string;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  updated_at: number;
}

// =============================================================================
// NAMESPACE: spaces & workflows
// =============================================================================

export interface SpaceApp {
  name: string;
  bundle_id: string;
  path: string;
}

export interface SpaceProfile {
  id: string;
  name: string;
  icon: string;
  accent_color: string;
  theme: "neon_glow" | "frosted_dark" | "liquid_cyan" | "oled_black";
  wallpaper: string;
  hotkey: string;
  apps: SpaceApp[];
  folders: string[];
  layout_grid: "3x5" | "4x6" | "5x7" | "5x8";
}

export interface SpacesGetResult {
  active_space_id: string;
  spaces: SpaceProfile[];
}

export interface BatchLaunchWorkflowResult {
  success: boolean;
  space_id: string;
  space_name: string;
  launched_apps: string[];
  opened_folders: string[];
}

// =============================================================================
// NAMESPACE: system (App Grid & Clean Uninstaller)
// =============================================================================

export interface SystemAppItem {
  name: string;
  bundle_id: string;
  path: string;
  category: "Dev" | "Design" | "Media" | "Productivity" | "System" | "Utilities";
  is_favorite?: boolean;
}

export interface SystemGetAppsResult {
  apps: SystemAppItem[];
  total: number;
}

export interface AppRemnant {
  path: string;
  size_bytes: number;
  is_directory: boolean;
}

export interface UninstallPreviewResult {
  app_name: string;
  bundle_id: string;
  remnants: AppRemnant[];
  total_bytes: number;
  total_human: string;
  remnant_count: number;
}

