/**
 * 1PB Vault Engine - upload.js
 * Optimized for AirDrive + WebDAV + GitHub Actions Backend
 */

const REPO_OWNER = "Codeblub";
const REPO_NAME = "cloud-stoage";
const BRANCH = "main";

/**
 * Gets the GITHUB_TOKEN from the UI input or localStorage
 */
function getToken() {
    const tokenInput = document.getElementById('tokenInput');
    return tokenInput ? tokenInput.value : localStorage.getItem('gh_token');
}

/**
 * Core function to push data to GitHub
 */
async function commitToGithub(path, content, message, isBase64 = true) {
    const token = getToken();
    if (!token) {
        alert("Please enter your GitHub Token first.");
        return false;
    }

    // Ensure we are always working within the vault directory
    const cleanPath = path.startsWith('vault/') ? path : `vault/${path}`;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${cleanPath}`;
    
    // 1. Check for existing file to get SHA (needed for updates/overwrites)
    let sha = null;
    try {
        const checkRes = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });
        if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
        }
    } catch (e) {
        console.log("New path detected, no SHA required.");
    }

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
 * Intercepts Folder Creation (MKCOL)
 * This allows AirDrive to 'create' folders by placing a .gitkeep file inside them
 */
async function createFolder(folderPath) {
    console.log(`AirDrive requesting folder: ${folderPath}`);
    // Removes trailing slashes and adds .gitkeep
    const path = `${folderPath.replace(/\/$/, "")}/.gitkeep`;
    return await commitToGithub(path, " ", "Initialize Directory Structure", false);
}

/**
 * Handles the "Push to Cloud" button in the 1PB Vault Control UI
 */
async function handleUpload() {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput || !fileInput.files.length) {
        return alert("Select a file first.");
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
        const base64Content = reader.result.split(',')[1];
        // If the file is inside a folder, 'file.name' might just be the name.
        // WebDAV uploads usually provide the full relative path.
        const path = file.webkitRelativePath || file.name;
        
        console.log(`Syncing to Vault: ${path}`);
        const success = await commitToGithub(path, base64Content, `Upload: ${file.name}`);
        
        if (success) {
            alert("Upload Complete!");
            window.location.reload(); 
        } else {
            alert("Upload failed. Verify token and repo permissions.");
        }
    };
    reader.readAsDataURL(file);
}

// Global hook for the HTML button
window.uploadFile = handleUpload;

// Listen for the DOM to attach events to the UI
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.querySelector('button[onclick="uploadFile()"]') || 
                      document.querySelector('input[type="button"][value="Push to Cloud"]');
    if (uploadBtn) {
        uploadBtn.onclick = handleUpload;
    }
});

export { handleUpload, createFolder, commitToGithub };
