---
title: Precompiled hd-Idle armhf deb-package for Debian
date: '2013-03-04T11:20:00.001+04:00'
tags:
- linux
- mele
modified: '2013-03-12T15:44:47.322+04:00'
url: /2013/03/precompiled-hd-idle-armhf-deb-package.html
---
There is still no hd-idle package in standard Debian repository. Even in testing branch.
You can get sources at [official site](http://hd-idle.sourceforge.net/) but you'll need to install a lot of dependencies to compile it.
Or here is already compiled version:  
[Download](http://i.sepa.spb.ru/_/mele/hd-idle_1.04_armhf.deb)
{ target="_blank" } hd-idle_1.04_armhf.deb

Installation:
```bash
cd /tmp
wget http://i.sepa.spb.ru/_/mele/hd-idle_1.04_armhf.deb
dpkg -i hd-idle_1.04_armhf.deb
nano /etc/default/hd-idle
```
