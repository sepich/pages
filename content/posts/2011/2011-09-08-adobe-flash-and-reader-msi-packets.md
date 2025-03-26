---
title: Adobe Flash and Adobe Reader msi packets
date: '2011-09-08T23:42:00.003+04:00'
tags:
- windows
- msi
modified: '2011-09-25T09:52:51.745+04:00'
url: /2011/09/adobe-flash-and-reader-msi-packets.html
---
Some quick info about getting **Adobe Flash** and **Adobe Reader** installers in **msi** form for distributing in AD by GPO.  
  
#### Adobe Flash  
Get msi installer here:  
[http://www.adobe.com/products/flashplayer/fp_distribution3.html](http://www.adobe.com/products/flashplayer/fp_distribution3.html)
  
For silent install from command prompt use commands like:  
`start /w msiexec /i \\server\path\install_flash_player_10_active_x.msi /quiet` 
this is plugin for IE  
`start /w msiexec /i \\server\path\install_flash_player_10_plugin.msi /quiet` 
this is for Mozilla like  

Additionally you may want to delete logs:  
`del /f /s /q "%windir%\system32\Macromed\Flash\*.log"`  
And to disable auto update you need create `mms.cfg` file with `AutoUpdateDisable=true` contents for this.  
```
echo AutoUpdateDisable=true > "%windir%\system32\Macromed\Flash\mms.cfg"
```
Or use GPO Preferences for creating such file  


####  Adobe Reader  
Get msi installer from ftp here:  
[ftp://ftp.adobe.com/pub/adobe/reader/win/10.x/](ftp://ftp.adobe.com/pub/adobe/reader/win/10.x/)
  
Additionally you need CustomizationWizard for customizing installation settings  
[http://www.adobe.com/support/downloads/detail.jsp?ftpID=4950](http://www.adobe.com/support/downloads/detail.jsp?ftpID=4950)
  
Using it you open **msi** file, tweak some settings, and get transformation **mst** file. Already tweaked my mst file you can get [here](http://min.us/mbiWWproFe)  
For silent install from command prompt use something like:
```
msiexec /i "\\server\path\AdbeRdr1000_ru_RU.msi" /qr TRANSFORMS="\\server\path\AdbeRdr1000_ru_RU.mst"
```
But msi and mst transforms better suits GPO software distribution or SCCM :)
