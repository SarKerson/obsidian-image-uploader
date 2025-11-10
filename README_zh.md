# Obsidian PicGo 集成插件

这个插件可以将您 Obsidian 文档中的图片通过 PicGo HTTP API 上传到图床，并自动将图片 URL 替换为 PicGo 返回的 URL。

## 功能特性

- 自动识别当前文档中的所有图片
- 通过 PicGo HTTP API 将图片上传到图床
- 将原始图片 URL 替换为 PicGo 返回的 URL
- 支持域名黑名单，可排除特定域名的图片上传
- 支持本地图片和网络图片

## 安装方法

1. 确保您已安装并运行了启用 HTTP API 的 PicGo
2. 将此插件文件夹下载到您的 Obsidian 仓库的 `.obsidian/plugins` 目录中
3. 在 Obsidian 设置中启用该插件

## 配置说明

1. **PicGo 服务器**：设置您的 PicGo HTTP API 端点（默认：`http://127.0.0.1:36677/upload`）
2. **域名黑名单**：添加您不想上传图片的域名（每行一个域名）

## 使用方法

1. 在插件设置中配置您的 PicGo 服务器 URL
2. （可选）根据需要将域名添加到黑名单
3. 打开包含图片的文档
4. 运行命令 "PicGo Integration: Upload all images in current document"
5. 插件将自动上传本地图片和网络图片到您的图床服务并替换 URL

## 环境要求

- Obsidian v0.9.7 或更高版本
- 启用 HTTP API 的 PicGo

## API 格式

插件以以下 JSON 格式向 PicGo 发送请求：

```json
{
  "list": ["image_url_here"]
}
```

## 支持格式

- 本地文件路径（相对路径或绝对路径）
- 网络图片 URL（http:// 或 https://）
- Markdown 格式图片：`![alt](url)`
- HTML 格式图片：`<img src="url" />`

## 注意事项

- 来自 localhost 的图片不会被上传
- 来自 file:// 协议的图片不会被上传
- 黑名单域名中的图片不会被上传