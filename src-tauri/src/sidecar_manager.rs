//! 🧟‍♂️ sidecar_manager.rs - Zero Zombie Sidecar Supervisor
//!
//! Gestione del ciclo di vita del demone Python (JARVIS) con Two-Phase Graceful Shutdown:
//! 1. Invio formale di SIGTERM tramite libc::kill.
//! 2. Polling non bloccante per 3.0 secondi.
//! 3. Se ancora attivo, invio forzato di SIGKILL via libc::kill e child.kill().
//!
//! REGOLE FERREE: Zero .unwrap() o .expect() nel codice di produzione.

use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Manager};
use thiserror::Error;

#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum SidecarError {
    #[error("Il processo sidecar è già in esecuzione")]
    AlreadyRunning,

    #[error("Nessun processo sidecar attualmente attivo")]
    NotRunning,

    #[error("Impossibile acquisire il lock del mutex: {0}")]
    LockError(String),

    #[error("Interprete Python non trovato nei percorsi cercati")]
    PythonNotFound,

    #[error("Entrypoint del demone non trovato al percorso: {0}")]
    ScriptNotFound(String),

    #[error("Fallimento durante lo spawn del processo: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Errore nell'invio del segnale di sistema: {0}")]
    SignalError(String),
}

/// Stato gestito del processo sidecar
#[derive(Clone)]
pub struct SidecarState {
    child: Arc<Mutex<Option<Child>>>,
    ipc_secret: Arc<Mutex<Option<String>>>,
}

impl Default for SidecarState {
    fn default() -> Self {
        Self::new()
    }
}

impl SidecarState {
    /// Inizializza una nuova istanza di SidecarState
    pub fn new() -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            ipc_secret: Arc::new(Mutex::new(None)),
        }
    }

    /// Ritorna il token effimero di sessione generato per la connessione IPC
    #[allow(dead_code)]
    pub fn get_ipc_secret(&self) -> Result<Option<String>, SidecarError> {
        let lock = self
            .ipc_secret
            .lock()
            .map_err(|e| SidecarError::LockError(e.to_string()))?;
        Ok(lock.clone())
    }

    /// Risolve il percorso dell'interprete Python dando priorità all'ambiente virtuale del progetto
    fn resolve_python_path(&self, project_root: &Path) -> Result<PathBuf, SidecarError> {
        let candidates = [
            project_root.join("backend").join("venv").join("bin").join("python"),
            project_root.join("backend").join("venv").join("bin").join("python3"),
            project_root.join("venv").join("bin").join("python3"),
            PathBuf::from("/opt/homebrew/bin/python3"),
            PathBuf::from("/usr/local/bin/python3"),
            PathBuf::from("/usr/bin/python3"),
        ];

        for candidate in &candidates {
            if candidate.exists() {
                return Ok(candidate.clone());
            }
        }

        // Fallback su PATH di sistema
        Ok(PathBuf::from("python3"))
    }

    /// Risolve il percorso dell'entrypoint backend/main.py
    fn resolve_script_path(&self, project_root: &Path) -> Result<PathBuf, SidecarError> {
        let script = project_root.join("backend").join("main.py");
        if script.exists() {
            return Ok(script);
        }

        // Fallback provando directory corrente
        let local_script = PathBuf::from("backend").join("main.py");
        if local_script.exists() {
            return Ok(local_script);
        }

        Err(SidecarError::ScriptNotFound(script.to_string_lossy().to_string()))
    }

    /// Avvia il demone Python registrando il child process e la chiave effimera
    pub fn spawn(&self, app_handle: &AppHandle) -> Result<(), SidecarError> {
        let mut child_lock = self
            .child
            .lock()
            .map_err(|e| SidecarError::LockError(e.to_string()))?;

        if child_lock.is_some() {
            return Err(SidecarError::AlreadyRunning);
        }

        // Risoluzione directory base di lavoro
        let resource_dir = match app_handle.path().resource_dir() {
            Ok(path) => path,
            Err(_) => PathBuf::from("."),
        };

        let current_dir = match std::env::current_dir() {
            Ok(dir) => dir,
            Err(_) => resource_dir.clone(),
        };

        // Trova root del progetto
        let project_root = if current_dir.join("backend").exists() {
            current_dir.clone()
        } else if let Some(parent) = current_dir.parent() {
            if parent.join("backend").exists() {
                parent.to_path_buf()
            } else {
                current_dir.clone()
            }
        } else {
            current_dir.clone()
        };

        let python_bin = self.resolve_python_path(&project_root)?;
        let script_path = self.resolve_script_path(&project_root)?;

        // Generazione token di sicurezza effimero UUIDv4
        let session_secret = uuid::Uuid::new_v4().to_string();

        let mut cmd = Command::new(&python_bin);
        cmd.arg(&script_path);
        cmd.current_dir(&project_root);
        cmd.env("JLAUNCHER_IPC_SECRET", &session_secret);
        cmd.env("PYTHONUNBUFFERED", "1");

        println!(
            "[SidecarManager] Avvio demone Python: {:?} {:?} (CWD: {:?})",
            python_bin, script_path, project_root
        );

        let child = cmd.spawn()?;
        let child_pid = child.id();
        println!(
            "[SidecarManager] Demone Python avviato con successo. PID: {}",
            child_pid
        );

        // Memorizza il token di sessione
        let mut secret_lock = self
            .ipc_secret
            .lock()
            .map_err(|e| SidecarError::LockError(e.to_string()))?;
        *secret_lock = Some(session_secret);

        *child_lock = Some(child);
        Ok(())
    }

    /// Esegue il Graceful Shutdown a due fasi (SIGTERM -> 3s timeout -> SIGKILL)
    pub fn graceful_shutdown(&self) -> Result<(), SidecarError> {
        let mut child_lock = self
            .child
            .lock()
            .map_err(|e| SidecarError::LockError(e.to_string()))?;

        let child_process = match child_lock.as_mut() {
            Some(c) => c,
            None => {
                println!("[SidecarManager] Nessun processo child attivo da arrestare.");
                return Ok(());
            }
        };

        let pid = child_process.id() as libc::pid_t;
        println!(
            "[SidecarManager] [Fase 1] Invio SIGTERM al demone Python (PID: {})...",
            pid
        );

        // Verifica preliminare se il processo è già terminato
        match child_process.try_wait() {
            Ok(Some(status)) => {
                println!(
                    "[SidecarManager] Il processo PID {} è già terminato con stato: {:?}",
                    pid, status
                );
                *child_lock = None;
                return Ok(());
            }
            Ok(None) => {}
            Err(e) => {
                eprintln!(
                    "[SidecarManager] Errore durante try_wait preliminare: {}",
                    e
                );
            }
        }

        // Invia formalmente SIGTERM via libc
        let kill_res = unsafe { libc::kill(pid, libc::SIGTERM) };
        if kill_res != 0 {
            eprintln!(
                "[SidecarManager] libc::kill SIGTERM ha restituito codice di errore: {}",
                kill_res
            );
        }

        // Polling non bloccante per un massimo di 3.0 secondi (30 intervalli da 100ms)
        let mut exited = false;
        for _ in 0..30 {
            std::thread::sleep(Duration::from_millis(100));
            match child_process.try_wait() {
                Ok(Some(status)) => {
                    println!(
                        "[SidecarManager] Demone Python (PID: {}) terminato elegantemente con stato: {:?}",
                        pid, status
                    );
                    exited = true;
                    break;
                }
                Ok(None) => continue,
                Err(err) => {
                    eprintln!(
                        "[SidecarManager] Errore durante try_wait nel loop: {}",
                        err
                    );
                    break;
                }
            }
        }

        // Se non è uscito entro 3 secondi, esegue SIGKILL forzato
        if !exited {
            eprintln!(
                "[SidecarManager] [Fase 2] Timeout di 3.0s superato per PID {}. Invio forzato di SIGKILL...",
                pid
            );
            let kill9_res = unsafe { libc::kill(pid, libc::SIGKILL) };
            if kill9_res != 0 {
                eprintln!(
                    "[SidecarManager] libc::kill SIGKILL ha restituito codice: {}",
                    kill9_res
                );
            }
            let _ = child_process.kill();
            let _ = child_process.wait();
            println!("[SidecarManager] Processo PID {} terminato forzatamente via SIGKILL.", pid);
        }

        *child_lock = None;
        println!("[SidecarManager] Graceful Shutdown completato. Zero zombie garantito.");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sidecar_state_initialization() {
        let state = SidecarState::new();
        let secret = state.get_ipc_secret();
        assert!(secret.is_ok());
        assert_eq!(secret.unwrap(), None);
    }

    #[test]
    fn test_sidecar_shutdown_when_not_running() {
        let state = SidecarState::new();
        let shutdown_res = state.graceful_shutdown();
        assert!(shutdown_res.is_ok());
    }

    #[test]
    fn test_path_resolution() {
        let state = SidecarState::new();
        let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let root = if current_dir.join("backend").exists() {
            current_dir
        } else if let Some(parent) = current_dir.parent() {
            parent.to_path_buf()
        } else {
            current_dir
        };

        let py = state.resolve_python_path(&root);
        assert!(py.is_ok());
        let script = state.resolve_script_path(&root);
        assert!(script.is_ok());
    }
}

