/**
 * 1PB Vault Engine - upload.js
 * Version 2.0: Supports Folder Traversal & Recursive Uploads
 */

const REPO_OWNER = "Codeblub";
const REPO_NAME = "cloud-stoage";
const BRANCH = "main";

function getToken() {
    return document.getElementById('tokenInput')?.value || localStorage.getItem('gh_token');
}

/**
 * Uploads a single file to GitHub with SHA checking for overwrites
 */
async function commitToGithub(path, content, message, isBase64 = true) {
    const token = getToken();
    if (!token) return false;

    // Ensure path starts with vault/
    const cleanPath = path.startsWith('vault/') ? path : `vault/${path}`;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${cleanPath}`;
    
    let sha = null;
    try {
        const res = await fetch(url, { headers: { "Authorization": `token ${token}` } });
        if (res.ok) {
            const data = await res.json();
            sha = data.sha;
        }
    } catch (e) {}

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: message,
            content: isBase64 ? content : btoa(content),
            branch: BRANCH,
            sha: sha || undefined
        })
    });

    return response.ok;
}

/**
 * Fixed handleUpload: Supports Folder Drag-and-Drop
 */
async function handleUpload() {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput.files.length) return alert("Select files or a folder first.");

    const files = fileInput.files;
    let successCount = 0;

    for (let file of files) {
        // webkitRelativePath is key: it preserves folder structure during upload
        const path = file.webkitRelativePath || file.name;
        
        const reader = new FileReader();
        const uploadPromise = new Promise((resolve) => {
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                const ok = await commitToGithub(path, base64, `Upload: ${path}`);
                if (ok) successCount++;
                resolve();
            };
            reader.readAsDataURL(file);
        });
        await uploadPromise;
    }

    if (successCount > 0) {
        alert(`Successfully synced ${successCount} items to the Vault.`);
        location.reload();
    }
}

window.uploadFile = handleUpload;
