import { execSync } from "child_process";
import { join } from "path";
import * as fs from "fs";
import { createBrotliCompress, createBrotliDecompress } from "zlib";
import { https } from "follow-redirects";
import * as tar from "tar-fs";
import packageJson from "../package.json";

process.chdir(join(__dirname, ".."));

/**
 * Get the tarball name of current environment.
 */
function getPackageName() {
	const name = packageJson.name.split("/").pop();
	const { version } = packageJson;
	const runtime = "node";
	const abi = "NAPIv3";
	const { platform, arch } = process;

	return `${name}-v${version}-${runtime}-${abi}-${platform}-${arch}.tar.br`;
}

function getGithubRelease() {
	const re = new RegExp('github.com/([^/"]+)/([^/"]+)');
	const { version, repository } = packageJson;

	const match = re.exec(JSON.stringify(repository));
	if (!match) {
		throw new Error("You must set the repository property in package.json");
	}

	return `https://${match[0]}/releases/download/v${version}`.replace(/\.git$/, "");
}

/**
 * Pack the prebuilt binary file and compress it with brotli.
 */
function pack() {
	fs.rmSync("prebuilds", { recursive: true, force: true });
	fs.mkdirSync("prebuilds");

	const pack = tar.pack(".", {
		entries: ["build/Release/binding.node"],
	});

	const file = `prebuilds/${getPackageName()}`;
	console.log(`Packing files to ${file}`);

	pack.pipe(createBrotliCompress()).pipe(fs.createWriteStream(file));
}

/**
 * Download prebuilt binary from GitHub Release.
 * If download failed, fallback to build locally.
 */
function download() {
	const url = `${getGithubRelease()}/${getPackageName()}`;
	const request = https.get(url);

	request.on("response", response => {
		const { statusCode } = response;

		if (statusCode === 404) {
			return handleInstallError(`No prebuilt binary for your environment：${url}`);
		} else if (statusCode !== 200) {
			return handleInstallError(`Download failed (${statusCode}): ${url}`);
		}

		response
			.pipe(createBrotliDecompress())
			.pipe(tar.extract("."));
	});

	request.on("error", handleInstallError).end();
}

function handleInstallError(error: string) {
	console.warn(error);

	try {
		const cmd = "node-gyp rebuild --ensure";
		execSync(cmd, { stdio: "inherit" });
	} catch (e) {
		process.exit(e.status);
	}
}

const { NO_PREBUILD, CI } = process.env;
const [, , verb] = process.argv;

if (verb === "install") {
	if (!NO_PREBUILD && !CI) {
		download();
	}
} else if (verb === "pack") {
	pack();
} else {
	console.error("Parameter required: install or pack");
	process.exit(1);
}
