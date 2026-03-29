const GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"; // Ensure this is set in your environment
const REPO_OWNER = "Codeblub";
const REPO_NAME = "cloud-stoage";
const BRANCH = "main";

/**
 * Enhanced Upload Logic for 1PB Vault Engine
 * Supports: Nested Folders, MKCOL (Directory Creation), and Overwrites
 */

async function commitToGithub(path, content, message, isBase64 = true) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    // First, check if the file exists to get the SHA (for overwriting/updating)
    let sha = null;
    try {
        const res = await fetch(url, {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` }
        });
        if (res.ok) {
            const data = await res.json();
            sha = data.sha;
        }
    } catch (e) { console.log("New file detected, no SHA needed."); }

    const body = {
        message: message,
        content: isBase64 ? content : btoa(content),
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    return response.ok;
}

/**
 * Handle WebDAV MKCOL (Make Collection)
 * This bypasses the "Read Only" error by creating a physical folder structure in Git
 */
async function handleMKCOL(folderPath) {
    console.log(`Creating Directory: ${folderPath}`);
    // Create a .gitkeep so GitHub tracks the directory
    return await commitToGithub(`${folderPath}/.gitkeep`, " ", "Initialize Directory Structure", false);
}

/**
 * Main Upload Interceptor
 * Use this when a file is dropped or sent via AirDrive/WebDAV
 */
async function handleUpload(file, customPath = "vault/") {
    const reader = new FileReader();
    reader.onload = async () => {
        const base64Content = reader.result.split(',')[1];
        const fullPath = customPath + file.name;
        
        console.log(`Pushing to Cloud: ${fullPath}`);
        const success = await commitToGithub(fullPath, base64Content, `Sync ${file.name}`);
        
        if (success) {
            alert("Vault Updated Successfully!");
            window.location.reload(); // Refresh to show new files in 1PB Vault Control
        } else {
            alert("Upload failed. Check Token permissions.");
        }
    };
    reader.readAsDataURL(file);
}

// Exporting functions for your index.html listeners
export { handleUpload, handleMKCOL, commitToGithub };
