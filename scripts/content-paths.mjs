// content-seed / content-sync 共用的路径与常量。抽出来是因为两边一旦对
// VERSION_FILE 的位置有分歧，同步服务就会永远认为有新内容、每 30 秒重建一次。
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const LANGS = ["zh", "en"];

export const i18nPath = (lang) => join(REPO_ROOT, "src", "i18n", `${lang}.json`);

// 故意放在仓库外：`git clean -fdx` 会删掉仓库内的未跟踪文件，标记一没就会
// 触发一次无谓的全量重建。
export const VERSION_FILE = join(homedir(), ".me-content-version");
