const { Octokit } = require("octokit");

// This connects to the secret you just created
const octokit = new Octokit({ auth: process.env.MY_CLOUD_TOKEN });

async function run() {
  try {
    const timestamp = new Date().toLocaleString();
    const fileName = `log-${Date.now()}.txt`;
    
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: 'Codeblub',
      repo: 'cloud-stoage',
      path: `vault/${fileName}`, // This saves files into a folder named 'vault'
      message: 'Cloud Storage: New Entry',
      content: Buffer.from(`Entry created at: ${timestamp}`).toString('base64'),
      headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    });
    
    console.log(`✅ Success! Created ${fileName} in the vault.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

run();
