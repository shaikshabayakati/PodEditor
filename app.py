import tkinter as tk
from tkinter import filedialog, messagebox
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import threading
import time
import os
import subprocess

def launch_chrome():
    """Launches an instance of Chrome with remote debugging enabled."""
    try:
        # Common paths for Chrome on Windows
        paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe")
        ]
        chrome_path = next((p for p in paths if os.path.exists(p)), None)
        
        if not chrome_path:
            messagebox.showerror("Error", "Could not find Chrome on this computer.")
            return

        # Create an isolated Chrome profile so it doesn't conflict with your normal browsing
        debug_dir = os.path.join(os.path.expanduser("~"), "ChromeDebugProfile")
        subprocess.Popen([chrome_path, "--remote-debugging-port=9222", f"--user-data-dir={debug_dir}"])
        status_label.config(text="Chrome launched! Now you can start downloading.", fg="green")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to launch Chrome: {e}")

def browse_dir():
    folder_selected = filedialog.askdirectory()
    dir_var.set(folder_selected)

def start_process():
    links = text_area.get("1.0", tk.END).strip().split('\n')
    links = [l.strip() for l in links if l.strip()]
    download_dir = dir_var.get()

    if not links:
        messagebox.showerror("Error", "Please paste at least one link.")
        return
    if not download_dir:
        messagebox.showerror("Error", "Please select your Chrome download folder.")
        return

    start_btn.config(state=tk.DISABLED)
    status_label.config(text="Connecting to your open Chrome...")
    
    threading.Thread(target=auto_download, args=(links, download_dir), daemon=True).start()

def wait_for_downloads(download_dir):
    """Pauses Python while Chrome completes the download."""
    print(f"Monitoring directory: {download_dir}")
    
    # Increase initial wait and use a timeout to avoid infinite loops if it never starts
    max_init_wait = 15 
    start_wait = 0
    found_download = False
    
    while start_wait < max_init_wait:
        is_downloading = any(filename.endswith(".crdownload") for filename in os.listdir(download_dir))
        if is_downloading:
            found_download = True
            print("Download detected (.crdownload found)")
            break
        time.sleep(1)
        start_wait += 1
    
    if not found_download:
        print("No .crdownload file detected after waiting. Either it finished instantly or didn't start.")
        time.sleep(2) # Final safety buffer
        return

    while True:
        is_downloading = any(filename.endswith(".crdownload") for filename in os.listdir(download_dir))
        if not is_downloading:
            print("Download complete (.crdownload gone)")
            break
        time.sleep(2)

def auto_download(links, download_dir):
    options = webdriver.ChromeOptions()
    # Crucial: Tells Python to hook into the port we opened in Step 1
    options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    
    try:
        # Connects to your ACTUAL open Chrome browser
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 15)

        for i, link in enumerate(links):
            status_label.config(text=f"Loading link {i+1}/{len(links)}...")
            driver.get(link)
            
            try:
                # Find the download button case-insensitively
                xpath = "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'download')]"
                download_btn = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
                
                # More aggressive approach: allow all downloads in this session
                try:
                    driver.execute_cdp_cmd('Page.setDownloadBehavior', {
                        'behavior': 'allow',
                        'downloadPath': download_dir
                    })
                except:
                    pass

                # Natively click it via your profile
                try:
                    from selenium.webdriver.common.action_chains import ActionChains
                    ActionChains(driver).move_to_element(download_btn).click().perform()
                except:
                    driver.execute_script("arguments[0].click();", download_btn)
                
                status_label.config(text=f"Downloading file {i+1}/{len(links)}... waiting for 100%")
                
                # Freeze Python until the file hits 100% and the .crdownload file disappears
                wait_for_downloads(download_dir)
                
            except Exception as e:
                print(f"Skipping link {i+1} due to error: {e}")
                continue

        status_label.config(text="🎉 All links processed successfully!")
    except Exception as e:
        status_label.config(text=f"Connection Error: Ensure Chrome Debug mode is running.")
        print(e)
    finally:
        start_btn.config(state=tk.NORMAL)

# --- GUI Setup ---
app = tk.Tk()
app.title("Real Chrome Link Downloader")
app.geometry("500x480")

# Add a button to easily launch Chrome properly
tk.Label(app, text="1. Launch Chrome in Debug Mode:", font=("Arial", 10, "bold")).pack(pady=(10, 0))
launch_btn = tk.Button(app, text="Open Debug Chrome", command=launch_chrome, bg="#FF9800", fg="white", font=("Arial", 10, "bold"))
launch_btn.pack(pady=5)

tk.Label(app, text="2. Paste Links (one per line):", font=("Arial", 10, "bold")).pack(pady=(10, 0))
text_area = tk.Text(app, height=10, width=55)
text_area.pack(pady=5)

tk.Label(app, text="3. Select your Chrome Download Folder:", font=("Arial", 10, "bold")).pack(pady=(10, 0))
dir_var = tk.StringVar()
dir_frame = tk.Frame(app)
dir_frame.pack(pady=5)
tk.Entry(dir_frame, textvariable=dir_var, width=42, state="readonly").pack(side=tk.LEFT, padx=5)
tk.Button(dir_frame, text="Browse...", command=browse_dir).pack(side=tk.LEFT)

start_btn = tk.Button(app, text="Start Downloading", command=start_process, bg="#008CBA", fg="white", font=("Arial", 12, "bold"))
start_btn.pack(pady=15)

status_label = tk.Label(app, text="Make sure Chrome is running in Debug Mode first!", fg="red")
status_label.pack(pady=5)

app.mainloop()