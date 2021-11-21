const fs = require("fs");
require("dotenv").config();
const octokit = require("@octokit/core");

const client = new octokit.Octokit({ auth: process.env.GH_TOKEN });

async function updateAllRepos() {
	try {
		const res = await client.request("GET /user/repos", {
			sort: "updated",
			per_page: "100",
		});
		const repos = res.data.filter(r => r.name !== "geraldiner" && r.name !== "projects-readme" && r.name !== "projects-readme-tutorial");
		for (let i = 0; i < repos.length; i++) {
			const { name } = repos[i];
			updateReadMe(name);
		}
	} catch (error) {
		console.log(error);
	}
}

async function updateReadMe(repo) {
	try {
		const res = await client.request(`GET /repos/geraldiner/${repo}/contents/README.md`);
		const { path, sha, content, encoding } = res.data;
		const rawContent = Buffer.from(content, encoding).toString();
		const startIndex = rawContent.indexOf("## Other Projects");
		const updatedContent = `${startIndex === -1 ? rawContent : rawContent.slice(0, startIndex)}\n${getNewProjectSection()}`;
		commitNewReadme(repo, path, sha, encoding, updatedContent);
	} catch (error) {
		try {
			const content = `\n${getNewProjectSection()}`;
			await client.request(`PUT /repos/geraldiner/${repo}/contents/README.md`, {
				message: "Create README",
				content: Buffer.from(content, "utf-8").toString(encoding),
			});
		} catch (err) {
			console.log(err);
		}
	}
}

async function commitNewReadme(repo, path, sha, encoding, updatedContent) {
	try {
		await client.request(`PUT /repos/geraldiner/${repo}/contents/{path}`, {
			message: "Update README",
			content: Buffer.from(updatedContent, "utf-8").toString(encoding),
			path,
			sha,
		});
	} catch (err) {
		console.log(err);
	}
}

function getNewProjectSection() {
	return fs.readFileSync("projects.md").toString();
}

updateAllRepos();
