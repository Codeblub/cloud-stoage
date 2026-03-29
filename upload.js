/**
 * 1PB Vault Engine - upload.js
 * Optimized for WebDAV + GitHub Actions Backend
 */

// Configuration - Ensure these match your repo
const REPO_OWNER = "Codeblub";
const REPO_NAME = "cloud-stoage";
const BRANCH = "main";

/**
 * Gets the GITHUB_TOKEN from the UI input or environment
 */
function getToken() {
    const tokenInput = document.getElementById('tokenInput'); // Assumes you have an input with this ID
    return tokenInput ? tokenInput.value : localStorage.getItem('gh_token');
}

/**
 * Main Commit Function
 * Handles both new files and updates (overwrites)
 */
async function commitToGithub(path, content, message, isBase64 = true) {
    const token = getToken();
    if (!token) {
        alert("Please enter your GitHub Token first.");
        return false;
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    // 1. Check for existing file to get SHA (required for updates)
    let sha = null;
    try {
        const checkRes = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });
        if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
        }
    } catch (e) { console.log("New file path detected."); }

    // 2. Prepare Payload
    const body = {
        message: message,
        content: isBase64 ? content : btoa(content),
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    // 3. Push to GitHub
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    return response.ok;
}

/**
 * Handles WebDAV Folder Creation (MKCOL)
 * Since Git doesn't track empty folders, we add a .gitkeep file.
 */
async function createFolder(folderPath) {
    console.log(`Creating directory: ${folderPath}`);
    const path = `vault/${folderPath}/.gitkeep`.replace(/\/+/g, '/');
    return await commitToGithub(path, " ", "Initialize Directory Structure", false);
}

/**
 * Triggered by the "Push to Cloud" button in 1PB Vault Control
 */
async function handleUpload() {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput.files.length) return alert("Select a file first.");

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
        const base64Content = reader.result.split(',')[1];
        const path = `vault/${file.name}`;
        
        console.log(`Syncing to Vault: ${path}`);
        const success = await commitToGithub(path, base64Content, `Upload: ${file.name}`);
        
        if (success) {
            alert("Upload Complete!");
            window.location.reload(); 
        } else {
            alert("Upload failed. Verify token permissions.");
        }
    };
    reader.readAsDataURL(file);
}

// Attach to your existing button if not already linked
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.querySelector('button[onclick="uploadFile()"]') || 
                      document.querySelector('input[type="button"][value="Push to Cloud"]');
    if (uploadBtn) {
        uploadBtn.onclick = handleUpload;
    }
});

export { handleUpload, createFolder, commitToGithub };
