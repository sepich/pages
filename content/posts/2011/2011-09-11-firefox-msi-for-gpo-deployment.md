---
title: Firefox msi for GPO deployment
date: '2011-09-11T14:50:00.001+04:00'
tags:
- windows
- msi
modified: '2011-09-11T14:55:35.890+04:00'
thumbnail: /assets/img/2011/firefox.jpg
url: /2011/09/firefox-msi-for-gpo-deployment.html
---
This is a custom **msi package of Firefox 6.0.2** with some plugins for mass deployment in AD by Group Policy. 

Customizations from original version:  

- Installed plugins:  
[GPO for Firefox](https://addons.mozilla.org/firefox/downloads/latest/51892/platform:5/addon-51892-latest.xpi) - apply GroupPolicy settings assigned by [adm](http://sourceforge.net/projects/firefoxadm/)/[admx](http://www.frontmotion.com/FMFirefoxCE/download_fmfirefoxce.htm) to Firefox  
[IETab](https://addons.mozilla.org/firefox/downloads/latest/92382/addon-92382-latest.xpi) - opens selected sites by IE engine inside Firefox tab  
[Adblock Plus](https://addons.mozilla.org/firefox/downloads/latest/1865/addon-1865-latest.xpi) - block advertisement, banners etc
- Tweaked default interface:  
![](/assets/img/2011/firefox.jpg) 
Disabled text menu, cleared statusbar, Adblock button moved to top bar
- Sets as default browser for all users
- No asking about import of IE bookmarks on first run
- No any browser information / plug-in notification tabs open on first run. Home page only.
- Auto-updates enabled by default. You need to give write rights for users to folder  
`%ProgramFiles%\Mozilla Firefox`  
for auto-updates works under user. This could be done by GPO settings (Windows configuration > Security > File system)
- Modified [firefox.adm](http://ge.tt/8IUf6d7?c) GPP policy included. Added `localfilelinks` policy for opening intranet links to local resources, like `file:\\\o:\path\file` as described [here](http://kb.mozillazine.org/Links_to_local_pages_do_not_work)

[Download Firefox_en.msi](http://ge.tt/8IUf6d7?c)
[Скачать Firefox.msi](http://ge.tt/8IUf6d7?c) русский.  
[How to](/2011/09/howto-cook-custom-firefox-msi-for-enterprise-deployment.html) do it yourself
