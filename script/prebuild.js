const { execSync } = require("child_process");
const { join } = require("path");
const fs = require("fs");
const { createBrotliCompress, createBrotliDecompress } = require("zlib");
const { https } = require("follow-redirects");
const tar = require("tar-fs");
const packageJson = require("../package.json");

const binary = "build/Release/binding.node";

process.chdir(join(__dirname, ".."));

/**
 * Get the tarball name of current environment.
 */
function getPackageName() {
	const name = packageJson.name.split("/").pop();
	const { version } = packageJson;
	const runtime = "node";
	const { platform, arch } = process;

	return `${name}-v${version}-${runtime}-${platform}-${arch}.tar.br`;
}

function getGithubRelease() {
	const re = new RegExp('github.com/[^/"]+/[^/"]+');
	const { version, repository } = packageJson;

	const match = re.exec(JSON.stringify(repository));
	if (!match) {
		throw new Error("You must set the repository property in package.json");
	}
	const url = match[0].replace(/\.git$/, "");
	return `https://${url}/releases/download/v${version}`;
}

/**
 * Pack the prebuilt binary file and compress it with brotli.
 */
function pack() {
	fs.rmSync("prebuilds", { recursive: true, force: true });
	fs.mkdirSync("prebuilds");

	const pack = tar.pack(".", {
		entries: [binary],
	});

	const file = `prebuilds/${getPackageName()}`;
	console.log(`Packing files to ${file}`);

	pack.pipe(createBrotliCompress()).pipe(fs.createWriteStream(file));
}

function checkRange(request, response) {
	const reqHeader = request.getHeader("Range");
	const resHeader = response.headers["content-range"];
	const match1 = /bytes=(\d*)-(\d*)/.exec(reqHeader);
	const match2 = /bytes (\d+)-(\d+)\/(\d+)/.exec(resHeader);

	if (!match1 || !match2) {
		return false;
	}
	const offset = parseInt(match2[1]);
	const end = parseInt(match2[2]);
	const total = parseInt(match2[3]);

	const from = parseInt(match1[1]) || 0;
	const to = parseInt(match1[2]) || total;

	return (offset === from) && (end + 1 === to);
}

/**
 * Download prebuilt binary from GitHub Release, If download failed, fallback to build locally.
 */
function download() {
	const filename = getPackageName();
	const headers = {};

	try {
		const { size } = fs.statSync(filename);
		headers["Range"] = `bytes=${size}-`;
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}

	const url = `${getGithubRelease()}/${filename}`;
	const request = https.get(url, { headers });

	request.on("response", response => {
		const { statusCode } = response;
		let stream;

		switch (statusCode) {
			case 404:
				return handleInstallError(`No prebuilt binary for your environment：${url}`);
			case 200:
				stream = fs.createWriteStream(filename);
				break;
			case 206:
				if (!checkRange(request, response)) {
					return handleInstallError("Range  mismatch");
				}
				stream = fs.createWriteStream(filename, { flags: "a" });
				break;
			default:
				return handleInstallError(`Download failed (${statusCode}): ${url}`);
		}

		const writing = response.pipe(stream).on("finish", () => {
			clearTimeout(timer);

			const extract = fs
				.createReadStream(filename)
				.pipe(createBrotliDecompress())
				.pipe(tar.extract("."));

			extract.on("finish", () => fs.unlinkSync(filename));
		});

		const timer = setTimeout(() => writing.destroy(), 30_000);
	});

	request.on("error", handleInstallError).end();
}

function handleInstallError(error) {
	console.warn(error);

	try {
		const cmd = "node-gyp rebuild --ensure";
		execSync(cmd, { stdio: "inherit" });
	} catch (e) {
		process.exit(e.status);
	}
}

const { NO_PREBUILD } = process.env;
const [, , verb] = process.argv;

if (verb === "install") {
	if (!NO_PREBUILD) {
		download();
	}
} else if (verb === "pack") {
	pack();
} else {
	console.error("Parameter required: install or pack");
	process.exit(1);
}
