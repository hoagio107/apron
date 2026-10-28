#[tauri::command]
fn open_in_folder(path: String) -> Result<(), String> {
  if !std::path::Path::new(&path).is_dir() {
    return Err("Path is not a valid directory".into());
  }

  #[cfg(target_os = "windows")]
  {
    use std::process::Command;
    Command::new("explorer")
      .arg(&path)
      .spawn()
      .map_err(|e| e.to_string())?;
    Ok(())
  }
  #[cfg(target_os = "macos")]
  {
    use std::process::Command;
    Command::new("open")
      .arg(&path)
      .spawn()
      .map_err(|e| e.to_string())?;
    Ok(())
  }
  #[cfg(not(any(target_os = "windows", target_os = "macos")))]
  {
    use std::process::Command;
    Command::new("xdg-open")
      .arg(&path)
      .spawn()
      .map_err(|e| e.to_string())?;
    Ok(())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![open_in_folder])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
