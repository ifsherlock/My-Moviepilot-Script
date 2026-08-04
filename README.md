# My-Moviepilot-Script

一个自用的油猴脚本合集，涵盖 MoviePilot/PT 辅助、LINUX.DO 主题、FNOS 文件管理和 GitHub Raw 链接跳转。

## 快速安装

请先安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他兼容的用户脚本管理器，然后点击下表中的“安装”。脚本管理器会打开安装确认页。

| 脚本 | 版本 | 用途 | 安装 | 源码 |
| --- | --- | --- | --- | --- |
| MoviePilot 种子名自动测试与下载 | 3.2.0 | 在 PT 详情页识别种子名称并推送到 MoviePilot | [安装](<https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/MoviePilot%20%E7%A7%8D%E5%AD%90%E5%90%8D%E8%87%AA%E5%8A%A8%E6%B5%8B%E8%AF%95%E4%B8%8E%E4%B8%8B%E8%BD%BD.js>) | [查看](<./MoviePilot 种子名自动测试与下载.js>) |
| LINUX.DO NGA Theme | 2.3.7 | 为 LINUX.DO 增加 `nga` 和 `nga plus` 主题 | [安装](https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/linuxdo-nga-theme.user.js) | [查看](./linuxdo-nga-theme.user.js) |
| NotePod++ FNOS 助手 | 1.0.0 | 在 FNOS 文件管理器中使用 NotePod++ 编辑和新建文件 | [安装](<https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/NotePod%2B%2B%20FNOS%20%E5%8A%A9%E6%89%8B.user.js>) | [查看](<./NotePod++ FNOS 助手.user.js>) |
| GitHub 仓库链接跳转助手 | 1.0.0 | 从 GitHub Raw 页面快速返回对应仓库 | [安装](<https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/GitHub%20%E4%BB%93%E5%BA%93%E9%93%BE%E6%8E%A5%E8%B7%B3%E8%BD%AC%E5%8A%A9%E6%89%8B.user.js>) | [查看](<./GitHub 仓库链接跳转助手.user.js>) |
| Redirect t.me to telegram.dog | 1.0.1 | 将失效的 `t.me` 地址改写到 `telegram.dog` | [安装](https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/redirect-t-me-to-telegram-dog.user.js) | [查看](./redirect-t-me-to-telegram-dog.user.js) |

MoviePilot 脚本的文件名当前以 `.js` 结尾。如果点击后浏览器只显示源码，请在脚本管理器的“实用工具”中选择“从 URL 安装”，并使用表格中的安装地址。

## MoviePilot 种子名自动测试与下载

在 PT 站点详情页提取种子名称，调用 MoviePilot API 完成媒体识别，并提供重新识别、手动关联和一键推送下载。

主要功能：

- 使用 MoviePilot API Key，不需要在脚本中保存 MoviePilot 账号和密码。
- 支持自动识别、候选标题重试、TMDB 辅助匹配和手动关联。
- 获取当前站点的下载链接后，可直接推送到 MoviePilot 下载器。
- 支持常见 `details*.php` 详情页，以及 TTG、Bangumi、ACGNX、DMHY、Nyaa、Mikan、Skyey2、M-Team 等页面。
- 可在油猴菜单中打开调试日志，便于排查识别或连接问题。

首次使用：

1. 安装脚本后，打开油猴菜单中的 `设置 MoviePilot`。
2. 填写完整的 MoviePilot 地址，包括 `http://` 或 `https://` 和端口。
3. 在 MoviePilot 的“设置 → 运营 → API 密钥”中取得 API Key 并填入。
4. TMDB API Key 为可选项，仅用于自动识别失败后的辅助匹配。
5. 打开受支持的种子详情页，脚本会在页面内显示识别结果和下载操作。

MoviePilot 地址、API Key 和 TMDB API Key 保存在当前用户脚本的本地存储中，不会写入本仓库。

## LINUX.DO NGA Theme

为 [LINUX.DO](https://linux.do/) 增加一套参考 NGA 配色与信息密度的界面主题，不替换帖子数据，也不改变回复、点赞、收藏、Boost、举报等原有功能。

- `nga`：以配色和基础控件样式为主，尽量保持 LINUX.DO 原布局。
- `nga plus`：进一步调整帖子列表、楼层作者栏、正文区域和右侧时间轴，使宽屏布局更接近 NGA。
- 支持首页、帖子列表、帖子正文和个人页等常用页面。
- 左下角主题菜单可切换 `nga`、`nga plus` 或原有主题。
- 提供独立的 `NGA 标识` 开关，可替换左上角 LINUX.DO Logo。
- 已配置 `@updateURL` 和 `@downloadURL`，安装 2.3.7 后可由脚本管理器检查后续更新。

所有主题选项均保存在浏览器本地。关闭 NGA 主题后，页面会恢复 LINUX.DO 原有样式。

## NotePod++ FNOS 助手

为 FNOS 文件管理器补充 NotePod++ 编辑入口和新建文件操作。

- 在文件右键菜单中增加“使用 NotePod++ 编辑”。
- 在文件管理窗口中增加“新建文件”按钮。
- 支持内嵌编辑窗口、独立窗口打开和窗口位置记录。
- 默认仅在域名包含 `fnos.net`，或端口为 `5666`、`5667` 的页面启用。

脚本元数据会匹配 HTTP/HTTPS 页面，但运行时会再次检查地址。其他域名、局域网 IP 或端口需要通过油猴菜单中的 `NotePod++：设置` 手动加入匹配规则；也可以在那里暂时关闭脚本。

## GitHub 仓库链接跳转助手

在 `raw.githubusercontent.com` 页面显示一个可拖动的“跳转仓库”悬浮按钮。

- 当前页面只对应一个仓库时，点击后直接打开仓库首页。
- 页面中检测到多个 Raw 链接时，以列表形式展示对应仓库。
- 自动合并同一仓库的多个链接，避免重复项目。
- 支持 Tampermonkey 和 Violentmonkey 常见的 `GM_*` / `GM.*` 接口。

## Redirect t.me to telegram.dog

将当前页面或网页中的 `t.me` 链接改写为 `telegram.dog`，用于无法正常打开 `t.me` 时继续进入 Telegram 深链接。

- 访问 `t.me/...` 时直接保留路径和查询参数并跳转到 `telegram.dog/...`。
- 将 `username.t.me/path` 改写为 `telegram.dog/username/path`。
- 扫描页面已有链接，并持续处理动态加载或后来修改的链接。
- 在点击阶段再次检查目标地址，覆盖未被页面扫描捕获的链接。

为了处理任意网站中的 Telegram 链接，脚本会匹配所有 HTTP/HTTPS 页面；它使用 `@grant none`，不会申请油猴存储或跨域请求权限。

## 更新与安全

- 带有 `@updateURL` 和 `@downloadURL` 的脚本可通过脚本管理器检查更新；更新源均指向本仓库的 `main` 分支。
- MoviePilot 脚本当前没有自动更新元数据，需要通过上方安装链接手动覆盖更新。
- 安装或更新前，请在脚本管理器的确认页核对脚本名称、匹配站点和权限。
- 不要公开 MoviePilot API Key、站点 Cookie 或其他私人配置。

## 致谢

MoviePilot 脚本基于以下项目修改和整合：

- [MoviePilot 种子名自动测试与下载（增强版）](https://greasyfork.org/zh-CN/scripts/569257-moviepilot-%E7%A7%8D%E5%AD%90%E5%90%8D%E8%87%AA%E5%8A%A8%E6%B5%8B%E8%AF%95%E4%B8%8E%E4%B8%8B%E8%BD%BD-%E5%A2%9E%E5%BC%BA%E7%89%88)
- [MoviePilotNameTest](https://greasyfork.org/zh-CN/scripts/473246-moviepilotnametest)

感谢原作者的工作。
