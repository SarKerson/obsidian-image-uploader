const { Plugin, Setting, PluginSettingTab, Notice, requestUrl } = require('obsidian');

module.exports = class PicGoIntegrationPlugin extends Plugin {
	settings = {
		picgoServer: 'http://127.0.0.1:36677/upload',
		blacklist: []
	};

	async onload() {
		await this.loadSettings();

		// 添加设置选项
		this.addSettingTab(new PicGoSettingTab(this.app, this));

		// 添加命令：上传当前文档中的所有图片
		this.addCommand({
			id: 'upload-all-images',
			name: 'Upload all images in current document',
			callback: () => this.uploadAllImages()
		});

		console.log('Image Uploader plugin loaded');
	}

	onunload() {
		console.log('Image Uploader plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.settings, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 上传当前文档中的所有图片
	async uploadAllImages() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file');
			return;
		}

		const content = await this.app.vault.read(activeFile);
		// 改进正则表达式以更好地匹配各种图片格式
		const imageRegex = /!\[.*?\]\((.*?)\)|<img[^>]*src=["'](.*?)["'][^>]*>/g;
		let newContent = content;
		let match;
		let uploadedCount = 0;
		let skippedCount = 0;

		// 使用数组存储所有匹配项，避免重复处理
		const matches = [];
		while ((match = imageRegex.exec(content)) !== null) {
			matches.push({
				fullMatch: match[0],
				imageUrl: match[1] || match[2]
			});
		}

		// 处理每个匹配项
		for (const { fullMatch, imageUrl } of matches) {
			// 检查是否在黑名单中
			if (this.isBlacklisted(imageUrl)) {
				console.log(`Skipping blacklisted image: ${imageUrl}`);
				skippedCount++;
				continue;
			}

			// 检查是否为需要上传的图片
			if (this.isUploadableImage(imageUrl)) {
				try {
					const uploadedUrl = await this.uploadImage(imageUrl);
					if (uploadedUrl) {
						// 只替换当前匹配项，避免影响其他图片
						newContent = newContent.replace(fullMatch, fullMatch.replace(imageUrl, uploadedUrl));
						uploadedCount++;
					}
				} catch (error) {
					console.error(`Failed to upload image ${imageUrl}:`, error);
					new Notice(`Failed to upload image: ${imageUrl}`);
				}
			} else {
				skippedCount++;
			}
		}

		if (uploadedCount > 0) {
			await this.app.vault.modify(activeFile, newContent);
			new Notice(`Successfully uploaded ${uploadedCount} images. Skipped ${skippedCount} images.`);
		} else {
			new Notice(`No images were uploaded. Skipped ${skippedCount} images.`);
		}
	}

	// 检查图片是否在黑名单中
	isBlacklisted(imageUrl) {
		// 如果没有设置黑名单，直接返回false
		if (!this.settings.blacklist || this.settings.blacklist.length === 0) {
			return false;
		}

		try {
			// 如果是本地文件路径，不检查黑名单
			if (!imageUrl.startsWith('http')) {
				return false;
			}

			const urlObj = new URL(imageUrl);
			// 检查域名是否在黑名单中
			return this.settings.blacklist.some(domain => {
				// 确保域名不为空
				if (!domain) return false;
				// 检查完全匹配或子域名匹配
				return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
			});
		} catch (error) {
			// 如果不是有效的URL，假设它是本地文件，不检查黑名单
			console.log(`Invalid URL, skipping blacklist check: ${imageUrl}`);
			return false;
		}
	}

	// 检查是否为需要上传的图片
	isUploadableImage(imageUrl) {
		// 检查是否为需要上传的图片
		// 本地文件和互联网图片都应该被上传（除了localhost和黑名单中的域名）
		// 返回true表示需要上传，false表示不需要上传
		if (!imageUrl) return false;

		// 本地文件路径需要上传
		if (!imageUrl.startsWith('http')) {
			return true;
		}

		// localhost地址不上传
		if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('https://localhost')) {
			return false;
		}

		// file:// 协议不上传
		if (imageUrl.startsWith('file://')) {
			return false;
		}

		// 其他http/https链接都需要上传
		return true;
	}

	// 上传单个图片
	async uploadImage(imageUrl) {
		try {
			// 发送上传请求
			new Notice(`Uploading image: ${imageUrl}`);

			// 准备请求数据 - 使用PicGo要求的JSON格式
			const requestData = {
				list: [imageUrl]
			};

			const response = await requestUrl({
				url: this.settings.picgoServer,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestData)
			});

			if (response.status === 200) {
				const result = response.json;
				if (result.success) {
					new Notice(`Successfully uploaded: ${imageUrl}`);
					return result.result[0];
				} else {
					throw new Error(result.message || 'Upload failed');
				}
			} else {
				throw new Error(`HTTP ${response.status}: ${response.text}`);
			}
		} catch (error) {
			console.error('Upload error:', error);
			new Notice(`Upload failed: ${error.message}`);
			return null;
		}
	}
}

// 设置选项卡
function PicGoSettingTab(app, plugin) {
	PluginSettingTab.call(this, app, plugin);
	this.plugin = plugin;
}

PicGoSettingTab.prototype = Object.create(PluginSettingTab.prototype);
PicGoSettingTab.prototype.constructor = PicGoSettingTab;

PicGoSettingTab.prototype.display = function () {
	const { containerEl } = this;
	containerEl.empty();

	containerEl.createEl('h2', { text: 'Image Uploader Settings' });

	// PicGo服务器设置
	new Setting(containerEl)
		.setName('PicGo Server')
		.setDesc('PicGo HTTP API endpoint')
		.addText(text => text
			.setPlaceholder('http://127.0.0.1:36677/upload')
			.setValue(this.plugin.settings.picgoServer)
			.onChange(async (value) => {
				// 验证URL格式
				if (value && !value.startsWith('http')) {
					new Notice('Please enter a valid HTTP/HTTPS URL');
					return;
				}
				this.plugin.settings.picgoServer = value;
				await this.plugin.saveSettings();
			}));

	// 域名黑名单设置说明
	containerEl.createEl('h3', { text: 'Domain Blacklist' });
	containerEl.createEl('p', {
		text: 'Images from these domains will not be uploaded. Enter one domain per line.'
	});

	// 域名黑名单设置
	new Setting(containerEl)
		.setName('Blacklisted Domains')
		.setDesc('One domain per line (e.g., example.com)')
		.addTextArea(text => {
			text
				.setPlaceholder('example.com\nanother-domain.com')
				.setValue(this.plugin.settings.blacklist.join('\n'))
				.onChange(async (value) => {
					this.plugin.settings.blacklist = value.split('\n').map(d => d.trim()).filter(d => d);
					await this.plugin.saveSettings();
				});
			text.inputEl.rows = 6;
			text.inputEl.cols = 50;
		});

	// 使用说明
	containerEl.createEl('h3', { text: 'How to Use' });
	const instructions = containerEl.createEl('ul');
	instructions.createEl('li', { text: 'Configure your PicGo server URL above' });
	instructions.createEl('li', { text: 'Add domains to blacklist if needed' });
	instructions.createEl('li', { text: 'Open a document with images' });
	instructions.createEl('li', { text: 'Run "Image Uploader: Upload all images in current document" command' });
	instructions.createEl('li', { text: 'Local images will be uploaded and URLs replaced' });
}
