---
title: HowTo cook custom Firefox msi for enterprise deployment
date: '2011-09-10T20:36:00.001+03:00'
tags:
- windows
- msi
thumbnail: /assets/img/2011/ff1.png
---
> This is english version of my publication: https://habr.com/ru/articles/128161/

![](/assets/img/2011/ff1.png)
{ width="300px" .left }
The official Mozilla stance on MSI distributions is expressed in [this article](https://wiki.mozilla.org/Deployment:Deploying_Firefox)
{ target="_blank" }. It is recommended to wrap [FirefoxSetup.exe](https://wiki.mozilla.org/Installer:Command_Line_Arguments)
{ target="_blank" } in MSI, and any distribution of non-original packages is prohibited. However, when using wrappers, all the benefits of MSI are lost—auto-generation of rollback for changes, self-repair, and it becomes harder to manage updates, removals, and patches. In Mozilla's bug tracker, the issue [#231062](https://bugzilla.mozilla.org/show_bug.cgi?id=231062)
{ target="_blank" } Provide Firefox MSI package</a> has been open for 7 years! Meanwhile, Chrome has built-in support for [MSI](http://www.google.de/chrome/eula.html?platform=win&msi=true)
{ target="_blank" } and [GPO](http://www.chromium.org/administrators/policy-templates)
{ target="_blank" }. No wonder an alternative build for Firefox appeared from FrontMotion — [Firefox Community Edition](http://www.frontmotion.com/FMFirefoxCE/download_fmfirefoxce.htm)
{ target="_blank" }, which has its own peculiarities:  
[+] Applies policies set via [FirefoxAdm](http://sourceforge.net/projects/firefoxadm/)
{ target="_blank" } without additional extensions.  
[+] Includes its own ADM/ADMX extensions for GPP console.  
[+] Pre-installed plugins: Flash, IETab.  
[-] The browser is recompiled, and there's no guarantee that no extra features were added beyond GPO.  
[-] Uses a non-standard shortcut name (FrontMotion Firefox) on the desktop and in the Start menu (this can be fixed via MSI transforms).  
[-] Uses a different icon (from the nightly branch)—a black one, which is critical for users looking for the familiar orange fox.  
[-] Automatic updates are not applied since this is a custom build. The update channel is set to default (a special channel where there are no updates).  

If these downsides don't suit you, you can use the paid [service for package building](http://store.frontmotion.com/FirefoxPackager/index.htm)
{ target="_blank" }. Here, I'll describe how to build the package yourself and eliminate the aforementioned downsides.

1. Take a reference virtual machine with a client OS where the build will be done. Run [RegShot](http://rapidshare.com/files/383291723/Regshot\_v2.1.0.17.rar)
{ target="_blank" } and take snapshot #1 of the registry.
1. Install the latest Firefox. Take snapshot #2 of the registry, close the reports, and we'll return to them later.
1. Install the following plugins in Firefox:
[Adblock Plus](https://addons.mozilla.org/firefox/downloads/latest/1865/addon-1865-latest.xpi?src=search)
{ target="_blank" } - Ad blocking.
[IETab](https://addons.mozilla.org/firefox/downloads/latest/92382/addon-92382-latest.xpi?src=search)
{ target="_blank" } - Allows opening sites in Firefox tabs using the IE engine. Sometimes needed for legacy intranet sites.
[GPO for Firefox](https://addons.mozilla.org/firefox/downloads/latest/51892/platform:5/addon-51892-latest.xpi?src=search)
{ target="_blank" } - Reads policy settings from the local machine's registry and applies them to Firefox ([new version 0.9.3](http://ge.tt/8IUf6d7?c)
{ target="_blank" }, added application of new settings).
I also added spell-check files `en-US.dic`.
1. Restart Firefox, configure Adblock for the update channel. I also moved the Adblock button up, removed the status bar, and text menu. Close Firefox.
![](/assets/img/2011/ff2.png)
1. Firefox saves these settings in the user profile - `%appdata%\Mozilla\Firefox\Profiles\%rnd%.default\`
Now we need to make these settings the default for all new profiles. To do this, create the default profile folder 
`C:\Program Files\Mozilla Firefox\defaults\profile`
and copy from the user profile:
- The `adblockplus` folder, if Adblock was installed.
- The `localstore.rdf` file, if the text menu was removed or buttons were moved.
1. Create a `prefs.js` file in the default profile and insert the following:
```js
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage", "ya.ru");
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("browser.startup.page", 3);
user_pref("extensions.adblockplus.currentVersion", "1.3.9");
user_pref("extensions.ietab2.hasRun", true);
user_pref("extensions.ietab2.ietab2PrefsMigrated", true);
user_pref("extensions.ietab2.version", "3.5.9.1");
```
This prevents extra tabs and welcome messages on the first launch and disables the default browser prompt. Full Firefox configuration options are [here](http://kb.mozillazine.org/About:config_entries)
{ target="_blank" }.
1. Copy the plugins from the user profile's `extensions` folder to:  
`C:\Program Files\Mozilla Firefox\extensions`
A little about XPI plugins. Starting from version 4, they do not necessarily need to be unpacked into a separate folder with a unique identifier for execution. They can remain in their original form. Therefore, in the plugins folder, you see a mix of folders and XPI files. When copied to the `Mozilla Firefox\extensions` folder, the plugin is installed globally. Previously, this had to be done using:
`firefox.exe -install-global-extension "%path-to-extension%\extname.xpi"`  
More details can be found [here](http://kb.mozillazine.org/Installing_extensions)
{ target="_blank" }.
1. After copying the plugins, you need to check their compatibility with the Firefox version. To do this, open the `install.rdf` file in each plugin and look at the `<em:maxVersion>` parameter. For incompatible ones, I changed it to `99`. XPI plugins should be opened as a ZIP archive, and you should also check and modify the `install.rdf` file inside if necessary.
1. Now delete the user profile, the entire folder `%appdata%\Mozilla\Firefox\` and launch Firefox. Ensure panels and menus were arranged in the order we set, and all added plugins were connected. If a welcome tab for any plugin opens, find the line in the `prefs.js` file that determines that this plugin has not been launched yet, and copy it to the default profile.
1. However, after each deletion of the `%appdata%\Mozilla\Firefox\` folder and launching the browser, a prompt to import bookmarks appears. To disable the bookmark import prompt, create the file:  
`C:\Program Files\Mozilla Firefox\override.ini` 
with the content:
  ```ini
  [XRE]
  EnableProfileMigrator=false
  ```

1. Once you are satisfied with the initial launch of the browser with an empty profile, you can proceed to packaging it into an MSI. Launch [wItem Installer](http://www.witemsoft.com/togo/downloads/)
{ target="_blank" } and create a new project. Fill in the information on the **General Info** tab and select the installation of shortcuts for all users, not just the current one.
![](/assets/img/2011/ff3.png)
1. On the **Files** tab, drag and drop all contents from our folder `C:\Program Files\Mozilla Firefox\`
1. On the **Shortcuts** tab, create a `New shortcut for a file from the installation` for the folders `Desktop` and `Start Menu\Programs` pointing to `firefox.exe`
1. On the **Registry** tab, perform `Import from a .reg file`. But first, it needs to be prepared. Go back to the reports from RegShot, take `*Redo.reg`, open it with Notepad, and clean it of unnecessary entries.
If you need to make Firefox the default browser for all users of the computer, replace all occurrences of `HKEY_CURRENT_USER` with `HKEY_LOCAL_MACHINE`.
Also, replace all occurrences of `C:\\Program Files\\Mozilla Firefox` with `%AppDir%` so that the final folder name is set after installation.
Additionally, wItem interprets .reg files slightly differently, so replace all `\"` with `"`.
I ended up with this file - [http://pastebin.com/fGjsH8n4](http://pastebin.com/fGjsH8n4)
{ target="_blank" }
1. On the **Custom Actions** tab, add the following task to register `AccessibleMarshal.dll`
![](/assets/img/2011/ff4.png)
1. Perform a Build on the **Create Setup** tab. There should be no Errors, even an incorrectly formatted software version will prevent the MSI installation.
1. Take the [ADM/ADMX files](http://www.frontmotion.com/FMFirefoxCE/download_fmfirefoxce.htm)
{ target="_blank" }, add them to the GPP/PolicyDefinitions folder in the console, and configure the necessary browser settings. For example, single sign-on NTLM (logging in with the current domain account for the intranet) - `network.automatic-ntlm-auth.trusted-uris`
1. To enable browser auto-update under a user account, you need to grant permissions to the folder
`%ProgramFiles%\Mozilla Firefox`
This can be done either via GPO (Windows Configuration\Security Settings\File System) or using Custom Actions at the end of the installation. For example, like this:
```bash
cacls "%AppDir%" /t /e /p "builtin\users":C
```

PS  
I slightly modified [firefox.adm](http://ge.tt/8IUf6d7?c)
{ target="_blank" } adding parameters to configure opening folders from links like `file:///o:\folder\file` for network drives and intranet, as described [here](http://kb.mozillazine.org/Links_to_local_pages_do_not_work)
{ target="_blank" }. However, to apply the settings in Firefox, the [GPO v0.9.3](http://ge.tt/8IUf6d7?c)
{ target="_blank" } plugin is required.
  ** The ready-made firefox.msi can be downloaded [here](http://ge.tt/8IUf6d7?c)
{ target="_blank" } (for personal educational purposes only).
