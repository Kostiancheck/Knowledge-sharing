# What are extensions?
Browsers expose certain objects/functionality via API called **WebExtension API**. Extensions are basically Javascript applications that have access to this API. So you can do stuff like setting cookies (note keyword **browser** that is never explicitly imported, but is accessible):
```javascript 
browser.cookies.set({ 
	__utma: "1asdazxcbv" 
});
```

# Content scripts
Content script is a piece of javascript code that will be executed on a particular **web page**.
Whenever browser opens a page that matches pattern you specified, it will execute this piece of code (for example, after the page has loaded). You can think about it like automatically adding your own `<script>` element at the bottom of the page. Although, it does not literally add `<script>` element, but rather executes code at certain trigger (see `run_at` option for details).

Content scripts are cool because they have access to **document** object on a page you need. So they can read and modify the content of the page using the standard DOM API.

The problem is that they **don't have access to most of WebExtension API features**. Because it would be ridiculous if content script injected on a certain page in one tab could block requests in another tab, for example.

You must use **background scripts** to access other WebExtension APIs. And your content scripts may communicate with background scripts using messages, so this restriction can kind of be circumvented.

# Background scripts
Background scripts are way more powerful than content scripts. They can do stuff like intercepting requests, opening and closing tabs, adding sites to bookmarks etc.

They are running "in the background", implying "all the time". However, this is not entirely true. When you enable extension, background scripts are loaded. All **event listeners** are registered at this moment and they'll be active until extension is disabled or deleted. Nothing else is executed or even loaded to memory. Only when a certain event fires that extension listened for, browser loads background script again and executes relevant functions, unloading once closed.

# HTML popups
To do something like this:
![[Pasted image 20240403191240.png]]
You need a thing called "default_popup" "action". When you click on extension, "action" is triggered, and if you have defined "default_popup" path to .html file, it will be rendered (like a micro-page, something like iframe) just under it.
# manifest.json
Every extension must have a **manifest.json** file. It contains metadata about extension, such as name, description, version etc. 

Manifest file contains list of all background scripts, as well as list of all content scripts along with rules on when to load them, and list of permissions needed to run the extension.

See basic example below.
``` JSON
{
	"manifest_version": 3,
	"name": "manifest.json example",
	"version": "1",
	"content_scripts": [
		{
			"matches": [
				"*://*.google.com/*"
			],
			"js": ["content-script.js"]
		}
	],
	"background": {
		"scripts": [
			"background.js"
		],
		"type": "module"
	},
	"permissions": [
		"webNavigation"
		]
	}
}
```

# Developing extension
Once you add your .html/.css/.js files and link them with manifest.json, you might want to try out your extension.

You can load your extension *unpacked*, to allow easy reload. 
First, visit about:debugging#/runtime/this-firefox
Then, click "load temporary extension" and choose path to manifest.json file.

Now, if you click "Inspect" button, a pop-up will open where you can see log output of your background scripts. To see the output of content scripts, you just need to open developer tools on relevant websites.

You can also reload script after changing code with reload button here, or in the Inspect pop-up. Note that previous output of background scripts won't be deleted automatically.

# Publishing extension
First, you probably need add-on ID in your manifest.json file. See link [2].

If you want your extension published, you need to get it signed (verified by Mozilla). See link [3].

If you don't care about getting your extension listed on addons.mozilla.org, you can still sign it via automatic\* mozilla process. Just select "On your own" option here (you select which option to use for every new version, so you'll be able to publish later):
![[Pasted image 20240403124244.png]]
\*it's not automatic if you use code minifiers/generators etc. Even webpack.
The whole process takes about 15 minutes in normal circumstances.

So, you set "browser_specific_settings" object in manifest.json, specified uuid and update_url[4], registered on mozilla and enabled 2fa, etc. 
No you need to "package" your extension. It means just creating a zip file with contents of your extension folder.
`zip -r -FS ../my-extension.zip * --exclude '*.git*'`

The ZIP file must be a ZIP of the extension's files themselves, not of the directory containing them.

You can now submit this zip for signing. Once it's signature is approved, you may download extension .xpi file and install it.

> **!danger zone!**
The other option would be disabling signature verification and installing .zip directly. To do so you need to go to about:config, set `xpinstall.signatures.required` to `false`. Then you can then install packaged .zip locally: visit about:addons -> press gear icon -> install from file. It is very dangerous to do so, as you disable signature verification for ALL your installed extensions. And remember that extension update automatically by default! So it's a huge security risk.

In my case, I had to explicitly allow my extension to modify data on youtube.com after installing signed version. IDK how to make it work by default, or how to make a request for it on first launch.
# Sources
1. The most important source is Mozilla extension docs. Even if you're developing extension for Chrome, these docs will help a lot. - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
2. When do you need an add-on ID? - https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/#when-do-you-need-an-add-on-id
3. Get your extension signed - https://extensionworkshop.com/documentation/publish/#get-your-extension-signed
4. update_url - https://extensionworkshop.com/documentation/manage/updating-your-extension/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=submission
   